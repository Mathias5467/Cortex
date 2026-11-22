import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KeyHint } from "@/components/ui/Kbd";
import { View, ViewFooter, ViewHeader } from "@/components/ui/View";

interface ClipboardEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function ClipboardEditor({ initialContent, onSave, onCancel }: ClipboardEditorProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(initialContent.length, initialContent.length);
  }, [initialContent]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "Enter" || e.key === "s")) {
      e.preventDefault();
      onSave(content.trim());
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <View>
      <ViewHeader onBack={onCancel} icon={Pencil} title="Upraviť položku schránky">
        <span className="text-[11px] text-muted font-mono">{content.length} znakov</span>
      </ViewHeader>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Napíš sem text..."
        className="flex-1 w-full bg-transparent resize-none outline-none py-3 font-mono text-sm leading-relaxed text-content placeholder-faint select-text"
      />

      <ViewFooter
        label={
          <span className="flex items-center gap-3">
            <KeyHint keys={["Ctrl", "↵"]} label="Uložiť & Kopírovať" />
            <KeyHint keys={["esc"]} label="Zrušiť" />
          </span>
        }
      >
        <Button variant="ghost" onClick={onCancel}>
          <X className="w-3.5 h-3.5" />
          Zrušiť
        </Button>
        <Button onClick={() => onSave(content.trim())}>
          <Save className="w-3.5 h-3.5" />
          Uložiť
        </Button>
      </ViewFooter>
    </View>
  );
}
