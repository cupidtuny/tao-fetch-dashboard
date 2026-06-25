"use client";

import { Fragment, useMemo, useState } from "react";
import type { SubnetIdentity, SubnetPool } from "@/lib/taostats";
import { price } from "@/lib/format";
import { BurnBar } from "./BurnBar";
import { PriceChange } from "./PriceChange";
import { Sparkline } from "./Sparkline";
import { SubnetDetail } from "./SubnetDetail";

/** A pool row enriched with incentive_burn (0–1) and the subnet's identity. */
export type SubnetRow = SubnetPool & {
  incentive_burn: number | null;
  identity: SubnetIdentity | null;
};

type SortKey =
  | "rank"
  | "name"
  | "price"
  | "price_change_1_day"
  | "price_change_1_week"
  | "incentive_burn";

interface Column {
  key: SortKey;
  label: string;
  align: "left" | "right";
  /** Tailwind width class — fixed layout keeps the table from reflowing. */
  width: string;
}

const COLUMNS: Column[] = [
  { key: "rank", label: "#", align: "left", width: "w-12" },
  { key: "name", label: "Subnet", align: "left", width: "w-auto" },
  { key: "price", label: "Price", align: "right", width: "w-28" },
  { key: "price_change_1_day", label: "24h %", align: "right", width: "w-24" },
  { key: "price_change_1_week", label: "7d %", align: "right", width: "w-24" },
  { key: "incentive_burn", label: "Incentive Burn", align: "right", width: "w-44" },
];

function valueOf(p: SubnetRow, key: SortKey): number | string {
  switch (key) {
    case "name":
      return (p.name ?? `Subnet ${p.netuid}`).toLowerCase();
    case "rank":
      return p.rank ?? Number.MAX_SAFE_INTEGER;
    case "incentive_burn":
      return p.incentive_burn ?? -1;
    default:
      return Number(p[key] ?? 0);
  }
}

const TOTAL_COLS = COLUMNS.length + 1; // + the 7d sparkline column

export function SubnetTable({ pools }: { pools: SubnetRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [asc, setAsc] = useState(true);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? pools.filter(
          (p) =>
            (p.name ?? "").toLowerCase().includes(q) ||
            (p.symbol ?? "").toLowerCase().includes(q) ||
            String(p.netuid) === q,
        )
      : pools;

    return [...filtered].sort((a, b) => {
      const va = valueOf(a, sortKey);
      const vb = valueOf(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return asc ? cmp : -cmp;
    });
  }, [pools, sortKey, asc, query]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setAsc((v) => !v);
    } else {
      setSortKey(key);
      // Rank and name default ascending; everything else high→low.
      setAsc(key === "name" || key === "rank");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, symbol or netuid…"
          className="w-72 max-w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-neutral-600"
        />
        <span className="text-sm text-neutral-500">{rows.length} subnets</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60 text-neutral-400">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 font-medium hover:text-neutral-200 ${col.width} ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-neutral-500">{asc ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
              <th className="w-32 px-4 py-3 text-right font-medium">7d</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const open = expanded === p.netuid;
              return (
                <Fragment key={p.netuid}>
                  <tr
                    onClick={() => setExpanded(open ? null : p.netuid)}
                    aria-expanded={open}
                    className={`cursor-pointer border-b border-neutral-900 transition-colors last:border-0 ${
                      open ? "bg-neutral-900/40" : "hover:bg-neutral-900/40"
                    }`}
                  >
                    <td className="px-4 py-3 text-neutral-500">{p.rank ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`shrink-0 text-xs text-neutral-600 transition-transform ${
                            open ? "rotate-90 text-neutral-300" : ""
                          }`}
                        >
                          ▶
                        </span>
                        <span className="truncate font-medium text-neutral-100">
                          {p.name ?? `Subnet ${p.netuid}`}
                        </span>
                        <span className="shrink-0 text-neutral-500">
                          {p.symbol ?? `SN${p.netuid}`}
                        </span>
                      </div>
                      <div className="ml-5 text-xs text-neutral-600">
                        netuid {p.netuid}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-100">
                      {price(p.price)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <PriceChange value={p.price_change_1_day} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <PriceChange value={p.price_change_1_week} />
                    </td>
                    <td className="px-4 py-3">
                      <BurnBar value={p.incentive_burn} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Sparkline points={p.seven_day_prices} />
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-b border-neutral-900 bg-neutral-950/60">
                      <td colSpan={TOTAL_COLS} className="p-0">
                        <SubnetDetail identity={p.identity} pool={p} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={TOTAL_COLS}
                  className="px-4 py-10 text-center text-neutral-500"
                >
                  No subnets match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
