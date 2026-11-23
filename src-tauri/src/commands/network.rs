use crate::shell;
use serde::Serialize;
use std::collections::{BTreeMap, HashMap};
use std::net::{IpAddr, ToSocketAddrs, UdpSocket};

const DNS_SCRIPT: &str = r#"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$records = foreach ($type in 'A','AAAA','CNAME','MX','NS','TXT') {
  Resolve-DnsName -Name $env:CORTEX_HOST -Type $type -DnsOnly -ErrorAction SilentlyContinue |
    Where-Object { $_.Section -eq 'Answer' -and "$($_.Type)" -eq $type } |
    ForEach-Object {
      $record = $_
      $value = switch ($type) {
        'CNAME' { $record.NameHost }
        'NS' { $record.NameHost }
        'MX' { "$($record.Preference) $($record.NameExchange)" }
        'TXT' { $record.Strings -join '' }
        default { $record.IPAddress }
      }
      "$type`t$value`t$($record.TTL)"
    }
}
$records | Select-Object -Unique
"#;

const PING_SCRIPT: &str = r#"
$ping = New-Object System.Net.NetworkInformation.Ping
1..4 | ForEach-Object {
  try {
    $reply = $ping.Send($env:CORTEX_HOST, 1500)
    "$($reply.Status)`t$($reply.RoundtripTime)`t$($reply.Address)"
  } catch {
    "Failed`t0`t"
  }
}
"#;

#[derive(Serialize)]
pub struct DnsRecord {
    kind: String,
    value: String,
    ttl: String,
}

#[derive(Serialize)]
pub struct PingResult {
    sent: usize,
    received: usize,
    average_ms: u64,
    address: String,
}

#[derive(Serialize)]
pub struct ListeningPort {
    port: u16,
    pid: u32,
    process: String,
    addresses: Vec<String>,
}

fn ensure_host(host: &str) -> Result<(), String> {
    let valid = !host.is_empty()
        && host.len() <= 253
        && host
            .chars()
            .all(|c| c.is_alphanumeric() || matches!(c, '.' | '-' | '_' | ':'));
    if valid {
        Ok(())
    } else {
        Err("Invalid host name".to_string())
    }
}

fn run_script(script: &str, host: &str) -> Result<String, String> {
    ensure_host(host)?;
    shell::run_with_env(
        "powershell",
        &["-NoProfile", "-NonInteractive", "-Command", script],
        &[("CORTEX_HOST", host)],
    )
    .map(|output| String::from_utf8_lossy(&output.stdout).into_owned())
}

fn local_address(bind: &str, probe: &str) -> Option<String> {
    let socket = UdpSocket::bind(bind).ok()?;
    socket.connect(probe).ok()?;
    let address = socket.local_addr().ok()?.ip();
    (!address.is_loopback() && !address.is_unspecified()).then(|| address.to_string())
}

fn parse_dns(output: &str) -> Vec<DnsRecord> {
    output
        .lines()
        .filter_map(|line| {
            let mut parts = line.trim_end().split('\t');
            Some(DnsRecord {
                kind: parts.next()?.to_string(),
                value: parts.next()?.to_string(),
                ttl: parts.next().unwrap_or_default().to_string(),
            })
        })
        .collect()
}

fn parse_ping(output: &str) -> PingResult {
    let replies: Vec<Vec<&str>> = output
        .lines()
        .map(|line| line.trim_end().split('\t').collect())
        .collect();
    let successes: Vec<&Vec<&str>> = replies
        .iter()
        .filter(|reply| reply[0] == "Success")
        .collect();
    let total: u64 = successes
        .iter()
        .filter_map(|reply| reply.get(1)?.parse::<u64>().ok())
        .sum();

    PingResult {
        sent: replies.len(),
        received: successes.len(),
        average_ms: total / successes.len().max(1) as u64,
        address: successes
            .first()
            .and_then(|reply| reply.get(2))
            .unwrap_or(&"")
            .to_string(),
    }
}

fn parse_processes(output: &str) -> HashMap<u32, String> {
    output
        .lines()
        .filter_map(|line| {
            let fields: Vec<&str> = line.trim().trim_matches('"').split("\",\"").collect();
            Some((fields.get(1)?.parse().ok()?, fields[0].to_string()))
        })
        .collect()
}

