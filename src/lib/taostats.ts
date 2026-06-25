/**
 * Typed client for the Taostats API (https://docs.taostats.io).
 *
 * All requests are made server-side so the API key is never exposed to the
 * browser. Set TAOSTATS_API_KEY in .env.local.
 */

const BASE_URL = "https://api.taostats.io";

/** A point in a subnet's 7-day price history. */
export interface PricePoint {
  block_number: number;
  timestamp: string;
  price: string;
}

/**
 * A subnet's dTAO pool — the market data behind the taostats /subnets table.
 * Monetary fields suffixed with RAO are integer strings in RAO (1 TAO = 1e9 RAO).
 */
export interface SubnetPool {
  netuid: number;
  block_number: number;
  timestamp: string;
  name: string | null;
  symbol: string | null;
  rank: number | null;
  /** Alpha token price denominated in TAO. */
  price: string;
  /** Market cap in RAO. */
  market_cap: string;
  /** Liquidity in RAO. */
  liquidity: string;
  total_tao: string;
  total_alpha: string;
  alpha_in_pool: string;
  alpha_staked: string;
  price_change_1_hour: string | null;
  price_change_1_day: string | null;
  price_change_1_week: string | null;
  price_change_1_month: string | null;
  /** 24h TAO volume in RAO. */
  tao_volume_24_hr: string;
  tao_buy_volume_24_hr: string;
  tao_sell_volume_24_hr: string;
  buys_24_hr: number;
  sells_24_hr: number;
  buyers_24_hr: number;
  sellers_24_hr: number;
  seven_day_prices: PricePoint[] | null;
  startup_mode: boolean;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  next_page: number | null;
  prev_page: number | null;
}

export interface PaginatedResponse<T> {
  pagination: Pagination;
  data: T[];
}

export class TaostatsError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "TaostatsError";
  }
}

function apiKey(): string {
  const key = process.env.TAOSTATS_API_KEY;
  if (!key) {
    throw new TaostatsError(
      "TAOSTATS_API_KEY is not set. Add it to .env.local — get a key at https://taostats.io.",
    );
  }
  return key;
}

async function get<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: {
      Authorization: apiKey(),
      accept: "application/json",
    },
    // Revalidate at most once a minute so we don't hammer the API on every load.
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TaostatsError(
      `Taostats API ${res.status} on ${path}: ${body.slice(0, 200)}`,
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

/** Subnet metadata from /api/subnet/latest/v1 — we only type what we use. */
export interface SubnetInfo {
  netuid: number;
  /** Fraction (0–1) of miner incentive that is burned. 1 = fully burned. */
  incentive_burn: string | number | null;
  emission: string;
  active_miners: number | null;
  active_validators: number | null;
  /** Per-UID registration fee (burn) in RAO. */
  neuron_registration_cost: string | null;
}

/** Subnet identity (name, description, links) from /api/subnet/identity/v1. */
export interface SubnetIdentity {
  netuid: number;
  subnet_name: string | null;
  description: string | null;
  summary: string | null;
  github_repo: string | null;
  /** Email or contact string. */
  subnet_contact: string | null;
  /** Website — may be missing the https:// scheme. */
  subnet_url: string | null;
  logo_url: string | null;
  /** Often a Discord invite code rather than a full URL. */
  discord: string | null;
  /** Twitter/X handle, usually prefixed with "@". */
  twitter: string | null;
  tags: string[] | null;
  additional: string | null;
}

/** Latest TAO/USD price from /api/price/latest/v1. */
export interface TaoPrice {
  price: string;
  percent_change_1h: string;
  percent_change_24h: string;
  percent_change_7d: string;
  market_cap: string;
  volume_24h: string;
  last_updated: string;
}

export type PoolOrder =
  | "market_cap_desc"
  | "market_cap_asc"
  | "price_desc"
  | "price_asc"
  | "netuid_asc"
  | "netuid_desc";

/** Fetch the latest dTAO pool data for every subnet (the subnets dashboard). */
export async function getSubnetPools(opts: {
  order?: PoolOrder;
  limit?: number;
  page?: number;
} = {}): Promise<PaginatedResponse<SubnetPool>> {
  return get<PaginatedResponse<SubnetPool>>("/api/dtao/pool/latest/v1", {
    order: opts.order ?? "market_cap_desc",
    limit: opts.limit ?? 200,
    page: opts.page ?? 1,
  });
}

/** Fetch subnet metadata (incentive_burn, emission, …) for every subnet. */
export async function getSubnets(
  opts: { limit?: number; page?: number } = {},
): Promise<PaginatedResponse<SubnetInfo>> {
  return get<PaginatedResponse<SubnetInfo>>("/api/subnet/latest/v1", {
    order: "netuid_asc",
    limit: opts.limit ?? 1024,
    page: opts.page ?? 1,
  });
}

/** Fetch identity (name, description, links) for every subnet. */
export async function getSubnetIdentities(
  opts: { limit?: number; page?: number } = {},
): Promise<PaginatedResponse<SubnetIdentity>> {
  return get<PaginatedResponse<SubnetIdentity>>("/api/subnet/identity/v1", {
    limit: opts.limit ?? 200,
    page: opts.page ?? 1,
  });
}

/** Fetch the latest TAO/USD price and recent changes. */
export async function getTaoPrice(): Promise<TaoPrice> {
  const res = await get<PaginatedResponse<TaoPrice>>("/api/price/latest/v1", {
    asset: "tao",
  });
  const price = res.data[0];
  if (!price) throw new TaostatsError("No TAO price returned by Taostats.");
  return price;
}
