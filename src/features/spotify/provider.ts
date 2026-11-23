import { useMemo } from "react";
import { Music, Search } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { matchKeyword } from "@/core/keyword";
import { useLauncher } from "@/core/launcher";
import type { LauncherItem, ResultProvider } from "@/core/types";
import { searchUri } from "./api";

export const spotifyProvider: ResultProvider = {
  id: "spotify",
  hidesFallback: true,
  useItems: (query) => {
    const launcher = useLauncher();
    const search = matchKeyword(query, ["sp"])?.args ?? "";

    return useMemo<LauncherItem[]>(() => {
      if (!search) return [];
      return [
        {
          id: "spotify:search",
          section: "Spotify",
          icon: { kind: "tile", icon: Music, color: CATEGORIES.media.color },
          title: "Search Spotify",
          subtitle: `"${search}"`,
          verb: "Search",
          footer: "Open search in Spotify",
          actions: [
            {
              id: "search",
              label: "Search in Spotify",
              icon: Search,
              run: () => launcher.openPath(searchUri(search)),
            },
          ],
        },
      ];
    }, [search, launcher]);
  },
};
