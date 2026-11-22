import { ClipboardList } from "lucide-react";
import type { Command } from "@/core/types";
import { ClipboardView } from "./ClipboardView";

export const clipboardCommands: Command[] = [
  {
    id: "open-clipboard-history",
    name: "Clipboard History",
    description: "Browse and paste copied items (Ctrl+H)",
    icon: ClipboardList,
    category: "clipboard",
    hotkey: { key: "h", ctrl: true },
    run: (launcher) => launcher.open(<ClipboardView />),
  },
];
