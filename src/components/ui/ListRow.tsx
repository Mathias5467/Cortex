import type { ReactNode, RefObject } from "react";

interface ListRowProps {
  isSelected: boolean;
  selectedRef: RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onClick: () => void;
  children: ReactNode;
}

export function ListRow({ isSelected, selectedRef, onSelect, onClick, children }: ListRowProps) {
  return (
    <div
      ref={isSelected ? selectedRef : null}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      onMouseMove={() => {
        if (!isSelected) onSelect();
      }}
      className={`group text-sm px-3 py-2 rounded-lg cursor-pointer transition-colors flex justify-between items-center gap-2 ${
        isSelected ? "bg-selected text-content" : "text-secondary"
      }`}
    >
      {children}
    </div>
  );
}
