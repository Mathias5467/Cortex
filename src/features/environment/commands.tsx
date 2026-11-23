import { Variable } from "lucide-react";
import type { Command } from "@/core/types";
import { EnvironmentView } from "./EnvironmentView";

export const environmentCommands: Command[] = [
  {
    id: "environment-variables",
    name: "Environment Variables",
    description: "Explore PATH and other Windows variables",
    icon: Variable,
    category: "environment",
    run: (launcher) => launcher.open(<EnvironmentView />),
  },
];
