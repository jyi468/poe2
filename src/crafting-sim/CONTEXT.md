# src/crafting-sim/ — crafting EV simulators

## What This Workspace Is For

Expected-value math for crafting decisions: "is it cheaper to craft this mod combo or buy
it?" Each sim pulls real tier/ilvl/value data out of PoB's `Data/ModItem.lua`, applies
modelled spawn-weight bands (PoB ships no real GGG weights), and prices attempts against
live orb costs. Powers the Craft-sim tab and the `*-sim` CLIs.

## Layout

```
src/crafting-sim/
├── pob-mods.ts          # loadModTiers, poolFor, statLow/statHigh — reads PoB ModItem.lua
├── estimate.ts          # estimateCraft — pure EV engine (Transmute→Augment magic craft)
├── slots.ts             # scanSlots, SLOT_DEFS — item-slot/target picker for the UI
├── magic-craft.ts       # CLI → `pnpm craft-sim` (two-mod magic craft)
├── boots.ts / boots-craft.ts            # boots sim core + CLI → `pnpm boots-sim`
├── desecration.ts / desecration-craft.ts # desecration sim core + CLI → `pnpm desecration-sim`
└── *.test.ts            # co-located vitest
```

## Exact vs Modelled (read before trusting a number)

- **EXACT** (from PoB `Data/ModItem.lua`): tier lists, ilvl gates, mod value ranges, and
  threshold fractions (e.g. what share of a phys tier clears >66%).
- **MODELLED**: pool-share / spawn-weight probabilities are passed as low/central/high
  bands. PoB's `weightVal` is a 1/0 can-spawn flag, not a real weight. Plug real weights
  from craftofexile / poe2db to tighten any estimate.

Every sim should keep this distinction visible in its output and comments.

## Key Workflows

```bash
pnpm craft-sim         # magic two-mod craft EV
pnpm boots-sim         # movement-speed boots EV
pnpm desecration-sim   # desecration / lich-modifier EV
```

## Rules

- **`estimate.ts` is pure** — no I/O, no env reads; callers supply prices and weight bands.
  Keep it that way so it's trivially testable and reusable from `src/server/routes.ts`.
- **Reads `$POB_REPO`** via `pob-mods.ts` for tier data — never hardcode mod values.
- **Immutability**: return new scenario/result objects.
- **ESM imports**: always `.js` extension.

## What to Avoid

- Do not invent spawn weights inline — pass them as a documented band and label them modelled.
- Do not couple the EV engine to the CLI or the server; logic stays in the core `.ts`.
