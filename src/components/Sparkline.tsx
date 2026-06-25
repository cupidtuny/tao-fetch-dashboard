"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { PricePoint } from "@/lib/taostats";

/** A tiny 7-day price sparkline. Green if the period closed up, red if down. */
export function Sparkline({ points }: { points: PricePoint[] | null }) {
  if (!points || points.length < 2) {
    return <div className="h-8 w-24 text-neutral-600">—</div>;
  }

  const data = points.map((p) => ({ price: Number(p.price) }));
  const up = data[data.length - 1].price >= data[0].price;
  const color = up ? "#22c55e" : "#ef4444";
  const id = `spark-${color}`;

  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
