# app/ — crafting command center (frontend)

## What This Workspace Is For

The React + Vite frontend of the crafting command center. A tabbed single-page app over the
JSON API served by `src/server/`. Read this together with `src/server/CONTEXT.md` — they are
two halves of one feature.

## Layout

```
app/
├── index.html
├── vite.config.ts        # dev server + /api proxy to src/server
├── tsconfig.json
└── src/
    ├── main.tsx          # React entry
    ├── App.tsx           # tab shell (Flowchart · Desecration · Jewel · Economy · Methods · Craft sim · Trade)
    ├── api.ts            # get/post helpers — unwrap the {ok,data|error} envelope
    ├── allocation.ts     # shared client-side helpers
    ├── format.ts         # display formatting
    ├── styles.css
    ├── tabs/             # FlowchartTab, DesecrationTab, JewelTab, EconomyTab, MethodsTab, CraftSimTab, TradeTab
    └── components/       # ErrorBanner, PriceTable, Mermaid (shared UI)
```

## Key Workflows

```bash
pnpm app          # dev: API + Vite together (concurrently)
pnpm app:build    # production build → app/dist
pnpm app:serve    # serve the built app + API from src/server
```

## Rules

- **API access goes through `api.ts`** — `get`/`post` already unwrap the server envelope and
  throw on `{ ok: false }`. Don't call `fetch` directly in tabs/components.
- **Envelope is the contract** — the server (`src/server/http.ts`) returns
  `{ ok: true, data }` / `{ ok: false, error }`; keep `api.ts` in sync with it.
- **ESM imports**: `.js` extension on relative imports (matches the project-wide rule).
- Surface failures via `components/ErrorBanner` rather than swallowing them.

## What to Avoid

- Do not add business/EV logic here — it belongs in `src/crafting-sim/` and `src/economy/`,
  exposed via the API.
- Do not hardcode the API origin — rely on the Vite `/api` proxy (dev) and same-origin (prod).
