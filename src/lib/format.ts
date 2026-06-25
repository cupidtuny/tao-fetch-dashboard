/** Formatting helpers for TAO / RAO values and dashboard numbers. */

const RAO_PER_TAO = 1e9;

/** Convert an integer RAO string to a TAO number. */
export function raoToTao(rao: string | number | null | undefined): number {
  if (rao == null) return 0;
  return Number(rao) / RAO_PER_TAO;
}

/** Compact number, e.g. 1.2M, 3.4K, 12.3B. */
export function compact(n: number, digits = 2): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(digits)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(digits)}K`;
  return n.toFixed(digits);
}

/** Format a TAO amount with the τ symbol, compacted for large values. */
export function tao(n: number, opts: { compact?: boolean; digits?: number } = {}): string {
  if (!isFinite(n)) return "—";
  if (opts.compact) return `τ${compact(n, opts.digits ?? 2)}`;
  return `τ${n.toLocaleString("en-US", {
    minimumFractionDigits: opts.digits ?? 2,
    maximumFractionDigits: opts.digits ?? 2,
  })}`;
}

/** Format a USD amount, e.g. $218.83. */
export function usd(n: string | number | null | undefined, digits = 2): string {
  if (n == null) return "—";
  const v = Number(n);
  if (!isFinite(v)) return "—";
  return `$${v.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/** Format an alpha-token price in TAO with adaptive precision for tiny values. */
export function price(p: string | number | null | undefined): string {
  if (p == null) return "—";
  const n = Number(p);
  if (!isFinite(n)) return "—";
  const digits = n < 0.01 ? 6 : n < 1 ? 4 : 3;
  return `τ${n.toFixed(digits)}`;
}

/** Format an already-percentage change string (e.g. "4.23" -> "+4.23%"). */
export function percent(p: string | number | null | undefined): string {
  if (p == null) return "—";
  const n = Number(p);
  if (!isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

/** Sign of a numeric-ish value: 1, -1, or 0. Used for coloring. */
export function sign(p: string | number | null | undefined): number {
  if (p == null) return 0;
  const n = Number(p);
  if (!isFinite(n) || n === 0) return 0;
  return n > 0 ? 1 : -1;
}
