export interface CalcResult {
  expression: string;
  result: string;
  rawNumber: number;
}

export function evaluateMath(input: string): CalcResult | null {
  const trimmed = input.trim();

  if (!/[\+\-\*\/\%]/.test(trimmed)) {
    return null;
  }

  const sanitized = trimmed.replace(/,/g, ".");
  if (!/^[\d\s\+\-\*\/\%\(\)\.]+$/.test(sanitized)) {
    return null;
  }

  if (/[\+\-\*\/\%]$/.test(sanitized.trim())) {
    return null;
  }

  try {
    const fn = new Function(`return (${sanitized});`);
    const val = fn();

    if (typeof val === "number" && !isNaN(val) && isFinite(val)) {
      const rounded = Math.round(val * 1e10) / 1e10;
      return {
        expression: trimmed,
        result: rounded.toLocaleString("en-US", { maximumFractionDigits: 6 }),
        rawNumber: rounded,
      };
    }
  } catch {
    return null;
  }

  return null;
}