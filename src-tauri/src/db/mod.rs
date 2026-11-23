mod apps;
mod clipboard;
mod colors;
mod schema;
mod typing;
mod vault;
mod workspaces;

pub use clipboard::ClipboardItem;
pub use workspaces::Workspace;

use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State};

pub struct Database {
    conn: Connection,
}

pub type DbState<'a> = State<'a, Mutex<Database>>;

impl Database {
    pub fn init(app_handle: &AppHandle) -> rusqlite::Result<Self> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."));

        let _ = fs::create_dir_all(&app_dir);

        let db = Database {
            conn: Connection::open(app_dir.join("cortex.db"))?,
        };
        db.migrate()?;
        Ok(db)
    }
}

pub fn with_db<T>(
    state: &DbState<'_>,
    query: impl FnOnce(&Database) -> rusqlite::Result<T>,
) -> Result<T, String> {
    let db = state.lock().map_err(|e| e.to_string())?;
    query(&db).map_err(|e| e.to_string())
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
