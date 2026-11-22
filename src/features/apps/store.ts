import { invoke } from "@tauri-apps/api/core";
import { createResource } from "@/core/resource";

export interface AppEntry {
  name: string;
  path: string;
  icon?: string;
  launch_count: number;
  last_launched: number;
}

type Aliases = Record<string, string>;

export const appsStore = createResource<AppEntry[]>([], () => invoke<AppEntry[]>("scan_app_shortcuts"));

export const aliasesStore = createResource<Aliases>({}, () => invoke<Aliases>("get_aliases"));

export function recordLaunch(path: string) {
  const now = Math.floor(Date.now() / 1000);
  appsStore.update((apps) =>
    apps.map((app) =>
      app.path === path ? { ...app, launch_count: app.launch_count + 1, last_launched: now } : app,
    ),
  );
}

export async function removeAlias(path: string) {
  await invoke("remove_app_alias", { path });
  await aliasesStore.reload();
}

export async function saveAlias(alias: string, path: string) {
  if (!alias) return removeAlias(path);
  await invoke("set_app_alias", { alias, path });
  await aliasesStore.reload();
}
