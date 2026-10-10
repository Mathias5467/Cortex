import {
  Folder,
  FileText,
  Calculator,
  Tag,
  CornerDownLeft,
  Lock,
  Trash2,
  Moon,
  RotateCw,
  Power,
  Globe,
  Pipette,
  Binary,
} from "lucide-react";
import { UnifiedResult } from "../types";

interface ResultItemProps {
  entry: UnifiedResult;
  isSelected: boolean;
  selectedRef: React.RefObject<HTMLDivElement | null> | null;
  aliases: Record<string, string>;
  onClick: () => void;
  onMouseMove: () => void;
}

export function ResultItem({
  entry,
  isSelected,
  selectedRef,
  aliases,
  onClick,
  onMouseMove,
}: ResultItemProps) {
  return (
    <div
      ref={isSelected ? selectedRef : null}
      onClick={onClick}
      onMouseMove={onMouseMove}
      className="text-sm px-3 py-2 rounded-lg cursor-pointer transition-colors flex justify-between items-center"
      style={{
        backgroundColor: isSelected ? "var(--bg-selected)" : "transparent",
        color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
      }}
    >
      <div className="flex items-center gap-3">
        {entry.type === "calc" ? (
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Calculator className="w-3.5 h-3.5" />
          </div>
        ) : entry.type === "dev" ? (
          <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Binary className="w-3.5 h-3.5" />
          </div>
        ) : entry.type === "command" ? (
          <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            {entry.data.iconName === "lock" && <Lock className="w-3.5 h-3.5" />}
            {entry.data.iconName === "trash" && <Trash2 className="w-3.5 h-3.5" />}
            {entry.data.iconName === "moon" && <Moon className="w-3.5 h-3.5" />}
            {entry.data.iconName === "rotate" && <RotateCw className="w-3.5 h-3.5" />}
            {entry.data.iconName === "power" && <Power className="w-3.5 h-3.5" />}
            {entry.data.iconName === "pipette" && <Pipette className="w-3.5 h-3.5" />}
          </div>
        ) : entry.type === "web" ? (
          <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </div>
        ) : entry.type === "app" ? (
          entry.data.icon ? (
            <img
              src={entry.data.icon}
              alt=""
              className="w-6 h-6 rounded-md shrink-0 object-contain drop-shadow-sm"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs font-semibold"
              style={{
                backgroundColor: "var(--bg-selected)",
                color: "var(--text-secondary)",
              }}
            >
              {entry.data.name.charAt(0).toUpperCase()}
            </div>
          )
        ) : entry.data.is_dir ? (
          <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Folder className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        )}

        {entry.type === "calc" ? (
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-white">{entry.data.result}</span>
            <span className="text-xs text-white/40 font-mono">({entry.data.expression})</span>
          </div>
        ) : entry.type === "dev" ? (
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold text-white">{entry.data.title}</span>
            <span className="text-xs text-white/40">{entry.data.subtitle}</span>
          </div>
        ) : entry.type === "web" ? (
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm text-white">Search {entry.data.engine}</span>
            <span className="text-xs text-white/40 truncate max-w-[320px]">
              "{entry.data.query}"
            </span>
          </div>
        ) : entry.type === "command" ? (
          <div className="flex flex-col">
            <span className="font-medium text-sm text-white">{entry.data.name}</span>
            <span className="text-[11px] text-white/40">{entry.data.description}</span>
          </div>
        ) : (
          <span className="font-medium text-sm truncate max-w-[420px]">{entry.data.name}</span>
        )}

        {entry.type === "app" &&
          Object.entries(aliases).find(([_, path]) => path === entry.data.path) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {Object.entries(aliases).find(([_, path]) => path === entry.data.path)?.[0]}
            </span>
          )}
      </div>

      {isSelected && (
        <span
          className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
          style={{
            backgroundColor: "var(--accent-muted)",
            color: "var(--accent)",
          }}
        >
          <CornerDownLeft className="w-3 h-3" />
          {entry.type === "calc" || entry.type === "dev"
            ? "Copy"
            : entry.type === "web"
            ? "Search"
            : "Open"}
        </span>
      )}
    </div>
  );
}