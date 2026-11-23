import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { matchesHotkey } from "@/core/hotkeys";
import { useLauncher } from "@/core/launcher";
import { useWindowFocus } from "@/core/useWindowFocus";
import type { PromptRequest } from "@/core/types";
import { COMMANDS } from "@/registry/commands";
import { useResults } from "@/registry/useResults";
import { ItemBrowser } from "./ItemBrowser";
import { PromptBar, SearchBar } from "./SearchBar";

interface SearchViewProps {
  term: string;
  onTermChange: (value: string) => void;
  prompt: PromptRequest | null;
  onPromptClose: () => void;
}

export function SearchView({ term, onTermChange, prompt, onPromptClose }: SearchViewProps) {
  const launcher = useLauncher();
  const inputRef = useRef<HTMLInputElement>(null);
  const items = useResults(term);

  useWindowFocus((focused) => {
    if (focused) inputRef.current?.focus();
  });

  function runCommandHotkey(e: KeyboardEvent<HTMLInputElement>): boolean {
    const command = COMMANDS.find(({ hotkey }) => hotkey && matchesHotkey(e, hotkey));
    if (!command) return false;
    e.preventDefault();
    Promise.resolve(command.run(launcher)).catch((err) => launcher.notify(String(err), "error"));
    return true;
  }

  return (
    <ItemBrowser
      items={items}
      resetKey={term}
      emptyLabel="No matching results found"
      idleLabel="Cortex Launcher"
      escapeLabel="Close"
      onEscape={launcher.close}
      onKey={runCommandHotkey}
      renderHeader={(onKeyDown) =>
        prompt ? (
          <PromptBar request={prompt} onClose={onPromptClose} />
        ) : (
          <SearchBar inputRef={inputRef} term={term} onTermChange={onTermChange} onKeyDown={onKeyDown} />
        )
      }
    />
  );
}
