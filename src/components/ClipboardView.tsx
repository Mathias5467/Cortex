import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  ClipboardList,
  ArrowLeft,
  Trash2,
  Copy,
  CornerDownLeft,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { ClipboardItem } from "../types";

interface ClipboardViewProps {
  onBack: () => void;
  onCopyAndClose: (text: string) => void;
}

function formatTimeAgo(timestampSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestampSeconds;
  if (diff < 60) return "Práve teraz";
  if (diff < 3600) return `pred ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `pred ${Math.floor(diff / 3600)} hod`;
  return `pred ${Math.floor(diff / 86400)} dňami`;
}

export function ClipboardView({ onBack, onCopyAndClose }: ClipboardViewProps) {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [editingItem, setEditingItem] = useState<ClipboardItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadHistory();
    searchInputRef.current?.focus();
  }, []);

  async function loadHistory() {
    try {
      const res = await invoke<ClipboardItem[]>("get_clipboard_history");
      setItems(res);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredItems = items.filter((item) =>
    item.content.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    if (editingItem && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [editingItem]);

  async function handleDelete(id: number) {
    await invoke("delete_clipboard_item", { id });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function startEditing(item: ClipboardItem) {
    setEditingItem(item);
    setEditContent(item.content);
  }

  async function saveAndFinish() {
    if (!editingItem) return;

    const trimmed = editContent.trim();
    if (trimmed) {
      await invoke("save_edited_clipboard_item", {
        id: editingItem.id,
        content: trimmed,
      });

      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...i, content: trimmed } : i))
      );

      onCopyAndClose(trimmed);
    }

    setEditingItem(null);
  }

  function handleListKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onBack();
      return;
    }

    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        onCopyAndClose(selected.content);
      }
    } else if (e.key === "e" && e.ctrlKey) {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        startEditing(selected);
      }
    } else if (e.key === "Delete" || (e.key === "Backspace" && e.ctrlKey)) {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        handleDelete(selected.id);
      }
    }
  }

  function handleEditorKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "Enter" || e.key === "s")) {
      e.preventDefault();
      saveAndFinish();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setEditingItem(null);
      setTimeout(() => searchInputRef.current?.focus(), 50);
      return;
    }
  }

  if (editingItem) {
    return (
      <div className="w-full h-full flex flex-col">
        <div
          className="w-full flex items-center justify-between py-1.5 pb-2 border-b"
          style={{ borderColor: "var(--border-divider)" }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingItem(null)}
              className="p-1 cursor-pointer rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Späť do zoznamu (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Upraviť položku schránky
            </span>
          </div>

          <div className="text-[11px] text-white/40 font-mono">
            {editContent.length} znakov
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleEditorKeyDown}
          placeholder="Napíš sem text..."
          className="flex-1 w-full bg-transparent resize-none outline-none py-3 font-mono text-sm leading-relaxed text-white placeholder-white/20 select-text"
        />

        <div
          className="mt-2 pt-2 border-t flex items-center justify-between text-xs select-none"
          style={{ borderColor: "var(--border-divider)", color: "var(--text-secondary)" }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-white/60">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">↵</kbd>
              <span>Uložiť & Kopírovať</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-white/40">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">esc</kbd>
              <span>Zrušiť</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingItem(null)}
              className="px-2.5 py-1 cursor-pointer rounded hover:bg-white/10 text-white/60 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Zrušiť
            </button>
            <button
              onClick={saveAndFinish}
              className="px-2.5 py-1 cursor-pointer rounded bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Uložiť
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div
        className="w-full flex items-center gap-2.5 py-1.5 border-b"
        style={{ borderColor: "var(--border-divider)" }}
      >
        <button
          onClick={onBack}
          className="p-1 rounded cursor-pointer hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title="Späť (Esc)"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
        <input
          ref={searchInputRef}
          autoFocus
          type="text"
          placeholder="Hľadaj v histórii schránky..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleListKeyDown}
          className="flex-1 bg-transparent text-md outline-none text-white placeholder-white/40"
        />
        <span className="text-[10px] text-white/40 font-mono">esc späť</span>
      </div>

      <div className="mt-2 overflow-y-auto flex-1 pr-1 space-y-1">
        {filteredItems.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={item.id}
              ref={isSelected ? selectedRef : null}
              onClick={() => onCopyAndClose(item.content)}
              onMouseMove={() => {
                if (selectedIndex !== index) setSelectedIndex(index);
              }}
              className="text-sm px-3 py-2 rounded-lg cursor-pointer transition-colors flex justify-between items-center group"
              style={{
                backgroundColor: isSelected ? "var(--bg-selected)" : "transparent",
                color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden pr-2">
                <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-xs text-white truncate max-w-[440px]">
                    {item.content}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-white/40">
                    <span>{formatTimeAgo(item.timestamp)}</span>
                    <span>•</span>
                    <span>{item.content.length} znakov</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(item);
                  }}
                  className="opacity-0 cursor-pointer group-hover:opacity-100 p-1 hover:text-amber-400 text-white/40 transition-opacity"
                  title="Upraviť (Ctrl + E)"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="opacity-0 cursor-pointer group-hover:opacity-100 p-1 hover:text-red-400 text-white/40 transition-opacity"
                  title="Zmazať"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {isSelected && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ml-1"
                    style={{
                      backgroundColor: "var(--accent-muted)",
                      color: "var(--accent)",
                    }}
                  >
                    <CornerDownLeft className="w-3 h-3" />
                    Kopírovať
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-sm px-2 py-6 text-center text-white/40">
            História schránky je prázdna
          </div>
        )}
      </div>

      <div
        className="mt-2 pt-2 border-t flex items-center justify-between text-xs select-none"
        style={{ borderColor: "var(--border-divider)", color: "var(--text-secondary)" }}
      >
        <div className="text-[11px] opacity-70">
          Celkovo {items.length} položiek v schránke
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">↵</kbd>
            <span>Kopírovať</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">E</kbd>
            <span>Upraviť</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">Del</kbd>
            <span>Zmazať</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">esc</kbd>
            <span>Späť</span>
          </span>
        </div>
      </div>
    </div>
  );
}