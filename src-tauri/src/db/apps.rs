use super::{now_secs, Database};
use rusqlite::{params, Result};
use std::collections::HashMap;

impl Database {
    pub fn record_launch(&self, path: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO app_usage (path, launch_count, last_launched)
             VALUES (?1, 1, ?2)
             ON CONFLICT(path) DO UPDATE SET
                launch_count = launch_count + 1,
                last_launched = ?2",
            params![path, now_secs()],
        )?;
        Ok(())
    }

    pub fn get_usage_map(&self) -> Result<HashMap<String, (i32, i64)>> {
        let mut stmt = self
            .conn
            .prepare("SELECT path, launch_count, last_launched FROM app_usage")?;

        let rows = stmt.query_map([], |row| Ok((row.get(0)?, (row.get(1)?, row.get(2)?))))?;
        Ok(rows.flatten().collect())
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

    pub fn get_aliases(&self) -> Result<HashMap<String, String>> {
        let mut stmt = self.conn.prepare("SELECT alias, path FROM aliases")?;
        let rows = stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?;
        Ok(rows.flatten().collect())
    }

    pub fn remove_alias_by_path(&self, path: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM aliases WHERE path = ?1", params![path])?;
        Ok(())
    }
}
