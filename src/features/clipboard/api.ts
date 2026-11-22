import { invoke } from "@tauri-apps/api/core";

export interface ClipboardItem {
  id: number;
  content: string;
  item_type: "text" | "image";
  preview?: string;
  timestamp: number;
}

export const clipboardApi = {
  list: () => invoke<ClipboardItem[]>("get_clipboard_history"),
  remove: (id: number) => invoke<void>("delete_clipboard_item", { id }),
  save: (id: number, content: string) => invoke<void>("save_edited_clipboard_item", { id, content }),
};
