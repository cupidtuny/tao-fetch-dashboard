import { PriceChange } from "@/components/PriceChange";
import { SubnetTable, type SubnetRow } from "@/components/SubnetTable";
import { usd } from "@/lib/format";
import {
  getSubnetIdentities,
  getSubnetPools,
  getSubnets,
  getTaoPrice,
  TaostatsError,
  type SubnetIdentity,
  type TaoPrice,
} from "@/lib/taostats";

export const revalidate = 60;

function num(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

function TaoPriceHeader({ price }: { price: TaoPrice }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/40 px-6 py-5">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          TAO Price
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-neutral-100">
            {usd(price.price)}
          </span>
          <span className="font-mono text-sm">
            <PriceChange value={price.percent_change_24h} />
          </span>
        </div>
      </div>
      <dl className="flex gap-6 text-sm">
        <div className="text-right">
          <dt className="text-xs text-neutral-500">1h</dt>
          <dd className="font-mono">
            <PriceChange value={price.percent_change_1h} />
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-neutral-500">24h</dt>
          <dd className="font-mono">
            <PriceChange value={price.percent_change_24h} />
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-neutral-500">7d</dt>
          <dd className="font-mono">
            <PriceChange value={price.percent_change_7d} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-5 py-4 text-sm text-red-200">
      <div className="font-semibold">Could not load data</div>
      <p className="mt-1 text-red-300/80">{message}</p>
    </div>
  );
}

export default async function Home() {
  let rows: SubnetRow[] = [];
  let taoPrice: TaoPrice | null = null;
  let error: string | null = null;

  try {
    const [poolsRes, subnetsRes, identitiesRes, price] = await Promise.all([
      getSubnetPools({ order: "market_cap_desc", limit: 200 }),
      getSubnets(),
      getSubnetIdentities(),
      getTaoPrice(),
    ]);
    taoPrice = price;

    // Join pool market data with each subnet's incentive_burn and identity.
    const burnByNetuid = new Map<number, number | null>(
      subnetsRes.data.map((s) => [s.netuid, num(s.incentive_burn)]),
    );
    const identityByNetuid = new Map<number, SubnetIdentity>(
      identitiesRes.data.map((i) => [i.netuid, i]),
    );

    rows = poolsRes.data
      .map((p) => ({
        ...p,
        incentive_burn: burnByNetuid.get(p.netuid) ?? null,
        identity: identityByNetuid.get(p.netuid) ?? null,
      }))
      // Drop subnets whose incentive is fully (100%) burned.
      .filter((p) => p.incentive_burn == null || p.incentive_burn < 1);
  } catch (e) {
    error =
      e instanceof TaostatsError
        ? e.message
        : "Unexpected error fetching data from Taostats.";
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-100">Bittensor Subnets</h1>
        <p className="mt-1 text-neutral-500">
          Live dTAO market data across all subnets · sourced from Taostats
        </p>
      </header>

      {error ? (
        <ErrorBanner message={error} />
      ) : (
        <div className="space-y-8">
          {taoPrice && <TaoPriceHeader price={taoPrice} />}
          <SubnetTable pools={rows} />
        </div>
      )}
    </main>
  );
}
