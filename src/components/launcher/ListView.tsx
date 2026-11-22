import { useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { stripAccents } from "@/core/fuzzy";
import { useLauncher } from "@/core/launcher";
import type { AsyncState } from "@/core/useAsync";
import type { LauncherItem } from "@/core/types";
import { SearchInput, ViewHeader } from "@/components/ui/View";
import { ItemBrowser } from "./ItemBrowser";

interface ListViewProps {
  icon: LucideIcon;
  placeholder: string;
  items: LauncherItem[];
  status?: Pick<AsyncState<unknown>, "error" | "isLoading">;
  emptyLabel?: string;
  headerActions?: ReactNode;
}

function normalize(text: string) {
  return stripAccents(text.toLowerCase());
}

export function ListView({ icon, placeholder, items, status, emptyLabel, headerActions }: ListViewProps) {
  const { goBack } = useLauncher();
  const [term, setTerm] = useState("");

  const needle = normalize(term.trim());
  const visible = items.filter(({ title, subtitle, tag }) =>
    normalize([title, subtitle, tag].join(" ")).includes(needle),
  );

  const placeholderLabel = status?.error ?? (status?.isLoading ? "Loading..." : emptyLabel);

  return (
    <ItemBrowser
      items={visible}
      resetKey={term}
      emptyLabel={(items.length === 0 && placeholderLabel) || "No matching results found"}
      idleLabel={`${items.length} items`}
      escapeLabel="Back"
      onEscape={goBack}
      renderHeader={(onKeyDown) => (
        <ViewHeader
          onBack={goBack}
          icon={icon}
          search={
            <SearchInput
              placeholder={placeholder}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={onKeyDown}
            />
          }
        >
          {headerActions}
        </ViewHeader>
      )}
    />
  );
}
