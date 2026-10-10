export interface SystemCommand {
  id: string;
  name: string;
  description: string;
  iconName: "lock" | "trash" | "moon" | "power" | "rotate" | "pipette" | "clipboard" | "window-left" | "window-right" | "window-max" | "window-center" | "keyboard";
  action: "system" | "web" | "color" | "window";
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
  {
    id: "snap-left",
    name: "Snap Left (50%)",
    description: "Move window to left half of screen",
    iconName: "window-left",
    action: "window",
    command: "left",
  },
  {
    id: "snap-right",
    name: "Snap Right (50%)",
    description: "Move window to right half of screen",
    iconName: "window-right",
    action: "window",
    command: "right",
  },
  {
    id: "snap-max",
    name: "Maximize Window",
    description: "Expand window to full screen",
    iconName: "window-max",
    action: "window",
    command: "maximize",
  },
  {
    id: "snap-center",
    name: "Center Window",
    description: "Center window with comfortable margins",
    iconName: "window-center",
    action: "window",
    command: "center",
  },
  {
    id: "open-typing-game",
    name: "Typing Practice",
    description: "Monkeytype-style speed test (15s)",
    iconName: "keyboard",
    action: "system",
  },
];