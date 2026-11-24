/** "$1.25"; amounts under a cent keep up to four decimals so they don't read as "$0.00". */
export function formatUsd(value: number): string {
  const digits = value !== 0 && Math.abs(value) < 0.01 ? 4 : 2;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits })}`;
}

/** "$0.29 / 1M tokens" style price for a USD-per-million-tokens rate. */
export function formatPerMillion(usdPerMillion: number): string {
  return `${formatUsd(usdPerMillion)} / 1M tokens`;
}

/** "$0.045 / image" (keeps three decimals for typical image prices). */
export function formatPerImage(usd: number): string {
  const digits = usd !== 0 && Math.abs(usd) < 0.01 ? 4 : 3;
  return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits })} / image`;
}
