import { useMemo } from "react";
import { Calculator, Copy } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import type { LauncherItem, ResultProvider } from "@/core/types";
import { evaluateMath } from "./evaluate";

export const calculatorProvider: ResultProvider = {
  id: "calculator",
  useItems: ({ term }) => {
    const launcher = useLauncher();

    return useMemo<LauncherItem[]>(() => {
      const calc = evaluateMath(term);
      if (!calc) return [];

      return [
        {
          id: "calculator:result",
          section: CATEGORIES.calculator.label,
          icon: { kind: "tile", icon: Calculator, color: CATEGORIES.calculator.color },
          title: calc.result,
          titleStyle: "result",
          subtitle: `(${calc.expression})`,
          subtitleStyle: "code",
          verb: "Copy",
          footer: `Calculator: ${calc.expression} = ${calc.result}`,
          actions: [
            {
              id: "copy-result",
              label: "Copy Result",
              icon: Copy,
              run: () => launcher.copyAndClose(calc.result.replace(/,/g, "")),
            },
          ],
        },
      ];
    }, [term, launcher]);
  },
};
