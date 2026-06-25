# Crafting Command Center — Design

> Status: approved design (2026-06-25). A local web app that wraps the existing
> poe2-assistant CLIs so crafting/economy analysis stops being hand-run shell
> commands.

## Problem

The toolkit already produces everything needed to make crafting decisions —
live prices (`pnpm economy`), real trade floors (`pnpm trade`), and exact PoB
tier/EV math (`pnpm craft-sim`) — but each is a separate shell command whose
output has to be read by eye. There is no single place to see prices, the
profit playbook, and a craft's odds/EV together, and re-running them is friction.

## Goal

One local **command center** that reuses the existing modules unchanged in
spirit and surfaces them as four tabs: **Economy**, **Methods**, **Craft sim**,
**Trade**. Buttons trigger the live tools; the page holds the staged ~100-div
strategy against current prices.

Non-goals (YAGNI): auth, multi-user, persistence/DB, deployment, mobile layout,
historical price charts, write-back to build files.

## Architecture

Two pieces; all domain logic stays in `src/`.

```
app/                       Vite + React + TS frontend (4 tabs)
  src/
    main.tsx               app shell + tab router
    api.ts                 typed fetch client for /api/*
    format.ts             ex/div + number formatting helpers
    tabs/
      EconomyTab.tsx
      MethodsTab.tsx
      CraftSimTab.tsx
      TradeTab.tsx
    components/            small shared bits (PriceTable, ErrorBanner, Stat)
  index.html
  vite.config.ts           dev server, proxy /api -> :5179

src/server/                thin node:http API (no web framework dep)
  server.ts                route table + static serve of app/dist
  economy-routes.ts        GET /api/economy, POST /api/economy/refresh
  slots-routes.ts          GET /api/slots
  craft-routes.ts          POST /api/craft
  trade-routes.ts          POST /api/trade
  http.ts                  tiny helpers: json(), body(), wrap(handler)
```

### Reuse + minimal refactor

- `src/crafting-sim/pob-mods.ts` — already a clean library (`loadModTiers`,
  `poolFor`, `statLow/High`). Used as-is by `slots-routes` and `craft-routes`.
- `src/crafting-sim/magic-craft.ts` — currently a CLI script. **Extract** the EV
  math (odds, expected attempts, per-attempt cost, break-even) into a pure
  `estimateCraft(input): CraftEstimate` in a new `src/crafting-sim/estimate.ts`.
  The existing CLI keeps working by calling `estimateCraft` and printing.
- `src/economy/pull.ts` — **extract** the pull-and-write core into a pure
  `pullEconomy(): Promise<EconomySnapshot>` (the CLI `main()` calls it then logs).
  `economy-routes` calls the same function. Reading the latest snapshot stays a
  file read of `data/economy/latest.json`.
- `src/economy/trade.ts` — **extract** `runQuery`/`buildBody` into a reusable
  `searchTrade(spec): Promise<TradeResult>` returning structured listings
  instead of `console.log`. The CLI prints the structured result.

Each extraction is behavior-preserving: CLI output is unchanged; the server and
CLI share one function. Per the global rules, run `gitnexus_impact` on each
symbol touched before editing and `gitnexus_detect_changes` before committing.

### API surface

| Method + path | Body | Returns | Backed by |
|---|---|---|---|
| `GET /api/economy` | — | latest snapshot (currencies, uniques, inputs, divine rate, pulledAt) | read `data/economy/latest.json` |
| `POST /api/economy/refresh` | — | fresh snapshot | `pullEconomy()` |
| `GET /api/slots` | — | per-slot pool sizes + chase-mod tiers (the scan) | `poolFor` over `ModItem.lua` |
| `POST /api/craft` | `{slot, ilvl, prefixGroup?, prefixMin?, suffixStat?, buyPriceDiv?, weights?}` | `CraftEstimate` (odds, attempts, cost bands, break-even) | `estimateCraft()` |
| `POST /api/trade` | `{category?, rarity?, name?, type?, stats[], limit?, corrupted?}` | cheapest listings (price ex/div, typeLine, mods, ilvl) | `searchTrade()` |

