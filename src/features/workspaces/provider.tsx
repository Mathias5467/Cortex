import { useMemo } from "react";
import { Layers, Pencil, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { fuzzyScore } from "@/core/fuzzy";
import { useLauncher } from "@/core/launcher";
import type { LauncherItem, ResultProvider } from "@/core/types";
import { WorkspaceEditor } from "./WorkspaceEditor";
import { deleteWorkspace, launchWorkspace, workspacesStore } from "./store";

export const workspacesProvider: ResultProvider = {
  id: "workspaces",
  useItems: ({ term, lower }) => {
    const launcher = useLauncher();
    const workspaces = workspacesStore.use();

    return useMemo<LauncherItem[]>(
      () =>
        workspaces
          .filter((workspace) => !term || fuzzyScore(lower, workspace.name) > 0)
          .map((workspace) => ({
            id: `workspace:${workspace.id}`,
            section: "Workspaces & Bundles",
            icon: { kind: "tile", icon: Layers, color: CATEGORIES.workspace.color },
            title: workspace.name,
            subtitle: workspace.description,
            layout: "stacked",
            verb: "Open",
            footer: `Workspace: ${workspace.name} (${workspace.targets.length} položiek)`,
            actions: [
              {
                id: "launch",
                label: `Spustiť bundle (${workspace.targets.length} položiek)`,
                icon: Layers,
                run: () => {
                  launchWorkspace(workspace).catch(console.error);
                  launcher.close();
                },
              },
              {
                id: "edit",
                label: "Upraviť položky balíčka",
                icon: Pencil,
                hotkey: { key: "e", ctrl: true },
                run: () => launcher.open(<WorkspaceEditor workspace={workspace} />),
              },
              {
                id: "delete",
                label: "Zmazať Workspace",
                icon: Trash2,
                tone: "danger",
                run: () => deleteWorkspace(workspace.id),
              },
            ],
          })),
      [term, lower, workspaces, launcher],
    );
  },
};
