const UNITS: { value: number; suffix: string }[] = [
  { value: 1_000_000_000, suffix: "B" },
  { value: 1_000_000, suffix: "M" },
  { value: 1_000, suffix: "K" },
];

/**
 * Compact count formatter matching the target site's stat pills.
 * 950 → "950", 1200 → "1.2K", 15300 → "15K", 1500000 → "1.5M".
 * One decimal below 10 units, none from 10 up.
 */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  for (let i = 0; i < UNITS.length; i++) {
    const { value, suffix } = UNITS[i];
    if (abs < value) continue;

    const quotient = abs / value;
    if (quotient < 10) {
      const rounded = Math.round(quotient * 10) / 10;
      // 9.96 → 10.0 → promote to the integer form, never "10.0K"
      const text = rounded >= 10 ? "10" : rounded.toFixed(1).replace(/\.0$/, "");
      return `${sign}${text}${suffix}`;
    }

    const rounded = Math.round(quotient);
    // 999.6K rounds to 1000K → promote to the next unit when one exists
    if (rounded >= 1000 && i > 0) {
      const bigger = UNITS[i - 1];
      return `${sign}1${bigger.suffix}`;
    }
    return `${sign}${rounded}${suffix}`;
  }

  return `${sign}${Math.round(abs)}`;
}

/** Same as `formatCount` but with a lowercase "k" (site shows "364k" / "1.5M"). */
export function formatCountLower(n: number): string {
  return formatCount(n).replace("K", "k");
}
