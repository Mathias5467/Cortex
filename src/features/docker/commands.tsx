import { Box } from "lucide-react";
import type { Command } from "@/core/types";
import { DockerView } from "./DockerView";

export const dockerCommands: Command[] = [
  {
    id: "docker-containers",
    name: "Docker Containers",
    description: "Start, stop, inspect logs and remove containers",
    icon: Box,
    category: "containers",
    run: (launcher) => launcher.open(<DockerView />),
  },
];
