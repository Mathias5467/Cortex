import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const native = {
  hideWindow: () => getCurrentWindow().hide(),
  copyText: (text: string) => invoke<void>("copy_to_clipboard", { text }),
  readText: () => invoke<string>("read_clipboard_text"),
  copySecret: (text: string) => invoke<void>("copy_secret_to_clipboard", { text }),
  copyImage: (previewBase64: string) => invoke<void>("copy_image_to_clipboard", { previewBase64 }),
  launch: (path: string) => invoke<void>("launch_app", { path }),
  showInFolder: (path: string) => invoke<void>("show_in_folder", { path }),
};
