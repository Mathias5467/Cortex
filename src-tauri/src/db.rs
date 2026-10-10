use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn init(app_handle: &AppHandle) -> Result<Self> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."));

        let _ = fs::create_dir_all(&app_dir);

        let db_path = app_dir.join("cortex.db");
        let conn = Connection::open(db_path)?;

        let db = Database { conn };
        db.create_tables()?;
        Ok(db)
    }

    fn create_tables(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS app_usage (
                path TEXT PRIMARY KEY,
                launch_count INTEGER NOT NULL DEFAULT 0,
                last_launched INTEGER NOT NULL DEFAULT 0
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS aliases (
                alias TEXT PRIMARY KEY,
                path TEXT NOT NULL
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS clipboard_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL UNIQUE,
                timestamp INTEGER NOT NULL
            )",
            [],
        )?;
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS clipboard_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                item_type TEXT NOT NULL DEFAULT 'text',
                preview TEXT,
                timestamp INTEGER NOT NULL
            )",
            [],
        )?;

        let _ = self.conn.execute(
            "ALTER TABLE clipboard_history ADD COLUMN item_type TEXT NOT NULL DEFAULT 'text'",
            [],
        );
        let _ = self.conn.execute(
            "ALTER TABLE clipboard_history ADD COLUMN preview TEXT",
            [],
        );

        Ok(())
    }

    pub fn record_launch(&self, path: &str) -> Result<()> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn.execute(
            "INSERT INTO app_usage (path, launch_count, last_launched)
             VALUES (?1, 1, ?2)
             ON CONFLICT(path) DO UPDATE SET
                launch_count = launch_count + 1,
                last_launched = ?2",
            params![path, now],
        )?;
        Ok(())
    }

    pub fn get_usage_map(&self) -> Result<std::collections::HashMap<String, (i32, i64)>> {
        let mut stmt = self
            .conn
            .prepare("SELECT path, launch_count, last_launched FROM app_usage")?;

        let mut map = std::collections::HashMap::new();
        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i32>(1)?,
                row.get::<_, i64>(2)?,
            ))
        })?;

        for row in rows.flatten() {
            map.insert(row.0, (row.1, row.2));
        }

        Ok(map)
    }

    pub fn set_alias(&self, alias: &str, path: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO aliases (alias, path)
             VALUES (?1, ?2)
             ON CONFLICT(alias) DO UPDATE SET path = ?2",
            params![alias.to_lowercase().trim(), path],
        )?;
        Ok(())
    }

    pub fn get_aliases(&self) -> Result<std::collections::HashMap<String, String>> {
        let mut stmt = self.conn.prepare("SELECT alias, path FROM aliases")?;
        let mut map = std::collections::HashMap::new();

        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;

        for row in rows.flatten() {
            map.insert(row.0, row.1);
        }

        Ok(map)
    }

    pub fn remove_alias_by_path(&self, path: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM aliases WHERE path = ?1",
            params![path],
        )?;
        Ok(())
    }

    pub fn save_clipboard_entry(&self, content: &str) -> Result<()> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn.execute(
            "INSERT INTO clipboard_history (content, timestamp)
             VALUES (?1, ?2)
             ON CONFLICT(content) DO UPDATE SET timestamp = ?2",
            rusqlite::params![content, now],
        )?;

        self.conn.execute(
            "DELETE FROM clipboard_history WHERE id NOT IN (
                SELECT id FROM clipboard_history ORDER BY timestamp DESC LIMIT 100
            )",
            [],
        )?;

        Ok(())
    }

    pub fn delete_clipboard_entry(&self, id: i64) -> Result<()> {
        self.conn.execute(
            "DELETE FROM clipboard_history WHERE id = ?1",
            rusqlite::params![id],
        )?;
        Ok(())
    }

    pub fn update_clipboard_entry(&self, id: i64, new_content: &str) -> Result<()> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn.execute(
            "UPDATE clipboard_history SET content = ?1, timestamp = ?2 WHERE id = ?3",
            rusqlite::params![new_content, now, id],
        )?;
        Ok(())
    }

    pub fn save_clipboard_image(&self, dimensions: &str, preview_base64: &str) -> Result<()> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn.execute(
            "INSERT INTO clipboard_history (content, item_type, preview, timestamp)
             VALUES (?1, 'image', ?2, ?3)",
            rusqlite::params![dimensions, preview_base64, now],
        )?;

        self.conn.execute(
            "DELETE FROM clipboard_history WHERE id NOT IN (
                SELECT id FROM clipboard_history ORDER BY timestamp DESC LIMIT 100
            )",
            [],
        )?;

        Ok(())
    }

    pub fn get_clipboard_history(&self) -> Result<Vec<(i64, String, String, Option<String>, i64)>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, content, item_type, preview, timestamp FROM clipboard_history ORDER BY timestamp DESC LIMIT 60",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
            ))
        })?;

        let mut entries = Vec::new();
        for r in rows.flatten() {
            entries.push(r);
        }
        Ok(entries)
    }
}