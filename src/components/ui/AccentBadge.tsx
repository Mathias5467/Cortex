import type { LucideIcon } from "lucide-react";

interface AccentBadgeProps {
  icon: LucideIcon;
  label: string;
}

export function AccentBadge({ icon: Icon, label }: AccentBadgeProps) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 bg-accent/20 text-accent">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
