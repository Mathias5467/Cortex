import { useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { Search } from "lucide-react";
import type { PromptRequest } from "@/core/types";
import { AccentBadge } from "@/components/ui/AccentBadge";
import { SearchInput } from "@/components/ui/View";

interface SearchBarProps {
  inputRef: RefObject<HTMLInputElement | null>;
  term: string;
  onTermChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export function SearchBar({ inputRef, term, onTermChange, onKeyDown }: SearchBarProps) {
  return (
    <div className="w-full flex items-center gap-2.5 py-1.5 border-b border-line shrink-0">
      <Search className="w-4 h-4 text-accent shrink-0" />
      <SearchInput
        ref={inputRef}
        placeholder="Search for apps, files and commands..."
        value={term}
        onChange={(e) => onTermChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

interface PromptBarProps {
  request: PromptRequest;
  onClose: () => void;
}

export function PromptBar({ request, onClose }: PromptBarProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const clean = value.trim();
      const problem = request.validate?.(clean) ?? null;
      if (problem) {
        setError(problem);
        return;
      }
      try {
        await request.onSubmit(clean);
        onClose();
      } catch (err) {
        console.error(err);
        setError(String(err));
      }
    }
  }

  return (
    <div className="w-full flex items-center gap-2 py-2 border-b border-line shrink-0">
      <AccentBadge icon={request.icon} label={request.label} />
      <input
        autoFocus
        type="text"
        placeholder={request.placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-0 bg-transparent text-sm outline-none text-content placeholder-muted"
      />
      <span className={`text-[10px] shrink-0 ${error ? "text-danger" : "text-muted"}`}>
        {error ?? "esc to cancel"}
      </span>
    </div>
  );
}
