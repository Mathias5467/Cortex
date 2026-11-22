import type { ButtonHTMLAttributes } from "react";

type Tone = "default" | "accent" | "danger";

const TONES: Record<Tone, string> = {
  default: "hover:text-content",
  accent: "hover:text-accent",
  danger: "hover:text-danger",
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  revealOnHover?: boolean;
}

export function IconButton({ tone = "default", revealOnHover = false, className = "", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`cursor-pointer p-1 rounded text-muted transition ${TONES[tone]} ${
        revealOnHover ? "opacity-0 group-hover:opacity-100" : "hover:bg-hover"
      } ${className}`}
      {...props}
    />
  );
}
