import { useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Braces, Copy, FolderOpen, List, Settings2, Variable } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import type { Launcher, LauncherItem, RunAction } from "@/core/types";
import { useAsync } from "@/core/useAsync";
import { ListView } from "@/components/launcher/ListView";
import { Button } from "@/components/ui/Button";

interface PathEntry {
  path: string;
  exists: boolean;
}

interface EnvVariable {
  name: string;
  value: string;
  scope: "User" | "System" | "Process";
  entries: PathEntry[];
}

const SENSITIVE_NAME = /token|secret|password|passwd|api_?key|private|credential/i;

function createPathItem(entry: PathEntry, index: number, isDuplicate: boolean, launcher: Launcher): LauncherItem {
  const copy: RunAction = {
    id: "copy",
    label: "Copy Path",
    icon: Copy,
    run: () => launcher.copyAndClose(entry.path),
  };
  const open: RunAction = {
    id: "open",
    label: "Open Folder",
    icon: FolderOpen,
    run: () => launcher.openPath(entry.path),
  };
  const tag = [!entry.exists && "missing", isDuplicate && "duplicate"].filter(Boolean).join(", ");

  return {
    id: `path:${index}`,
    section: "Entries",
    icon: {
      kind: "tile",
      icon: FolderOpen,
      color: entry.exists ? CATEGORIES.folder.color : CATEGORIES.file.color,
    },
    title: entry.path,
    tag: tag || undefined,
    verb: entry.exists ? "Open" : "Copy",
    footer: entry.path,
    actions: entry.exists ? [open, copy] : [copy],
  };
}

function PathEntriesView({ variable }: { variable: EnvVariable }) {
  const launcher = useLauncher();
  const items = useMemo(() => {
    const seen = new Set<string>();
    return variable.entries.map((entry, index) => {
      const key = entry.path.toLowerCase().replace(/[\\/]+$/, "");
      const isDuplicate = seen.has(key);
      seen.add(key);
      return createPathItem(entry, index, isDuplicate, launcher);
    });
  }, [variable, launcher]);

  return <ListView icon={List} placeholder={`Search in ${variable.name} (${variable.scope})...`} items={items} />;
}

function createVariableItem(variable: EnvVariable, launcher: Launcher): LauncherItem {
  const { name, value, scope, entries } = variable;
  const isSensitive = SENSITIVE_NAME.test(name);

  const copyValue: RunAction = {
    id: "copy-value",
    label: "Copy Value",
    icon: Copy,
    run: () => (isSensitive ? launcher.copySecretAndClose(value) : launcher.copyAndClose(value)),
  };
  const browse: RunAction = {
    id: "browse",
    label: `Browse ${entries.length} Entries`,
    icon: List,
    run: () => launcher.open(<PathEntriesView variable={variable} />),
  };
  const hasEntries = entries.length > 0;

  return {
    id: `env:${scope}:${name}`,
    section: `${scope} variables`,
    icon: { kind: "tile", icon: Variable, color: CATEGORIES.environment.color },
    title: name,
    titleStyle: "code",
    subtitle: isSensitive ? "••••••••••••" : value || "(empty)",
    layout: "stacked",
    tag: hasEntries ? `${entries.length} paths` : undefined,
    verb: hasEntries ? "Browse" : "Copy",
    footer: `${scope}: ${name}`,
    actions: [
      hasEntries ? browse : copyValue,
      ...(hasEntries ? [copyValue] : []),
      {
        id: "copy-name",
        label: "Copy Name",
        icon: Copy,
        run: () => launcher.copyAndClose(name),
      },
      {
        id: "copy-powershell",
        label: `Copy $env:${name}`,
        icon: Braces,
        run: () => launcher.copyAndClose(`$env:${name}`),
      },
      {
        id: "copy-cmd",
        label: `Copy %${name}%`,
        icon: Braces,
        run: () => launcher.copyAndClose(`%${name}%`),
      },
    ],
  };
}

export function EnvironmentView() {
  const launcher = useLauncher();
  const variables = useAsync("environment", () => invoke<EnvVariable[]>("list_env_variables"));
  const items = useMemo(
    () => (variables.data ?? []).map((variable) => createVariableItem(variable, launcher)),
    [variables.data, launcher],
  );

  return (
    <ListView
      icon={Variable}
      placeholder="Search environment variables..."
      items={items}
      status={variables}
      headerActions={
        <Button
          variant="soft"
          onClick={() => {
            invoke("open_env_editor").catch((err) => launcher.notify(String(err), "error"));
          }}
        >
          <Settings2 className="w-3.5 h-3.5" /> Edit
        </Button>
      }
    />
  );
}
