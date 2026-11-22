use super::{now_secs, Database};
use rusqlite::{params, Result};

#[derive(serde::Serialize)]
pub struct Workspace {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub targets: Vec<String>,
}

impl Database {
    pub fn get_workspaces(&self) -> Result<Vec<Workspace>> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, description, targets FROM workspaces")?;

        let rows = stmt.query_map([], |row| {
            let targets_json: String = row.get(3)?;
            Ok(Workspace {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                targets: serde_json::from_str(&targets_json).unwrap_or_default(),
            })
        })?;

        Ok(rows.flatten().collect())
    }

    pub fn save_or_update_workspace(
        &self,
        id: Option<i64>,
        name: &str,
        description: &str,
        targets_json: &str,
    ) -> Result<()> {
        let mut updated = 0;

        if let Some(existing_id) = id {
            updated = self.conn.execute(
                "UPDATE workspaces SET name = ?1, description = ?2, targets = ?3 WHERE id = ?4",
                params![name, description, targets_json, existing_id],
            )?;
        }

        if updated == 0 {
            self.conn.execute(
                "INSERT INTO workspaces (name, description, targets, created_at)
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(name) DO UPDATE SET description = ?2, targets = ?3",
                params![name, description, targets_json, now_secs()],
            )?;
        }

        Ok(())
    }

    pub fn delete_workspace(&self, id: i64) -> Result<()> {
        self.conn
            .execute("DELETE FROM workspaces WHERE id = ?1", params![id])?;
        Ok(())
    }
}
