import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { Copy, RefreshCw, ScrollText } from "lucide-react";
import { useLauncher } from "@/core/launcher";
import { native } from "@/core/native";
import { usePolling } from "@/core/usePolling";
import { IconButton } from "@/components/ui/IconButton";
import { KeyHint } from "@/components/ui/Kbd";
import { EmptyState, View, ViewFooter, ViewHeader } from "@/components/ui/View";
import { dockerApi, type Container } from "./api";

const REFRESH_INTERVAL = 3000;
const BOTTOM_THRESHOLD = 40;

export function LogsView({ container }: { container: Container }) {
  const { goBack, notify } = useLauncher();
  const { data, error, isLoading, refresh } = usePolling(() => dockerApi.logs(container.id), REFRESH_INTERVAL);
  const outputRef = useRef<HTMLPreElement>(null);
  const isPinned = useRef(true);

  useEffect(() => {
    const output = outputRef.current;
    if (output && isPinned.current) output.scrollTop = output.scrollHeight;
  }, [data]);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      goBack();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      outputRef.current?.scrollBy({ top: e.key === "ArrowDown" ? 60 : -60 });
    }
  }

  async function copyLogs() {
    await native.copyText(data ?? "");
    notify("Logs copied");
  }

  return (
    <View captureFocus onKeyDown={handleKeyDown}>
      <ViewHeader onBack={goBack} icon={ScrollText} title={`Logs: ${container.name}`}>
        <IconButton tone="accent" title="Refresh" onClick={() => void refresh()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton tone="accent" title="Copy logs" disabled={!data} onClick={() => void copyLogs()}>
          <Copy className="w-3.5 h-3.5" />
        </IconButton>
      </ViewHeader>

      {data ? (
        <pre
          ref={outputRef}
          onScroll={(e) => {
            const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
            isPinned.current = scrollHeight - scrollTop - clientHeight < BOTTOM_THRESHOLD;
          }}
          className="mt-2 flex-1 min-h-0 overflow-auto rounded-lg bg-well border border-line p-2 text-[11px] leading-relaxed font-mono text-secondary whitespace-pre-wrap break-all select-text"
        >
          {data}
        </pre>
      ) : (
        <div className="flex-1">
          <EmptyState>{error ?? (isLoading ? "Loading..." : "No logs yet")}</EmptyState>
        </div>
      )}

      <ViewFooter label={container.image}>
        <KeyHint keys={["↑", "↓"]} label="Scroll" />
        <KeyHint keys={["esc"]} label="Back" />
      </ViewFooter>
    </View>
  );
}
