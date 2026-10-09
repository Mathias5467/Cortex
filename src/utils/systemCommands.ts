export interface SystemCommand {
  id: string;
  name: string;
  description: string;
  iconName: "lock" | "trash" | "moon" | "power" | "rotate";
  action: "system" | "web";
  command?: string;
  urlTemplate?: string;
}

export const SYSTEM_COMMANDS: SystemCommand[] = [
  {
    id: "lock-pc",
    name: "Lock Screen",
    description: "Lock your Windows workstation",
    iconName: "lock",
    action: "system",
    command: "lock",
  },
  {
    id: "empty-recycle-bin",
    name: "Empty Recycle Bin",
    description: "Permanently delete items in trash",
    iconName: "trash",
    action: "system",
    command: "empty_bin",
  },
  {
    id: "sleep-pc",
    name: "Sleep",
    description: "Put computer into sleep mode",
    iconName: "moon",
    action: "system",
    command: "sleep",
  },
  {
    id: "restart-pc",
    name: "Restart Computer",
    description: "Reboot Windows",
    iconName: "rotate",
    action: "system",
    command: "restart",
  },
  {
    id: "shutdown-pc",
    name: "Shut Down",
    description: "Power off computer",
    iconName: "power",
    action: "system",
    command: "shutdown",
  },
];