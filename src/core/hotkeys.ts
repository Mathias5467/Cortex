import type { KeyboardEvent } from "react";

export interface Hotkey {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
}

const KEY_LABELS: Record<string, string> = {
  enter: "↵",
  escape: "esc",
  delete: "Del",
};

export function matchesHotkey(event: KeyboardEvent, hotkey: Hotkey): boolean {
  return (
    event.key.toLowerCase() === hotkey.key.toLowerCase() &&
    event.ctrlKey === !!hotkey.ctrl &&
    event.altKey === !!hotkey.alt &&
    (hotkey.shift === undefined || event.shiftKey === hotkey.shift)
  );
}

export function hotkeyLabel(hotkey: Hotkey): string {
  const parts: string[] = [];
  if (hotkey.ctrl) parts.push("Ctrl");
  if (hotkey.alt) parts.push("Alt");
  if (hotkey.shift) parts.push("Shift");
  parts.push(KEY_LABELS[hotkey.key.toLowerCase()] ?? hotkey.key.toUpperCase());
  return parts.join(" ");
}
