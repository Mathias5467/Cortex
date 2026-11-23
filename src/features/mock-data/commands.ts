import { AlignLeft, Braces } from "lucide-react";
import type { Command } from "@/core/types";

export const mockDataCommands: Command[] = [
  {
    id: "mock-data",
    name: "Mock Data Generator",
    description: "Users, emails, names as JSON, CSV or SQL (mock user 5)",
    icon: Braces,
    category: "text",
    run: (launcher) => launcher.search("mock "),
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum Generator",
    description: "Paragraphs, sentences or words (lorem 3)",
    icon: AlignLeft,
    category: "text",
    run: (launcher) => launcher.search("lorem "),
  },
];
