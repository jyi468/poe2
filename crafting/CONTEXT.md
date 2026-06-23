# crafting/ — Crafting lookup workspace

## What This Workspace Is For

Hand-maintained reference tables the assistant uses when estimating crafting cost and
recommending upgrade paths. Organised along three lookup axes so you can approach from
any angle: how much you want to spend, what base you are targeting, or which crafting
technique you want to apply.

## Layout

```
crafting/
├── budget/
│   ├── ssf-league-start/   # Zero-currency, self-found progression notes
│   ├── mid/                # Early-to-mid trade budget (chaos–a few divines)
│   └── mirror/             # High-end / mirror-tier crafts
├── base/                   # Per-item-base notes: mod pools, tiers, tags
└── method/                 # Per-technique notes: steps, expected cost, risk
```

Each leaf directory currently holds a `.gitkeep`. Replace it (or add alongside it)
with `.md` files as you accumulate data.

## Lookup Axes

| Axis | Start here when… | Example file |
|------|-----------------|--------------|
| `budget/` | You know your currency ceiling | `budget/mid/body-armour.md` |
| `base/` | You know the item slot/base | `base/gloves-advanced-iron.md` |
| `method/` | You want to apply a specific technique | `method/essence-spam.md` |

Cross-reference `knowledge/sources.md` for URLs to poe2db.tw (mod tiers, tags) and
craftofexile.com (crafting odds and expected cost).

## Rules

- Markdown only — no code, no scripts
- Keep files flat inside the axis directory; one topic per file
- Link to external sources rather than duplicating raw data (see `knowledge/sources.md`)
- Budget tiers are approximate — note the league/patch context at the top of each file

## What to Avoid

- Do not put build evaluation logic here — that belongs in `src/`
- Do not store economy prices directly (they change); record relative guidance instead
- Do not create subdirectories deeper than one level inside an axis directory
