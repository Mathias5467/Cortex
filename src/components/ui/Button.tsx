import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "soft" | "neutral" | "ghost";
type Size = "xs" | "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent hover:bg-accent-hover text-on-accent font-semibold",
  soft: "bg-accent/20 hover:bg-accent/30 text-accent font-semibold",
  neutral: "bg-hover hover:bg-hover-strong text-content",
  ghost: "hover:bg-hover text-secondary",
};

const SIZES: Record<Size, string> = {
  xs: "text-[10px] px-2 py-0.5 rounded",
  sm: "text-xs px-2.5 py-1 rounded",
  md: "text-xs px-4 py-1.5 rounded-lg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "sm", className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`cursor-pointer transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
