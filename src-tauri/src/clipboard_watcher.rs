use crate::db::Database;
use arboard::{Clipboard, Error, ImageData};
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use std::io::Cursor;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use windows::core::{w, PCWSTR};
use windows::Win32::System::DataExchange::{
    GetClipboardSequenceNumber, IsClipboardFormatAvailable, RegisterClipboardFormatW,
};

const POLL_INTERVAL: Duration = Duration::from_millis(600);

const PRIVATE_FORMATS: [PCWSTR; 2] = [
    w!("ExcludeClipboardContentFromMonitorProcessing"),
    w!("Clipboard Viewer Ignore"),
];

pub fn start(app: AppHandle) {
    std::thread::spawn(move || watch(app));
}

fn watch(app: AppHandle) {
    let Ok(mut clipboard) = Clipboard::new() else {
        return;
    };
    let mut last_sequence = None;

    loop {
        std::thread::sleep(POLL_INTERVAL);

        let sequence = sequence_number();
        if last_sequence == Some(sequence) {
            continue;
        }

        if is_private() {
            last_sequence = Some(sequence);
            continue;
        }

        let (Some(text), Some(image)) = (
            unless_occupied(clipboard.get_text()),
            unless_occupied(clipboard.get_image()),
        ) else {
            continue;
        };

        if is_private() || sequence_number() != sequence {
            continue;
        }

        last_sequence = Some(sequence);
        if let Some(text) = text {
            save_text(&app, text.trim());
        }
        if let Some(image) = image {
            save_image(&app, image);
        }
    }
}

fn sequence_number() -> u32 {
    unsafe { GetClipboardSequenceNumber() }
}

pub fn is_private() -> bool {
    PRIVATE_FORMATS.iter().any(|name| unsafe {
        let format = RegisterClipboardFormatW(*name);
        format != 0 && IsClipboardFormatAvailable(format).is_ok()
    })
}

fn unless_occupied<T>(result: Result<T, Error>) -> Option<Option<T>> {
    match result {
        Err(Error::ClipboardOccupied) => None,
        other => Some(other.ok()),
    }
}

fn save_text(app: &AppHandle, text: &str) {
    if text.is_empty() {
        return;
    }
    with_database(app, |db| {
        let _ = db.save_clipboard_entry(text);
    });
}

fn save_image(app: &AppHandle, image: ImageData<'_>) {
    if image.width == 0 || image.height == 0 {
        return;
    }
    let dimensions = format!("{} × {}", image.width, image.height);
    if let Some(preview) = create_preview(image) {
        with_database(app, |db| {
            let _ = db.save_clipboard_image(&dimensions, &preview);
        });
    }
}

fn with_database(app: &AppHandle, action: impl FnOnce(&Database)) {
    if let Some(state) = app.try_state::<Mutex<Database>>() {
        if let Ok(db) = state.lock() {
            action(&db);
        }
    }
}

fn create_preview(img: ImageData<'_>) -> Option<String> {
    let rgba =
        image::RgbaImage::from_raw(img.width as u32, img.height as u32, img.bytes.into_owned())?;
    let thumb = image::DynamicImage::ImageRgba8(rgba).thumbnail(280, 160);

    let mut png_bytes = Cursor::new(Vec::new());
    thumb
        .write_to(&mut png_bytes, image::ImageFormat::Png)
        .ok()?;

    Some(format!(
        "data:image/png;base64,{}",
        BASE64.encode(png_bytes.into_inner())
    ))
}
