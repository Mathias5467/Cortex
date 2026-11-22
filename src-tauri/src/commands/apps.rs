use crate::db::{with_db, DbState};
use crate::{icons, shell};
use std::collections::{HashMap, HashSet};
use std::path::Path;

const IGNORED_FOLDERS: &[&str] = &[
    "administrative tools",
    "windows kits",
    "visual studio tools",
    "accessibility",
    "system tools",
    "windows software development kit",
    "nástroje balíka microsoft office",
];

const BLOCKLIST: &[&str] = &[
    "uninstall",
    "documentation",
    "readme",
    "read me",
    "help",
    "release notes",
    "license",
    "manual",
    "guide",
    "website",
    "visit",
    "setup",
    "support",
    "about",
    "check for updates",
    "configure",
    "sample",
    "odinštalovať",
    "odinstalovat",
    "núdzový režim",
    "predvoľby",
    "denník telemetrie",
];

#[derive(serde::Serialize)]
pub struct AppEntry {
    name: String,
    path: String,
    icon: Option<String>,
    launch_count: i32,
    last_launched: i64,
}

fn start_menu_dirs() -> [String; 2] {
    [
        r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs".to_string(),
        format!(
            r"{}\Microsoft\Windows\Start Menu\Programs",
            std::env::var("APPDATA").unwrap_or_default()
        ),
    ]
}

fn shortcut_name(path: &Path) -> Option<&str> {
    let extension = path.extension()?.to_str()?;
    if !extension.eq_ignore_ascii_case("lnk") {
        return None;
    }

    let path_lower = path.to_string_lossy().to_lowercase();
    if IGNORED_FOLDERS
        .iter()
        .any(|folder| path_lower.contains(folder))
    {
        return None;
    }

    let name = path.file_stem()?.to_str()?;
    let name_lower = name.to_lowercase();
    if BLOCKLIST.iter().any(|word| name_lower.contains(word)) {
        return None;
    }

    Some(name)
}

#[tauri::command]
pub fn scan_app_shortcuts(db: DbState<'_>) -> Vec<AppEntry> {
    let usage_map = with_db(&db, |db| db.get_usage_map()).unwrap_or_default();
    let mut apps = Vec::new();
    let mut seen_names = HashSet::new();

    for dir in start_menu_dirs() {
        for entry in walkdir::WalkDir::new(dir)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let Some(name) = shortcut_name(entry.path()) else {
                continue;
            };
            if !seen_names.insert(name.to_lowercase()) {
                continue;
            }

            let path = entry.path().display().to_string();
            let (launch_count, last_launched) = usage_map.get(&path).copied().unwrap_or((0, 0));

            apps.push(AppEntry {
                name: name.to_string(),
                icon: icons::get_icon_as_base64(&path),
                path,
                launch_count,
                last_launched,
            });
        }
    }

    apps
}

#[tauri::command]
pub fn launch_app(path: String, db: DbState<'_>) -> Result<(), String> {
    let _ = with_db(&db, |db| db.record_launch(&path));
    shell::open_target(&path)
}

#[tauri::command]
pub fn show_in_folder(path: String) -> Result<(), String> {
    shell::reveal(&path)
}

#[tauri::command]
pub fn get_aliases(db: DbState<'_>) -> Result<HashMap<String, String>, String> {
    with_db(&db, |db| db.get_aliases())
}

#[tauri::command]
pub fn set_app_alias(alias: String, path: String, db: DbState<'_>) -> Result<(), String> {
    with_db(&db, |db| db.set_alias(&alias, &path))
}

#[tauri::command]
pub fn remove_app_alias(path: String, db: DbState<'_>) -> Result<(), String> {
    with_db(&db, |db| db.remove_alias_by_path(&path))
}
