import { Palette, Pipette, RotateCcw } from "lucide-react";
import { PALETTE, parseIconColor, type PaletteColor } from "@/core/colors";
import type { Command, Launcher, RunAction, SubmenuAction } from "@/core/types";
import { defaultCommandColor, resetIconColor, setIconColor } from "./iconColors";

const COLOR_NAMES = Object.keys(PALETTE) as PaletteColor[];

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function createColorAction(command: Command, isOverridden: boolean, launcher: Launcher): SubmenuAction {
  const swatches: RunAction[] = COLOR_NAMES.map((name) => ({
    id: `color-${name}`,
    label: capitalize(name),
    swatch: name,
    run: () => setIconColor(command.id, name),
  }));

  const custom: RunAction = {
    id: "color-custom",
    label: "Custom Hex...",
    icon: Pipette,
    run: () =>
      launcher.prompt({
        icon: Palette,
        label: `Color: ${command.name}`,
        placeholder: "#ff6363",
        validate: (value) => (parseIconColor(value.toLowerCase()) ? null : "Use a hex value like #ff6363"),
        onSubmit: async (value) => {
          const color = parseIconColor(value.toLowerCase());
          if (color) await setIconColor(command.id, color);
        },
      }),
  };

  const reset: RunAction = {
    id: "color-reset",
    label: "Reset to Default",
    icon: RotateCcw,
    swatch: defaultCommandColor(command),
    run: () => resetIconColor(command.id),
  };

  return {
    id: "change-color",
    label: "Change Color",
    icon: Palette,
    hotkey: { key: "c", alt: true },
    children: [...(isOverridden ? [reset] : []), ...swatches, custom],
  };
}
