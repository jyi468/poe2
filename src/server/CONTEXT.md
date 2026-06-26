# src/server/ — command-center JSON API

## What This Workspace Is For

The backend half of the crafting command center. A dependency-free `node:http` server that
exposes the economy, methods, crafting-sim, and trade logic as a small JSON API, and (in
production) serves the built Vite app from `app/dist`. The React app in `app/` is the frontend.

## Layout

```
src/server/
├── server.ts     # http server, ROUTE table, static fallback to app/dist
├── routes.ts     # handlers — thin adapters over economy/ + crafting-sim/ + methods/
├── http.ts       # readBody, sendJson, wrap (envelope), Handler type
└── http.test.ts  # vitest
```

## API Surface

| Route | Backed by |
|-------|-----------|
| `GET /api/economy` | `economy/pull-core` readLatestSnapshot |
| `POST /api/economy/refresh` | `economy/pull-core` pullEconomy + writeSnapshot |
| `GET /api/methods` | `methods/parse` loadMethodBoard |
| `GET /api/flowchart` | reads `crafting/crafting-flowchart.md` (raw markdown) |
| `GET /api/desecration` | `crafting-sim/desecration-items` evaluateDesecItems (live omen prices) |
| `GET /api/slots` | `crafting-sim/slots` scanSlots |
| `POST /api/craft` | `crafting-sim/estimate` estimateCraft |
| `POST /api/trade` | `economy/trade-core` searchTrade / findStats |

## Key Workflows

```bash
pnpm app          # dev: api (tsx watch) + vite web, concurrently
pnpm api          # api only, watch mode
pnpm app:build    # build the frontend into app/dist
pnpm app:serve    # serve built app + api from this server (prod-style)
```

`PORT` defaults to `5179` (override via env).

## Rules

- **Envelope contract**: every response is `{ ok: true, data }` or `{ ok: false, error }`,
  applied by `http.wrap`. Handlers in `routes.ts` return plain data and throw on failure —
  they never build the envelope themselves. The frontend's `app/src/api.ts` unwraps it.
- **Handlers stay thin**: business logic lives in `economy/`, `crafting-sim/`, `methods/`.
  Route handlers only adapt request → core call → data.
- **No web framework** — plain `node:http` by design; don't add Express/Fastify.
- **ESM imports**: always `.js` extension.

## What to Avoid

- Do not duplicate economy/craft logic here — import the core modules.
- Do not leak raw error stacks to clients; `wrap` already converts thrown errors to
  `{ ok: false, error }`.
