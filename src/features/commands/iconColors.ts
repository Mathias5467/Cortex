import { invoke } from "@tauri-apps/api/core";
import { CATEGORIES, parseIconColor, type IconColor } from "@/core/colors";
import { createResource } from "@/core/resource";
import type { Command } from "@/core/types";

type ColorOverrides = Record<string, string>;

export const iconColors = createResource<ColorOverrides>({}, () => invoke<ColorOverrides>("get_icon_colors"));

export async function setIconColor(itemId: string, color: IconColor) {
  await invoke("set_icon_color", { itemId, color });
  await iconColors.reload();
}

export async function resetIconColor(itemId: string) {
  await invoke("reset_icon_color", { itemId });
  await iconColors.reload();
}

export function defaultCommandColor(command: Command): IconColor {
  return command.color ?? CATEGORIES[command.category].color;
}

export function resolveCommandColor(command: Command, overrides: ColorOverrides): IconColor {
  return parseIconColor(overrides[command.id]) ?? defaultCommandColor(command);
}
