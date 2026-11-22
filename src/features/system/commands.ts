import { invoke } from "@tauri-apps/api/core";
import { Lock, Moon, Power, RotateCw, Trash2 } from "lucide-react";
import type { Command, Launcher } from "@/core/types";

function runSystem(command: string) {
  return (launcher: Launcher) => {
    invoke("run_system_command", { command }).catch(console.error);
    launcher.close();
  };
}

export const systemCommands: Command[] = [
  {
    id: "lock-pc",
    name: "Lock Screen",
    description: "Lock your Windows workstation",
    icon: Lock,
    category: "system",
    run: runSystem("lock"),
  },
  {
    id: "empty-recycle-bin",
    name: "Empty Recycle Bin",
    description: "Permanently delete items in trash",
    icon: Trash2,
    category: "system",
    run: runSystem("empty_bin"),
  },
  {
    id: "sleep-pc",
    name: "Sleep",
    description: "Put computer into sleep mode",
    icon: Moon,
    category: "system",
    run: runSystem("sleep"),
  },
  {
    id: "restart-pc",
    name: "Restart Computer",
    description: "Reboot Windows",
    icon: RotateCw,
    category: "system",
    run: runSystem("restart"),
  },
  {
    id: "shutdown-pc",
    name: "Shut Down",
    description: "Power off computer",
    icon: Power,
    category: "system",
    run: runSystem("shutdown"),
  },
];
