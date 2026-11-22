import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-hover font-mono">{children}</kbd>;
}

interface KeyHintProps {
  keys: string[];
  label: string;
}

export function KeyHint({ keys, label }: KeyHintProps) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
      <span>{label}</span>
    </span>
  );
}
