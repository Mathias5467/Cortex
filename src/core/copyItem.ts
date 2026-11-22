import { Copy, type LucideIcon } from "lucide-react";
import { CATEGORIES, type CategoryId } from "./colors";
import type { Launcher, LauncherAction, LauncherItem } from "./types";

interface CopyItemOptions {
  id: string;
  section: string;
  category: CategoryId;
  icon: LucideIcon;
  value: string;
  title?: string;
  subtitle?: string;
  layout?: LauncherItem["layout"];
  isSecret?: boolean;
  actions?: LauncherAction[];
}

export function createCopyItem(launcher: Launcher, options: CopyItemOptions): LauncherItem {
  const copy = options.isSecret ? launcher.copySecretAndClose : launcher.copyAndClose;

  return {
    id: options.id,
    section: options.section,
    icon: { kind: "tile", icon: options.icon, color: CATEGORIES[options.category].color },
    title: options.title ?? options.value,
    titleStyle: "code",
    subtitle: options.subtitle,
    layout: options.layout ?? "stacked",
    verb: "Copy",
    footer: `Copy: ${options.subtitle ?? options.section}`,
    actions: [
      { id: "copy", label: "Copy to Clipboard", icon: Copy, run: () => copy(options.value) },
      ...(options.actions ?? []),
    ],
  };
}
