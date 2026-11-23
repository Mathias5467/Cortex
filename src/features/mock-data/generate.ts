import { randomBetween, randomItem, randomString, DIGITS } from "@/core/random";
import { stripAccents } from "@/core/fuzzy";

const FIRST_NAMES = [
  "Adam", "Anna", "Boris", "Clara", "Daniel", "Ema", "Filip", "Grace", "Hugo", "Ivana",
  "Jakub", "Kira", "Lukas", "Maya", "Noah", "Olivia", "Peter", "Rosa", "Simon", "Zuzana",
];
const LAST_NAMES = [
  "Adams", "Baker", "Carter", "Dvorak", "Evans", "Fischer", "Garcia", "Horvath", "Ivanov", "Jensen",
  "Kovac", "Larsen", "Miller", "Novak", "Olsen", "Parker", "Rossi", "Silva", "Turner", "Weber",
];
const STREETS = ["Oak Street", "Maple Avenue", "River Road", "Station Lane", "Park Boulevard", "Hill Street"];
const CITIES = ["Bratislava", "Vienna", "Prague", "Berlin", "Dublin", "Lisbon", "Oslo", "Madrid"];
const COMPANY_PREFIXES = ["Blue", "North", "Bright", "Iron", "Silver", "Green", "Nova", "Swift"];
const COMPANY_SUFFIXES = ["Labs", "Systems", "Works", "Studio", "Logistics", "Dynamics", "Partners", "Software"];
const LOREM_WORDS = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore " +
  "magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo " +
  "consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint " +
  "occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum"
).split(" ");

export type MockValue = string | number | boolean;
export type MockRecord = Record<string, MockValue>;

function repeat<T>(count: number, create: (index: number) => T): T[] {
  return Array.from({ length: count }, (_, index) => create(index));
}

function fullName() {
  return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
}

function emailFor(name: string) {
  return `${stripAccents(name).toLowerCase().replace(/\s+/g, ".")}${randomBetween(1, 99)}@example.com`;
}

function phone() {
  return `+1 555 01${randomString(DIGITS, 2)}`;
}

function address() {
  return `${randomBetween(1, 250)} ${randomItem(STREETS)}, ${randomItem(CITIES)}`;
}

function company() {
  return `${randomItem(COMPANY_PREFIXES)} ${randomItem(COMPANY_SUFFIXES)}`;
}

function isoDate() {
  const start = Date.UTC(2015, 0, 1);
  return new Date(start + randomBetween(0, 4000) * 86_400_000).toISOString().slice(0, 10);
}

export const MOCK_TYPES: Record<string, { label: string; create: () => MockValue }> = {
  name: { label: "Full name", create: fullName },
  email: { label: "Email", create: () => emailFor(fullName()) },
  phone: { label: "Phone", create: phone },
  address: { label: "Address", create: address },
  company: { label: "Company", create: company },
  date: { label: "Date", create: isoDate },
  number: { label: "Number", create: () => randomBetween(1, 10_000) },
  uuid: { label: "UUID", create: () => crypto.randomUUID() },
};

export function createValues(type: string, count: number): string {
  return repeat(count, () => MOCK_TYPES[type].create()).join("\n");
}

export function createUsers(count: number): MockRecord[] {
  return repeat(count, (index) => {
    const name = fullName();
    return {
      id: index + 1,
      name,
      email: emailFor(name),
      phone: phone(),
      company: company(),
      address: address(),
      active: randomBetween(0, 1) === 1,
      created_at: isoDate(),
    };
  });
}

export function toJson(records: MockRecord[]): string {
  return JSON.stringify(records.length === 1 ? records[0] : records, null, 2);
}

export function toCsv(records: MockRecord[]): string {
  const cell = (value: MockValue) => (/[",\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : value);
  return [Object.keys(records[0]), ...records.map(Object.values)].map((row) => row.map(cell).join(",")).join("\n");
}

export function toSql(records: MockRecord[]): string {
  const literal = (value: MockValue) => (typeof value === "string" ? `'${value.replace(/'/g, "''")}'` : String(value));
  const rows = records.map((record) => `  (${Object.values(record).map(literal).join(", ")})`);
  return `INSERT INTO users (${Object.keys(records[0]).join(", ")}) VALUES\n${rows.join(",\n")};`;
}

export function loremWords(count: number): string {
  return repeat(count, (index) => (index < 8 ? LOREM_WORDS[index] : randomItem(LOREM_WORDS))).join(" ");
}

function sentence(words: string): string {
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}.`;
}

export function loremSentences(count: number): string {
  return repeat(count, (index) =>
    sentence(
      index === 0
        ? loremWords(randomBetween(8, 14))
        : repeat(randomBetween(6, 14), () => randomItem(LOREM_WORDS)).join(" "),
    ),
  ).join(" ");
}

export function loremParagraphs(count: number): string {
  return repeat(count, (index) => {
    const opening = index === 0 ? loremSentences(1) : "";
    const rest = repeat(randomBetween(3, 5), () =>
      sentence(repeat(randomBetween(6, 14), () => randomItem(LOREM_WORDS)).join(" ")),
    ).join(" ");
    return `${opening} ${rest}`.trim();
  }).join("\n\n");
}
