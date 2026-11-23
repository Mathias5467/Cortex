import { CaseSensitive } from "lucide-react";
import type { Command } from "@/core/types";

export const caseConverterCommands: Command[] = [
  {
    id: "case-converter",
    name: "Case Converter",
    description: "Rename text or clipboard to camelCase, snake_case... (case <text>)",
    icon: CaseSensitive,
    category: "text",
    run: (launcher) => launcher.search("case "),
  },
];
