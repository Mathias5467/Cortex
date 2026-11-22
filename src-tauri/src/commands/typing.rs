use crate::db::{with_db, DbState};

#[tauri::command]
pub fn save_typing_result(wpm: i32, accuracy: i32, db: DbState<'_>) -> Result<(), String> {
    with_db(&db, |db| db.save_typing_score(wpm, accuracy))
}

#[tauri::command]
pub fn get_best_typing_score(db: DbState<'_>) -> Result<i32, String> {
    with_db(&db, |db| db.get_best_typing_wpm())
}
