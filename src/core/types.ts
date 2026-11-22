import type { ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import type { CategoryId, IconColor } from "./colors";
import type { Hotkey } from "./hotkeys";

export interface PromptRequest {
  icon: LucideIcon;
  label: string;
  placeholder: string;
  validate?: (value: string) => string | null;
  onSubmit: (value: string) => void | Promise<void>;
}

export type NoticeTone = "info" | "error";

export interface Notice {
  message: string;
  tone: NoticeTone;
}

export interface Launcher {
  close: () => void;
  copyAndClose: (text: string) => Promise<void>;
  copySecretAndClose: (text: string) => Promise<void>;
  openPath: (path: string) => Promise<void>;
  showInFolder: (path: string) => Promise<void>;
  open: (view: ReactElement) => void;
  goBack: () => void;
  search: (term: string) => void;
  notify: (message: string, tone?: NoticeTone) => void;
  prompt: (request: PromptRequest) => void;
}

interface ActionBase {
  id: string;
  label: string;
  icon?: LucideIcon;
  swatch?: IconColor;
  hotkey?: Hotkey;
  tone?: "default" | "danger";
}

export interface RunAction extends ActionBase {
  run: () => void | Promise<void>;
}

export interface SubmenuAction extends ActionBase {
  children: LauncherAction[];
}

export type LauncherAction = RunAction | SubmenuAction;

export type ItemIcon =
  | { kind: "tile"; icon: LucideIcon; color: IconColor }
  | { kind: "image"; src: string }
  | { kind: "letter"; text: string };

export interface LauncherItem {
  id: string;
  section: string;
  icon: ItemIcon;
  title: string;
  titleStyle?: "default" | "result" | "code";
  subtitle?: string;
  subtitleStyle?: "default" | "code";
  layout?: "inline" | "stacked";
  tag?: string;
  verb: string;
  footer: string;
  actions: [RunAction, ...LauncherAction[]];
}

export interface Query {
  term: string;
  lower: string;
}

export interface ResultProvider {
  id: string;
  useItems: (query: Query) => LauncherItem[];
  hidesFallback?: boolean;
  isFallback?: boolean;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: CategoryId;
  color?: IconColor;
  hotkey?: Hotkey;
  run: (launcher: Launcher) => void | Promise<void>;
}
