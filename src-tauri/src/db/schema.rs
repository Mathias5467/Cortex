use super::{now_secs, Database};
use rusqlite::{params, Result};

const TABLES: &[&str] = &[
    "CREATE TABLE IF NOT EXISTS app_usage (
        path TEXT PRIMARY KEY,
        launch_count INTEGER NOT NULL DEFAULT 0,
        last_launched INTEGER NOT NULL DEFAULT 0
    )",
    "CREATE TABLE IF NOT EXISTS aliases (
        alias TEXT PRIMARY KEY,
        path TEXT NOT NULL
    )",
    "CREATE TABLE IF NOT EXISTS clipboard_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        item_type TEXT NOT NULL DEFAULT 'text',
        preview TEXT,
        timestamp INTEGER NOT NULL
    )",
    "CREATE TABLE IF NOT EXISTS typing_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wpm INTEGER NOT NULL,
        accuracy INTEGER NOT NULL,
        timestamp INTEGER NOT NULL
    )",
    "CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        targets TEXT NOT NULL,
        created_at INTEGER NOT NULL
    )",
    "CREATE TABLE IF NOT EXISTS vault_settings (
        id INTEGER PRIMARY KEY,
        salt TEXT NOT NULL,
        verification_hash TEXT NOT NULL
    )",
    "CREATE TABLE IF NOT EXISTS vault_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        username TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        nonce TEXT NOT NULL,
        url TEXT,
        updated_at INTEGER NOT NULL
    )",
    "CREATE TABLE IF NOT EXISTS icon_colors (
        item_id TEXT PRIMARY KEY,
        color TEXT NOT NULL
    )",
];

const ADDED_COLUMNS: &[&str] = &[
    "ALTER TABLE clipboard_history ADD COLUMN item_type TEXT NOT NULL DEFAULT 'text'",
    "ALTER TABLE clipboard_history ADD COLUMN preview TEXT",
];

const INDEXES: &[&str] = &[
    "CREATE UNIQUE INDEX IF NOT EXISTS clipboard_text_unique
        ON clipboard_history (content) WHERE item_type = 'text'",
];

const REBUILD_CLIPBOARD_HISTORY: &str = "
    DROP TABLE IF EXISTS clipboard_history_next;
    CREATE TABLE clipboard_history_next (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        item_type TEXT NOT NULL DEFAULT 'text',
        preview TEXT,
        timestamp INTEGER NOT NULL
    );
    INSERT INTO clipboard_history_next (id, content, item_type, preview, timestamp)
        SELECT id, content, item_type, preview, timestamp FROM clipboard_history;
    DROP TABLE clipboard_history;
    ALTER TABLE clipboard_history_next RENAME TO clipboard_history;
";

impl Database {
    pub(super) fn migrate(&self) -> Result<()> {
        for sql in TABLES {
            self.conn.execute(sql, [])?;
        }
        for sql in ADDED_COLUMNS {
            let _ = self.conn.execute(sql, []);
        }
        self.drop_clipboard_unique_constraint()?;
        for sql in INDEXES {
            self.conn.execute(sql, [])?;
        }
        self.seed_workspaces();
        Ok(())
    }

    fn drop_clipboard_unique_constraint(&self) -> Result<()> {
        let table_sql: String = self.conn.query_row(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'clipboard_history'",
            [],
            |row| row.get(0),
        )?;

        if !table_sql.contains("UNIQUE") {
            return Ok(());
        }

        let transaction = self.conn.unchecked_transaction()?;
        transaction.execute_batch(REBUILD_CLIPBOARD_HISTORY)?;
        transaction.commit()
    }

    fn seed_workspaces(&self) {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM workspaces", [], |row| row.get(0))
            .unwrap_or(0);

        if count > 0 {
            return;
        }

        let targets = serde_json::json!(["https://scholar.google.com", "https://overleaf.com"]);
        let _ = self.conn.execute(
            "INSERT INTO workspaces (name, description, targets, created_at)
             VALUES (?1, ?2, ?3, ?4)",
            params![
                "Bakalárska práca",
                "Otvorí Word, zdroje a priečinok",
                targets.to_string(),
                now_secs()
            ],
        );
    }
}
