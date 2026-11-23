import { useMemo } from "react";
import { matchKeyword } from "@/core/keyword";
import { useLauncher } from "@/core/launcher";
import type { ResultProvider } from "@/core/types";
import { useAsync } from "@/core/useAsync";
import { useClipboardText } from "@/core/useClipboardText";
import { hashApi } from "./api";
import { createDigestItems } from "./items";

const KEYWORDS = ["hash", "md5", "sha1", "sha256", "sha512"] as const;

export const hashProvider: ResultProvider = {
  id: "hash",
  hidesFallback: true,
  useItems: (query) => {
    const launcher = useLauncher();
    const match = matchKeyword(query, KEYWORDS);
    const clipboard = useClipboardText(match?.args === "");
    const text = match ? match.args || clipboard : "";
    const { data } = useAsync(text || null, () => hashApi.text(text), 80);
    const keyword = match?.keyword;
    const source = match?.args ? "Hash" : "Hash of Clipboard";

    return useMemo(() => {
      if (!data || !keyword) return [];
      return createDigestItems(launcher, data, source, keyword === "hash" ? undefined : keyword);
    }, [data, keyword, source, launcher]);
  },
};
