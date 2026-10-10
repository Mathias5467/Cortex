import { CalcResult } from "./utils/calc";
import { DevToolResult } from "./utils/devTools";
import { SystemCommand } from "./utils/systemCommands";
import { UnitConversionResult } from "./utils/unitsConverter";

export interface AppEntry {
  name: string;
  path: string;
  icon?: string;
  launch_count: number;
  last_launched: number;
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  extension?: string;
}

export interface ClipboardItem {
  id: number;
  content: string;
  item_type: "text" | "image";
  preview?: string;
  timestamp: number;
}

export type UnifiedResult =
  | { type: "calc"; data: CalcResult }
  | { type: "unit"; data: UnitConversionResult }
  | { type: "workspace"; data: Workspace }
  | { type: "dev"; data: DevToolResult }
  | { type: "command"; data: SystemCommand }
  | { type: "web"; data: { engine: string; query: string; url: string } }
  | { type: "app"; data: AppEntry }
  | { type: "file"; data: FileEntry };

export interface ActionItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  run: () => void;
}

export interface Workspace {
  id: number;
  name: string;
  description: string;
  targets: string[];
}