use crate::shell;
use serde::{Deserialize, Serialize};
use std::process::Output;

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct DockerRow {
    #[serde(rename = "ID")]
    id: String,
    names: String,
    image: String,
    state: String,
    status: String,
    #[serde(default)]
    ports: String,
}

#[derive(Serialize)]
pub struct Container {
    id: String,
    name: String,
    image: String,
    state: String,
    status: String,
    ports: String,
    host_ports: Vec<u16>,
}

fn parse_host_ports(ports: &str) -> Vec<u16> {
    let mut found: Vec<u16> = ports
        .split(", ")
        .filter_map(|mapping| mapping.split_once("->"))
        .filter_map(|(host, _)| host.rsplit(':').next())
        .filter_map(|port| port.split('-').next()?.parse().ok())
        .collect();
    found.sort_unstable();
    found.dedup();
    found
}

fn parse_containers(output: &str) -> Vec<Container> {
    output
        .lines()
        .filter_map(|line| serde_json::from_str::<DockerRow>(line).ok())
        .map(|row| Container {
            host_ports: parse_host_ports(&row.ports),
            id: row.id,
            name: row.names,
            image: row.image,
            state: row.state,
            status: row.status,
            ports: row.ports,
        })
        .collect()
}

fn docker(args: &[&str]) -> Result<Output, String> {
    shell::run("docker", args).map_err(|e| {
        let is_offline = ["docker API", "docker daemon", "dockerDesktop"]
            .iter()
            .any(|hint| e.contains(hint));
        if is_offline {
            "Docker is not running".to_string()
        } else {
            e
        }
    })
}

fn ensure_container_id(id: &str) -> Result<(), String> {
    if !id.is_empty() && id.chars().all(|c| c.is_ascii_alphanumeric()) {
        Ok(())
    } else {
        Err("Invalid container id".to_string())
    }
}

#[tauri::command(async)]
pub fn list_containers() -> Result<Vec<Container>, String> {
    docker(&["ps", "-a", "--format", "{{json .}}"])
        .map(|output| parse_containers(&String::from_utf8_lossy(&output.stdout)))
}

#[tauri::command(async)]
pub fn control_container(id: String, action: String) -> Result<(), String> {
    ensure_container_id(&id)?;
    let args: &[&str] = match action.as_str() {
        "start" => &["start", &id],
        "stop" => &["stop", &id],
        "restart" => &["restart", &id],
        "pause" => &["pause", &id],
        "unpause" => &["unpause", &id],
        "remove" => &["rm", "-f", &id],
        _ => return Err("Unknown container action".to_string()),
    };
    docker(args).map(|_| ())
}

#[tauri::command(async)]
pub fn container_logs(id: String) -> Result<String, String> {
    ensure_container_id(&id)?;
    let output = docker(&["logs", "--tail", "300", "--timestamps", &id])?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    let mut lines: Vec<&str> = stdout.lines().chain(stderr.lines()).collect();
    lines.sort_by_key(|line| line.split(' ').next().unwrap_or_default());
    Ok(lines.join("\n"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_containers_and_ports() {
        let line = r#"{"ID":"abc123","Names":"web","Image":"nginx","State":"running","Status":"Up 2 minutes","Ports":"0.0.0.0:8080->80/tcp, [::]:8080->80/tcp, 443/tcp"}"#;
        let containers = parse_containers(line);
        assert_eq!(containers.len(), 1);
        assert_eq!(containers[0].name, "web");
        assert_eq!(containers[0].host_ports, vec![8080]);
    }

    #[test]
    fn rejects_unsafe_ids() {
        assert!(ensure_container_id("abc123").is_ok());
        assert!(ensure_container_id("--all").is_err());
        assert!(ensure_container_id("").is_err());
    }
}
