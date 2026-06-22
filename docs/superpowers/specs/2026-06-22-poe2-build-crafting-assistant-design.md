# PoE2 Build & Crafting Assistant — Design

**Date:** 2026-06-22
**Status:** Approved (overall shape + approach)

## Purpose

A context-aware knowledge + tooling workspace, living in this repo, that an AI
assistant (Claude Code, working here) uses to help the owner:

1. **Understand crafting** in the current patch, factoring in budget and meta.
2. **Improve and trailblaze builds** — analyze the owner's existing build, find
   weak spots and upgrades, and (later) surface novel tree / skill-gem / item
   options that may not exist in published guides yet.

This is **not** a standalone consumer app. The "product" is three layers:
structured markdown knowledge, calculation/glue scripts, and a Path of Building 2
(PoB2) integration that does the heavy numerical lifting.

## Key Facts (verified during design)

- **Cloned PoB2 source:** `~/projects/PathOfBuilding-PoE2`. Contains
  `src/HeadlessWrapper.lua` (explicitly designed to run PoB's calc engine without
  a GUI under a standard Lua / LuaJIT interpreter), a `Dockerfile`, and
  `docker-compose.yml` documenting the headless dependency set.
- **Installed PoB2 (Windows):**
  `/mnt/c/Users/jyi46/AppData/Roaming/Path of Building Community (PoE2)/` — ships
  `lua51.dll` and runs through `SimpleGraphic`/GUI plumbing (no clean standalone
  interpreter).
- **Owner's build:**
  `/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds/UR HOMO.xml`
  — a level 96 Ranger / Deadeye, full tree + items + gems, ~43 KB / 718 lines.
  (A second build, `Attribute Stacking Invoker Monk.xml`, also exists.)
- **No Lua interpreter in WSL yet** (`luajit`, `lua`, `luarocks` all missing) —
  installing one plus PoB's native deps (`lcurl`, `lua-utf8`, etc.) is a setup
  step. The repo `Dockerfile` documents the exact set.

## Chosen Approach

**Headless LuaJIT bridge to PoB2's calc engine.** Run the cloned repo's
`HeadlessWrapper.lua` under `luajit` in WSL, feed it builds, let PoB compute all
metrics (DPS, EHP, resistances, etc.), and read structured numbers back out.

**Rejected alternatives:**

- *Drive the Windows install's bundled Lua via WSL→Windows interop* — the Windows
  build runs through GUI plumbing and ships only `lua51.dll`, not a clean
  interpreter. More fragile than the headless wrapper.
- *Roll our own calculations from build XML* — defeats the purpose; re-implementing
  PoB's engine is enormous and would drift from each game patch.

**Accepted cost:** one-time setup friction installing `luajit` + native libs. The
repo's `Dockerfile` makes this a solved problem.

## Glue / CLI Language

**TypeScript / Node (pnpm)** for everything above the Lua bridge (build copy/parse,
invoking `eval.lua`, formatting JSON, and the later scraping/economy phase). The
bridge itself is fixed as Lua.

## Architecture (layers)

### Layer 1 — PoB2 bridge (foundation)
- `pob/eval.lua`, run via `luajit` against the cloned repo's `src/` + game data
  (`Data/`, `TreeData/`).
- **Input:** a build (path to an XML file, or a PoB export/build code), plus an
  optional set of modifications (swap a gem, add/remove tree nodes, change an item).
- **Output:** a clean **JSON** blob of metrics — DPS per skill, total / effective
  HP, ES, resistances, mana, and key flags.

### Layer 2 — Build I/O (TypeScript)
- Read the owner's build XML directly from OneDrive
  (`.../Builds/UR HOMO.xml`); optionally snapshot a copy into `builds/` for
  version control / diffing.
- Decode a PoB export code → build XML, and re-encode modified XML → code (PoB
  codes are base64 + zlib-compressed XML) for sharing or pasting back into the GUI.

### Layer 3 — Knowledge base
- `knowledge/*.md`: current patch notes, mechanics, crafting methods, meta
  summaries, and the owner's own observations.
- This is the context the assistant reads to reason well, and the "learn about
  best options / crafting" surface. Maintained by hand in this phase (no scraping
  yet).

