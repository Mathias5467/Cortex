use serde::Serialize;
use std::env;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub extension: Option<String>,
}

fn get_user_search_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();

    if let Ok(user_profile) = env::var("USERPROFILE") {
        let base = PathBuf::from(user_profile);
        dirs.push(base.join("Desktop"));
        dirs.push(base.join("Downloads"));
        dirs.push(base.join("Documents"));
    }

    dirs
}

#[tauri::command]
pub fn search_user_files(query: String) -> Vec<FileEntry> {
    let clean_query = query.trim().to_lowercase();
    if clean_query.is_empty() {
        return Vec::new();
    }

    let mut results = Vec::new();
    let search_dirs = get_user_search_dirs();

    for dir in search_dirs {
        if !dir.exists() {
            continue;
        }

        for entry in walkdir::WalkDir::new(&dir)
            .max_depth(2)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            
            if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                if file_name.starts_with('.') {
                    continue;
                }

                if file_name.to_lowercase().contains(&clean_query) {
                    let is_dir = path.is_dir();
                    let extension = path
                        .extension()
                        .and_then(|ext| ext.to_str())
                        .map(|ext| ext.to_string());

                    results.push(FileEntry {
                        name: file_name.to_string(),
                        path: path.display().to_string(),
                        is_dir,
                        extension,
                    });

                    if results.len() >= 15 {
                        return results;
                    }
                }
            }
        }
    }

    results
}