import { UnifiedResult } from "../types";
import { ResultItem } from "./ResultItem";

interface ResultListProps {
  results: UnifiedResult[];
  selectedIndex: number;
  selectedRef: React.RefObject<HTMLDivElement | null>;
  aliases: Record<string, string>;
  onSelectIndex: (index: number) => void;
  onExecute: (entry: UnifiedResult) => void;
}

export function ResultList({
  results,
  selectedIndex,
  selectedRef,
  aliases,
  onSelectIndex,
  onExecute,
}: ResultListProps) {
  if (results.length === 0) {
    return (
      <div
        className="text-sm px-2 py-6 text-center"
        style={{ color: "var(--text-placeholder)" }}
      >
        No matching results found
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-y-auto flex-1 pr-1 space-y-1">
      {results.map((entry, index) => {
        const isSelected = index === selectedIndex;
        const prevEntry = results[index - 1];
        const showHeader = !prevEntry || prevEntry.type !== entry.type;

        const itemKey =
          entry.type === "calc"
            ? "calc-result"
            : entry.type === "dev"
            ? entry.data.id
            : entry.type === "command"
            ? entry.data.id
            : entry.type === "web"
            ? entry.data.url
            : entry.data.path;

        return (
          <div key={itemKey}>
            {showHeader && (
              <div className="text-[10px] font-bold tracking-wider text-white/40 px-3 pt-2 pb-1 uppercase">
                {entry.type === "calc"
                  ? "Calculator"
                  : entry.type === "dev"
                  ? "Developer Tools"
                  : entry.type === "web"
                  ? "Web Search"
                  : entry.type === "command"
                  ? "System Commands"
                  : entry.type === "app"
                  ? "Applications"
                  : "Files & Folders"}
              </div>
            )}

            <ResultItem
              entry={entry}
              isSelected={isSelected}
              selectedRef={selectedRef}
              aliases={aliases}
              onClick={() => onExecute(entry)}
              onMouseMove={() => {
                if (selectedIndex !== index) {
                  onSelectIndex(index);
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
}