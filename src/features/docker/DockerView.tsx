import { useMemo } from "react";
import { Box, Copy, ExternalLink, Pause, Play, RefreshCw, RotateCw, ScrollText, Square, Trash2, X } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import type { Launcher, LauncherAction, LauncherItem, RunAction } from "@/core/types";
import { usePolling } from "@/core/usePolling";
import { ListView } from "@/components/launcher/ListView";
import { IconButton } from "@/components/ui/IconButton";
import { LogsView } from "./LogsView";
import { dockerApi, type Container, type ContainerAction } from "./api";

const REFRESH_INTERVAL = 3000;

const DONE_LABELS: Record<ContainerAction, string> = {
  start: "started",
  stop: "stopped",
  restart: "restarted",
  pause: "paused",
  unpause: "resumed",
  remove: "removed",
};

const STATE_ORDER = ["running", "paused", "restarting"];

function stateRank(state: string) {
  const rank = STATE_ORDER.indexOf(state);
  return rank === -1 ? STATE_ORDER.length : rank;
}

function createContainerItem(container: Container, launcher: Launcher, refresh: () => Promise<void>): LauncherItem {
  const isRunning = container.state === "running";
  const isPaused = container.state === "paused";
  const isActive = isRunning || isPaused;

  async function control(action: ContainerAction) {
    await dockerApi.control(container.id, action);
    launcher.notify(`${container.name} ${DONE_LABELS[action]}`);
    await refresh();
  }

  const toggle: RunAction = isPaused
    ? { id: "unpause", label: "Resume", icon: Play, run: () => control("unpause") }
    : isRunning
      ? { id: "stop", label: "Stop", icon: Square, run: () => control("stop") }
      : { id: "start", label: "Start", icon: Play, run: () => control("start") };

  const openPorts: LauncherAction[] = isRunning
    ? container.host_ports.map((port, index) => ({
        id: `open-${port}`,
        label: `Open localhost:${port}`,
        icon: ExternalLink,
        hotkey: index === 0 ? { key: "o", ctrl: true } : undefined,
        run: () => launcher.openPath(`http://localhost:${port}`),
      }))
    : [];

  return {
    id: `container:${container.id}`,
    section: isActive ? "Running" : "Stopped",
    icon: { kind: "tile", icon: Box, color: isPaused ? "amber" : isRunning ? CATEGORIES.containers.color : "gray" },
    title: container.name,
    subtitle: `${container.image} • ${container.status}`,
    layout: "stacked",
    tag: container.host_ports.length > 0 ? container.host_ports.join(", ") : undefined,
    verb: toggle.label,
    footer: container.ports || container.image,
    actions: [
      toggle,
      ...openPorts,
      {
        id: "logs",
        label: "View Logs",
        icon: ScrollText,
        hotkey: { key: "l", ctrl: true },
        run: () => launcher.open(<LogsView container={container} />),
      },
      ...(isActive
        ? [
            {
              id: "restart",
              label: "Restart",
              icon: RotateCw,
              hotkey: { key: "r", ctrl: true },
              run: () => control("restart"),
            },
          ]
        : []),
      ...(isRunning ? [{ id: "pause", label: "Pause", icon: Pause, run: () => control("pause") }] : []),
      {
        id: "copy-id",
        label: "Copy Container ID",
        icon: Copy,
        run: () => launcher.copyAndClose(container.id),
      },
      {
        id: "remove",
        label: "Remove Container",
        icon: Trash2,
        tone: "danger",
        children: [
          { id: "cancel", label: "Cancel", icon: X, run: () => {} },
          {
            id: "confirm",
            label: `Remove ${container.name}`,
            icon: Trash2,
            tone: "danger",
            run: () => control("remove"),
          },
        ],
      },
    ],
  };
}

export function DockerView() {
  const launcher = useLauncher();
  const { data, error, isLoading, refresh } = usePolling(dockerApi.list, REFRESH_INTERVAL);

  const items = useMemo(
    () =>
      [...(data ?? [])]
        .sort((a, b) => stateRank(a.state) - stateRank(b.state) || a.name.localeCompare(b.name))
        .map((container) => createContainerItem(container, launcher, refresh)),
    [data, launcher, refresh],
  );

  return (
    <ListView
      icon={Box}
      placeholder="Search containers..."
      items={items}
      status={{ error, isLoading }}
      emptyLabel="No containers found"
      headerActions={
        <IconButton tone="accent" title="Refresh" onClick={() => void refresh()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </IconButton>
      }
    />
  );
}
