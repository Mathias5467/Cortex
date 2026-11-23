import { useMemo } from "react";
import { CaseSensitive } from "lucide-react";
import { createCopyItem } from "@/core/copyItem";
import { matchKeyword } from "@/core/keyword";
import { useLauncher } from "@/core/launcher";
import type { ResultProvider } from "@/core/types";
import { useClipboardText } from "@/core/useClipboardText";
import { convertCases } from "./convert";

export const caseConverterProvider: ResultProvider = {
  id: "case-converter",
  hidesFallback: true,
  useItems: (query) => {
    const launcher = useLauncher();
    const match = matchKeyword(query, ["case"]);
    const clipboard = useClipboardText(match?.args === "");
    const text = match ? match.args || clipboard : "";

    return useMemo(
      () =>
        convertCases(text).map(({ id, label, value }) =>
          createCopyItem(launcher, {
            id: `case:${id}`,
            section: "Case Converter",
            category: "text",
            icon: CaseSensitive,
            value,
            subtitle: label,
          }),
        ),
      [text, launcher],
    );
  },
};
