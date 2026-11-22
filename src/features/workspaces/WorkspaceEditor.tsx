import { useState } from "react";
import { Globe, Layers, Plus, Save, Search, Trash2, X } from "lucide-react";
import { CATEGORIES, toCssColor } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import { View, ViewFooter, ViewHeader } from "@/components/ui/View";
import { appsStore, type AppEntry } from "@/features/apps/store";
import { saveWorkspace, type Workspace } from "./store";

function isUrl(target: string) {
  return target.startsWith("http://") || target.startsWith("https://");
}

function AppIcon({ app }: { app: AppEntry }) {
  if (app.icon) return <img src={app.icon} alt="" className="w-4 h-4 object-contain rounded shrink-0" />;
  return (
    <div className="w-4 h-4 rounded bg-hover flex items-center justify-center text-[9px] shrink-0">
      {app.name.charAt(0)}
    </div>
  );
}

function TargetIcon({ target, app }: { target: string; app?: AppEntry }) {
  if (app?.icon) return <AppIcon app={app} />;
  const Icon = isUrl(target) ? Globe : Layers;
  const category = isUrl(target) ? CATEGORIES.web : CATEGORIES.workspace;
  return <Icon className="w-4 h-4 shrink-0" style={{ color: toCssColor(category.color) }} />;
}

function UrlForm({ onAdd, onClose }: { onAdd: (url: string) => void; onClose: () => void }) {
  const [value, setValue] = useState("");

  function submit() {
    const clean = value.trim();
    if (!clean) return;
    onAdd(isUrl(clean) ? clean : `https://${clean}`);
  }

  return (
    <div className="flex items-center gap-2 mb-2 p-1.5 bg-field rounded-lg border border-line-strong">
      <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="https://overleaf.com"
        className="flex-1 bg-transparent text-xs outline-none text-content placeholder-muted"
      />
      <Button size="xs" onClick={submit}>
        Pridať
      </Button>
      <IconButton tone="danger" onClick={onClose}>
        <X className="w-3.5 h-3.5" />
      </IconButton>
    </div>
  );
}

interface AppPickerProps {
  apps: AppEntry[];
  onPick: (path: string) => void;
  onClose: () => void;
}

function AppPicker({ apps, onPick, onClose }: AppPickerProps) {
  const [search, setSearch] = useState("");
  const matches = apps.filter((app) => app.name.toLowerCase().includes(search.toLowerCase().trim()));

  return (
    <div className="mb-2 p-2 bg-popover rounded-lg border border-accent/30 shadow-xl max-h-48 flex flex-col">
      <div className="flex items-center gap-1.5 pb-1.5 border-b border-line-strong mb-1">
        <Search className="w-3.5 h-3.5 text-muted" />
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Vyhľadaj appku (napr. Word, VS Code)..."
          className="flex-1 bg-transparent text-xs outline-none text-content placeholder-muted"
        />
        <IconButton tone="danger" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </IconButton>
      </div>
      <div className="overflow-y-auto flex-1 space-y-0.5">
        {matches.map((app) => (
          <div
            key={app.path}
            onClick={() => onPick(app.path)}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-hover cursor-pointer text-xs"
          >
            <AppIcon app={app} />
            <span className="truncate">{app.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceEditor({ workspace }: { workspace?: Workspace }) {
  const { goBack } = useLauncher();
  const apps = appsStore.use();
  const [name, setName] = useState(workspace?.name ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const [targets, setTargets] = useState<string[]>(workspace?.targets ?? []);
  const [isPickingApp, setIsPickingApp] = useState(false);
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  const cleanName = name.trim();
  const canSave = cleanName !== "" && targets.length > 0;

  async function handleSave() {
    if (!canSave) return;
    try {
      await saveWorkspace({
        id: workspace?.id,
        name: cleanName,
        description: description.trim() || "Vlastný balíček",
        targets,
      });
      goBack();
    } catch (err) {
      console.error("Chyba pri ukladaní workspace:", err);
    }
  }

  function addApp(path: string) {
    setTargets((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setIsPickingApp(false);
  }

  function addUrl(url: string) {
    setTargets((prev) => [...prev, url]);
    setIsAddingUrl(false);
  }

  return (
    <View>
      <ViewHeader
        onBack={goBack}
        icon={Layers}
        title={workspace ? `Upraviť: ${workspace.name}` : "Nový Workspace Bundle"}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-3 py-3 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          <TextField
            autoFocus
            label="Názov:"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Napr. Bakalárska práca, Coding..."
          />
          <TextField
            label="Popis:"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Čo tento balíček spustí..."
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-secondary font-medium">
              Položky v balíčku ({targets.length}):
            </label>
            <div className="flex items-center gap-1.5">
              <Button variant="neutral" size="xs" onClick={() => setIsAddingUrl(true)}>
                <Plus className="w-2.5 h-2.5" /> Web URL
              </Button>
              <Button variant="soft" size="xs" onClick={() => setIsPickingApp(true)}>
                <Plus className="w-2.5 h-2.5" /> Pridať aplikáciu
              </Button>
            </div>
          </div>

          {isAddingUrl && <UrlForm onAdd={addUrl} onClose={() => setIsAddingUrl(false)} />}
          {isPickingApp && <AppPicker apps={apps} onPick={addApp} onClose={() => setIsPickingApp(false)} />}

          <div className="flex-1 overflow-y-auto border border-line-strong rounded-lg p-2 space-y-1 bg-well">
            {targets.map((target, idx) => {
              const app = apps.find(({ path }) => path === target);

              return (
                <div
                  key={`${target}-${idx}`}
                  className="flex items-center justify-between p-1.5 rounded bg-field hover:bg-hover text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <TargetIcon target={target} app={app} />
                    <span className="font-medium truncate">{app?.name ?? target}</span>
                  </div>
                  <IconButton
                    tone="danger"
                    title="Odstrániť"
                    onClick={() => setTargets((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
              );
            })}

            {targets.length === 0 && (
              <div className="text-center py-6 text-muted text-xs">
                Balíček je zatiaľ prázdny. Pridaj aspoň jednu aplikáciu alebo web.
              </div>
            )}
          </div>
        </div>
      </div>

      <ViewFooter>
        <Button variant="ghost" onClick={goBack}>
          Zrušiť
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          <Save className="w-3.5 h-3.5" />
          Uložiť balíček
        </Button>
      </ViewFooter>
    </View>
  );
}
