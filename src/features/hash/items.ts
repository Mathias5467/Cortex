import { Fingerprint } from "lucide-react";
import { createCopyItem } from "@/core/copyItem";
import type { Launcher, LauncherItem } from "@/core/types";
import { ALGORITHMS, type Digests } from "./api";

export function createDigestItems(
  launcher: Launcher,
  digests: Digests,
  section: string,
  only?: keyof Digests,
): LauncherItem[] {
  return ALGORITHMS.filter(({ id }) => !only || id === only).map(({ id, label }) =>
    createCopyItem(launcher, {
      id: `hash:${id}`,
      section,
      category: "security",
      icon: Fingerprint,
      value: digests[id],
      subtitle: label,
    }),
  );
}
