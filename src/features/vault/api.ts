import { invoke } from "@tauri-apps/api/core";

export interface VaultStatus {
  is_initialized: boolean;
  is_unlocked: boolean;
}

export interface VaultEntry {
  id: number;
  title: string;
  username: string;
  password: string;
  url?: string;
  updated_at: number;
}

export interface VaultDraft {
  id: number | null;
  title: string;
  username: string;
  password: string;
  url: string | null;
}

export const vaultApi = {
  status: () => invoke<VaultStatus>("check_vault_status"),
  setup: (password: string) => invoke<void>("setup_master_password", { password }),
  unlock: (password: string) => invoke<boolean>("unlock_vault", { password }),
  lock: () => invoke<void>("lock_vault"),
  list: () => invoke<VaultEntry[]>("get_vault_entries"),
  save: (draft: VaultDraft) => invoke<void>("save_vault_item", { ...draft }),
  remove: (id: number) => invoke<void>("delete_vault_item", { id }),
};
