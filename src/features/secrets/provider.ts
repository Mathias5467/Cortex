import { useMemo, useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import { createCopyItem } from "@/core/copyItem";
import { matchKeyword } from "@/core/keyword";
import { useLauncher } from "@/core/launcher";
import type { ResultProvider, RunAction } from "@/core/types";
import { generateKeys, generatePasswords, type GeneratedSecret } from "./generate";

const GENERATORS: Record<string, { section: string; generate: (args: string) => GeneratedSecret[] }> = {
  pass: { section: "Password Generator", generate: generatePasswords },
  secret: { section: "API Key Generator", generate: generateKeys },
  apikey: { section: "API Key Generator", generate: generateKeys },
};

const KEYWORDS = Object.keys(GENERATORS);

export const secretsProvider: ResultProvider = {
  id: "secrets",
  hidesFallback: true,
  useItems: (query) => {
    const launcher = useLauncher();
    const [version, setVersion] = useState(0);
    const match = matchKeyword(query, KEYWORDS);
    const keyword = match?.keyword;
    const args = match?.args ?? "";

    return useMemo(() => {
      if (!keyword || (args && !/^\d+$/.test(args))) return [];

      const { section, generate } = GENERATORS[keyword];
      const regenerate: RunAction = {
        id: "regenerate",
        label: "Generate New Values",
        icon: RefreshCw,
        hotkey: { key: "r", ctrl: true },
        run: () => setVersion(version + 1),
      };

      return generate(args).map(({ id, label, value }) =>
        createCopyItem(launcher, {
          id: `secret:${id}`,
          section,
          category: "security",
          icon: KeyRound,
          value,
          subtitle: label,
          isSecret: true,
          actions: [regenerate],
        }),
      );
    }, [keyword, args, version, launcher]);
  },
};
