use crate::shell::spawn;
use windows::core::PCWSTR;
use windows::Win32::Foundation::POINT;
use windows::Win32::Graphics::Gdi::{GetDC, GetPixel, ReleaseDC};
use windows::Win32::System::Shutdown::LockWorkStation;
use windows::Win32::UI::Shell::{
    SHEmptyRecycleBinW, SHERB_NOCONFIRMATION, SHERB_NOPROGRESSUI, SHERB_NOSOUND,
};
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

fn empty_recycle_bin() -> windows::core::Result<()> {
    unsafe {
        SHEmptyRecycleBinW(
            None,
            PCWSTR::null(),
            SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND,
        )
    }
}

#[tauri::command]
pub fn run_system_command(command: String) -> Result<(), String> {
    match command.as_str() {
        "lock" => unsafe { LockWorkStation() }.map_err(|e| e.to_string()),
        "empty_bin" => empty_recycle_bin().map_err(|e| e.to_string()),
        "sleep" => spawn("rundll32.exe", &["powrprof.dll,SetSuspendState", "0,1,0"]),
        "restart" => spawn("shutdown", &["/r", "/t", "0"]),
        "shutdown" => spawn("shutdown", &["/s", "/t", "0"]),
        _ => Err("Unknown command".to_string()),
    }
}

#[tauri::command]
pub fn pick_screen_color() -> Result<String, String> {
    unsafe {
        let mut point = POINT::default();
        GetCursorPos(&mut point).map_err(|_| "Failed to get cursor position".to_string())?;

        let hdc = GetDC(None);
        let pixel = GetPixel(hdc, point.x, point.y);
        ReleaseDC(None, hdc);

        let r = (pixel.0 & 0xFF) as u8;
        let g = ((pixel.0 >> 8) & 0xFF) as u8;
        let b = ((pixel.0 >> 16) & 0xFF) as u8;

        Ok(format!("#{:02X}{:02X}{:02X}", r, g, b))
    }
}
