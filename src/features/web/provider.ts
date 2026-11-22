import { useMemo } from "react";
import { Globe } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import type { Launcher, LauncherItem, ResultProvider } from "@/core/types";

interface WebEngine {
  name: string;
  prefix: string;
  baseUrl: string;
}

const GOOGLE: WebEngine = { name: "Google", prefix: "g", baseUrl: "https://www.google.com/search?q=" };

const WEB_ENGINES: WebEngine[] = [
  GOOGLE,
  { name: "YouTube", prefix: "yt", baseUrl: "https://www.youtube.com/results?search_query=" },
  { name: "GitHub", prefix: "gh", baseUrl: "https://github.com/search?q=" },
];

function createWebItem(id: string, engine: WebEngine, search: string, launcher: Launcher): LauncherItem {
  const url = engine.baseUrl + encodeURIComponent(search);

  return {
    id,
    section: CATEGORIES.web.label,
    icon: { kind: "tile", icon: Globe, color: CATEGORIES.web.color },
    title: `Search ${engine.name}`,
    subtitle: `"${search}"`,
    verb: "Search",
    footer: `Open URL: ${url}`,
    actions: [
      {
        id: "open-web",
        label: `Search on ${engine.name}`,
        icon: Globe,
        run: () => launcher.openPath(url),
      },
    ],
  };
}

export const webProvider: ResultProvider = {
  id: "web",
  hidesFallback: true,
  useItems: ({ term, lower }) => {
    const launcher = useLauncher();

    return useMemo<LauncherItem[]>(() => {
      const engine = WEB_ENGINES.find(({ prefix }) => lower.startsWith(`${prefix} `));
      if (!engine) return [];
      const search = term.slice(engine.prefix.length + 1).trim();
      return [createWebItem("web:search", engine, search, launcher)];
    }, [term, lower, launcher]);
  },
};

export const webFallbackProvider: ResultProvider = {
  id: "web-fallback",
  isFallback: true,
  useItems: ({ term }) => {
    const launcher = useLauncher();

    return useMemo<LauncherItem[]>(
      () => (term ? [createWebItem("web:fallback", GOOGLE, term, launcher)] : []),
      [term, launcher],
    );
  },
};
