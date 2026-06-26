# src/economy/ — live price + trade data

## What This Workspace Is For

Pulling live market data and turning it into snapshots and lookups. Two upstreams:
poe2scout (bulk currency/unique prices) and the official PoE2 trade2 API (mod-filtered
listing search). Everything here feeds the Economy and Trade tabs and the crafting EV sims.

## Layout

```
src/economy/
├── client.ts          # poe2scout HTTP client: getByCategory, getLeagues
├── normalize.ts       # normalizeItem, byPriceDesc, pickCurrentLeague
├── types.ts           # NormalizedItem and shared shapes
├── pull-core.ts       # pullEconomy / writeSnapshot / readLatestSnapshot (logic)
├── pull.ts            # CLI wrapper → `pnpm economy`
├── digest.ts          # builds the markdown digest (latest.md)
├── query.ts           # CLI: full price table for one category → `pnpm prices`
├── trade-core.ts      # trade2 API: findStats, searchTrade, QuerySpec (logic)
├── trade.ts           # CLI wrapper → `pnpm trade`
└── *.test.ts          # co-located vitest
```

## Key Workflows

```bash
pnpm economy                         # pull snapshot → data/economy/latest.{json,md}
pnpm prices essences --top 15        # ad-hoc price lookup, no snapshot written
pnpm trade --find "critical damage"  # resolve a stat id, then search listings
```

## Rules

- **Core vs CLI split**: all logic lives in `*-core.ts` (and `client`/`normalize`); the
  `pull.ts` / `query.ts` / `trade.ts` files are thin argv + stdout wrappers. Add logic to
  core, not the CLI shell — the server (`src/server/routes.ts`) imports the core directly.
- **ESM imports**: always `.js` extension.
- **Immutability**: normalize/sort helpers return new arrays; never mutate fetched payloads.
- Snapshots are written under `data/economy/` only — never elsewhere.

## What to Avoid

- Do not ad-hoc `curl` the APIs — reuse `client.ts` / `trade-core.ts` so league resolution
  and rate handling stay consistent.
- Do not hardcode a league name — resolve via `getLeagues` / `pickCurrentLeague`.
