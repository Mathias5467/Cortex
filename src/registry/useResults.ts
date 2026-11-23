import { useMemo } from "react";
import type { LauncherItem, Query } from "@/core/types";
import { PROVIDERS } from "./providers";

export function useResults(rawTerm: string): LauncherItem[] {
  const term = rawTerm.trim();
  const query = useMemo<Query>(() => ({ term, lower: term.toLowerCase() }), [term]);

  const groups = PROVIDERS.map((provider) => ({ provider, items: provider.useItems(query) }));
  const hasMatches = groups.some(({ provider, items }) => provider.hidesFallback && items.length > 0);

  return groups
    .filter(({ provider }) => !provider.isFallback || !hasMatches)
    .flatMap(({ items }) => items);
}
