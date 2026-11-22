import { invoke } from "@tauri-apps/api/core";
import { createResource } from "@/core/resource";

export interface Workspace {
  id: number;
  name: string;
  description: string;
  targets: string[];
}

export type WorkspaceDraft = Omit<Workspace, "id"> & { id?: number };

export const workspacesStore = createResource<Workspace[]>([], () => invoke<Workspace[]>("get_all_workspaces"));

export function launchWorkspace(workspace: Workspace) {
  return invoke<void>("launch_workspace", { targets: workspace.targets });
}

export async function saveWorkspace(draft: WorkspaceDraft) {
  await invoke("save_workspace_item", { ...draft, id: draft.id ?? null });
  await workspacesStore.reload();
}

export async function deleteWorkspace(id: number) {
  await invoke("delete_workspace_by_id", { id });
  await workspacesStore.reload();
}
