import { Keyboard } from "lucide-react";
import type { Command } from "@/core/types";
import { TypingGame } from "./TypingGame";

export const typingCommands: Command[] = [
  {
    id: "open-typing-game",
    name: "Typing Practice",
    description: "Monkeytype-style speed test (15s)",
    icon: Keyboard,
    category: "practice",
    run: (launcher) => launcher.open(<TypingGame />),
  },
];
