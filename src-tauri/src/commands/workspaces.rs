use crate::db::{with_db, DbState, Workspace};
use crate::shell;

#[tauri::command]
pub fn get_all_workspaces(db: DbState<'_>) -> Result<Vec<Workspace>, String> {
    with_db(&db, |db| db.get_workspaces())
}

#[tauri::command]
pub fn launch_workspace(targets: Vec<String>) -> Result<(), String> {
    for target in &targets {
        let _ = shell::open_target(target);
    }
    Ok(())
}

#[tauri::command]
pub fn save_workspace_item(
    id: Option<i64>,
    name: String,
    description: String,
    targets: Vec<String>,
    db: DbState<'_>,
) -> Result<(), String> {
    let targets_json = serde_json::to_string(&targets).map_err(|e| e.to_string())?;
    with_db(&db, |db| {
        db.save_or_update_workspace(id, &name, &description, &targets_json)
    })
}

#[tauri::command]
pub fn delete_workspace_by_id(id: i64, db: DbState<'_>) -> Result<(), String> {
    with_db(&db, |db| db.delete_workspace(id))
}
