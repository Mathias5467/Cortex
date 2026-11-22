use super::{now_secs, Database};
use rusqlite::{params, Result};

#[derive(serde::Serialize)]
pub struct ClipboardItem {
    pub id: i64,
    pub content: String,
    pub item_type: String,
    pub preview: Option<String>,
    pub timestamp: i64,
}

impl Database {
    pub fn save_clipboard_entry(&self, content: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO clipboard_history (content, timestamp)
             VALUES (?1, ?2)
             ON CONFLICT(content) WHERE item_type = 'text' DO UPDATE SET timestamp = ?2",
            params![content, now_secs()],
        )?;
        self.trim_clipboard_history()
    }

    pub fn save_clipboard_image(&self, dimensions: &str, preview_base64: &str) -> Result<()> {
        let updated = self.conn.execute(
            "UPDATE clipboard_history SET timestamp = ?2
             WHERE item_type = 'image' AND preview = ?1",
            params![preview_base64, now_secs()],
        )?;

        if updated == 0 {
            self.conn.execute(
                "INSERT INTO clipboard_history (content, item_type, preview, timestamp)
                 VALUES (?1, 'image', ?2, ?3)",
                params![dimensions, preview_base64, now_secs()],
            )?;
        }

        self.trim_clipboard_history()
    }

    fn trim_clipboard_history(&self) -> Result<()> {
        self.conn.execute(
            "DELETE FROM clipboard_history WHERE id NOT IN (
                SELECT id FROM clipboard_history ORDER BY timestamp DESC LIMIT 100
            )",
            [],
        )?;
        Ok(())
    }

    pub fn delete_clipboard_entry(&self, id: i64) -> Result<()> {
        self.conn
            .execute("DELETE FROM clipboard_history WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn update_clipboard_entry(&self, id: i64, new_content: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE clipboard_history SET content = ?1, timestamp = ?2 WHERE id = ?3",
            params![new_content, now_secs(), id],
        )?;
        Ok(())
    }

    pub fn get_clipboard_history(&self) -> Result<Vec<ClipboardItem>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, content, item_type, preview, timestamp FROM clipboard_history ORDER BY timestamp DESC LIMIT 60",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(ClipboardItem {
                id: row.get(0)?,
                content: row.get(1)?,
                item_type: row.get(2)?,
                preview: row.get(3)?,
                timestamp: row.get(4)?,
            })
        })?;

        Ok(rows.flatten().collect())
    }
}
