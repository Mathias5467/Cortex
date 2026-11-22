import type { ButtonHTMLAttributes } from "react";

interface SegmentButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
}

export function SegmentButton({ isActive, className = "", ...props }: SegmentButtonProps) {
  return (
    <button
      type="button"
      className={`cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
        isActive ? "text-accent font-bold bg-hover" : "text-muted hover:text-content"
      } ${className}`}
      {...props}
    />
  );
}
