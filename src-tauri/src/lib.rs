mod db;
mod icons;

use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use std::collections::HashSet;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let database = db::Database::init(app.handle())
                .expect("failed to initialize sqlite database");
                app.manage(Mutex::new(database));
            let shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);
            app.global_shortcut().register(shortcut)?;
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let _ = window_clone.hide();
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_app_shortcuts,
            launch_app,
            show_in_folder,
            get_aliases,
            set_app_alias
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(serde::Serialize)]
struct AppEntry {
    name: String,
    path: String,
    icon: Option<String>,
    launch_count: i32,
    last_launched: i64,
}

#[tauri::command]
fn scan_app_shortcuts(
    db_state: tauri::State<'_, Mutex<db::Database>>,
) -> Vec<AppEntry> {
    let usage_map = db_state
        .lock()
        .map(|db| db.get_usage_map().unwrap_or_default())
        .unwrap_or_default();

    let mut apps = Vec::new();
    let mut seen_names = HashSet::new();

    let ignored_folders = [
        "administrative tools",
        "windows kits",
        "visual studio tools",
        "accessibility",
        "system tools",
        "windows software development kit",
        "nástroje balíka microsoft office",
    ];

    let blocklist = [
        // English
        "uninstall",
        "installer",
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
        "Math Input Panel",
        "Quick Assist",
        "Node.js command prompt",
        "Install Additional Tools for Node.js",
        "OneDrive",
        "Calculator Suite",
        // Slovak
        "odinštalovať",
        "odinstalovat",
        "núdzový režim",
        "predvoľby",
        "denník telemetrie",
    ];

    let start_menu_dirs = [
        r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs",
        &format!(
            r"{}\Microsoft\Windows\Start Menu\Programs",
            std::env::var("APPDATA").unwrap_or_default()
        ),
    ];

    for dir in start_menu_dirs {
        for entry in walkdir::WalkDir::new(dir)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            
            if path
                .extension()
                .and_then(|e| e.to_str())
                .map_or(false, |ext| ext.eq_ignore_ascii_case("lnk"))
            {

                 let path_lower = path.to_string_lossy().to_lowercase();

                if ignored_folders.iter().any(|folder| path_lower.contains(folder)) {
                    continue;
                }

                if let Some(app_name) = path.file_stem().and_then(|s| s.to_str()) {
                    let lower_name = app_name.to_lowercase();

                    if blocklist.iter().any(|word| lower_name.contains(word)) {
                        continue;
                    }

                    if seen_names.insert(lower_name) {
                        let path_str = path.display().to_string();
                        let icon = icons::get_icon_as_base64(&path_str);

                        let (launch_count, last_launched) = usage_map
                            .get(&path_str)
                            .copied()
                            .unwrap_or((0, 0));

                        apps.push(AppEntry {
                            name: app_name.to_string(),
                            path: path_str,
                            icon,
                            launch_count,
                            last_launched
                        });
                    }
                }
            }
        }
    }
    apps
}


#[tauri::command]
fn launch_app(
    path: String,
    db_state: tauri::State<'_, Mutex<db::Database>>,
) -> Result<(), String> {
    if let Ok(db) = db_state.lock() {
        let _ = db.record_launch(&path);
    }
    std::process::Command::new("cmd")
        .args(["/C", "start", "", &path])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn show_in_folder(path: String) -> Result<(), String> {
    std::process::Command::new("explorer")
        .args(["/select,", &path])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_aliases(
    db_state: tauri::State<'_, Mutex<db::Database>>,
) -> Result<std::collections::HashMap<String, String>, String> {
    db_state
        .lock()
        .map_err(|e| e.to_string())?
        .get_aliases()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_app_alias(
    alias: String,
    path: String,
    db_state: tauri::State<'_, Mutex<db::Database>>,
) -> Result<(), String> {
    db_state
        .lock()
        .map_err(|e| e.to_string())?
        .set_alias(&alias, &path)
        .map_err(|e| e.to_string())
}