All responses share an envelope `{ ok: true, data } | { ok: false, error }`.

### Data flow

React tab → `api.ts` fetch → node:http route → existing TS module → external
source (poe2scout, official trade2 API, PoB `ModItem.lua` on disk).

## Tabs

1. **Economy** — divine rate + `pulledAt`, a `[Refresh prices]` button
   (`POST /api/economy/refresh`), and sortable tables for currencies, crafting
   inputs, and uniques. Stale badge if `pulledAt` older than ~6h.

2. **Methods** — renders the profit board from `crafting/method/README.md`
   (method, capital, margin, risk, best-window, link). The board table is the
   primary source; each method file is enriched by reading its structured
   markdown sections (the `**Tier:**` line under `## Starting capital`, and the
   `## Worked example` block) — these files have no YAML front-matter, so the
   parser keys off those headings. **Plus** the staged
   ~100-div allocation: a recommended sequence (lead earner → cash-flow floor →
   upside swing → buffer) with per-stage div budgets recomputed from the live
   snapshot. This is where the originally-requested 100-div strategy lives.

3. **Craft sim** — pick `slot` + `ilvl`, then pick a target prefix group and/or
   target suffix stat from the lists `/api/slots` returns. Shows: the exact tier
   table for the target (affix, ilvl gate, value range, fraction clearing a
   threshold), the competing pool-group count (the variance driver), per-attempt
   odds with low/central/high weight bands, expected attempts, EV cost in div
   from live orb prices, and break-even vs a typed buy price. Real GGG spawn
   weights are not in PoB — the UI labels weight-derived numbers as **modelled**
   and exposes the low/central/high band, matching `magic-craft.ts` today.

4. **Trade** — form to build a mod-filtered query (category, rarity=nonunique,
   up to N stat filters with min/max, corrupted toggle); shows cheapest real
   listings as an order-of-magnitude floor. Reuses the existing politeness/
   rate-limit backoff. A `--find`-style stat search box resolves stat ids.

## Error handling

- Every route wrapped by `wrap()`: thrown errors → `{ ok:false, error }` + 4xx/5xx.
- `POB_REPO` unset/missing → `/api/slots` and `/api/craft` return a clear
  "set POB_REPO to a PathOfBuilding-PoE2 checkout" message; the tab renders an
  ErrorBanner with that text instead of crashing.
- Trade 429s reuse existing `Retry-After` backoff; surfaced to the UI as a
  "rate limited, retrying" state, not a hard error.
- Network failure on refresh leaves the last-good snapshot in place and shows a
  non-blocking banner.

## Testing

- vitest (co-located `*.test.ts`) on the extracted pure functions:
  - `estimateCraft` — odds/attempts/break-even for known inputs (golden numbers).
  - `searchTrade` body builder — query JSON shape for given specs (no network;
    test `buildBody` directly).
  - method-board parser — parses the README table + each method's `**Tier:**`
    and `## Worked example` sections.
- Frontend kept thin (presentational tabs over typed API data); no heavy UI
  tests. A smoke test that `api.ts` types match the server envelope is enough.

## Running

- `pnpm app` — concurrently starts the API server (tsx watch on
  `src/server/server.ts`, port 5179) and Vite dev (proxying `/api`).
- `pnpm app:build` — `vite build` to `app/dist`; the server serves it statically
  so `pnpm app:serve` runs the whole thing from one process with no Vite.
- New dev deps: `vite`, `react`, `react-dom`, `@vitejs/plugin-react`,
  `@types/react`, `@types/react-dom`, `concurrently`. No web-framework dep on
  the server (plain `node:http`).

## File-size / convention guardrails

Follows project conventions: kebab-case `.ts` under `src/`, ESM imports with
`.js` extensions, co-located tests, immutable returns, many small files
(200–400 lines typical). No edits to `knowledge/` or `crafting/` content —
the Methods tab only **reads** those docs. Secrets/paths stay in env
(`POB_REPO`, `ONEDRIVE_BUILDS_DIR`), none hardcoded.
