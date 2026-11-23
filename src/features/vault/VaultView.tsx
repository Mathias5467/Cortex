import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Eye, EyeOff, Pencil, Plus, ShieldCheck, Trash2, Unlock } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import { useListNavigation } from "@/core/useListNavigation";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { IconTile } from "@/components/ui/IconTile";
import { KeyHint } from "@/components/ui/Kbd";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState, SearchInput, View, ViewFooter, ViewHeader } from "@/components/ui/View";
import { VaultEntryForm } from "./VaultEntryForm";
import { VaultSetup, VaultUnlock } from "./VaultGate";
import { vaultApi, type VaultDraft, type VaultEntry, type VaultStatus } from "./api";

type Editor = { entry: VaultEntry | null } | null;

export function VaultView() {
  const { goBack, copySecretAndClose } = useLauncher();
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [search, setSearch] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [editor, setEditor] = useState<Editor>(null);

  const needle = search.toLowerCase().trim();
  const visible = entries.filter(
    (entry) => entry.title.toLowerCase().includes(needle) || entry.username.toLowerCase().includes(needle),
  );
  const { index, setIndex, selectedRef, handleArrows } = useListNavigation(visible.length, search);

  const refresh = useCallback(async () => {
    try {
      const next = await vaultApi.status();
      setEntries(next.is_unlocked ? await vaultApi.list() : []);
      setStatus(next);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleLock() {
    await vaultApi.lock();
    setRevealedIds(new Set());
    await refresh();
  }

  async function handleDelete(id: number) {
    await vaultApi.remove(id);
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  async function handleSave(draft: VaultDraft) {
    await vaultApi.save(draft);
    setEditor(null);
    await refresh();
  }

  function toggleReveal(id: number, e: MouseEvent) {
    e.stopPropagation();
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      goBack();
      return;
    }

    if (handleArrows(e)) return;

    const selected = visible[index];
    if (e.key === "Enter" && selected) {
      e.preventDefault();
      void copySecretAndClose(selected.password);
    }
  }

  if (status && !status.is_initialized) return <VaultSetup onUnlocked={refresh} />;
  if (status && !status.is_unlocked) return <VaultUnlock onUnlocked={refresh} />;
  if (editor) {
    return <VaultEntryForm entry={editor.entry} onSave={handleSave} onCancel={() => setEditor(null)} />;
  }

  return (
    <View>
      <ViewHeader
        onBack={goBack}
        icon={ShieldCheck}
        search={
          <SearchInput
            placeholder="Hľadaj v zašifrovanom trezore..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        }
      >
        <Button variant="soft" onClick={() => setEditor({ entry: null })}>
          <Plus className="w-3.5 h-3.5" /> Nové heslo
        </Button>
        <IconButton tone="accent" title="Zamknúť trezor" onClick={() => void handleLock()}>
          <Unlock className="w-3.5 h-3.5" />
        </IconButton>
      </ViewHeader>

      <div className="mt-2 overflow-y-auto flex-1 space-y-1 pr-1">
        {visible.map((entry, i) => {
          const isRevealed = revealedIds.has(entry.id);
          const RevealIcon = isRevealed ? EyeOff : Eye;

          return (
            <ListRow
              key={entry.id}
              isSelected={i === index}
              selectedRef={selectedRef}
              onSelect={() => setIndex(i)}
              onClick={() => void copySecretAndClose(entry.password)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconTile text={entry.title.charAt(0).toUpperCase()} color={CATEGORIES.security.color} />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-content text-xs truncate">{entry.title}</span>
                  <span className="text-[11px] text-muted truncate">{entry.username || "Bez mena"}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div className="font-mono text-[11px] text-accent bg-well px-2 py-0.5 rounded border border-line flex items-center gap-1.5">
                  <span>{isRevealed ? entry.password : "••••••••••••"}</span>
                  <button
                    type="button"
                    onClick={(e) => toggleReveal(entry.id, e)}
                    className="cursor-pointer text-secondary hover:text-content"
                  >
                    <RevealIcon className="w-3 h-3" />
                  </button>
                </div>

                <IconButton
                  tone="accent"
                  revealOnHover
                  title="Upraviť"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditor({ entry });
                  }}
                >
                  <Pencil className="w-3 h-3" />
                </IconButton>

                <IconButton
                  tone="danger"
                  revealOnHover
                  title="Zmazať"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(entry.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </IconButton>
              </div>
            </ListRow>
          );
        })}

        {status && visible.length === 0 && (
          <EmptyState>Žiadne uložené heslá. Klikni na "+ Nové heslo" hore.</EmptyState>
        )}
      </div>

      <ViewFooter label={`${entries.length} zašifrovaných účtov`}>
        <KeyHint keys={["↵"]} label="Kopírovať heslo" />
        <KeyHint keys={["esc"]} label="Zavrieť" />
      </ViewFooter>
    </View>
  );
}
