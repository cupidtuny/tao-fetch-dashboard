# TAO Dashboard

A Bittensor subnets analytics dashboard, inspired by [taostats.io/subnets](https://taostats.io/subnets).
Built with Next.js (App Router), TypeScript, Tailwind CSS, and Recharts; data comes
live from the [Taostats API](https://docs.taostats.io).

## What it shows

The home page lists every subnet's dTAO pool with:

- Rank, name, symbol, and netuid
- Alpha-token price (in TAO)
- 24h and 7d price change
- Market cap, 24h volume, and liquidity
- A 7-day price sparkline

…plus summary cards for total market cap, 24h volume, and liquidity. The table is
client-side sortable and searchable.

## Setup

1. Get a Taostats API key at <https://taostats.io> (account → API).
2. Copy the env template and add your key:

   ```bash
   cp .env.example .env.local
   # then edit .env.local and set TAOSTATS_API_KEY=...
   ```

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open <http://localhost:3000>.

The API key is read server-side only (in `src/lib/taostats.ts`) and never reaches
the browser. Responses are cached/revalidated every 60 seconds.

## Project layout

```
src/
  app/
    page.tsx          # Subnets dashboard (server component, fetches data)
    layout.tsx        # Root layout + metadata
    globals.css       # Tailwind + dark theme
  components/
    SubnetTable.tsx   # Sortable/searchable table (client)
    Sparkline.tsx     # 7-day price sparkline (Recharts)
    PriceChange.tsx   # Colored % change cell
    StatCard.tsx      # Summary stat card
  lib/
    taostats.ts       # Typed Taostats API client
    format.ts         # TAO/RAO/number formatting helpers
```

## Data source

- `GET /api/dtao/pool/latest/v1` — per-subnet market data (price, market cap,
  volume, liquidity, price changes, 7-day prices). This powers the dashboard.
- `GET /api/subnet/latest/v1` — subnet metadata (emission, validators, miners,
  registration cost). Reserved for upcoming detail views.

## Roadmap

- [ ] Per-subnet detail page (price chart, validators, emission, holders)
- [ ] Emission / validator metadata columns from the subnet endpoint
- [ ] Time-range selector for charts
- [ ] Auto-refresh and loading skeletons
```
