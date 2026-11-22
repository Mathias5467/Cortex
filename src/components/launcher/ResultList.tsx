import type { RefObject } from "react";
import type { LauncherItem } from "@/core/types";
import { EmptyState } from "@/components/ui/View";
import { ResultRow } from "./ResultRow";

interface ResultListProps {
  items: LauncherItem[];
  emptyLabel: string;
  selectedIndex: number;
  selectedRef: RefObject<HTMLDivElement | null>;
  onSelectIndex: (index: number) => void;
  onExecute: (item: LauncherItem) => void;
}

export function ResultList({
  items,
  emptyLabel,
  selectedIndex,
  selectedRef,
  onSelectIndex,
  onExecute,
}: ResultListProps) {
  return (
    <div className="mt-2 overflow-y-auto flex-1 pr-1 space-y-1">
      {items.length === 0 && <EmptyState>{emptyLabel}</EmptyState>}

      {items.map((item, index) => (
        <div key={item.id}>
          {items[index - 1]?.section !== item.section && (
            <div className="text-[10px] font-bold tracking-wider text-muted px-3 pt-2 pb-1 uppercase">
              {item.section}
            </div>
          )}
          <ResultRow
            item={item}
            isSelected={index === selectedIndex}
            selectedRef={selectedRef}
            onClick={() => onExecute(item)}
            onSelect={() => onSelectIndex(index)}
          />
        </div>
      ))}
    </div>
  );
}
