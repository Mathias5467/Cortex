import { useEffect, useState, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { fuzzyScore, calculateFrecency } from "./utils/fuzzy";
import "./App.css";

interface AppEntry {
  name: string;
  path: string;
  icon?: string;
  launch_count: number;
  last_launched: number;
}


function App() {
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [searchedTerm, setSearchedTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    handleScan();

    const appWindow = getCurrentWindow();
    const unlisten = appWindow.onFocusChanged(({ payload: focused}) => {
      if (focused) {
        inputRef.current?.focus();
      } else {
        setSearchedTerm("");
      }
    })

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [])

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchedTerm]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [selectedIndex]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setSearchedTerm("");
      getCurrentWindow().hide();
      return;
    }

    if (filteredApps.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredApps.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const app = filteredApps[selectedIndex];
      if (app) {
        if (e.ctrlKey) {
          handleShowInFolder(app.path);
        } else {
          handleLaunch(app.path);
        }
      }
    }
  }

  async function handleScan() {
    try {
      const result = await invoke<AppEntry[]>("scan_app_shortcuts");
      setApps(result);
    } catch (error) {
      console.error("Failed to scan shortcuts:", error);
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
      console.error("Failed to launch app:", error);
    }
  }

  const filteredApps = useMemo(() => {
    const term = searchedTerm.trim().toLowerCase();
    if (!term) {
      return [...apps].sort((a, b) => {
        const frecencyA = calculateFrecency(a.launch_count, a.last_launched);
        const frecencyB = calculateFrecency(b.launch_count, b.last_launched);

        if (frecencyB !== frecencyA) {
          return frecencyB - frecencyA;
        }
        return a.name.localeCompare(b.name);
      });
    }

    return apps.map(
      (app) => {
        const matchScore = fuzzyScore(term, app.name);
        const frecency = calculateFrecency(app.launch_count, app.last_launched);
        // Matching is primary (multiplied by 10), frecency breaks ties and elevates favorites
        const totalScore = matchScore > 0 ? matchScore * 10 + frecency : 0;
        return { app, score: totalScore };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.app);
  }, [apps, searchedTerm]);

  async function handleShowInFolder(path: string) {
    try {
      await invoke("show_in_folder", { path });
      setSearchedTerm("");
      await getCurrentWindow().hide();
    } catch (error) {
      console.error("Failed to show in folder:", error);
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
      <input
        ref={inputRef}
        autoFocus
        type="text"
        placeholder="Search for apps and commands..."
        value={searchedTerm}
        onChange={(e) => setSearchedTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent text-md outline-none py-2 border-b"
        style={{
          color: "var(--text-primary)",
          borderColor: "var(--border-divider)",
        }}
      />

      <div className="mt-2 overflow-y-auto flex-1 pr-1 space-y-1">
        {filteredApps.map((app, index) => {
          const isSelected = index === selectedIndex;
          console.log(index, app.name, app.path);
          return (
            <div
              key={app.path}
              ref={isSelected ? selectedRef : null}
              onClick={() => handleLaunch(app.path)}
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
                {app.icon ? (
                  <img
                    src={app.icon}
                    alt=""
                    className="w-6 h-6 rounded-md shrink-0 object-contain drop-shadow-sm"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs font-semibold"
                    style={{ backgroundColor: "var(--bg-selected)", color: "var(--text-secondary)" }}
                  >
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-sm">{app.name}</span>
              </div>

              {isSelected && (
                <span 
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}
                >
                  Enter
                </span>
              )}
            </div>
          );
        })}

        {filteredApps.length === 0 && (
          <div 
            className="text-sm px-2 py-6 text-center"
            style={{ color: "var(--text-placeholder)" }}
          >
            No matching applications found
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
          {filteredApps[selectedIndex]?.path || "Cortex Launcher"}
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