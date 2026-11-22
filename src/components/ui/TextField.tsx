import type { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelAction?: ReactNode;
}

export function TextField({ label, labelAction, className = "", ...props }: TextFieldProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-secondary font-medium">{label}</label>
          {labelAction}
        </div>
      )}
      <input
        type="text"
        className={`w-full bg-field border border-line-strong rounded-lg px-2.5 py-1.5 text-xs outline-none text-content placeholder-muted focus:border-accent/60 transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
