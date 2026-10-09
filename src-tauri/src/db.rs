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
}