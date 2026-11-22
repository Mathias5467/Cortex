import { useMemo } from "react";
import { Copy, Scale } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import type { LauncherItem, ResultProvider } from "@/core/types";
import { convertUnits } from "./convert";

export const unitsProvider: ResultProvider = {
  id: "units",
  useItems: ({ term }) => {
    const launcher = useLauncher();

    return useMemo<LauncherItem[]>(() => {
      const unit = convertUnits(term);
      if (!unit) return [];

      return [
        {
          id: "units:result",
          section: CATEGORIES.units.label,
          icon: { kind: "tile", icon: Scale, color: CATEGORIES.units.color },
          title: unit.formattedResult,
          titleStyle: "result",
          subtitle: `(${unit.fromValue} ${unit.fromUnit})`,
          subtitleStyle: "code",
          verb: "Copy",
          footer: `Convert: ${unit.fromValue} ${unit.fromUnit} = ${unit.formattedResult}`,
          actions: [
            {
              id: "copy-value",
              label: `Copy Value (${unit.toValue})`,
              icon: Copy,
              run: () => launcher.copyAndClose(unit.toValue.toString()),
            },
            {
              id: "copy-formatted",
              label: `Copy with Unit (${unit.formattedResult})`,
              icon: Copy,
              run: () => launcher.copyAndClose(unit.formattedResult),
            },
          ],
        },
      ];
    }, [term, launcher]);
  },
};
