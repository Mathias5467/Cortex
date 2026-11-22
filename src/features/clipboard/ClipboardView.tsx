import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { ClipboardList, Copy, CornerDownLeft, Pencil, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import { native } from "@/core/native";
import { useListNavigation } from "@/core/useListNavigation";
import { AccentBadge } from "@/components/ui/AccentBadge";
import { IconButton } from "@/components/ui/IconButton";
import { IconTile } from "@/components/ui/IconTile";
import { KeyHint } from "@/components/ui/Kbd";
import { ListRow } from "@/components/ui/ListRow";
import { SegmentButton } from "@/components/ui/SegmentButton";
import { EmptyState, SearchInput, View, ViewFooter, ViewHeader } from "@/components/ui/View";
import { ClipboardEditor } from "./ClipboardEditor";
import { clipboardApi, type ClipboardItem } from "./api";

type Filter = "all" | ClipboardItem["item_type"];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Všetko" },
  { id: "text", label: "Texty" },
  { id: "image", label: "Screenshoty" },
];

function formatTimeAgo(timestampSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestampSeconds;
  if (diff < 60) return "Práve teraz";
  if (diff < 3600) return `pred ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `pred ${Math.floor(diff / 3600)} hod`;
  return `pred ${Math.floor(diff / 86400)} dňami`;
}

export function ClipboardView() {
  const { goBack, copyAndClose } = useLauncher();
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<ClipboardItem | null>(null);

  const needle = search.toLowerCase().trim();
  const visible = items.filter(
    (item) => (filter === "all" || item.item_type === filter) && item.content.toLowerCase().includes(needle),
  );
  const { index, setIndex, selectedRef, handleArrows } = useListNavigation(visible.length, `${filter}:${search}`);

  useEffect(() => {
    clipboardApi.list().then(setItems).catch(console.error);
  }, []);

  async function handleDelete(id: number) {
    await clipboardApi.remove(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleCopy(item: ClipboardItem) {
    if (item.item_type === "image" && item.preview) {
      await native.copyImage(item.preview);
      goBack();
    } else {
      await copyAndClose(item.content);
    }
  }

  async function handleSave(content: string) {
    if (!editing) return;
    if (content) {
      await clipboardApi.save(editing.id, content);
      setItems((prev) => prev.map((item) => (item.id === editing.id ? { ...item, content } : item)));
      await copyAndClose(content);
    }
    setEditing(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      goBack();
      return;
    }

    if (handleArrows(e)) return;

    const selected = visible[index];
    if (!selected) return;

    if (e.key === "Enter") {
      e.preventDefault();
      void handleCopy(selected);
    } else if (e.key === "e" && e.ctrlKey) {
      e.preventDefault();
      if (selected.item_type === "text") setEditing(selected);
    } else if (e.key === "Delete" || (e.key === "Backspace" && e.ctrlKey)) {
      e.preventDefault();
      void handleDelete(selected.id);
    }
  }

  if (editing) {
    return (
      <ClipboardEditor
        initialContent={editing.content}
        onSave={(content) => void handleSave(content)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <View>
      <ViewHeader
        onBack={goBack}
        icon={ClipboardList}
        search={
          <SearchInput
            placeholder="Hľadaj v histórii schránky..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        }
      >
        <span className="text-[10px] text-muted font-mono">esc späť</span>
      </ViewHeader>

      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs border-b border-line">
        {FILTERS.map(({ id, label }) => (
          <SegmentButton
            key={id}
            isActive={filter === id}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setFilter(id)}
          >
            {label}
          </SegmentButton>
        ))}
      </div>

      <div className="mt-2 overflow-y-auto flex-1 pr-1 space-y-1">
        {visible.map((item, i) => {
          const isSelected = i === index;
          const isImage = item.item_type === "image";

          return (
            <ListRow
              key={item.id}
              isSelected={isSelected}
              selectedRef={selectedRef}
              onSelect={() => setIndex(i)}
              onClick={() => void handleCopy(item)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isImage && item.preview ? (
                  <img
                    src={item.preview}
                    alt="Screenshot"
                    className="w-14 h-10 object-cover rounded border border-line-strong shrink-0 bg-well"
                  />
                ) : (
                  <IconTile icon={Copy} color={CATEGORIES.clipboard.color} />
                )}

                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-xs text-content truncate">
                    {isImage ? `Screenshot (${item.content})` : item.content}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-muted">
                    <span>{formatTimeAgo(item.timestamp)}</span>
                    <span>•</span>
                    <span>{isImage ? "Obrázok" : `${item.content.length} znakov`}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!isImage && (
                  <IconButton
                    tone="accent"
                    revealOnHover
                    title="Upraviť (Ctrl + E)"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(item);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </IconButton>
                )}

                <IconButton
                  tone="danger"
                  revealOnHover
                  title="Zmazať"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(item.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconButton>

                {isSelected && <AccentBadge icon={CornerDownLeft} label="Kopírovať" />}
              </div>
            </ListRow>
          );
        })}

        {visible.length === 0 && <EmptyState>História schránky je prázdna</EmptyState>}
      </div>

      <ViewFooter label={`Celkovo ${items.length} položiek v schránke`}>
        <KeyHint keys={["↵"]} label="Kopírovať" />
        <KeyHint keys={["Ctrl", "E"]} label="Upraviť" />
        <KeyHint keys={["Del"]} label="Zmazať" />
        <KeyHint keys={["esc"]} label="Späť" />
      </ViewFooter>
    </View>
  );
}
