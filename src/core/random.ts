export const LOWER = "abcdefghijklmnopqrstuvwxyz";
export const UPPER = LOWER.toUpperCase();
export const DIGITS = "0123456789";
export const SYMBOLS = "!@#$%^&*()_+-=[]{}";

const UINT32_RANGE = 2 ** 32;

export function randomInt(max: number): number {
  const limit = UINT32_RANGE - (UINT32_RANGE % max);
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function randomBetween(min: number, max: number): number {
  return min + randomInt(max - min + 1);
}

export function randomItem<T>(items: readonly T[]): T {
  return items[randomInt(items.length)];
}

export function randomString(charset: string, length: number): string {
  return Array.from({ length }, () => charset[randomInt(charset.length)]).join("");
}

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function randomPassword(length: number, groups: readonly string[]): string {
  const charset = groups.join("");
  for (;;) {
    const password = randomString(charset, length);
    const isComplete = groups.every((group) => [...password].some((char) => group.includes(char)));
    if (isComplete || length < groups.length) return password;
  }
}
