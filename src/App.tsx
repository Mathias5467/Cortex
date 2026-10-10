import { useEffect, useState, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, ExternalLink, FolderOpen, Globe, Power, Tag, Trash2 } from "lucide-react";
import { AppEntry, FileEntry, UnifiedResult, ActionItem } from "./types";
import { fuzzyScore, calculateFrecency } from "./utils/fuzzy";
import { evaluateMath } from "./utils/calc";
import { SYSTEM_COMMANDS } from "./utils/systemCommands";
import { evaluateDevTools } from "./utils/devTools";
import { SearchBar } from "./components/SearchBar";
import { ResultList } from "./components/ResultList";
import { ActionMenu } from "./components/ActionMenu";
import { Footer } from "./components/Footer";
import { ClipboardView } from "./components/ClipboardView";
import { TypingGame } from "./components/TypingGame";
import { convertUnits } from "./utils/unitsConverter";
import "./App.css";

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
  const [viewMode, setViewMode] = useState<"search" | "clipboard" | "typing">("search");

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
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const allResults = useMemo<UnifiedResult[]>(() => {
    const term = searchedTerm.trim();
    const termLower = term.toLowerCase();

    const unitResult = convertUnits(term);
    const unitList: UnifiedResult[] = unitResult
      ? [{ type: "unit", data: unitResult }]
      : [];

    const devResults: UnifiedResult[] = evaluateDevTools(term).map((d) => ({
      type: "dev",
      data: d,
    }));

    const calcResult = evaluateMath(term);
    const calcList: UnifiedResult[] = calcResult ? [{ type: "calc", data: calcResult }] : [];

    let webList: UnifiedResult[] = [];
    if (termLower.startsWith("g ") && term.length > 2) {
      const q = term.slice(2).trim();
      webList = [{ type: "web", data: { engine: "Google", query: q, url: `https://www.google.com/search?q=${encodeURIComponent(q)}` } }];
    } else if (termLower.startsWith("yt ") && term.length > 3) {
      const q = term.slice(3).trim();
      webList = [{ type: "web", data: { engine: "YouTube", query: q, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` } }];
    } else if (termLower.startsWith("gh ") && term.length > 3) {
      const q = term.slice(3).trim();
      webList = [{ type: "web", data: { engine: "GitHub", query: q, url: `https://github.com/search?q=${encodeURIComponent(q)}` } }];
    }

    const matchedCommands: UnifiedResult[] = term
      ? SYSTEM_COMMANDS.filter((cmd) => fuzzyScore(termLower, cmd.name) > 0).map((cmd) => ({
          type: "command",
          data: cmd,
        }))
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
          return { app, score: matchScore > 0 ? matchScore * 10 + frecency : 0 };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.app);
    }

    const fallbackWeb: UnifiedResult[] =
      term && appResults.length === 0 && files.length === 0 && webList.length === 0
        ? [{ type: "web", data: { engine: "Google", query: term, url: `https://www.google.com/search?q=${encodeURIComponent(term)}` } }]
        : [];

    return [
      ...calcList,
      ...unitList,
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
          run: () => copyAndHide(currentItem.data.result.replace(/,/g, "")),
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
            if (currentItem.data.action === "color") handlePickColor();
            else if (currentItem.data.command) invoke("run_system_command", { command: currentItem.data.command });
            closeLauncher();
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
            closeLauncher();
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
          run: () => copyAndHide(currentItem.data.valueToCopy),
        },
      ];
    }

    if (currentItem.type === "unit") {
      return [
        {
          id: "copy-unit-val",
          label: `Copy Value (${currentItem.data.toValue})`,
          shortcut: "↵",
          icon: <Copy className="w-3.5 h-3.5" />,
          run: () => copyAndHide(currentItem.data.toValue.toString()),
        },
        {
          id: "copy-unit-formatted",
          label: `Copy with Unit (${currentItem.data.formattedResult})`,
          icon: <Copy className="w-3.5 h-3.5 opacity-60" />,
          run: () => copyAndHide(currentItem.data.formattedResult),
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
        run: () => copyAndHide(itemPath),
      },
      ...(currentItem.type === "app"
        ? [
            {
              id: "set-alias",
              label: Object.entries(aliases).find(([_, p]) => p === itemPath)
                ? "Change Custom Alias"
                : "Set Custom Alias",
              shortcut: "Alt A",
              icon: <Tag className="w-3.5 h-3.5" />,
              run: () => {
                setAliasingApp(currentItem.data);
                setAliasInput("");
                setIsActionMenuOpen(false);
              },
            },
            ...(Object.entries(aliases).find(([_, p]) => p === itemPath)
              ? [
                  {
                    id: "remove-alias",
                    label: `Remove Alias (${Object.entries(aliases).find(([_, p]) => p === itemPath)?.[0]})`,
                    icon: <Trash2 className="w-3.5 h-3.5 text-red-400" />,
                    run: async () => {
                      await invoke("remove_app_alias", { path: itemPath });
                      await loadAliases();
                      setIsActionMenuOpen(false);
                    },
                  },
                ]
              : []),
          ]
        : []),
    ];
  }, [currentItem]);

  function closeLauncher() {
    setSearchedTerm("");
    getCurrentWindow().hide();
  }

  async function copyAndHide(text: string) {
    await invoke("copy_to_clipboard", { text });
    closeLauncher();
  }

  async function handlePickColor() {
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) await invoke("copy_to_clipboard", { text: result.sRGBHex });
        closeLauncher();
      } catch {}
    } else {
      const hex = await invoke<string>("pick_screen_color");
      await invoke("copy_to_clipboard", { text: hex });
      closeLauncher();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "k" && e.ctrlKey) {
      e.preventDefault();
      if (allResults.length > 0) setIsActionMenuOpen((prev) => !prev);
      return;
    }
    if (e.key === "h" && e.ctrlKey) {
      e.preventDefault();
      setViewMode("clipboard");
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
        setSelectedActionIndex((prev) => Math.min(prev + 1, availableActions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedActionIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        availableActions[selectedActionIndex]?.run();
        setIsActionMenuOpen(false);
        return;
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeLauncher();
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
        if (e.ctrlKey && (selected.type === "app" || selected.type === "file")) {
          handleShowInFolder(selected.data.path);
        } else {
          executeItem(selected);
        }
      }
    }
  }

  function executeItem(selected: UnifiedResult) {
    if (selected.type === "calc") copyAndHide(selected.data.result.replace(/,/g, ""));
    else if (selected.type === "unit") copyAndHide(selected.data.toValue.toString());
    else if (selected.type === "dev") copyAndHide(selected.data.valueToCopy);
    else if (selected.type === "command") {
      if (selected.data.id === "open-clipboard-history") {
        setViewMode("clipboard");
        return;
      }
      if (selected.data.id === "open-typing-game") {
        setViewMode("typing");
        return;
      }
      if (selected.data.action === "color") handlePickColor();
      else if (selected.data.action === "window" && selected.data.command) {
        invoke("snap_window", { action: selected.data.command });
      }
      else if (selected.data.command) invoke("run_system_command", { command: selected.data.command });
      closeLauncher();
    } else if (selected.type === "web") {
      invoke("launch_app", { path: selected.data.url });
      closeLauncher();
    } else {
      handleLaunch(selected.data.path);
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
        await invoke("set_app_alias", { alias: cleanAlias, path: aliasingApp.path });
      } else {
        await invoke("remove_app_alias", { path: aliasingApp.path });
      }
      await loadAliases();
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
          app.path === path ? { ...app, launch_count: app.launch_count + 1, last_launched: nowSec } : app
        )
      );
      await invoke("launch_app", { path });
      closeLauncher();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleShowInFolder(path: string) {
    try {
      await invoke("show_in_folder", { path });
      closeLauncher();
    } catch (error) {
      console.error(error);
    }
  }

  const footerLabel = useMemo(() => {
    if (!currentItem) return "Cortex Launcher";
    if (currentItem.type === "calc") return `Calculator: ${currentItem.data.expression} = ${currentItem.data.result}`;
    if (currentItem.type === "command") return `System: ${currentItem.data.description}`;
    if (currentItem.type === "web") return `Open URL: ${currentItem.data.url}`;
    if (currentItem.type === "dev") return `Copy: ${currentItem.data.title}`;
    if (currentItem.type === "unit") return `Convert: ${currentItem.data.fromValue} ${currentItem.data.fromUnit} = ${currentItem.data.formattedResult}`;
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
      {viewMode === "clipboard" ? (
        <ClipboardView
          onBack={() => setViewMode("search")}
          onCopyAndClose={(text) => copyAndHide(text)}
        />
      ) : viewMode === "typing" ? (
        <TypingGame onBack={() => setViewMode("search")} />
      ) : (
        <>
          <SearchBar
            inputRef={inputRef}
            searchedTerm={searchedTerm}
            setSearchedTerm={setSearchedTerm}
            onKeyDown={handleKeyDown}
            aliasingApp={aliasingApp}
            aliasInput={aliasInput}
            setAliasInput={setAliasInput}
            onAliasKeyDown={handleAliasKeyDown}
          />

          <ResultList
            results={allResults}
            selectedIndex={selectedIndex}
            selectedRef={selectedRef}
            aliases={aliases}
            onSelectIndex={setSelectedIndex}
            onExecute={executeItem}
          />

          <ActionMenu
            isOpen={isActionMenuOpen}
            actions={availableActions}
            selectedIndex={selectedActionIndex}
            onSelectIndex={setSelectedActionIndex}
            onExecuteAction={(action) => {
              action.run();
              setIsActionMenuOpen(false);
            }}
          />

          <Footer label={footerLabel} />
        </>
      )}
    </div>
  );
}

export default App;