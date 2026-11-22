import { FolderPlus } from "lucide-react";
import type { Command } from "@/core/types";
import { WorkspaceEditor } from "./WorkspaceEditor";

export const workspaceCommands: Command[] = [
  {
    id: "create-workspace-cmd",
    name: "Create Workspace",
    description: "Vytvor nový balíček aplikácií a webov na 1 klik",
    icon: FolderPlus,
    category: "workspace",
    run: (launcher) => launcher.open(<WorkspaceEditor />),
  },
];
