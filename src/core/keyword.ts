import type { Query } from "./types";

export interface KeywordMatch<K extends string> {
  keyword: K;
  args: string;
}

export function matchKeyword<K extends string>(query: Query, keywords: readonly K[]): KeywordMatch<K> | null {
  const [head] = query.lower.split(/\s/, 1);
  const keyword = keywords.find((candidate) => candidate === head);
  return keyword ? { keyword, args: query.term.slice(keyword.length).trim() } : null;
}

export function parseCount(args: string, fallback: number, min: number, max: number): number {
  const value = parseInt(args, 10);
  if (isNaN(value)) return fallback;
  return Math.max(min, Math.min(value, max));
}
