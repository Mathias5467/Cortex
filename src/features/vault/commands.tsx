import { ShieldCheck } from "lucide-react";
import type { Command } from "@/core/types";
import { VaultView } from "./VaultView";

export const vaultCommands: Command[] = [
  {
    id: "open-vault-cmd",
    name: "Password Vault",
    description: "Šifrovaný trezor hesiel (AES-256)",
    icon: ShieldCheck,
    category: "security",
    run: (launcher) => launcher.open(<VaultView />),
  },
];
