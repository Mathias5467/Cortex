use super::{now_secs, Database};
use rusqlite::{params, Result};

impl Database {
    pub fn save_typing_score(&self, wpm: i32, accuracy: i32) -> Result<()> {
        self.conn.execute(
            "INSERT INTO typing_scores (wpm, accuracy, timestamp) VALUES (?1, ?2, ?3)",
            params![wpm, accuracy, now_secs()],
        )?;
        Ok(())
    }

    pub fn get_best_typing_wpm(&self) -> Result<i32> {
        self.conn.query_row(
            "SELECT COALESCE(MAX(wpm), 0) FROM typing_scores",
            [],
            |row| row.get(0),
        )
    }
}
