use crate::shell;
use serde::Serialize;
use std::collections::HashSet;
use std::path::Path;
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
use winreg::RegKey;

const USER_KEY: &str = "Environment";
const SYSTEM_KEY: &str = r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment";

#[derive(Serialize)]
pub struct PathEntry {
    path: String,
    exists: bool,
}

#[derive(Serialize)]
pub struct EnvVariable {
    name: String,
    value: String,
    scope: &'static str,
    entries: Vec<PathEntry>,
}

fn expand(value: &str) -> String {
    let mut result = String::new();
    let mut rest = value;

    while let Some(start) = rest.find('%') {
        let after = &rest[start + 1..];
        let Some(end) = after.find('%') else { break };
        result.push_str(&rest[..start]);

        match std::env::var(&after[..end]) {
            Ok(resolved) if end > 0 => {
                result.push_str(&resolved);
                rest = &after[end + 1..];
            }
            _ => {
                result.push('%');
                rest = after;
            }
        }
    }

    result.push_str(rest);
    result
}

fn path_entries(name: &str, value: &str) -> Vec<PathEntry> {
    let is_path_list = name.eq_ignore_ascii_case("path")
        || name.eq_ignore_ascii_case("psmodulepath")
        || (value.contains(';') && value.contains(":\\"));
    if !is_path_list {
        return Vec::new();
    }

    value
        .split(';')
        .map(|entry| entry.trim().trim_matches('"'))
        .filter(|entry| !entry.is_empty())
        .map(|entry| PathEntry {
            path: entry.to_string(),
            exists: Path::new(entry).exists(),
        })
        .collect()
}

fn create_variable(name: String, raw: &str, scope: &'static str) -> EnvVariable {
    let value = expand(raw);
    EnvVariable {
        entries: path_entries(&name, &value),
        name,
        value,
        scope,
    }
}

fn read_registry(root: winreg::HKEY, key: &str, scope: &'static str) -> Vec<EnvVariable> {
    let Ok(key) = RegKey::predef(root).open_subkey(key) else {
        return Vec::new();
    };

    key.enum_values()
        .flatten()
        .filter_map(|(name, _)| {
            let raw: String = key.get_value(&name).ok()?;
            Some(create_variable(name, &raw, scope))
        })
        .collect()
}

#[tauri::command(async)]
pub fn list_env_variables() -> Vec<EnvVariable> {
    let mut variables = read_registry(HKEY_CURRENT_USER, USER_KEY, "User");
    variables.extend(read_registry(HKEY_LOCAL_MACHINE, SYSTEM_KEY, "System"));

    let persisted: HashSet<String> = variables
        .iter()
        .map(|variable| variable.name.to_lowercase())
        .collect();

    variables.extend(
        std::env::vars_os()
            .map(|(name, value)| {
                (
                    name.to_string_lossy().into_owned(),
                    value.to_string_lossy().into_owned(),
                )
            })
            .filter(|(name, _)| !name.is_empty() && !name.starts_with('='))
            .filter(|(name, _)| !persisted.contains(&name.to_lowercase()))
            .map(|(name, value)| EnvVariable {
                entries: path_entries(&name, &value),
                name,
                value,
                scope: "Process",
            }),
    );

    variables.sort_by_key(|variable| {
        let rank = match variable.scope {
            "User" => 0,
            "System" => 1,
            _ => 2,
        };
        (rank, variable.name.to_lowercase())
    });
    variables
}

#[tauri::command]
pub fn open_env_editor() -> Result<(), String> {
    shell::spawn("rundll32.exe", &["sysdm.cpl,EditEnvironmentVariables"])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn expands_known_variables_only() {
        std::env::set_var("CORTEX_TEST_VAR", "value");
        assert_eq!(expand(r"%CORTEX_TEST_VAR%\bin"), r"value\bin");
        assert_eq!(expand("%CORTEX_MISSING%;100%"), "%CORTEX_MISSING%;100%");
        assert_eq!(expand("a%%CORTEX_TEST_VAR%"), "a%value");
    }

    #[test]
    fn splits_path_lists() {
        let entries = path_entries("Path", r#"C:\Windows;"C:\missing dir";;"#);
        assert_eq!(entries.len(), 2);
        assert!(entries[0].exists);
        assert_eq!(entries[1].path, r"C:\missing dir");
        assert!(!entries[1].exists);
        assert!(path_entries("OS", "Windows_NT").is_empty());
    }
}
