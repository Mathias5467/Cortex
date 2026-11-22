use crate::clipboard_watcher;
use crate::db::{with_db, ClipboardItem, DbState};
use arboard::SetExtWindows;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;

#[tauri::command]
pub fn copy_to_clipboard(text: String) -> Result<(), String> {
    arboard::Clipboard::new()
        .and_then(|mut clipboard| clipboard.set_text(text))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_clipboard_text() -> String {
    if clipboard_watcher::is_private() {
        return String::new();
    }
    arboard::Clipboard::new()
        .and_then(|mut clipboard| clipboard.get_text())
        .unwrap_or_default()
}

#[tauri::command]
pub fn copy_secret_to_clipboard(text: String) -> Result<(), String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    clipboard
        .set()
        .exclude_from_monitoring()
        .exclude_from_cloud()
        .exclude_from_history()
        .text(text)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn copy_image_to_clipboard(preview_base64: String) -> Result<(), String> {
    let base64_data = preview_base64.trim_start_matches("data:image/png;base64,");
    let png_bytes = BASE64.decode(base64_data).map_err(|e| e.to_string())?;

    let img = image::load_from_memory(&png_bytes)
        .map_err(|e| e.to_string())?
        .to_rgba8();
    let (width, height) = img.dimensions();

    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    clipboard
        .set_image(arboard::ImageData {
            width: width as usize,
            height: height as usize,
            bytes: std::borrow::Cow::Owned(img.into_raw()),
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_clipboard_history(db: DbState<'_>) -> Result<Vec<ClipboardItem>, String> {
    with_db(&db, |db| db.get_clipboard_history())
}

#[tauri::command]
pub fn delete_clipboard_item(id: i64, db: DbState<'_>) -> Result<(), String> {
    with_db(&db, |db| db.delete_clipboard_entry(id))
}

#[tauri::command]
pub fn save_edited_clipboard_item(
    id: i64,
    content: String,
    db: DbState<'_>,
) -> Result<(), String> {
    with_db(&db, |db| db.update_clipboard_entry(id, &content))
}
