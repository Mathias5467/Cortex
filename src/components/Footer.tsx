interface FooterProps {
  label: string;
}

export function Footer({ label }: FooterProps) {
  return (
    <div
      className="mt-2 pt-2 border-t flex items-center justify-between text-xs select-none"
      style={{
        borderColor: "var(--border-divider)",
        color: "var(--text-secondary)",
      }}
    >
      <div className="truncate max-w-[340px] text-[11px] opacity-70">
        {label}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">↵</kbd>
          <span>Open</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">Ctrl</kbd>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">K</kbd>
          <span>Actions</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">esc</kbd>
          <span>Close</span>
        </span>
      </div>
    </div>
  );
}