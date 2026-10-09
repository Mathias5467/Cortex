use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use image::{ImageBuffer, ImageFormat, Rgba};
use std::ffi::OsStr;
use std::io::Cursor;
use std::os::windows::ffi::OsStrExt;
use windows::core::PCWSTR;
use windows::Win32::Foundation::SIZE;
use windows::Win32::Graphics::Gdi::{
    DeleteObject, GetDC, GetDIBits, ReleaseDC, BITMAPINFO, BITMAPINFOHEADER, BI_RGB,
    DIB_RGB_COLORS,
};
use windows::Win32::System::Com::{CoInitializeEx, CoUninitialize, COINIT_APARTMENTTHREADED};
use windows::Win32::UI::Shell::{
    SHCreateItemFromParsingName, IShellItemImageFactory, SIIGBF_BIGGERSIZEOK, SIIGBF_ICONONLY,
};

pub fn get_icon_as_base64(file_path: &str) -> Option<String> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        let wide_path: Vec<u16> = OsStr::new(file_path)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();

        let factory: IShellItemImageFactory =
            match SHCreateItemFromParsingName(PCWSTR(wide_path.as_ptr()), None) {
                Ok(f) => f,
                Err(_) => {
                    CoUninitialize();
                    return None;
                }
            };

        let icon_size = 48i32;
        let hbitmap = match factory.GetImage(
            SIZE {
                cx: icon_size,
                cy: icon_size,
            },
            SIIGBF_ICONONLY | SIIGBF_BIGGERSIZEOK,
        ) {
            Ok(b) => b,
            Err(_) => {
                CoUninitialize();
                return None;
            }
        };

        let mut bmi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: icon_size,
                biHeight: -icon_size,
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            },
            ..Default::default()
        };

        let hdc = GetDC(None);
        let mut raw_pixels = vec![0u8; (icon_size * icon_size * 4) as usize];

        GetDIBits(
            hdc,
            hbitmap,
            0,
            icon_size as u32,
            Some(raw_pixels.as_mut_ptr() as *mut _),
            &mut bmi,
            DIB_RGB_COLORS,
        );

        ReleaseDC(None, hdc);
        let _ = DeleteObject(hbitmap);
        CoUninitialize();

        for chunk in raw_pixels.chunks_exact_mut(4) {
            chunk.swap(0, 2);
        }

        let all_transparent = raw_pixels.iter().skip(3).step_by(4).all(|&a| a == 0);
        if all_transparent {
            for a in raw_pixels.iter_mut().skip(3).step_by(4) {
                *a = 255;
            }
        }

        let img_buffer: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_raw(icon_size as u32, icon_size as u32, raw_pixels)?;

        let mut png_bytes = Cursor::new(Vec::new());
        img_buffer.write_to(&mut png_bytes, ImageFormat::Png).ok()?;

        let base64_str = BASE64.encode(png_bytes.into_inner());
        Some(format!("data:image/png;base64,{}", base64_str))
    }
}