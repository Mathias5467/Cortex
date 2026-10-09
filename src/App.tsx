import { useEffect, useState, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { fuzzyScore, calculateFrecency } from "./utils/fuzzy";
import { evaluateMath, CalcResult } from "./utils/calc";
import "./App.css";
import { Folder } from 'lucide-react';

interface AppEntry {
  name: string;
  path: string;
  icon?: string;
  launch_count: number;
  last_launched: number;
}

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  extension?: string;
}

type UnifiedResult =
  | { type: "calc"; data: CalcResult }
  | { type: "app"; data: AppEntry }
  | { type: "file"; data: FileEntry };

function App() {
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [searchedTerm, setSearchedTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [aliasingApp, setAliasingApp] = useState<AppEntry | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);

  useEffect(() => {
    handleScan();
    loadAliases();

    const appWindow = getCurrentWindow();
    const unlisten = appWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        inputRef.current?.focus();
      } else {
        setSearchedTerm("");
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  async function loadAliases() {
    try {
      const res = await invoke<Record<string, string>>("get_aliases");
      setAliases(res);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const term = searchedTerm.trim();
    if (term.length >= 2) {
      invoke<FileEntry[]>("search_user_files", { query: term })
        .then((res) => setFiles(res))
        .catch((err) => console.error(err));
    } else {
      setFiles([]);
    }
  }, [searchedTerm]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchedTerm]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [selectedIndex]);

  const allResults = useMemo<UnifiedResult[]>(() => {
    const term = searchedTerm.trim();
    const termLower = term.toLowerCase();

    const calcResult = evaluateMath(term);
    const calcList: UnifiedResult[] = calcResult
      ? [{ type: "calc", data: calcResult }]
      : [];

    let appResults: AppEntry[] = [];
    if (!term) {
      appResults = [...apps].sort((a, b) => {
        const frecencyA = calculateFrecency(a.launch_count, a.last_launched);
        const frecencyB = calculateFrecency(b.launch_count, b.last_launched);
        return frecencyB - frecencyA;
      });
    } else {
      const aliasedPath = aliases[termLower];
      appResults = apps
        .map((app) => {
          const isAliasMatch = aliasedPath && app.path === aliasedPath;
          if (isAliasMatch) return { app, score: 100000 };

          const matchScore = fuzzyScore(termLower, app.name);
          const frecency = calculateFrecency(app.launch_count, app.last_launched);
          const totalScore = matchScore > 0 ? matchScore * 10 + frecency : 0;
          return { app, score: totalScore };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.app);
    }

    return [
      ...calcList,
      ...appResults.map((a) => ({ type: "app" as const, data: a })),
      ...files.map((f) => ({ type: "file" as const, data: f })),
    ];
  }, [apps, searchedTerm, aliases, files]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setSearchedTerm("");
      getCurrentWindow().hide();
      return;
    }

    if (e.key === "a" && e.altKey) {
      e.preventDefault();
      const selected = allResults[selectedIndex];
      if (selected && selected.type === "app") {
        setAliasingApp(selected.data);
        setAliasInput("");
      }
      return;
    }

    if (allResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = allResults[selectedIndex];
      if (selected) {
        if (selected.type === "calc") {
          navigator.clipboard.writeText(selected.data.result.replace(/,/g, ""));
          setSearchedTerm("");
          getCurrentWindow().hide();
        } else if (e.ctrlKey) {
          handleShowInFolder(selected.data.path);
        } else {
          handleLaunch(selected.data.path);
        }
      }
    }
  }

  async function handleAliasKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setAliasingApp(null);
      return;
    }

    if (e.key === "Enter" && aliasingApp) {
      e.preventDefault();
      const cleanAlias = aliasInput.trim().toLowerCase();
      if (cleanAlias) {
        await invoke("set_app_alias", {
          alias: cleanAlias,
          path: aliasingApp.path,
        });
        await loadAliases();
      }
      setAliasingApp(null);
    }
  }

  async function handleScan() {
    try {
      const result = await invoke<AppEntry[]>("scan_app_shortcuts");
      setApps(result);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleLaunch(path: string) {
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      setApps((prev) =>
        prev.map((app) =>
          app.path === path
            ? { ...app, launch_count: app.launch_count + 1, last_launched: nowSec }
            : app
        )
      );

      await invoke("launch_app", { path });
      setSearchedTerm("");
      await getCurrentWindow().hide();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleShowInFolder(path: string) {
    try {
      await invoke("show_in_folder", { path });
      setSearchedTerm("");
      await getCurrentWindow().hide();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div
      className="w-full h-screen flex flex-col rounded-xl text-white px-4 py-2 border overflow-hidden"
      style={{
        backgroundColor: "var(--bg-app)",
        borderColor: "var(--border-app)",
        backdropFilter: "blur(16px)",
      }}
    >
      {aliasingApp ? (
        <div
          className="w-full flex items-center gap-2 py-2 border-b"
          style={{ borderColor: "var(--border-divider)" }}
        >
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}
          >
            Alias: {aliasingApp.name}
          </span>
          <input
            autoFocus
            type="text"
            placeholder="Type nickname and hit Enter..."
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            onKeyDown={handleAliasKeyDown}
            className="flex-1 bg-transparent text-sm outline-none text-white placeholder-white/40"
          />
          <span className="text-[10px] text-white/40">esc to cancel</span>
        </div>
      ) : (
        <input
          ref={inputRef}
          autoFocus
          type="text"
          placeholder="Search for apps, files and commands..."
          value={searchedTerm}
          onChange={(e) => setSearchedTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-md outline-none py-2 border-b"
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--border-divider)",
          }}
        />
      )}

      <div className="mt-2 overflow-y-auto flex-1 pr-1 space-y-1">
        {allResults.map((entry, index) => {
          const isSelected = index === selectedIndex;
          const prevEntry = allResults[index - 1];
          const showHeader = !prevEntry || prevEntry.type !== entry.type;

          return (
            <div key={entry.type === "calc" ? "calculator-result" : entry.data.path}>
              {showHeader && (
                <div className="text-[10px] font-bold tracking-wider text-white/40 px-3 pt-2 pb-1 uppercase">
                  {entry.type === "calc"
                    ? "Calculator"
                    : entry.type === "app"
                    ? "Applications"
                    : "Files & Folders"}
                </div>
              )}

              <div
                ref={isSelected ? selectedRef : null}
                onClick={() => {
                  if (entry.type === "calc") {
                    navigator.clipboard.writeText(entry.data.result.replace(/,/g, ""));
                    setSearchedTerm("");
                    getCurrentWindow().hide();
                  } else {
                    handleLaunch(entry.data.path);
                  }
                }}
                onMouseMove={() => {
                  if (selectedIndex !== index) {
                    setSelectedIndex(index);
                  }
                }}
                className="text-sm px-3 py-2 rounded-lg cursor-pointer transition-colors flex justify-between items-center"
                style={{
                  backgroundColor: isSelected ? "var(--bg-selected)" : "transparent",
                  color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                <div className="flex items-center gap-3">
                  {entry.type === "calc" ? (
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                      =
                    </div>
                  ) : entry.type === "app" ? (
                    entry.data.icon ? (
                      <img
                        src={entry.data.icon}
                        alt=""
                        className="w-6 h-6 rounded-md shrink-0 object-contain drop-shadow-sm"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--bg-selected)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {entry.data.name.charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : entry.data.is_dir ? (
                    <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs shrink-0">
                      <Folder />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-white/10 text-white/70 flex items-center justify-center text-[9px] font-mono font-bold uppercase shrink-0">
                      {entry.data.extension?.slice(0, 3) || "DOC"}
                    </div>
                  )}

                  {/* Text Content */}
                  {entry.type === "calc" ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-semibold text-white">
                        {entry.data.result}
                      </span>
                      <span className="text-xs text-white/40 font-mono">
                        ({entry.data.expression})
                      </span>
                    </div>
                  ) : (
                    <span className="font-medium text-sm truncate max-w-[420px]">
                      {entry.data.name}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--accent-muted)",
                      color: "var(--accent)",
                    }}
                  >
                    {entry.type === "calc" ? "Enter to Copy" : "Enter"}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {allResults.length === 0 && (
          <div
            className="text-sm px-2 py-6 text-center"
            style={{ color: "var(--text-placeholder)" }}
          >
            No matching results found
          </div>
        )}
      </div>

      <div
        className="mt-2 pt-2 border-t flex items-center justify-between text-xs select-none"
        style={{
          borderColor: "var(--border-divider)",
          color: "var(--text-secondary)",
        }}
      >
        <div className="truncate max-w-[340px] text-[11px] opacity-70">
          {allResults[selectedIndex]?.data.path || "Cortex Launcher"}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">↵</kbd>
            <span>Open</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">↵</kbd>
            <span>Reveal</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">esc</kbd>
            <span>Close</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;