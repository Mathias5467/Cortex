mod clipboard_watcher;
mod commands;
mod db;
mod files;
mod icons;
mod shell;
mod vault;
mod window_manager;

use commands::vault::VaultSession;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
};

fn toggle_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

fn hide_on_blur(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let window_clone = window.clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::Focused(false) = event {
                let _ = window_clone.hide();
            }
        });
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        toggle_main_window(app);
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let database = db::Database::init(app.handle())
                .expect("failed to initialize sqlite database");
            app.manage(Mutex::new(database));
            app.manage(VaultSession::default());

            clipboard_watcher::start(app.handle().clone());

            let shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);
            app.global_shortcut().register(shortcut)?;

            hide_on_blur(app.handle());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::apps::scan_app_shortcuts,
            commands::apps::launch_app,
            commands::apps::show_in_folder,
            commands::apps::get_aliases,
            commands::apps::set_app_alias,
            commands::apps::remove_app_alias,
            commands::clipboard::copy_to_clipboard,
            commands::clipboard::copy_secret_to_clipboard,
            commands::clipboard::read_clipboard_text,
            commands::clipboard::copy_image_to_clipboard,
            commands::clipboard::get_clipboard_history,
            commands::clipboard::delete_clipboard_item,
            commands::clipboard::save_edited_clipboard_item,
            commands::colors::get_icon_colors,
            commands::colors::set_icon_color,
            commands::colors::reset_icon_color,
            commands::docker::list_containers,
            commands::docker::control_container,
            commands::docker::container_logs,
            commands::environment::list_env_variables,
            commands::environment::open_env_editor,
            commands::hash::hash_text,
            commands::hash::hash_file,
            commands::network::local_addresses,
            commands::network::dns_lookup,
            commands::network::ping_host,
            commands::network::listening_ports,
            commands::network::kill_process,
            commands::spotify::spotify_now_playing,
            commands::spotify::spotify_artwork,
            commands::spotify::spotify_control,
            commands::system::run_system_command,
            commands::system::pick_screen_color,
            commands::typing::save_typing_result,
            commands::typing::get_best_typing_score,
            commands::vault::check_vault_status,
            commands::vault::setup_master_password,
            commands::vault::unlock_vault,
            commands::vault::lock_vault,
            commands::vault::get_vault_entries,
            commands::vault::save_vault_item,
            commands::vault::delete_vault_item,
            commands::workspaces::get_all_workspaces,
            commands::workspaces::launch_workspace,
            commands::workspaces::save_workspace_item,
            commands::workspaces::delete_workspace_by_id,
            files::search_user_files,
            window_manager::snap_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
