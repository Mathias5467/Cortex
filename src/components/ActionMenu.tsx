import { ActionItem } from "../types";

interface ActionMenuProps {
  isOpen: boolean;
  actions: ActionItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onExecuteAction: (action: ActionItem) => void;
}

export function ActionMenu({
  isOpen,
  actions,
  selectedIndex,
  onSelectIndex,
  onExecuteAction,
}: ActionMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute right-4 bottom-12 w-64 rounded-xl border p-1 shadow-2xl backdrop-blur-2xl z-50"
      style={{
        backgroundColor: "var(--bg-app)",
        borderColor: "var(--border-app)",
      }}
    >
      <div className="text-[10px] font-bold tracking-wider text-white/40 px-3 py-1.5 uppercase">
        Actions
      </div>
      <div className="space-y-0.5">
        {actions.map((action, i) => {
          const isSelected = i === selectedIndex;
          return (
            <div
              key={action.id}
              onClick={() => onExecuteAction(action)}
              onMouseMove={() => onSelectIndex(i)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{
                backgroundColor: isSelected ? "var(--bg-selected)" : "transparent",
                color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-white/70">{action.icon}</span>
                <span className="font-medium">{action.label}</span>
              </div>
              {action.shortcut && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                  {action.shortcut}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}