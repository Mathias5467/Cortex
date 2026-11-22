const FALLBACK_WORDS = [
  "const", "function", "return", "import", "export", "async", "await",
  "promise", "memory", "thread", "render", "state", "effect", "window",
  "system", "binary", "source", "module", "string", "number", "object",
  "cursor", "screen", "button", "layout", "search", "engine", "result",
  "native", "launch", "command", "desktop", "target", "device", "syntax",
  "simple", "future", "bridge", "client", "server", "action", "vector",
];

export async function fetchWords(count: number): Promise<string[]> {
  try {
    const res = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((word: string) => word.toLowerCase());
      }
    }
  } catch {}
  return [...FALLBACK_WORDS].sort(() => Math.random() - 0.5).slice(0, count);
}
