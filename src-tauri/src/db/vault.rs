use super::{now_secs, Database};
use rusqlite::{params, OptionalExtension, Result};

pub struct EncryptedVaultEntry {
    pub id: i64,
    pub title: String,
    pub username: String,
    pub ciphertext: String,
    pub nonce: String,
    pub url: Option<String>,
    pub updated_at: i64,
}

impl Database {
    pub fn get_vault_settings(&self) -> Result<Option<(String, String)>> {
        self.conn
            .query_row(
                "SELECT salt, verification_hash FROM vault_settings WHERE id = 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()
    }

    pub fn set_vault_settings(&self, salt: &str, verification_hash: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO vault_settings (id, salt, verification_hash)
             VALUES (1, ?1, ?2)
             ON CONFLICT(id) DO UPDATE SET salt = ?1, verification_hash = ?2",
            params![salt, verification_hash],
        )?;
        Ok(())
    }

    pub fn save_vault_entry(
        &self,
        id: Option<i64>,
        title: &str,
        username: &str,
        ciphertext: &str,
        nonce: &str,
        url: Option<&str>,
    ) -> Result<()> {
        if let Some(existing_id) = id {
            self.conn.execute(
                "UPDATE vault_entries SET title = ?1, username = ?2, ciphertext = ?3, nonce = ?4, url = ?5, updated_at = ?6 WHERE id = ?7",
                params![title, username, ciphertext, nonce, url, now_secs(), existing_id],
            )?;
        } else {
            self.conn.execute(
                "INSERT INTO vault_entries (title, username, ciphertext, nonce, url, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![title, username, ciphertext, nonce, url, now_secs()],
            )?;
        }
        Ok(())
    }

    pub fn get_vault_entries(&self) -> Result<Vec<EncryptedVaultEntry>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, username, ciphertext, nonce, url, updated_at FROM vault_entries ORDER BY title ASC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(EncryptedVaultEntry {
                id: row.get(0)?,
                title: row.get(1)?,
                username: row.get(2)?,
                ciphertext: row.get(3)?,
                nonce: row.get(4)?,
                url: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        Ok(rows.flatten().collect())
    }

    pub fn delete_vault_entry(&self, id: i64) -> Result<()> {
        self.conn
            .execute("DELETE FROM vault_entries WHERE id = ?1", params![id])?;
        Ok(())
    }
}
