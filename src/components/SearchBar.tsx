import { Search, Tag } from "lucide-react";
import { AppEntry } from "../types";

interface SearchBarProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchedTerm: string;
  setSearchedTerm: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  aliasingApp: AppEntry | null;
  aliasInput: string;
  setAliasInput: (v: string) => void;
  onAliasKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function SearchBar({
  inputRef,
  searchedTerm,
  setSearchedTerm,
  onKeyDown,
  aliasingApp,
  aliasInput,
  setAliasInput,
  onAliasKeyDown,
}: SearchBarProps) {
  if (aliasingApp) {
    return (
      <div
        className="w-full flex items-center gap-2 py-2 border-b"
        style={{ borderColor: "var(--border-divider)" }}
      >
        <span
          className="text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1.5"
          style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}
        >
          <Tag className="w-3 h-3" />
          Alias: {aliasingApp.name}
        </span>
        <input
          autoFocus
          type="text"
          placeholder="Type nickname and hit Enter..."
          value={aliasInput}
          onChange={(e) => setAliasInput(e.target.value)}
          onKeyDown={onAliasKeyDown}
          className="flex-1 bg-transparent text-sm outline-none text-white placeholder-white/40"
        />
        <span className="text-[10px] text-white/40">esc to cancel</span>
      </div>
    );
  }

  return (
    <div
      className="w-full flex items-center gap-2.5 py-1.5 border-b"
      style={{ borderColor: "var(--border-divider)" }}
    >
      <Search className="w-4 h-4 text-white/40 shrink-0" />
      <input
        ref={inputRef}
        autoFocus
        type="text"
        placeholder="Search for apps, files and commands..."
        value={searchedTerm}
        onChange={(e) => setSearchedTerm(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full bg-transparent text-md outline-none text-white placeholder-white/40"
      />
    </div>
  );
}