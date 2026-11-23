import { Copy, ExternalLink, Plug, X } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import type { Launcher, LauncherItem } from "@/core/types";
import { networkApi, type ListeningPort } from "./api";

export function createPortItem(entry: ListeningPort, launcher: Launcher, onKilled: () => void): LauncherItem {
  const url = `http://localhost:${entry.port}`;
  const owner = entry.process || "Unknown process";

  return {
    id: `port:${entry.port}:${entry.pid}`,
    section: "Listening Ports",
    icon: { kind: "tile", icon: Plug, color: CATEGORIES.network.color },
    title: entry.port.toString(),
    titleStyle: "code",
    subtitle: `${owner} • PID ${entry.pid} • ${entry.addresses.join(", ")}`,
    layout: "stacked",
    verb: "Open",
    footer: url,
    actions: [
      { id: "open", label: `Open ${url}`, icon: ExternalLink, run: () => launcher.openPath(url) },
      { id: "copy-url", label: "Copy URL", icon: Copy, run: () => launcher.copyAndClose(url) },
      { id: "copy-pid", label: "Copy PID", icon: Copy, run: () => launcher.copyAndClose(entry.pid.toString()) },
      {
        id: "kill",
        label: "Kill Process",
        icon: X,
        tone: "danger",
        children: [
          { id: "cancel", label: "Cancel", run: () => {} },
          {
            id: "confirm",
            label: `Kill ${owner} (${entry.pid})`,
            icon: X,
            tone: "danger",
            run: async () => {
              await networkApi.kill(entry.pid);
              launcher.notify(`${owner} terminated`);
              onKilled();
            },
          },
        ],
      },
    ],
  };
}
