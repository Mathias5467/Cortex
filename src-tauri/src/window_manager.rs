use tauri::Manager;
use windows::Win32::Foundation::{HWND, RECT};
use windows::Win32::Graphics::Gdi::{
    GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetWindow, GetWindowLongW, IsWindowVisible, SetWindowPos, ShowWindow,
    GWL_EXSTYLE, GW_HWNDNEXT, HWND_TOP, SWP_NOACTIVATE, SW_MAXIMIZE, SW_RESTORE,
    WS_EX_TOOLWINDOW,
};

fn get_previous_window(cortex_hwnd: HWND) -> Option<HWND> {
    unsafe {
        let mut current = GetWindow(cortex_hwnd, GW_HWNDNEXT).ok()?;
        while !current.is_invalid() {
            if IsWindowVisible(current).as_bool() {
                let ex_style = GetWindowLongW(current, GWL_EXSTYLE) as u32;
                if (ex_style & WS_EX_TOOLWINDOW.0) == 0 {
                    return Some(current);
                }
            }
            current = match GetWindow(current, GW_HWNDNEXT) {
                Ok(next) => next,
                Err(_) => break,
            };
        }
        None
    }
}

fn get_monitor_work_area(hwnd: HWND) -> Option<RECT> {
    unsafe {
        let hmonitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
        let mut mi = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            ..Default::default()
        };
        if GetMonitorInfoW(hmonitor, &mut mi).as_bool() {
            Some(mi.rcWork)
        } else {
            None
        }
    }
}

#[tauri::command]
pub fn snap_window(action: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let main_window = app_handle
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let cortex_hwnd = HWND(main_window.hwnd().map_err(|e| e.to_string())?.0 as _);
    let target_hwnd = get_previous_window(cortex_hwnd).ok_or("No target window found")?;

    let work_area = get_monitor_work_area(target_hwnd).ok_or("Failed to get monitor info")?;

    let x = work_area.left;
    let y = work_area.top;
    let width = work_area.right - work_area.left;
    let height = work_area.bottom - work_area.top;

    unsafe {
        let _ = ShowWindow(target_hwnd, SW_RESTORE);

        match action.as_str() {
            "left" => {
                SetWindowPos(
                    target_hwnd,
                    HWND_TOP,
                    x,
                    y,
                    width / 2,
                    height,
                    SWP_NOACTIVATE,
                )
                .map_err(|e| e.to_string())?;
            }
            "right" => {
                SetWindowPos(
                    target_hwnd,
                    HWND_TOP,
                    x + (width / 2),
                    y,
                    width / 2,
                    height,
                    SWP_NOACTIVATE,
                )
                .map_err(|e| e.to_string())?;
            }
            "maximize" => {
                let _ = ShowWindow(target_hwnd, SW_MAXIMIZE);
            }
            "center" => {
                let w = (width as f32 * 0.7) as i32;
                let h = (height as f32 * 0.8) as i32;
                let cx = x + (width - w) / 2;
                let cy = y + (height - h) / 2;
                SetWindowPos(target_hwnd, HWND_TOP, cx, cy, w, h, SWP_NOACTIVATE)
                    .map_err(|e| e.to_string())?;
            }
            _ => return Err("Unknown snap action".to_string()),
        }
    }

    Ok(())
}