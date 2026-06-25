"use client";

import { Fragment, useMemo, useState } from "react";
import type { SubnetIdentity, SubnetPool } from "@/lib/taostats";
import { price, raoToTao } from "@/lib/format";
import { usePersistentSet } from "@/lib/usePersistentSet";
import { BurnBar } from "./BurnBar";
import { EmissionBar } from "./EmissionBar";
import { PriceChange } from "./PriceChange";
import { Sparkline } from "./Sparkline";
import { SubnetDetail } from "./SubnetDetail";

/** A pool row enriched with burn, emission share (0–1), miners, fee, identity. */
export type SubnetRow = SubnetPool & {
  incentive_burn: number | null;
  emission_share: number | null;
  active_miners: number | null;
  neuron_registration_cost: string | null;
  identity: SubnetIdentity | null;
};

type SortKey =
  | "rank"
  | "name"
  | "price"
  | "price_change_1_day"
  | "price_change_1_week"
  | "incentive_burn"
  | "emission_share"
  | "active_miners"
  | "neuron_registration_cost";

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
  { key: "incentive_burn", label: "Incentive Burn", align: "right", width: "w-36" },
  { key: "emission_share", label: "Emission", align: "right", width: "w-36" },
  { key: "active_miners", label: "Miners", align: "right", width: "w-20" },
  { key: "neuron_registration_cost", label: "Reg Fee", align: "right", width: "w-28" },
];

function valueOf(p: SubnetRow, key: SortKey): number | string {
  switch (key) {
    case "name":
      return (p.name ?? `Subnet ${p.netuid}`).toLowerCase();
    case "rank":
      return p.rank ?? Number.MAX_SAFE_INTEGER;
    case "incentive_burn":
      return p.incentive_burn ?? -1;
    case "emission_share":
      return p.emission_share ?? -1;
    case "active_miners":
      return p.active_miners ?? -1;
    case "neuron_registration_cost":
      return Number(p.neuron_registration_cost ?? -1);
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
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const favorites = usePersistentSet("tao-dashboard:favorites");
  const hidden = usePersistentSet("tao-dashboard:hidden");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = pools.filter((p) => {
      const isHidden = hidden.has(p.netuid);
      if (isHidden && !showHidden) return false;
      if (favoritesOnly && !favorites.has(p.netuid)) return false;
      if (q) {
        return (
          (p.name ?? "").toLowerCase().includes(q) ||
          (p.symbol ?? "").toLowerCase().includes(q) ||
          String(p.netuid) === q
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const va = valueOf(a, sortKey);
      const vb = valueOf(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return asc ? cmp : -cmp;
    });
    // favorites.set / hidden.set change identity when toggled, re-filtering.
  }, [pools, sortKey, asc, query, favoritesOnly, showHidden, favorites, hidden]);

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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, symbol or netuid…"
          className="w-72 max-w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-neutral-600"
        />

        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          aria-pressed={favoritesOnly}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            favoritesOnly
              ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
              : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600"
          }`}
        >
          ★ Favorites{favorites.set.size > 0 ? ` (${favorites.set.size})` : ""}
        </button>

        {hidden.set.size > 0 && (
          <button
            onClick={() => setShowHidden((v) => !v)}
            aria-pressed={showHidden}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              showHidden
                ? "border-neutral-600 bg-neutral-800 text-neutral-200"
                : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600"
            }`}
          >
            {showHidden ? "Hide hidden" : "Show hidden"} ({hidden.set.size})
          </button>
        )}

        <span className="ml-auto text-sm text-neutral-500">
          {rows.length} subnets
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[1080px] table-fixed border-collapse text-sm">
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
              const isFav = favorites.has(p.netuid);
              const isHidden = hidden.has(p.netuid);
              return (
                <Fragment key={p.netuid}>
                  <tr
                    onClick={() => setExpanded(open ? null : p.netuid)}
                    aria-expanded={open}
                    className={`cursor-pointer border-b border-neutral-900 transition-colors last:border-0 ${
                      open ? "bg-neutral-900/40" : "hover:bg-neutral-900/40"
                    } ${isHidden ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3 text-neutral-500">{p.rank ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            favorites.toggle(p.netuid);
                          }}
                          aria-label={isFav ? "Unfavorite" : "Favorite"}
                          aria-pressed={isFav}
                          className={`shrink-0 text-base leading-none transition-colors ${
                            isFav
                              ? "text-amber-400"
                              : "text-neutral-600 hover:text-neutral-300"
                          }`}
                        >
                          {isFav ? "★" : "☆"}
                        </button>
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
                      <div className="ml-9 text-xs text-neutral-600">
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
                      <EmissionBar share={p.emission_share} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-200">
                      {p.active_miners ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-200">
                      {p.neuron_registration_cost != null
                        ? price(raoToTao(p.neuron_registration_cost))
                        : "—"}
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
                        <SubnetDetail
                          identity={p.identity}
                          pool={p}
                          hidden={isHidden}
                          onToggleHide={() => hidden.toggle(p.netuid)}
                        />
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
