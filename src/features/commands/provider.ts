import { useMemo } from "react";
import { fuzzyScore } from "@/core/fuzzy";
import { useLauncher } from "@/core/launcher";
import type { LauncherItem, ResultProvider } from "@/core/types";
import { COMMANDS } from "@/registry/commands";
import { createColorAction } from "./colorAction";
import { iconColors, resolveCommandColor } from "./iconColors";

export const commandsProvider: ResultProvider = {
  id: "commands",
  useItems: ({ term, lower }) => {
    const launcher = useLauncher();
    const overrides = iconColors.use();

    return useMemo<LauncherItem[]>(() => {
      if (!term) return [];

      return COMMANDS.filter((command) => fuzzyScore(lower, command.name) > 0).map((command) => ({
        id: `command:${command.id}`,
        section: "Commands",
        icon: { kind: "tile", icon: command.icon, color: resolveCommandColor(command, overrides) },
        title: command.name,
        subtitle: command.description,
        layout: "stacked",
        verb: "Open",
        footer: command.description,
        actions: [
          {
            id: "run",
            label: `Run ${command.name}`,
            icon: command.icon,
            hotkey: command.hotkey,
            run: () => command.run(launcher),
          },
          createColorAction(command, command.id in overrides, launcher),
        ],
      }));
    }, [term, lower, launcher, overrides]);
  },
};
