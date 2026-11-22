use std::io::ErrorKind;
use std::os::windows::process::CommandExt;
use std::process::{Command, Output};

const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub fn spawn(program: &str, args: &[&str]) -> Result<(), String> {
    Command::new(program)
        .args(args)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub fn open_target(target: &str) -> Result<(), String> {
    spawn("cmd", &["/C", "start", "", target])
}

pub fn reveal(path: &str) -> Result<(), String> {
    spawn("explorer", &["/select,", path])
}

pub fn run(program: &str, args: &[&str]) -> Result<Output, String> {
    run_with_env(program, args, &[])
}

pub fn run_with_env(
    program: &str,
    args: &[&str],
    envs: &[(&str, &str)],
) -> Result<Output, String> {
    let output = Command::new(program)
        .args(args)
        .envs(envs.iter().copied())
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => format!("{program} is not installed or not in PATH"),
            _ => e.to_string(),
        })?;

    if output.status.success() {
        return Ok(output);
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    Err(if stderr.is_empty() {
        format!("{program} failed ({})", output.status)
    } else {
        stderr
    })
}

pub fn run_text(program: &str, args: &[&str]) -> Result<String, String> {
    run(program, args).map(|output| String::from_utf8_lossy(&output.stdout).into_owned())
}