### Layer 3b — Crafting knowledge workspace
A dedicated, structured workspace (separate from the general knowledge base) for
crafting reference, organized so the same craft can be looked up by different
entry points:
- **By budget** — e.g. league-start / SSF, mid-tier, high-end / mirror.
- **By base** — item base types (armour pieces, weapons, jewellery, etc.) and
  their relevant mod pools.
- **By method / outcome** — crafting techniques and the steps + expected cost to
  hit a target item.

Created/managed via the **`/scaffold-workspaces`** skill so the folder structure
is generated consistently rather than hand-built. Content is markdown the
assistant reads, cross-linked to the data sources below.

### Layer 4 — Analysis workflow
A documented, repeatable loop the assistant runs:
1. Import the owner's build → `eval.lua` → baseline metrics.
2. Identify weak spots (defenses, DPS, resistances, gaps vs. knowledge base).
3. Propose upgrades / alternatives (tree, gems, items).
4. Re-eval each candidate via the bridge.
5. Present a **before/after diff report**: what changed, numbers before vs. after,
   rough cost, and the concrete steps to apply it in PoB2.

### Layer 5 — Deferred phases (owner's call, later)
- **Economy module:** poe2.ninja-style scraping → price data → budget-aware
  suggestions. (Target sources: poe2.ninja-style economy data + hand-maintained
  markdown notes.)
- **Discovery / optimization:** systematic variant search — permute tree / gems /
  items, batch-evaluate through the bridge, rank by DPS / EHP / budget. The
  "trailblazing new meta" engine grows out of the working eval loop.

## External Data Sources (items & crafting)

Reference sources for the crafting workspace and (later) automated lookups:

- **poe2db.tw** (`https://poe2db.tw/us/`) — comprehensive item / base / mod /
  skill database. Use for authoritative base types, mod pools, tiers, and tags.
- **craftofexile.com** (`https://www.craftofexile.com/?game=poe2`) — crafting
  simulator with structured mod/probability data; useful for crafting steps,
  odds, and expected cost. Its **About page**
  (`https://www.craftofexile.com/about`) reportedly documents a **data view /
  data extractor**, which may be the cleanest structured-data path — investigate
  first.

Both likely expose queryable data or APIs (craftofexile loads structured JSON and
may offer the data extractor above; poe2db has predictable per-item URLs).
**Confirming exact API/endpoint availability and terms of use is a research task
during implementation.** In this
phase they are primarily manual references the assistant consults and distills
into the crafting workspace; programmatic pulls are a later enhancement alongside
the economy module.

## Data Flow

```
UR HOMO.xml ──▶ eval.lua (luajit + PoB engine) ──▶ JSON metrics
                                                        │
                                                        ▼
              knowledge/*.md ◀──── assistant reasoning
                                                        │
                                       propose modified build
                                                        │
                                                        ▼
                                   re-eval ──▶ before/after diff report
```

## Error Handling

- `eval.lua` emits **structured JSON errors** (invalid build, missing game data,
  engine exception) rather than crashing — the TS layer can branch on them.
- A one-time `pob/doctor` check verifies `luajit` + required native libs are
  present and that a known golden build evaluates correctly, so environment
  problems surface immediately rather than as confusing engine errors.

## Testing

- **Golden-build snapshot test:** evaluate `UR HOMO.xml` (known stats) and snapshot
  the `eval.lua` JSON output, so PoB updates or bridge changes that move the numbers
  get caught.
- TS layer: unit-test build code encode/decode round-trips and XML parsing.

## Out of Scope (this phase)

- Live trade/economy scraping and pricing (deferred).
- Automated large-scale build-space search / optimization (deferred).
- Any standalone GUI or web app — the assistant in this repo is the interface.

## Open / Setup Tasks

- Install `luajit` + PoB native dependencies in WSL (use the repo `Dockerfile` as
  the reference dependency list).
- Confirm `eval.lua` can load the cloned repo's `Data/` and `TreeData/` headlessly
  and produce non-zero DPS for `UR HOMO.xml`.
- Scaffold the crafting knowledge workspace via `/scaffold-workspaces` (axes:
  budget / base / method).
- Research data-source access: poe2db.tw URL patterns, and craftofexile.com's
  data view / data extractor (`/about`) + its structured JSON — including terms
  of use — before any programmatic pulling.
