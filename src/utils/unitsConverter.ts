export interface UnitConversionResult {
  fromValue: number;
  fromUnit: string;
  toValue: number;
  toUnit: string;
  formattedResult: string;
}

const LENGTH_TO_METERS: Record<string, number> = {
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
};

const WEIGHT_TO_GRAMS: Record<string, number> = {
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
};

const STORAGE_TO_BYTES: Record<string, number> = {
  b: 1,
  byte: 1,
  bytes: 1,
  kb: 1024,
  mb: 1024 ** 2,
  gb: 1024 ** 3,
  tb: 1024 ** 4,
};

const CSS_TO_PX: Record<string, number> = {
  px: 1,
  rem: 16,
  em: 16,
  pt: 1.333333,
};

const SPEED_TO_KMH: Record<string, number> = {
  "km/h": 1,
  kmh: 1,
  mph: 1.60934,
  "m/s": 3.6,
  ms: 3.6,
  knot: 1.852,
  knots: 1.852,
};

export function convertUnits(input: string): UnitConversionResult | null {
  const trimmed = input.trim().toLowerCase();

  const match = trimmed.match(
    /^([\d.,]+)\s*([a-zA-Z°\/]+)\s+(?:to|in|into|=)\s+([a-zA-Z°\/]+)$/
  );

  if (!match) return null;

  const rawVal = parseFloat(match[1].replace(/,/g, "."));
  if (isNaN(rawVal)) return null;

  const fromUnit = match[2].replace("°", "");
  const toUnit = match[3].replace("°", "");

  if (["c", "f", "k", "celsius", "fahrenheit", "kelvin"].includes(fromUnit) &&
      ["c", "f", "k", "celsius", "fahrenheit", "kelvin"].includes(toUnit)) {
    
    let celsius = rawVal;
    if (fromUnit.startsWith("f")) celsius = (rawVal - 32) * (5 / 9);
    else if (fromUnit.startsWith("k")) celsius = rawVal - 273.15;

    let target = celsius;
    let symbol = "°C";
    if (toUnit.startsWith("f")) {
      target = celsius * (9 / 5) + 32;
      symbol = "°F";
    } else if (toUnit.startsWith("k")) {
      target = celsius + 273.15;
      symbol = "K";
    }

    const rounded = Math.round(target * 1000) / 1000;
    return {
      fromValue: rawVal,
      fromUnit: match[2].toUpperCase(),
      toValue: rounded,
      toUnit: symbol,
      formattedResult: `${rounded.toLocaleString()} ${symbol}`,
    };
  }

  if (LENGTH_TO_METERS[fromUnit] && LENGTH_TO_METERS[toUnit]) {
    const meters = rawVal * LENGTH_TO_METERS[fromUnit];
    const target = meters / LENGTH_TO_METERS[toUnit];
    const rounded = Math.round(target * 10000) / 10000;
    return {
      fromValue: rawVal,
      fromUnit,
      toValue: rounded,
      toUnit,
      formattedResult: `${rounded.toLocaleString()} ${toUnit}`,
    };
  }

  if (WEIGHT_TO_GRAMS[fromUnit] && WEIGHT_TO_GRAMS[toUnit]) {
    const grams = rawVal * WEIGHT_TO_GRAMS[fromUnit];
    const target = grams / WEIGHT_TO_GRAMS[toUnit];
    const rounded = Math.round(target * 10000) / 10000;
    return {
      fromValue: rawVal,
      fromUnit,
      toValue: rounded,
      toUnit,
      formattedResult: `${rounded.toLocaleString()} ${toUnit}`,
    };
  }

  if (STORAGE_TO_BYTES[fromUnit] && STORAGE_TO_BYTES[toUnit]) {
    const bytes = rawVal * STORAGE_TO_BYTES[fromUnit];
    const target = bytes / STORAGE_TO_BYTES[toUnit];
    const rounded = Math.round(target * 10000) / 10000;
    return {
      fromValue: rawVal,
      fromUnit: fromUnit.toUpperCase(),
      toValue: rounded,
      toUnit: toUnit.toUpperCase(),
      formattedResult: `${rounded.toLocaleString()} ${toUnit.toUpperCase()}`,
    };
  }

  if (CSS_TO_PX[fromUnit] && CSS_TO_PX[toUnit]) {
    const px = rawVal * CSS_TO_PX[fromUnit];
    const target = px / CSS_TO_PX[toUnit];
    const rounded = Math.round(target * 1000) / 1000;
    return {
      fromValue: rawVal,
      fromUnit,
      toValue: rounded,
      toUnit,
      formattedResult: `${rounded} ${toUnit}`,
    };
  }

  if (SPEED_TO_KMH[fromUnit] && SPEED_TO_KMH[toUnit]) {
    const kmh = rawVal * SPEED_TO_KMH[fromUnit];
    const target = kmh / SPEED_TO_KMH[toUnit];
    const rounded = Math.round(target * 1000) / 1000;
    return {
      fromValue: rawVal,
      fromUnit,
      toValue: rounded,
      toUnit,
      formattedResult: `${rounded.toLocaleString()} ${toUnit}`,
    };
  }

  return null;
}