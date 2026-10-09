import { useEffect, useState, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Search,
  Folder,
  FileText,
  Calculator,
  ExternalLink,
  FolderOpen,
  Copy,
  Tag,
  CornerDownLeft,
  Lock,
  Trash2,
  Moon,
  RotateCw,
  Power,
  Globe,
  Pipette,
  Binary,
} from "lucide-react";
import { fuzzyScore, calculateFrecency } from "./utils/fuzzy";
import { evaluateMath, CalcResult } from "./utils/calc";
import { SYSTEM_COMMANDS, SystemCommand } from "./utils/systemCommands";
import { evaluateDevTools, DevToolResult } from "./utils/devTools";
import "./App.css";

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
  | { type: "dev"; data: DevToolResult }
  | { type: "command"; data: SystemCommand }
  | { type: "web"; data: { engine: string; query: string; url: string } }
  | { type: "app"; data: AppEntry }
  | { type: "file"; data: FileEntry };

interface ActionItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  run: () => void;
}

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
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);

  useEffect(() => {
    handleScan();
    loadAliases();

    const appWindow = getCurrentWindow();
    const unlisten = appWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        inputRef.current?.focus();
      } else {
        setSearchedTerm("");
        setIsActionMenuOpen(false);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  async function handlePickColor() {
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          await invoke("copy_to_clipboard", { text: result.sRGBHex });
        }
        setSearchedTerm("");
        await getCurrentWindow().hide();
      } catch {
      }
    } else {
      try {
        const hex = await invoke<string>("pick_screen_color");
        await invoke("copy_to_clipboard", { hex });
        setSearchedTerm("");
        await getCurrentWindow().hide();
      } catch (err) {
        console.error(err);
      }
    }
  }

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
    setSelectedActionIndex(0);
  }, [isActionMenuOpen]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [selectedIndex]);

  const allResults = useMemo<UnifiedResult[]>(() => {
    const term = searchedTerm.trim();
    const termLower = term.toLowerCase();

    const devResults: UnifiedResult[] = evaluateDevTools(term).map((d) => ({
      type: "dev",
      data: d,
    }));

    const calcResult = evaluateMath(term);
    const calcList: UnifiedResult[] = calcResult
      ? [{ type: "calc", data: calcResult }]
      : [];

    let webList: UnifiedResult[] = [];
    if (termLower.startsWith("g ") && term.length > 2) {
      const q = term.slice(2).trim();
      webList = [
        {
          type: "web",
          data: {
            engine: "Google",
            query: q,
            url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
          },
        },
      ];
    } else if (termLower.startsWith("yt ") && term.length > 3) {
      const q = term.slice(3).trim();
      webList = [
        {
          type: "web",
          data: {
            engine: "YouTube",
            query: q,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
          },
        },
      ];
    } else if (termLower.startsWith("gh ") && term.length > 3) {
      const q = term.slice(3).trim();
      webList = [
        {
          type: "web",
          data: {
            engine: "GitHub",
            query: q,
            url: `https://github.com/search?q=${encodeURIComponent(q)}`,
          },
        },
      ];
    }

    const matchedCommands: UnifiedResult[] = term
      ? SYSTEM_COMMANDS.filter((cmd) => fuzzyScore(termLower, cmd.name) > 0).map(
          (cmd) => ({ type: "command", data: cmd })
        )
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

    const fallbackWeb: UnifiedResult[] =
      term && appResults.length === 0 && files.length === 0 && webList.length === 0
        ? [
            {
              type: "web",
              data: {
                engine: "Google",
                query: term,
                url: `https://www.google.com/search?q=${encodeURIComponent(term)}`,
              },
            },
          ]
        : [];

    return [
      ...calcList,
      ...devResults,
      ...webList,
      ...matchedCommands,
      ...appResults.map((a) => ({ type: "app" as const, data: a })),
      ...files.map((f) => ({ type: "file" as const, data: f })),
      ...fallbackWeb,
    ];
  }, [apps, searchedTerm, aliases, files]);

  const currentItem = allResults[selectedIndex];

  const availableActions = useMemo<ActionItem[]>(() => {
    if (!currentItem) return [];

    if (currentItem.type === "calc") {
      return [
        {
          id: "copy-result",
          label: "Copy Result",
          shortcut: "↵",
          icon: <Copy className="w-3.5 h-3.5" />,
          run: () => {
            navigator.clipboard.writeText(currentItem.data.result.replace(/,/g, ""));
            setSearchedTerm("");
            getCurrentWindow().hide();
          },
        },
        {
          id: "copy-expression",
          label: "Copy Expression",
          icon: <Copy className="w-3.5 h-3.5 opacity-60" />,
          run: () => {
            navigator.clipboard.writeText(currentItem.data.expression);
            setSearchedTerm("");
            getCurrentWindow().hide();
          },
        },
      ];
    }

    if (currentItem.type === "command") {
      return [
        {
          id: "run-command",
          label: `Run ${currentItem.data.name}`,
          shortcut: "↵",
          icon: <Power className="w-3.5 h-3.5" />,
          run: () => {
            if (currentItem.data.action === "color") {
              handlePickColor();
              return;
            }
            if (currentItem.data.command) {
              invoke("run_system_command", { command: currentItem.data.command });
            }
            setSearchedTerm("");
            getCurrentWindow().hide();
          },
        },
      ];
    }

    if (currentItem.type === "web") {
      return [
        {
          id: "open-web",
          label: `Search on ${currentItem.data.engine}`,
          shortcut: "↵",
          icon: <Globe className="w-3.5 h-3.5" />,
          run: () => {
            invoke("launch_app", { path: currentItem.data.url });
            setSearchedTerm("");
            getCurrentWindow().hide();
          },
        },
        {
          id: "copy-url",
          label: "Copy Search URL",
          icon: <Copy className="w-3.5 h-3.5" />,
          run: () => {
            navigator.clipboard.writeText(currentItem.data.url);
            setSearchedTerm("");
            getCurrentWindow().hide();
          },
        },
      ];
    }

    if (currentItem.type === "dev") {
      return [
        {
          id: "copy-dev",
          label: "Copy to Clipboard",
          shortcut: "↵",
          icon: <Copy className="w-3.5 h-3.5" />,
          run: () => {
            navigator.clipboard.writeText(currentItem.data.valueToCopy);
            setSearchedTerm("");
            getCurrentWindow().hide();
          },
        },
      ];
    }

    const itemPath = currentItem.data.path;

    return [
      {
        id: "open",
        label: currentItem.type === "app" ? "Open Application" : "Open File",
        shortcut: "↵",
        icon: <ExternalLink className="w-3.5 h-3.5" />,
        run: () => handleLaunch(itemPath),
      },
      {
        id: "show-folder",
        label: "Show in File Explorer",
        shortcut: "Ctrl ↵",
        icon: <FolderOpen className="w-3.5 h-3.5" />,
        run: () => handleShowInFolder(itemPath),
      },
      {
        id: "copy-path",
        label: "Copy Path",
        icon: <Copy className="w-3.5 h-3.5" />,
        run: () => {
          navigator.clipboard.writeText(itemPath);
          setSearchedTerm("");
          getCurrentWindow().hide();
        },
      },
      ...(currentItem.type === "app"
        ? [
            {
              id: "set-alias",
              label: "Set Custom Alias",
              shortcut: "Alt A",
              icon: <Tag className="w-3.5 h-3.5" />,
              run: () => {
                setAliasingApp(currentItem.data);
                setAliasInput("");
                setIsActionMenuOpen(false);
              },
            },
          ]
        : []),
    ];
  }, [currentItem]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "k" && e.ctrlKey) {
      e.preventDefault();
      if (allResults.length > 0) {
        setIsActionMenuOpen((prev) => !prev);
      }
      return;
    }

    if (isActionMenuOpen) {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsActionMenuOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedActionIndex((prev) =>
          Math.min(prev + 1, availableActions.length - 1)
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedActionIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const action = availableActions[selectedActionIndex];
        if (action) {
          action.run();
          setIsActionMenuOpen(false);
        }
        return;
      }
      return;
    }

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
        } else if (selected.type === "dev") {
          navigator.clipboard.writeText(selected.data.valueToCopy);
          setSearchedTerm("");
          getCurrentWindow().hide();
        } else if (selected.type === "command") {
          if (selected.data.action === "color") {
            handlePickColor();
            return;
          } else if (selected.data.command) {
            invoke("run_system_command", { command: selected.data.command });
          }
          setSearchedTerm("");
          getCurrentWindow().hide();
        } else if (selected.type === "web") {
          invoke("launch_app", { path: selected.data.url });
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

  const footerLabel = useMemo(() => {
    if (!currentItem) return "Cortex Launcher";
    if (currentItem.type === "calc") {
      return `Calculator: ${currentItem.data.expression} = ${currentItem.data.result}`;
    }
    if (currentItem.type === "command") {
      return `System: ${currentItem.data.description}`;
    }
    if (currentItem.type === "web") {
      return `Open URL: ${currentItem.data.url}`;
    }
    if (currentItem.type === "dev") {
      return `Copy: ${currentItem.data.title}`;
    }
    return currentItem.data.path;
  }, [currentItem]);

  return (
    <div
      className="w-full h-screen flex flex-col rounded-xl text-white px-4 py-2 border overflow-hidden relative"
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
            className="text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1.5"
            style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}
          >
            <Tag className="w-3 h-3" />
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
        <div
          className="w-full flex items-center gap-2.5 py-1.5 border-b"
          style={{ borderColor: "var(--border-divider)" }}
        >
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Search for apps, files and commands..."
            value={searchedTerm}
            onChange={(e) => setSearchedTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-md outline-none text-white placeholder-white/40"
          />
        </div>
      )}

      <div className="mt-2 overflow-y-auto flex-1 pr-1 space-y-1">
        {allResults.map((entry, index) => {
          const isSelected = index === selectedIndex;
          const prevEntry = allResults[index - 1];
          const showHeader = !prevEntry || prevEntry.type !== entry.type;

          const itemKey =
            entry.type === "calc"
              ? "calc-result"
              : entry.type === "dev"
              ? entry.data.id
              : entry.type === "command"
              ? entry.data.id
              : entry.type === "web"
              ? entry.data.url
              : entry.data.path;

          return (
            <div key={itemKey}>
              {showHeader && (
                <div className="text-[10px] font-bold tracking-wider text-white/40 px-3 pt-2 pb-1 uppercase">
                  {entry.type === "calc"
                    ? "Calculator"
                    : entry.type === "dev"
                    ? "Developer Tools"
                    : entry.type === "web"
                    ? "Web Search"
                    : entry.type === "command"
                    ? "System Commands"
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
                  } else if (entry.type === "dev") {
                    navigator.clipboard.writeText(entry.data.valueToCopy);
                    setSearchedTerm("");
                    getCurrentWindow().hide();
                  } else if (entry.type === "command") {
                    if (entry.data.action === "color") {
                      handlePickColor();
                      return;
                    }
                    if (entry.data.command) {
                      invoke("run_system_command", { command: entry.data.command });
                    }
                    setSearchedTerm("");
                    getCurrentWindow().hide();
                  } else if (entry.type === "web") {
                    invoke("launch_app", { path: entry.data.url });
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
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Calculator className="w-3.5 h-3.5" />
                    </div>
                  ) : entry.type === "dev" ? (
                    <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Binary className="w-3.5 h-3.5" />
                    </div>
                  ) : entry.type === "command" ? (
                    <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      {entry.data.iconName === "lock" && <Lock className="w-3.5 h-3.5" />}
                      {entry.data.iconName === "trash" && <Trash2 className="w-3.5 h-3.5" />}
                      {entry.data.iconName === "moon" && <Moon className="w-3.5 h-3.5" />}
                      {entry.data.iconName === "rotate" && <RotateCw className="w-3.5 h-3.5" />}
                      {entry.data.iconName === "power" && <Power className="w-3.5 h-3.5" />}
                      {entry.data.iconName === "pipette" && <Pipette className="w-3.5 h-3.5" />}
                    </div>
                  ) : entry.type === "web" ? (
                    <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <Globe className="w-3.5 h-3.5" />
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
                    <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Folder className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {entry.type === "calc" ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-semibold text-white">
                        {entry.data.result}
                      </span>
                      <span className="text-xs text-white/40 font-mono">
                        ({entry.data.expression})
                      </span>
                    </div>
                  ) : entry.type === "dev" ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-sm font-semibold text-white">
                        {entry.data.title}
                      </span>
                      <span className="text-xs text-white/40">
                        {entry.data.subtitle}
                      </span>
                    </div>
                  ) : entry.type === "web" ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-sm text-white">
                        Search {entry.data.engine}
                      </span>
                      <span className="text-xs text-white/40 truncate max-w-[320px]">
                        "{entry.data.query}"
                      </span>
                    </div>
                  ) : entry.type === "command" ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-white">{entry.data.name}</span>
                      <span className="text-[11px] text-white/40">{entry.data.description}</span>
                    </div>
                  ) : (
                    <span className="font-medium text-sm truncate max-w-[420px]">
                      {entry.data.name}
                    </span>
                  )}

                  {entry.type === "app" &&
                    Object.entries(aliases).find(([_, path]) => path === entry.data.path) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        {
                          Object.entries(aliases).find(([_, path]) => path === entry.data.path)?.[0]
                        }
                      </span>
                    )}
                </div>

                {isSelected && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                    style={{
                      backgroundColor: "var(--accent-muted)",
                      color: "var(--accent)",
                    }}
                  >
                    <CornerDownLeft className="w-3 h-3" />
                    {entry.type === "calc" || entry.type === "dev"
                      ? "Copy"
                      : entry.type === "web"
                      ? "Search"
                      : "Open"}
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

      {isActionMenuOpen && (
        <div
          className="absolute right-4 bottom-12 w-64 rounded-xl border p-1 shadow-2xl backdrop-blur-2xl z-50"
          style={{
            backgroundColor: "var(--bg-app)",
            borderColor: "var(--border-app)",
          }}
        >
          <div className="text-[10px] font-bold tracking-wider text-white/40 px-3 py-1.5 uppercase">
            Actions
          </div>
          <div className="space-y-0.5">
            {availableActions.map((action, i) => {
              const isSelected = i === selectedActionIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => {
                    action.run();
                    setIsActionMenuOpen(false);
                  }}
                  onMouseMove={() => setSelectedActionIndex(i)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--bg-selected)"
                      : "transparent",
                    color: isSelected
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">{action.icon}</span>
                    <span className="font-medium">{action.label}</span>
                  </div>
                  {action.shortcut && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                      {action.shortcut}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        className="mt-2 pt-2 border-t flex items-center justify-between text-xs select-none"
        style={{
          borderColor: "var(--border-divider)",
          color: "var(--text-secondary)",
        }}
      >
        <div className="truncate max-w-[340px] text-[11px] opacity-70">
          {footerLabel}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">↵</kbd>
            <span>Open</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">K</kbd>
            <span>Actions</span>
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

export default App