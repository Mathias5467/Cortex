export interface DevToolResult {
  id: string;
  title: string;
  subtitle: string;
  valueToCopy: string;
}

type DevTool = (term: string, lower: string) => DevToolResult[];

const uuidTool: DevTool = (_, lower) => {
  if (lower !== "uuid" && lower !== "guid") return [];
  const uuid = crypto.randomUUID();
  return [{ id: "uuid", title: uuid, subtitle: "Random UUID v4 (Press Enter to copy)", valueToCopy: uuid }];
};

const timestampTool: DevTool = (_, lower) => {
  if (!["time", "now", "epoch", "date"].includes(lower)) return [];
  const now = new Date();
  const seconds = Math.floor(now.getTime() / 1000).toString();
  const iso = now.toISOString();
  return [
    {
      id: "timestamp-seconds",
      title: seconds,
      subtitle: `Unix Epoch (seconds) • ISO: ${iso}`,
      valueToCopy: seconds,
    },
    { id: "timestamp-iso", title: iso, subtitle: "ISO 8601 UTC Date", valueToCopy: iso },
  ];
};

function attempt(fn: () => string): string | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

const base64Tool: DevTool = (term) => {
  const raw = term.match(/^(?:b64|base64)\s+(.+)$/i)?.[1];
  if (!raw) return [];

  const results: DevToolResult[] = [];
  const encoded = attempt(() => btoa(raw));
  if (encoded !== null) {
    results.push({ id: "base64-encode", title: encoded, subtitle: `Encoded: "${raw}"`, valueToCopy: encoded });
  }
  const decoded = attempt(() => atob(raw));
  if (decoded !== null) {
    results.push({ id: "base64-decode", title: decoded, subtitle: "Decoded from Base64", valueToCopy: decoded });
  }
  return results;
};

const DEV_TOOLS: DevTool[] = [uuidTool, timestampTool, base64Tool];

export function evaluateDevTools(term: string): DevToolResult[] {
  const lower = term.toLowerCase();
  return DEV_TOOLS.flatMap((tool) => tool(term, lower));
}
