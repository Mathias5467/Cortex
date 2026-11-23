import { DIGITS, LOWER, SYMBOLS, UPPER, randomPassword } from "@/core/random";

export function generateStrongPassword(length = 20): string {
  return randomPassword(length, [LOWER, UPPER, DIGITS, SYMBOLS]);
}
