import { KeyRound } from "lucide-react";
import type { Command } from "@/core/types";

export const secretsCommands: Command[] = [
  {
    id: "password-generator",
    name: "Password Generator",
    description: "Generate a secure password (pass <length>)",
    icon: KeyRound,
    category: "security",
    run: (launcher) => launcher.search("pass "),
  },
  {
    id: "api-key-generator",
    name: "API Key Generator",
    description: "Generate a secure API key or secret (secret <bytes>)",
    icon: KeyRound,
    category: "security",
    run: (launcher) => launcher.search("secret "),
  },
];
