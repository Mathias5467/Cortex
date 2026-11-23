import { parseCount } from "@/core/keyword";
import { DIGITS, LOWER, SYMBOLS, UPPER, randomBytes, randomPassword, randomString } from "@/core/random";

export interface GeneratedSecret {
  id: string;
  label: string;
  value: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generatePasswords(args: string): GeneratedSecret[] {
  const length = parseCount(args, 20, 4, 128);
  return [
    {
      id: "strong",
      label: `Strong password • ${length} characters`,
      value: randomPassword(length, [LOWER, UPPER, DIGITS, SYMBOLS]),
    },
    {
      id: "alphanumeric",
      label: `Letters and digits • ${length} characters`,
      value: randomPassword(length, [LOWER, UPPER, DIGITS]),
    },
    { id: "pin", label: "PIN • 6 digits", value: randomString(DIGITS, 6) },
  ];
}

export function generateKeys(args: string): GeneratedSecret[] {
  const size = parseCount(args, 32, 8, 128);
  return [
    { id: "base64url", label: `Base64 URL • ${size} bytes`, value: toBase64Url(randomBytes(size)) },
    { id: "hex", label: `Hex • ${size} bytes`, value: toHex(randomBytes(size)) },
    {
      id: "api-key",
      label: `API key • ${size} characters`,
      value: `key_${randomPassword(size, [LOWER, UPPER, DIGITS])}`,
    },
    { id: "uuid", label: "UUID v4", value: crypto.randomUUID() },
  ];
}
