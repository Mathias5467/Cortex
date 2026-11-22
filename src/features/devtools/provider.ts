import { useMemo } from "react";
import { Binary, Copy } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import type { LauncherItem, ResultProvider } from "@/core/types";
import { evaluateDevTools } from "./tools";

export const devToolsProvider: ResultProvider = {
  id: "devtools",
  useItems: ({ term }) => {
    const launcher = useLauncher();

    return useMemo<LauncherItem[]>(
      () =>
        evaluateDevTools(term).map((result) => ({
          id: `devtools:${result.id}`,
          section: CATEGORIES.developer.label,
          icon: { kind: "tile", icon: Binary, color: CATEGORIES.developer.color },
          title: result.title,
          titleStyle: "code",
          subtitle: result.subtitle,
          verb: "Copy",
          footer: `Copy: ${result.title}`,
          actions: [
            {
              id: "copy",
              label: "Copy to Clipboard",
              icon: Copy,
              run: () => launcher.copyAndClose(result.valueToCopy),
            },
          ],
        })),
      [term, launcher],
    );
  },
};
