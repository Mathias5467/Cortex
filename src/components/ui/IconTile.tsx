import type { LucideIcon } from "lucide-react";
import { toCssColor, type IconColor } from "@/core/colors";

interface IconTileProps {
  icon?: LucideIcon;
  text?: string;
  color?: IconColor;
  size?: "sm" | "lg";
}

const SIZES = {
  sm: { tile: "w-6 h-6 rounded-md", icon: "w-3.5 h-3.5" },
  lg: { tile: "w-12 h-12 rounded-2xl", icon: "w-6 h-6" },
};

export function IconTile({ icon: Icon, text, color = "coral", size = "sm" }: IconTileProps) {
  const cssColor = toCssColor(color);

  return (
    <div
      className={`flex items-center justify-center shrink-0 text-xs font-bold ${SIZES[size].tile}`}
      style={{
        color: cssColor,
        backgroundColor: `color-mix(in srgb, ${cssColor} 22%, transparent)`,
      }}
    >
      {Icon ? <Icon className={SIZES[size].icon} /> : text}
    </div>
  );
}
