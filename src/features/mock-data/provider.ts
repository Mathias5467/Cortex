import { useMemo, useState } from "react";
import { AlignLeft, Braces, RefreshCw, type LucideIcon } from "lucide-react";
import { createCopyItem } from "@/core/copyItem";
import { matchKeyword, parseCount } from "@/core/keyword";
import { useLauncher } from "@/core/launcher";
import type { ResultProvider, RunAction } from "@/core/types";
import {
  MOCK_TYPES,
  createUsers,
  createValues,
  loremParagraphs,
  loremSentences,
  loremWords,
  toCsv,
  toJson,
  toSql,
} from "./generate";

interface MockResult {
  id: string;
  label: string;
  value: string;
}

const MAX_COUNT = 200;

function parseMockArgs(args: string) {
  const parts = args.toLowerCase().split(/\s+/).filter(Boolean);
  const count = parts.find((part) => /^\d+$/.test(part));
  const type = parts.find((part) => !/^\d+$/.test(part)) ?? "";
  return { type: type.replace(/s$/, ""), count: parseCount(count ?? "", 1, 1, MAX_COUNT) };
}

function createLorem(args: string): MockResult[] {
  const count = parseCount(args, 1, 1, 50);
  const words = parseCount(args, 10, 1, 1000);
  return [
    { id: "paragraphs", label: `Paragraphs • ${count}`, value: loremParagraphs(count) },
    { id: "sentences", label: `Sentences • ${count}`, value: loremSentences(count) },
    { id: "words", label: `Words • ${words}`, value: loremWords(words) },
  ];
}

function createMock(args: string): MockResult[] {
  const { type, count } = parseMockArgs(args);
  const results: MockResult[] = [];

  if (["user", "json", "csv", "sql"].some((name) => name.startsWith(type))) {
    const users = createUsers(count);
    const formats: MockResult[] = [
      { id: "json", label: `Users as JSON • ${count}`, value: toJson(users) },
      { id: "csv", label: `Users as CSV • ${count}`, value: toCsv(users) },
      { id: "sql", label: `Users as SQL • ${count}`, value: toSql(users) },
    ];
    results.push(...formats.filter(({ id }) => "user".startsWith(type) || id.startsWith(type)));
  }

  for (const [id, { label }] of Object.entries(MOCK_TYPES)) {
    if (id.startsWith(type)) results.push({ id, label: `${label} • ${count}`, value: createValues(id, count) });
  }

  return results;
}

const SOURCES: Record<string, { section: string; icon: LucideIcon; create: (args: string) => MockResult[] }> = {
  lorem: { section: "Lorem Ipsum", icon: AlignLeft, create: createLorem },
  mock: { section: "Mock Data", icon: Braces, create: createMock },
};

const KEYWORDS = Object.keys(SOURCES);

export const mockDataProvider: ResultProvider = {
  id: "mock-data",
  hidesFallback: true,
  useItems: (query) => {
    const launcher = useLauncher();
    const [version, setVersion] = useState(0);
    const match = matchKeyword(query, KEYWORDS);
    const keyword = match?.keyword;
    const args = match?.args ?? "";

    return useMemo(() => {
      if (!keyword) return [];

      const { section, icon, create } = SOURCES[keyword];
      const regenerate: RunAction = {
        id: "regenerate",
        label: "Generate New Data",
        icon: RefreshCw,
        hotkey: { key: "r", ctrl: true },
        run: () => setVersion(version + 1),
      };

      return create(args).map(({ id, label, value }) =>
        createCopyItem(launcher, {
          id: `mock:${id}`,
          section,
          category: "text",
          icon,
          value,
          title: value.slice(0, 200).replace(/\s+/g, " "),
          subtitle: label,
          actions: [regenerate],
        }),
      );
    }, [keyword, args, version, launcher]);
  },
};
