/**
 * Compact count formatter matching the target's stat labels
 * (e.g. 616, 4.0K, 14K, 112K, 1.5M).
 */
export function formatCount(value: number): string {
  if (value < 1_000) return String(value);
  if (value < 10_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value < 1_000_000) return `${Math.round(value / 1_000)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}