fn parse_listeners(output: &str) -> BTreeMap<(u16, u32), Vec<String>> {
    let mut listeners: BTreeMap<(u16, u32), Vec<String>> = BTreeMap::new();

    for line in output.lines() {
        let fields: Vec<&str> = line.split_whitespace().collect();
        if fields.len() < 5 || fields[0] != "TCP" {
            continue;
        }
        if fields[2] != "0.0.0.0:0" && fields[2] != "[::]:0" {
            continue;
        }
        let Some((address, port)) = fields[1].rsplit_once(':') else {
            continue;
        };
        if let (Ok(port), Ok(pid)) = (port.parse(), fields[fields.len() - 1].parse()) {
            listeners
                .entry((port, pid))
                .or_default()
                .push(address.to_string());
        }
    }

    listeners
}

#[tauri::command(async)]
pub fn local_addresses() -> Vec<String> {
    [
        local_address("0.0.0.0:0", "8.8.8.8:80"),
        local_address("[::]:0", "[2001:4860:4860::8888]:80"),
    ]
    .into_iter()
    .flatten()
    .collect()
}

#[tauri::command(async)]
pub fn dns_lookup(host: String) -> Result<Vec<DnsRecord>, String> {
    let is_local = host.eq_ignore_ascii_case("localhost") || host.parse::<IpAddr>().is_ok();
    let mut records = if is_local {
        Vec::new()
    } else {
        parse_dns(&run_script(DNS_SCRIPT, &host)?)
    };

    if records.is_empty() {
        let mut addresses: Vec<IpAddr> = (host.as_str(), 0)
            .to_socket_addrs()
            .map_err(|_| format!("No DNS records found for {host}"))?
            .map(|address| address.ip())
            .collect();
        addresses.sort();
        addresses.dedup();
        records.extend(addresses.into_iter().map(|address| DnsRecord {
            kind: if address.is_ipv4() { "A" } else { "AAAA" }.to_string(),
            value: address.to_string(),
            ttl: String::new(),
        }));
    }

    Ok(records)
}

#[tauri::command(async)]
pub fn ping_host(host: String) -> Result<PingResult, String> {
    run_script(PING_SCRIPT, &host).map(|output| parse_ping(&output))
}

#[tauri::command(async)]
pub fn listening_ports() -> Result<Vec<ListeningPort>, String> {
    let listeners = parse_listeners(&shell::run_text("netstat", &["-ano"])?);
    let processes = parse_processes(&shell::run_text("tasklist", &["/FO", "CSV", "/NH"])?);

    Ok(listeners
        .into_iter()
        .map(|((port, pid), addresses)| ListeningPort {
            port,
            pid,
            process: processes.get(&pid).cloned().unwrap_or_default(),
            addresses,
        })
        .collect())
}

#[tauri::command(async)]
pub fn kill_process(pid: u32) -> Result<(), String> {
    if pid <= 4 || pid == std::process::id() {
        return Err("This process cannot be terminated".to_string());
    }
    shell::run("taskkill", &["/PID", &pid.to_string(), "/F"]).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_listening_rows_in_any_language() {
        let output = "  TCP    0.0.0.0:3000   0.0.0.0:0   ABHOEREN   42\n  TCP    [::]:3000   [::]:0   LISTENING   42\n  TCP    127.0.0.1:5000   1.2.3.4:443   ESTABLISHED   7\n  UDP    0.0.0.0:53   *:*   9";
        let listeners = parse_listeners(output);
        assert_eq!(listeners.len(), 1);
        assert_eq!(listeners[&(3000, 42)], vec!["0.0.0.0", "[::]"]);
    }

    #[test]
    fn parses_process_names() {
        let processes =
            parse_processes("\"node.exe\",\"42\",\"Console\",\"1\",\"50,000 K\"\r\n");
        assert_eq!(processes[&42], "node.exe");
    }

    #[test]
    fn summarizes_ping() {
        let result = parse_ping("Success\t10\t1.1.1.1\r\nTimedOut\t0\t\r\nSuccess\t20\t1.1.1.1\r\n");
        assert_eq!((result.sent, result.received, result.average_ms), (3, 2, 15));
        assert_eq!(result.address, "1.1.1.1");
    }

    #[test]
    fn rejects_unsafe_hosts() {
        assert!(ensure_host("example.com").is_ok());
        assert!(ensure_host("a;calc").is_err());
        assert!(ensure_host("$(calc)").is_err());
        assert!(ensure_host("").is_err());
    }
}
