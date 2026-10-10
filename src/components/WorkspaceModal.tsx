import { useState } from "react";
import { ArrowLeft, Save, X, Plus, Layers, Globe, Trash2, Search } from "lucide-react";
import { Workspace, AppEntry } from "../types";

interface WorkspaceModalProps {
  initialWorkspace?: Workspace | null;
  installedApps: AppEntry[];
  onSave: (id: number | undefined, name: string, description: string, targets: string[]) => void;
  onCancel: () => void;
}

export function WorkspaceModal({
  initialWorkspace,
  installedApps,
  onSave,
  onCancel,
}: WorkspaceModalProps) {
  const [name, setName] = useState(initialWorkspace?.name || "");
  const [description, setDescription] = useState(initialWorkspace?.description || "");
  const [targets, setTargets] = useState<string[]>(initialWorkspace?.targets || []);

  const [isPickingApp, setIsPickingApp] = useState(false);
  const [appSearch, setAppSearch] = useState("");
  const [newUrlInput, setNewUrlInput] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  function handleSave() {
    const cleanName = name.trim();
    if (!cleanName || targets.length === 0) return;
    onSave(initialWorkspace?.id, cleanName, description.trim() || "Vlastný balíček", targets);
  }

  function addAppTarget(appPath: string) {
    if (!targets.includes(appPath)) {
      setTargets((prev) => [...prev, appPath]);
    }
    setIsPickingApp(false);
    setAppSearch("");
  }

  function addUrlTarget() {
    let clean = newUrlInput.trim();
    if (!clean) return;
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = `https://${clean}`;
    }
    setTargets((prev) => [...prev, clean]);
    setNewUrlInput("");
    setIsAddingUrl(false);
  }

  function removeTarget(index: number) {
    setTargets((prev) => prev.filter((_, i) => i !== index));
  }

  const filteredAppsToPick = installedApps.filter((a) =>
    a.name.toLowerCase().includes(appSearch.toLowerCase().trim())
  );

  return (
    <div className="w-full h-full flex flex-col justify-between text-white select-none font-sans">
      <div
        className="w-full flex items-center justify-between py-1.5 pb-2 border-b shrink-0"
        style={{ borderColor: "var(--border-divider)" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="p-1 cursor-pointer rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            {initialWorkspace ? `Upraviť: ${initialWorkspace.name}` : "Nový Workspace Bundle"}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-3 py-3 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-white/50 font-medium block mb-1">Názov:</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Napr. Bakalárska práca, Coding..."
              className="w-full bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-xs outline-none text-white focus:border-teal-400/50"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/50 font-medium block mb-1">Popis:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Čo tento balíček spustí..."
              className="w-full bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-xs outline-none text-white focus:border-teal-400/50"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-white/50 font-medium">
              Položky v balíčku ({targets.length}):
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsAddingUrl(true)}
                className="cursor-pointer text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
              >
                <Plus className="w-2.5 h-2.5" /> Web URL
              </button>
              <button
                type="button"
                onClick={() => setIsPickingApp(true)}
                className="cursor-pointer text-[10px] px-2 py-0.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-2.5 h-2.5" /> Pridať aplikáciu
              </button>
            </div>
          </div>

          {isAddingUrl && (
            <div className="flex items-center gap-2 mb-2 p-1.5 bg-white/5 rounded-lg border border-white/10">
              <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={newUrlInput}
                onChange={(e) => setNewUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUrlTarget()}
                placeholder="https://overleaf.com"
                className="flex-1 bg-transparent text-xs outline-none text-white"
              />
              <button
                onClick={addUrlTarget}
                className="cursor-pointer text-[10px] px-2 py-0.5 rounded bg-sky-500 text-black font-semibold"
              >
                Pridať
              </button>
              <button onClick={() => setIsAddingUrl(false)} className="cursor-pointer text-white hover:text-rose-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isPickingApp && (
            <div className="mb-2 p-2 bg-[#1a1a1e] rounded-lg border border-teal-500/30 shadow-xl max-h-48 flex flex-col">
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/10 mb-1">
                <Search className="w-3.5 h-3.5 text-white/40" />
                <input
                  autoFocus
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Vyhľadaj appku (napr. Word, VS Code)..."
                  className="flex-1 bg-transparent text-xs outline-none text-white"
                />
                <button onClick={() => setIsPickingApp(false)} className="cursor-pointer text-white hover:text-rose-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-0.5">
                {filteredAppsToPick.map((app) => (
                  <div
                    key={app.path}
                    onClick={() => addAppTarget(app.path)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/10 cursor-pointer text-xs"
                  >
                    {app.icon ? (
                      <img src={app.icon} alt="" className="w-4 h-4 object-contain rounded" />
                    ) : (
                      <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[9px]">
                        {app.name.charAt(0)}
                      </div>
                    )}
                    <span className="truncate">{app.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto border border-white/10 rounded-lg p-2 space-y-1 bg-black/20">
            {targets.map((t, idx) => {
              const matchedApp = installedApps.find((a) => a.path === t);
              const isUrl = t.startsWith("http://") || t.startsWith("https://");

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded bg-white/5 hover:bg-white/10 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {matchedApp?.icon ? (
                      <img src={matchedApp.icon} alt="" className="w-4 h-4 object-contain rounded shrink-0" />
                    ) : isUrl ? (
                      <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <Layers className="w-4 h-4 text-teal-400 shrink-0" />
                    )}
                    <span className="font-medium truncate">
                      {matchedApp ? matchedApp.name : t}
                    </span>
                  </div>
                  <button
                    onClick={() => removeTarget(idx)}
                    className="cursor-pointer text-white/30 hover:text-red-400 p-0.5 transition-colors"
                    title="Odstrániť"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {targets.length === 0 && (
              <div className="text-center py-6 text-white/30 text-xs">
                Balíček je zatiaľ prázdny. Pridaj aspoň jednu aplikáciu alebo web.
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="mt-2 pt-2 border-t shrink-0 flex items-center justify-between text-xs select-none"
        style={{ borderColor: "var(--border-divider)", color: "var(--text-secondary)" }}
      >
        <button
          onClick={onCancel}
          className="cursor-pointer px-2.5 py-1 rounded hover:bg-white/10 text-white/60 transition-colors"
        >
          Zrušiť
        </button>
        <button
          onClick={handleSave}
          disabled={targets.length === 0 || !name.trim()}
          className="px-3 py-1 cursor-pointer rounded bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:pointer-events-none text-black font-semibold transition-colors flex items-center gap-1"
        >
          <Save className="w-3.5 h-3.5" />
          Uložiť balíček
        </button>
      </div>
    </div>
  );
}