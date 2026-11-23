import { useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { KeyRound, RefreshCw, Save } from "lucide-react";
import { native } from "@/core/native";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { View, ViewFooter, ViewHeader } from "@/components/ui/View";
import type { VaultDraft, VaultEntry } from "./api";
import { generateStrongPassword } from "./password";

interface VaultEntryFormProps {
  entry: VaultEntry | null;
  onSave: (draft: VaultDraft) => Promise<void>;
  onCancel: () => void;
}

export function VaultEntryForm({ entry, onSave, onCancel }: VaultEntryFormProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [username, setUsername] = useState(entry?.username ?? "");
  const [password, setPassword] = useState(() => entry?.password ?? generateStrongPassword(18));
  const [url, setUrl] = useState(entry?.url ?? "");

  const canSave = title.trim() !== "" && password.trim() !== "";

  async function handleSave() {
    if (!canSave) return;
    await onSave({
      id: entry?.id ?? null,
      title: title.trim(),
      username: username.trim(),
      password: password.trim(),
      url: url.trim() || null,
    });
  }

  function copyPassword(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const { value, selectionStart, selectionEnd } = e.currentTarget;
    const selected = value.slice(selectionStart ?? 0, selectionEnd ?? value.length);
    if (selected) native.copySecret(selected).catch(console.error);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <View onKeyDown={handleKeyDown}>
      <ViewHeader onBack={onCancel} icon={KeyRound} title={entry ? "Upraviť účet" : "Nový zašifrovaný účet"} />

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 py-3 max-w-sm mx-auto w-full">
        <TextField
          autoFocus
          label="Názov služby / Aplikácie:"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Napr. GitHub, Google, Netflix..."
        />
        <TextField
          label="Používateľské meno / Email:"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="meno@example.com"
        />
        <TextField
          label="Heslo:"
          labelAction={
            <button
              type="button"
              onClick={() => setPassword(generateStrongPassword(20))}
              className="cursor-pointer text-[10px] text-accent hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Vygenerovať silné
            </button>
          }
          className="font-mono"
          value={password}
          onCopy={copyPassword}
          onCut={copyPassword}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Webová adresa (voliteľné):"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/login"
        />
      </div>

      <ViewFooter>
        <Button variant="ghost" onClick={onCancel}>
          Zrušiť
        </Button>
        <Button onClick={() => void handleSave()} disabled={!canSave}>
          <Save className="w-3.5 h-3.5" /> Zašifrovať a uložiť
        </Button>
      </ViewFooter>
    </View>
  );
}
