
export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();

  if (!q) return 1;

  if (q === t) return 1000;

  if (t.startsWith(q)) {
    return 500 - (t.length - q.length);
  }

  const words = target.split(/[\s\-_\.]+/).filter(Boolean);
  const acronym = words.map((w) => w[0]?.toLowerCase() || "").join("");
  if (acronym.startsWith(q)) return 400;
  if (acronym.includes(q)) return 300;

  const subIdx = t.indexOf(q);
  if (subIdx !== -1) {
    const isWordStart = subIdx === 0 || /[\s\-_\.]/.test(t[subIdx - 1]);
    return isWordStart ? 250 : 150;
  }

  let qIdx = 0;
  let score = 0;
  let prevMatchIdx = -1;

  for (let tIdx = 0; tIdx < t.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      if (prevMatchIdx !== -1 && tIdx === prevMatchIdx + 1) {
        score += 20;
      } else {
        score += 5;
      }

      if (tIdx === 0 || /[\s\-_\.]/.test(t[tIdx - 1])) {
        score += 15;
      }

      prevMatchIdx = tIdx;
      qIdx++;

      if (qIdx === q.length) break;
    }
  }

  if (qIdx === q.length) {
    return score;
  }

  return 0;
}

export function calculateFrecency(launchCount: number, lastLaunchedSeconds: number): number {
  if (!launchCount || !lastLaunchedSeconds) return 0;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ageSeconds = Math.max(0, nowSeconds - lastLaunchedSeconds);

  let recencyMultiplier = 10;
  if (ageSeconds < 4 * 3600) {
    recencyMultiplier = 100;
  } else if (ageSeconds < 24 * 3600) {
    recencyMultiplier = 80;
  } else if (ageSeconds < 3 * 86400) {
    recencyMultiplier = 60;
  } else if (ageSeconds < 7 * 86400) {
    recencyMultiplier = 40;
  } else if (ageSeconds < 30 * 86400) {
    recencyMultiplier = 20;
  }

  return launchCount * recencyMultiplier;
}