export interface UnitConversionResult {
  fromValue: number;
  fromUnit: string;
  toValue: number;
  toUnit: string;
  formattedResult: string;
}

interface UnitGroup {
  precision: number;
  units: Record<string, number>;
  formatUnit?: (unit: string) => string;
  formatValue?: (value: number) => string;
}

const UNIT_GROUPS: UnitGroup[] = [
  {
    precision: 10000,
    units: {
      mm: 0.001,
      cm: 0.01,
      m: 1,
      km: 1000,
      in: 0.0254,
      inch: 0.0254,
      inches: 0.0254,
      ft: 0.3048,
      feet: 0.3048,
      foot: 0.3048,
      yd: 0.9144,
      yard: 0.9144,
      yards: 0.9144,
      mi: 1609.344,
      mile: 1609.344,
      miles: 1609.344,
    },
  },
  {
    precision: 10000,
    units: {
      mg: 0.001,
      g: 1,
      kg: 1000,
      oz: 28.3495,
      ounce: 28.3495,
      ounces: 28.3495,
      lb: 453.592,
      lbs: 453.592,
      pound: 453.592,
      pounds: 453.592,
      ton: 1_000_000,
      tonne: 1_000_000,
    },
  },
  {
    precision: 10000,
    formatUnit: (unit) => unit.toUpperCase(),
    units: {
      b: 1,
      byte: 1,
      bytes: 1,
      kb: 1024,
      mb: 1024 ** 2,
      gb: 1024 ** 3,
      tb: 1024 ** 4,
    },
  },
  {
    precision: 1000,
    formatValue: (value) => value.toString(),
    units: {
      px: 1,
      rem: 16,
      em: 16,
      pt: 1.333333,
    },
  },
  {
    precision: 1000,
    units: {
      "km/h": 1,
      kmh: 1,
      mph: 1.60934,
      "m/s": 3.6,
      ms: 3.6,
      knot: 1.852,
      knots: 1.852,
    },
  },
];

interface TemperatureUnit {
  symbol: string;
  toCelsius: (value: number) => number;
  fromCelsius: (value: number) => number;
}

const CELSIUS: TemperatureUnit = { symbol: "°C", toCelsius: (v) => v, fromCelsius: (v) => v };
const FAHRENHEIT: TemperatureUnit = {
  symbol: "°F",
  toCelsius: (v) => (v - 32) * (5 / 9),
  fromCelsius: (v) => v * (9 / 5) + 32,
};
const KELVIN: TemperatureUnit = {
  symbol: "K",
  toCelsius: (v) => v - 273.15,
  fromCelsius: (v) => v + 273.15,
};

const TEMPERATURE_UNITS = new Map<string, TemperatureUnit>([
  ["c", CELSIUS],
  ["celsius", CELSIUS],
  ["f", FAHRENHEIT],
  ["fahrenheit", FAHRENHEIT],
  ["k", KELVIN],
  ["kelvin", KELVIN],
]);

const QUERY_PATTERN = /^([\d.,]+)\s*([a-zA-Z°/]+)\s+(?:to|in|into|=)\s+([a-zA-Z°/]+)$/;

function hasUnit(units: Record<string, number>, unit: string) {
  return typeof units[unit] === "number";
}

function round(value: number, precision: number) {
  return Math.round(value * precision) / precision;
}

export function convertUnits(input: string): UnitConversionResult | null {
  const match = input.trim().toLowerCase().match(QUERY_PATTERN);
  if (!match) return null;

  const fromValue = parseFloat(match[1].replace(/,/g, "."));
  if (isNaN(fromValue)) return null;

  const fromUnit = match[2].replace("°", "");
  const toUnit = match[3].replace("°", "");

  const fromTemperature = TEMPERATURE_UNITS.get(fromUnit);
  const toTemperature = TEMPERATURE_UNITS.get(toUnit);
  if (fromTemperature && toTemperature) {
    const toValue = round(toTemperature.fromCelsius(fromTemperature.toCelsius(fromValue)), 1000);
    return {
      fromValue,
      fromUnit: match[2].toUpperCase(),
      toValue,
      toUnit: toTemperature.symbol,
      formattedResult: `${toValue.toLocaleString()} ${toTemperature.symbol}`,
    };
  }

  const group = UNIT_GROUPS.find(({ units }) => hasUnit(units, fromUnit) && hasUnit(units, toUnit));
  if (!group) return null;

  const formatUnit = group.formatUnit ?? ((unit) => unit);
  const formatValue = group.formatValue ?? ((value) => value.toLocaleString());
  const toValue = round((fromValue * group.units[fromUnit]) / group.units[toUnit], group.precision);

  return {
    fromValue,
    fromUnit: formatUnit(fromUnit),
    toValue,
    toUnit: formatUnit(toUnit),
    formattedResult: `${formatValue(toValue)} ${formatUnit(toUnit)}`,
  };
}
