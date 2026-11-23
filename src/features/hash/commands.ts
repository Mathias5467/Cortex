import { Fingerprint } from "lucide-react";
import type { Command } from "@/core/types";

export const hashCommands: Command[] = [
  {
    id: "hash-generator",
    name: "Hash & Checksum Generator",
    description: "SHA-256, MD5, SHA-1, SHA-512 of text or clipboard (hash <text>)",
    icon: Fingerprint,
    category: "security",
    run: (launcher) => launcher.search("hash "),
  },
];
