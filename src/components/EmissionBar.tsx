/**
 * Emission-share progress bar. `share` is a fraction 0–1 of total network
 * emission (e.g. 0.104 = 10.4% of all subnet emissions).
 */
export function EmissionBar({ share }: { share: number | null }) {
  if (share == null || !isFinite(share)) {
    return <span className="text-neutral-600">—</span>;
  }
  const pct = Math.max(0, Math.min(1, share)) * 100;

  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-800">
        <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right font-mono text-xs text-neutral-400">
        {pct.toFixed(2)}%
      </span>
    </div>
  );
}
