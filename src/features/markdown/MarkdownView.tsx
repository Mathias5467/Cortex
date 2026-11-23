import { useEffect, useRef, useState } from "react";
import type { AnchorHTMLAttributes, KeyboardEvent } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Code, FileCode2, Trash2 } from "lucide-react";
import { useLauncher } from "@/core/launcher";
import { native } from "@/core/native";
import { useWindowSize } from "@/core/useWindowSize";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { KeyHint } from "@/components/ui/Kbd";
import { View, ViewFooter, ViewHeader } from "@/components/ui/View";

const STORAGE_KEY = "cortex.markdown";
const INDENT = "  ";
const PLUGINS = [remarkGfm];

const SAMPLE = `# Markdown

Píš vľavo, **výsledok** vidíš vpravo.

- [x] zoznamy a úlohy
- [ ] tabuľky, \`kód\` a [odkazy](https://example.com)

| Stĺpec | Hodnota |
| --- | --- |
| A | 1 |

\`\`\`ts
const answer = 42;
\`\`\`
`;

function loadDraft(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? SAMPLE;
  } catch {
    return SAMPLE;
  }
}

function saveDraft(source: string) {
  try {
    localStorage.setItem(STORAGE_KEY, source);
  } catch (err) {
    console.error(err);
  }
}

function ExternalLink({ href, children }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (href && /^(https?:|mailto:)/i.test(href)) openUrl(href).catch(console.error);
      }}
    >
      {children}
    </a>
  );
}

export default function MarkdownView() {
  const { goBack, notify } = useLauncher();
  const [source, setSource] = useState(loadDraft);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useWindowSize(1080, 660);

  useEffect(() => {
    saveDraft(source);
  }, [source]);

  async function copy(text: string, message: string) {
    try {
      await native.copyText(text);
      notify(message);
    } catch (err) {
      notify(String(err), "error");
    }
    editorRef.current?.focus();
  }

  function copyMarkdown() {
    void copy(source, "Markdown copied");
  }

  function copyHtml() {
    void copy(previewRef.current?.innerHTML ?? "", "HTML copied");
  }

  function syncScroll() {
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    const ratio = editor.scrollTop / Math.max(1, editor.scrollHeight - editor.clientHeight);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      goBack();
    } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      copyMarkdown();
    } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "h") {
      e.preventDefault();
      copyHtml();
    }
  }

  function handleEditorKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const editor = e.currentTarget;
    editor.setRangeText(INDENT, editor.selectionStart, editor.selectionEnd, "end");
    setSource(editor.value);
  }

  return (
    <View onKeyDown={handleKeyDown}>
      <ViewHeader onBack={goBack} icon={FileCode2} title="Markdown">
        <Button variant="neutral" onClick={copyMarkdown}>
          <FileCode2 className="w-3.5 h-3.5" /> Copy Markdown
        </Button>
        <Button variant="soft" onClick={copyHtml}>
          <Code className="w-3.5 h-3.5" /> Copy HTML
        </Button>
        <IconButton
          tone="danger"
          title="Clear"
          onClick={() => {
            setSource("");
            editorRef.current?.focus();
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </IconButton>
      </ViewHeader>

      <div className="mt-2 flex-1 min-h-0 grid grid-cols-2 gap-2">
        <textarea
          ref={editorRef}
          autoFocus
          spellCheck={false}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleEditorKeyDown}
          placeholder="# Markdown..."
          className="min-w-0 resize-none rounded-lg bg-well border border-line p-3 outline-none focus:border-accent/60 font-mono text-xs leading-relaxed text-content placeholder-faint select-text"
        />
        <div
          ref={previewRef}
          className="markdown min-w-0 overflow-auto rounded-lg bg-field border border-line p-3 select-text"
        >
          <Markdown remarkPlugins={PLUGINS} components={{ a: ExternalLink }}>
            {source}
          </Markdown>
        </div>
      </div>

      <ViewFooter label={`${source.length} characters`}>
        <KeyHint keys={["Ctrl", "Shift", "C"]} label="Markdown" />
        <KeyHint keys={["Ctrl", "Shift", "H"]} label="HTML" />
        <KeyHint keys={["esc"]} label="Back" />
      </ViewFooter>
    </View>
  );
}
