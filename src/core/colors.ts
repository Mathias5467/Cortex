export const PALETTE = {
  coral: "var(--color-accent)",
  orange: "#fb923c",
  amber: "#fbbf24",
  yellow: "#fde047",
  lime: "#a3e635",
  green: "#34d399",
  teal: "#2dd4bf",
  sky: "#38bdf8",
  blue: "#60a5fa",
  indigo: "#818cf8",
  violet: "#a78bfa",
  pink: "#f472b6",
  cyan: "#22d3ee",
  fuchsia: "#e879f9",
  purple: "#9f7aea",
  bronze: "#d4a373",
  emerald: "#10b981",
  gray: "#a1a1aa",
} as const;

export type PaletteColor = keyof typeof PALETTE;
export type IconColor = PaletteColor | `#${string}`;

interface Category {
  label: string;
  color: IconColor;
}

function defineCategories<T extends Record<string, Category>>(categories: T): { [K in keyof T]: Category } {
  return categories;
}

export const CATEGORIES = defineCategories({
  system: { label: "System", color: "orange" },
  window: { label: "Window Management", color: "blue" },
  clipboard: { label: "Clipboard", color: "amber" },
  tools: { label: "Tools", color: "pink" },
  practice: { label: "Practice", color: "violet" },
  workspace: { label: "Workspaces", color: "teal" },
  security: { label: "Security", color: "green" },
  calculator: { label: "Calculator", color: "lime" },
  units: { label: "Unit Conversion", color: "coral" },
  developer: { label: "Developer Tools", color: "indigo" },
  web: { label: "Web Search", color: "sky" },
  text: { label: "Text Tools", color: "fuchsia" },
  environment: { label: "Environment", color: "purple" },
  containers: { label: "Containers", color: "cyan" },
  network: { label: "Network", color: "bronze" },
  media: { label: "Media", color: "emerald" },
  folder: { label: "Folders", color: "yellow" },
  file: { label: "Files", color: "gray" },
});

export type CategoryId = keyof typeof CATEGORIES;

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function isPaletteColor(value: string): value is PaletteColor {
  return Object.prototype.hasOwnProperty.call(PALETTE, value);
}

function isHexColor(value: string): value is `#${string}` {
  return HEX_PATTERN.test(value);
}

export function parseIconColor(value: string | undefined): IconColor | undefined {
  if (value && (isPaletteColor(value) || isHexColor(value))) return value;
  return undefined;
}

export function toCssColor(color: IconColor): string {
  return isPaletteColor(color) ? PALETTE[color] : color;
}
