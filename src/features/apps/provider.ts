import { useMemo } from "react";
import { Copy, ExternalLink, FolderOpen, Tag, Trash2 } from "lucide-react";
import { calculateFrecency, fuzzyScore } from "@/core/fuzzy";
import { useLauncher } from "@/core/launcher";
import type { Launcher, LauncherItem, Query, ResultProvider } from "@/core/types";
import { aliasesStore, appsStore, recordLaunch, removeAlias, saveAlias, type AppEntry } from "./store";

const ALIAS_SCORE = 100000;

function rankApps(apps: AppEntry[], aliases: Record<string, string>, { term, lower }: Query): AppEntry[] {
  const aliasedPath = aliases[lower];

  return apps
    .map((app) => {
      const frecency = calculateFrecency(app.launch_count, app.last_launched);
      if (!term) return { app, score: frecency };
      if (aliasedPath === app.path) return { app, score: ALIAS_SCORE };
      const match = fuzzyScore(lower, app.name);
      return { app, score: match > 0 ? match * 10 + frecency : 0 };
    })
    .filter(({ score }) => !term || score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ app }) => app);
}

function createAppItem(app: AppEntry, alias: string | undefined, launcher: Launcher): LauncherItem {
  return {
    id: `app:${app.path}`,
    section: "Applications",
    icon: app.icon
      ? { kind: "image", src: app.icon }
      : { kind: "letter", text: app.name.charAt(0).toUpperCase() },
    title: app.name,
    tag: alias,
    verb: "Open",
    footer: app.path,
    actions: [
      {
        id: "open",
        label: "Open Application",
        icon: ExternalLink,
        run: () => {
          recordLaunch(app.path);
          return launcher.openPath(app.path);
        },
      },
      {
        id: "show-folder",
        label: "Show in File Explorer",
        icon: FolderOpen,
        hotkey: { key: "Enter", ctrl: true },
        run: () => launcher.showInFolder(app.path),
      },
      {
        id: "copy-path",
        label: "Copy Path",
        icon: Copy,
        run: () => launcher.copyAndClose(app.path),
      },
      {
        id: "set-alias",
        label: alias ? "Change Custom Alias" : "Set Custom Alias",
        icon: Tag,
        hotkey: { key: "a", alt: true },
        run: () =>
          launcher.prompt({
            icon: Tag,
            label: `Alias: ${app.name}`,
            placeholder: "Type nickname and hit Enter...",
            onSubmit: (value) => saveAlias(value.toLowerCase(), app.path),
          }),
      },
      ...(alias
        ? [
            {
              id: "remove-alias",
              label: `Remove Alias (${alias})`,
              icon: Trash2,
              tone: "danger" as const,
              run: () => removeAlias(app.path),
            },
          ]
        : []),
    ],
  };
}

export const appsProvider: ResultProvider = {
  id: "apps",
  hidesFallback: true,
  useItems: (query) => {
    const launcher = useLauncher();
    const apps = appsStore.use();
    const aliases = aliasesStore.use();

    return useMemo<LauncherItem[]>(() => {
      const aliasByPath = new Map<string, string>();
      for (const [alias, path] of Object.entries(aliases)) {
        if (!aliasByPath.has(path)) aliasByPath.set(path, alias);
      }
      return rankApps(apps, aliases, query).map((app) => createAppItem(app, aliasByPath.get(app.path), launcher));
    }, [apps, aliases, query, launcher]);
  },
};
