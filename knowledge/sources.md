# Data Sources (items & crafting)

- **poe2db.tw** — https://poe2db.tw/us/ — bases, mods, tiers, tags, skills. Predictable per-item URLs.
- **craftofexile.com** — https://www.craftofexile.com/?game=poe2 — crafting odds & expected cost.
  - Data view / extractor: https://www.craftofexile.com/about — investigate as the cleanest structured-data path before any scraping.

## Meta / economy (build popularity → mod demand)

Feeds `meta.md`. Stamp pulls with patch + date; these rot fast.

- **poe2scout.com (API)** — https://poe2scout.com/api/openapi.json — live, trade-derived
  currency + unique prices with a clean JSON OpenAPI. **This is the automated source**:
  `pnpm economy` (`../src/economy/pull.ts`) pulls it into `../data/economy/`. Key
  endpoints: `/{realm}/Leagues`, `/{realm}/Leagues/{league}/Currencies/ByCategory`,
  `.../Uniques/ByCategory`. Gotchas: `PerPage` max 250; `DataPoints` must be 7 or 8.
- **poe.ninja (PoE2)** — https://poe.ninja/poe2/builds/runesofaldur/ — live build
  distribution & economy. NOTE: site is JS-rendered and its API came back empty/blocked
  on plain fetch; poe2scout is the working machine path. Use poe.ninja for build %s
  (manual) until a browser path exists.
- **Maxroll PoE2** — https://maxroll.gg/poe2/tierlists/league-starter-ascendancy-tier-list
  (ascendancy tiers) and https://maxroll.gg/poe2/meta/the-build-meta (meta overview —
  was stale to 0.3 at last check; verify patch before trusting).
- **AoEAH 0.5 tier list** — https://www.aoeah.com/news/4539--poe-2-05-tier-list--best-class--league-starter-builds-return-of-the-ancients — archetypes, skills, gear-stat priorities.
- **Odealo 0.5 starters** — https://odealo.com/articles/the-best-starters-for-path-of-exile-2-patch-0-5 — league-starter build context.

> Phase 1: manual references the assistant distills into `crafting/`. Programmatic pulls + terms-of-use review are a later phase (alongside economy data).
