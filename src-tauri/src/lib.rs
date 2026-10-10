mod db;
mod icons;
mod files;

use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use std::collections::HashSet;
use std::sync::Mutex;

#[derive(Default)]
struct EditorData(Mutex<Option<(i64, String)>>);

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
            
            let db_state = std::sync::Arc::new(std::sync::Mutex::new(database));
            app.manage(db_state.clone());
            app.manage(EditorData::default());
            let db_clone = db_state.clone();
            std::thread::spawn(move || {
                let mut clipboard = match arboard::Clipboard::new() {
                    Ok(c) => c,
                    Err(_) => return,
                };
                let mut last_text = String::new();

                loop {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    if let Ok(current_text) = clipboard.get_text() {
                        let trimmed = current_text.trim();
                        if !trimmed.is_empty() && trimmed != last_text {
                            last_text = trimmed.to_string();
                            if let Ok(db) = db_clone.lock() {
                                let _ = db.save_clipboard_entry(trimmed);
                            }
                        }
                    }
                }
            });
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
            set_app_alias,
            files::search_user_files,
            run_system_command,
            pick_screen_color,
            copy_to_clipboard,
            remove_app_alias,
            get_clipboard_history,
            delete_clipboard_item,
            open_editor_window,
            get_editor_initial_data,
            save_edited_clipboard_item,
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

#[tauri::command]
fn run_system_command(command: String) -> Result<(), String> {
    match command.as_str() {
        "lock" => {
            unsafe {
                windows::Win32::System::Shutdown::LockWorkStation()
                    .map_err(|e| e.to_string())?;
            }
        }
        "empty_bin" => {
            unsafe {
                windows::Win32::UI::Shell::SHEmptyRecycleBinW(
                    None,
                    windows::core::PCWSTR::null(),
                    windows::Win32::UI::Shell::SHERB_NOCONFIRMATION
                        | windows::Win32::UI::Shell::SHERB_NOPROGRESSUI
                        | windows::Win32::UI::Shell::SHERB_NOSOUND,
                )
                .map_err(|e| e.to_string())?;
            }
        }
        "sleep" => {
            std::process::Command::new("rundll32.exe")
                .args(["powrprof.dll,SetSuspendState", "0,1,0"])
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        "restart" => {
            std::process::Command::new("shutdown")
                .args(["/r", "/t", "0"])
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        "shutdown" => {
            std::process::Command::new("shutdown")
                .args(["/s", "/t", "0"])
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        _ => return Err("Unknown command".to_string()),
    }
    Ok(())
}

#[tauri::command]
fn pick_screen_color() -> Result<String, String> {
    unsafe {
        let mut point = windows::Win32::Foundation::POINT::default();
        if !windows::Win32::UI::WindowsAndMessaging::GetCursorPos(&mut point).is_ok() {
            return Err("Failed to get cursor position".to_string());
        }

        let hdc = windows::Win32::Graphics::Gdi::GetDC(None);
        let pixel = windows::Win32::Graphics::Gdi::GetPixel(hdc, point.x, point.y);
        windows::Win32::Graphics::Gdi::ReleaseDC(None, hdc);

        let r = (pixel.0 & 0xFF) as u8;
        let g = ((pixel.0 >> 8) & 0xFF) as u8;
        let b = ((pixel.0 >> 16) & 0xFF) as u8;

        Ok(format!("#{:02X}{:02X}{:02X}", r, g, b))
    }
}

#[tauri::command]
fn copy_to_clipboard(text: String) -> Result<(), String> {
    std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command", &format!("Set-Clipboard -Value '{}'", text.replace("'", "''"))])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn remove_app_alias(
    path: String,
    db_state: tauri::State<'_, Mutex<db::Database>>,
) -> Result<(), String> {
    db_state
        .lock()
        .map_err(|e| e.to_string())?
        .remove_alias_by_path(&path)
        .map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
pub struct ClipboardItem {
    pub id: i64,
    pub content: String,
    pub timestamp: i64,
}

#[tauri::command]
fn get_clipboard_history(
    db_state: tauri::State<'_, std::sync::Arc<std::sync::Mutex<db::Database>>>,
) -> Result<Vec<ClipboardItem>, String> {
    let rows = db_state
        .lock()
        .map_err(|e| e.to_string())?
        .get_clipboard_history()
        .map_err(|e| e.to_string())?;

    Ok(rows
        .into_iter()
        .map(|(id, content, timestamp)| ClipboardItem { id, content, timestamp })
        .collect())
}

#[tauri::command]
fn delete_clipboard_item(
    id: i64,
    db_state: tauri::State<'_, std::sync::Arc<std::sync::Mutex<db::Database>>>,
) -> Result<(), String> {
    db_state
        .lock()
        .map_err(|e| e.to_string())?
        .delete_clipboard_entry(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_editor_window(
    app: tauri::AppHandle,
    id: i64,
    content: String,
    editor_data: tauri::State<'_, EditorData>,
) -> Result<(), String> {
    if let Ok(mut data) = editor_data.0.lock() {
        *data = Some((id, content));
    }

    if let Some(win) = app.get_webview_window("editor") {
        let _ = win.show();
        let _ = win.set_focus();
        let _ = win.eval("window.location.reload()");
        return Ok(());
    }

    tauri::WebviewWindowBuilder::new(
        &app,
        "editor",
        tauri::WebviewUrl::App("index.html#editor".into()),
    )
    .title("Cortex Editor")
    .inner_size(600.0, 480.0)
    .min_inner_size(400.0, 300.0)
    .center()
    .resizable(true)
    .decorations(true)
    .always_on_top(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_editor_initial_data(
    editor_data: tauri::State<'_, EditorData>,
) -> Option<(i64, String)> {
    editor_data.0.lock().ok().and_then(|d| d.clone())
}

#[tauri::command]
fn save_edited_clipboard_item(
    id: i64,
    content: String,
    db_state: tauri::State<'_, std::sync::Arc<std::sync::Mutex<db::Database>>>,
) -> Result<(), String> {
    db_state
        .lock()
        .map_err(|e| e.to_string())?
        .update_clipboard_entry(id, &content)
        .map_err(|e| e.to_string())
}