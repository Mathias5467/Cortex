import { useEffect, useRef } from "react";
import type { InputHTMLAttributes, KeyboardEventHandler, ReactNode, Ref } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { useWindowFocus } from "@/core/useWindowFocus";
import { IconButton } from "./IconButton";

interface ViewProps {
  children: ReactNode;
  onKeyDown?: KeyboardEventHandler;
  captureFocus?: boolean;
}

export function View({ children, onKeyDown, captureFocus = false }: ViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (captureFocus) ref.current?.focus();
  }, [captureFocus]);

  useWindowFocus((focused) => {
    if (focused && captureFocus) ref.current?.focus();
  });

  return (
    <div
      ref={ref}
      tabIndex={captureFocus ? -1 : undefined}
      className="w-full h-full flex flex-col select-none outline-none"
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

interface ViewHeaderProps {
  onBack: () => void;
  icon: LucideIcon;
  title?: string;
  search?: ReactNode;
  children?: ReactNode;
}

export function ViewHeader({ onBack, icon: Icon, title, search, children }: ViewHeaderProps) {
  return (
    <div className="w-full flex items-center justify-between gap-2 py-1.5 border-b border-line shrink-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <IconButton onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </IconButton>
        <Icon className="w-4 h-4 text-accent shrink-0" />
        {title && (
          <span className="text-xs font-semibold text-accent uppercase tracking-wider truncate">{title}</span>
        )}
        {search}
      </div>
      {children && <div className="flex items-center gap-1.5 shrink-0">{children}</div>}
    </div>
  );
}

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

export function SearchInput({ ref, ...props }: SearchInputProps) {
  return (
    <input
      ref={ref}
      autoFocus
      type="text"
      className="flex-1 min-w-0 bg-transparent text-md outline-none text-content placeholder-muted"
      {...props}
    />
  );
}

interface ViewFooterProps {
  label?: ReactNode;
  children?: ReactNode;
}

export function ViewFooter({ label, children }: ViewFooterProps) {
  return (
    <div className="mt-2 pt-2 border-t border-line flex items-center justify-between gap-3 text-xs text-secondary select-none shrink-0">
      <div className="truncate min-w-0 text-[11px] opacity-70">{label}</div>
      <div className="flex items-center gap-3 shrink-0">{children}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="text-sm px-2 py-6 text-center text-muted">{children}</div>;
}
