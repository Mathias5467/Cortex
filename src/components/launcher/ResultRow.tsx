import type { RefObject } from "react";
import { CornerDownLeft, Tag } from "lucide-react";
import type { ItemIcon, LauncherItem } from "@/core/types";
import { AccentBadge } from "@/components/ui/AccentBadge";
import { IconTile } from "@/components/ui/IconTile";
import { ListRow } from "@/components/ui/ListRow";

const TITLE_STYLES = {
  default: "font-medium text-sm",
  result: "text-base font-semibold",
  code: "font-mono text-sm font-semibold",
};

const SUBTITLE_STYLES = {
  default: "",
  code: "font-mono",
};

function ResultIcon({ icon }: { icon: ItemIcon }) {
  if (icon.kind === "tile") return <IconTile icon={icon.icon} color={icon.color} />;
  if (icon.kind === "letter") return <IconTile text={icon.text} color="gray" />;
  return <img src={icon.src} alt="" className="w-6 h-6 rounded-md shrink-0 object-contain drop-shadow-sm" />;
}

interface ResultRowProps {
  item: LauncherItem;
  isSelected: boolean;
  selectedRef: RefObject<HTMLDivElement | null>;
  onClick: () => void;
  onSelect: () => void;
}

export function ResultRow({ item, isSelected, selectedRef, onClick, onSelect }: ResultRowProps) {
  const stacked = item.layout === "stacked";

  return (
    <ListRow isSelected={isSelected} selectedRef={selectedRef} onClick={onClick} onSelect={onSelect}>
      <div className="flex items-center gap-3 min-w-0">
        <ResultIcon icon={item.icon} />

        <div className={`min-w-0 flex ${stacked ? "flex-col" : "items-baseline gap-2"}`}>
          <span
            className={`truncate ${TITLE_STYLES[item.titleStyle ?? "default"]} ${item.subtitle ? "text-content" : ""}`}
          >
            {item.title}
          </span>
          {item.subtitle && (
            <span
              className={`truncate text-muted ${stacked ? "text-[11px]" : "text-xs"} ${
                SUBTITLE_STYLES[item.subtitleStyle ?? "default"]
              }`}
            >
              {item.subtitle}
            </span>
          )}
        </div>

        {item.tag && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-hover text-secondary font-mono flex items-center gap-1 shrink-0">
            <Tag className="w-2.5 h-2.5" />
            {item.tag}
          </span>
        )}
      </div>

      {isSelected && <AccentBadge icon={CornerDownLeft} label={item.verb} />}
    </ListRow>
  );
}
