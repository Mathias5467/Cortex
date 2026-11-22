import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toCssColor } from "@/core/colors";
import { hotkeyLabel } from "@/core/hotkeys";
import type { LauncherAction } from "@/core/types";
import { Kbd } from "@/components/ui/Kbd";

interface ActionMenuProps {
  title: string;
  actions: LauncherAction[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onExecute: (action: LauncherAction) => void;
  onBack?: () => void;
}

function ActionIcon({ action }: { action: LauncherAction }) {
  if (action.swatch) {
    return (
      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: toCssColor(action.swatch) }} />
    );
  }
  if (!action.icon) return null;
  const Icon = action.icon;
  return <Icon className={`w-3.5 h-3.5 shrink-0 ${action.tone === "danger" ? "text-danger" : "text-secondary"}`} />;
}

export function ActionMenu({ title, actions, selectedIndex, onSelectIndex, onExecute, onBack }: ActionMenuProps) {
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, actions]);

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="absolute right-4 bottom-12 w-64 max-h-72 flex flex-col rounded-xl border border-line-strong bg-popover p-1 shadow-2xl backdrop-blur-2xl z-50"
    >
      <div
        onClick={onBack}
        className={`text-[10px] font-bold tracking-wider text-muted px-2.5 py-1.5 uppercase flex items-center gap-1 shrink-0 ${
          onBack ? "cursor-pointer hover:text-content" : ""
        }`}
      >
        {onBack && <ChevronLeft className="w-3 h-3" />}
        {title}
      </div>

      <div className="space-y-0.5 overflow-y-auto">
        {actions.map((action, i) => {
          const isSelected = i === selectedIndex;
          const isPrimary = i === 0 && !onBack;

          return (
            <div
              key={action.id}
              ref={isSelected ? selectedRef : null}
              onClick={() => onExecute(action)}
              onMouseMove={() => {
                if (!isSelected) onSelectIndex(i);
              }}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                isSelected ? "bg-selected text-content" : "text-secondary"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ActionIcon action={action} />
                <span className="font-medium truncate">{action.label}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isPrimary && <Kbd>↵</Kbd>}
                {action.hotkey && <Kbd>{hotkeyLabel(action.hotkey)}</Kbd>}
                {"children" in action && <ChevronRight className="w-3 h-3 text-muted" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
