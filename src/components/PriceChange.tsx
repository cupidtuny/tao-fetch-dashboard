import { percent, sign } from "@/lib/format";

/** Colored percentage-change cell. */
export function PriceChange({ value }: { value: string | null }) {
  const s = sign(value);
  const color =
    s > 0 ? "text-green-400" : s < 0 ? "text-red-400" : "text-neutral-500";
  return <span className={color}>{percent(value)}</span>;
}
