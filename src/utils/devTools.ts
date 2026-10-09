export interface DevToolResult {
  id: string;
  title: string;
  subtitle: string;
  valueToCopy: string;
  badge: string;
}

export function evaluateDevTools(input: string): DevToolResult[] {
  const term = input.trim();
  const lower = term.toLowerCase();
  const results: DevToolResult[] = [];

  if (lower === "uuid" || lower === "guid") {
    const uuid = crypto.randomUUID();
    results.push({
      id: "dev-uuid",
      title: uuid,
      subtitle: "Random UUID v4 (Press Enter to copy)",
      valueToCopy: uuid,
      badge: "UUID",
    });
  }

  if (lower === "time" || lower === "now" || lower === "epoch" || lower === "date") {
    const now = Date.now();
    const sec = Math.floor(now / 1000);
    const iso = new Date().toISOString();
    results.push({
      id: "dev-timestamp-sec",
      title: `${sec}`,
      subtitle: `Unix Epoch (seconds) • ISO: ${iso}`,
      valueToCopy: `${sec}`,
      badge: "EPOCH",
    });
    results.push({
      id: "dev-timestamp-iso",
      title: iso,
      subtitle: "ISO 8601 UTC Date",
      valueToCopy: iso,
      badge: "DATE",
    });
  }

  if (lower.startsWith("b64 ") || lower.startsWith("base64 ")) {
    const raw = term.replace(/^(b64|base64)\s+/i, "");
    if (raw) {
      try {
        const encoded = btoa(raw);
        results.push({
          id: "dev-b64-encode",
          title: encoded,
          subtitle: `Encoded: "${raw}"`,
          valueToCopy: encoded,
          badge: "BASE64 ENCODE",
        });
      } catch {}

      try {
        const decoded = atob(raw);
        results.push({
          id: "dev-b64-decode",
          title: decoded,
          subtitle: `Decoded from Base64`,
          valueToCopy: decoded,
          badge: "BASE64 DECODE",
        });
      } catch {}
    }
  }

  return results;
}