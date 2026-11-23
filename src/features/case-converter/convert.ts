import { stripAccents } from "@/core/fuzzy";

interface CaseStyle {
  id: string;
  label: string;
  format: (line: string) => string;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function splitWords(text: string): string[] {
  return stripAccents(text)
    .replace(/(\p{Ll}|\d)(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function joined(separator: string, transform: (word: string, index: number) => string) {
  return (line: string) => splitWords(line).map(transform).join(separator);
}

const lower = (word: string) => word.toLowerCase();
const upper = (word: string) => word.toUpperCase();

const CASE_STYLES: CaseStyle[] = [
  { id: "camel", label: "camelCase", format: joined("", (word, i) => (i === 0 ? lower(word) : capitalize(word))) },
  { id: "pascal", label: "PascalCase", format: joined("", capitalize) },
  { id: "snake", label: "snake_case", format: joined("_", lower) },
  { id: "constant", label: "CONSTANT_CASE", format: joined("_", upper) },
  { id: "kebab", label: "kebab-case", format: joined("-", lower) },
  { id: "train", label: "Train-Case", format: joined("-", capitalize) },
  { id: "dot", label: "dot.case", format: joined(".", lower) },
  { id: "path", label: "path/case", format: joined("/", lower) },
  { id: "title", label: "Title Case", format: (line) => line.replace(/[\p{L}\p{N}]+/gu, capitalize) },
  { id: "sentence", label: "Sentence case", format: (line) => capitalize(line.trim()) },
  { id: "lower", label: "lower case", format: lower },
  { id: "upper", label: "UPPER CASE", format: upper },
];

export function convertCases(text: string) {
  return CASE_STYLES.map(({ id, label, format }) => ({
    id,
    label,
    value: text.split(/\r?\n/).map(format).join("\n"),
  })).filter(({ value }) => value !== "");
}
