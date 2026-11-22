import { CircleAlert, CircleCheck } from "lucide-react";
import type { Notice } from "@/core/types";

export function Toast({ notice }: { notice: Notice }) {
  const isError = notice.tone === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-12 max-w-[85%] z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line-strong bg-popover shadow-2xl text-xs pointer-events-none">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${isError ? "text-danger" : "text-accent"}`} />
      <span className="truncate">{notice.message}</span>
    </div>
  );
}
