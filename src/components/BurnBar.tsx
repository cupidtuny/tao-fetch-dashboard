/**
 * Incentive-burn progress bar. `value` is a fraction 0–1 (e.g. 0.89 = 89%).
 * Subnets at 100% are filtered out upstream, so this only renders < 100%.
 */
export function BurnBar({ value }: { value: number | null }) {
  if (value == null || !isFinite(value)) {
    return <span className="text-neutral-600">—</span>;
  }
  const pct = Math.max(0, Math.min(1, value)) * 100;
  // Higher burn = more of the miner incentive is destroyed -> warmer color.
  const color = pct >= 66 ? "bg-red-500" : pct >= 33 ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right font-mono text-xs text-neutral-400">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
