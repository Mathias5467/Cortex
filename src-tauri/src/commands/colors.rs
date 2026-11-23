use crate::db::{with_db, DbState};
use std::collections::HashMap;

#[tauri::command]
pub fn get_icon_colors(db: DbState<'_>) -> Result<HashMap<String, String>, String> {
    with_db(&db, |db| db.get_icon_colors())
}

#[tauri::command]
pub fn set_icon_color(item_id: String, color: String, db: DbState<'_>) -> Result<(), String> {
    with_db(&db, |db| db.set_icon_color(&item_id, &color))
}

#[tauri::command]
pub fn reset_icon_color(item_id: String, db: DbState<'_>) -> Result<(), String> {
    with_db(&db, |db| db.reset_icon_color(&item_id))
}
