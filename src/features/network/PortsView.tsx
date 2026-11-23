import { useMemo } from "react";
import { Plug, RefreshCw } from "lucide-react";
import { useLauncher } from "@/core/launcher";
import { usePolling } from "@/core/usePolling";
import { ListView } from "@/components/launcher/ListView";
import { IconButton } from "@/components/ui/IconButton";
import { networkApi } from "./api";
import { createPortItem } from "./ports";

const REFRESH_INTERVAL = 5000;

export function PortsView() {
  const launcher = useLauncher();
  const { data, error, isLoading, refresh } = usePolling(networkApi.ports, REFRESH_INTERVAL);
  const items = useMemo(
    () => (data ?? []).map((entry) => createPortItem(entry, launcher, () => void refresh())),
    [data, launcher, refresh],
  );

  return (
    <ListView
      icon={Plug}
      placeholder="Search ports and processes..."
      items={items}
      status={{ error, isLoading }}
      headerActions={
        <IconButton tone="accent" title="Refresh" onClick={() => void refresh()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </IconButton>
      }
    />
  );
}
