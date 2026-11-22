import { invoke } from "@tauri-apps/api/core";
import { Maximize2, Minimize2, PanelLeft, PanelRight } from "lucide-react";
import type { Command, Launcher } from "@/core/types";

function snapWindow(action: string) {
  return async (launcher: Launcher) => {
    await invoke("snap_window", { action }).catch(console.error);
    launcher.close();
  };
}

export const windowCommands: Command[] = [
  {
    id: "snap-left",
    name: "Snap Left (50%)",
    description: "Move window to left half of screen",
    icon: PanelLeft,
    category: "window",
    run: snapWindow("left"),
  },
  {
    id: "snap-right",
    name: "Snap Right (50%)",
    description: "Move window to right half of screen",
    icon: PanelRight,
    category: "window",
    run: snapWindow("right"),
  },
  {
    id: "snap-max",
    name: "Maximize Window",
    description: "Expand window to full screen",
    icon: Maximize2,
    category: "window",
    run: snapWindow("maximize"),
  },
  {
    id: "snap-center",
    name: "Center Window",
    description: "Center window with comfortable margins",
    icon: Minimize2,
    category: "window",
    run: snapWindow("center"),
  },
];
