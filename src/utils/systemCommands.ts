export interface SystemCommand {
  id: string;
  name: string;
  description: string;
  iconName: "lock" | "trash" | "moon" | "power" | "rotate" | "pipette" | "clipboard";
  action: "system" | "web" | "color";
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
  {
    id: "open-clipboard-history",
    name: "Clipboard History",
    description: "Browse and paste copied items (Ctrl+H)",
    iconName: "clipboard",
    action: "system",
  },
  {
    id: "pick-color",
    name: "Color Picker",
    description: "Sample pixel color under mouse cursor",
    iconName: "pipette",
    action: "color",
  },
];