use super::Database;
use rusqlite::{params, Result};
use std::collections::HashMap;

impl Database {
    pub fn get_icon_colors(&self) -> Result<HashMap<String, String>> {
        let mut stmt = self.conn.prepare("SELECT item_id, color FROM icon_colors")?;
        let rows = stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?;
        Ok(rows.flatten().collect())
    }

    pub fn set_icon_color(&self, item_id: &str, color: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO icon_colors (item_id, color)
             VALUES (?1, ?2)
             ON CONFLICT(item_id) DO UPDATE SET color = ?2",
            params![item_id, color],
        )?;
        Ok(())
    }

    pub fn reset_icon_color(&self, item_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM icon_colors WHERE item_id = ?1",
            params![item_id],
        )?;
        Ok(())
    }
}
