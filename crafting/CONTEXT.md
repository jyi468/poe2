# crafting/ — Profit-crafting playbook

## What This Workspace Is For

A method-centric reference the assistant uses to recommend **profitable crafts for
the current patch** — craft an item, sell it for more than the inputs cost. The
unit of value is a **method** (a repeatable crafting technique with known
economics), not a budget tier.

## Layout

```
crafting/
├── method/                 # PRIMARY — one file per crafting method
│   ├── _template.md        # copyable skeleton for new methods
│   ├── README.md           # index / "profit board": table of all methods
│   └── <method-name>.md    # one method per file
└── base/                   # reference — item bases & their mod pools
```

`base/` is supporting reference data that methods link to. There is **no
`budget/` directory** — "how much currency to start" lives in each method's
**Starting capital** field (tiers: `ssf` / `low` / `mid` / `high`).

## Method Entry Shape

Each `method/<name>.md` has two zones (see `method/_template.md`):

- **Durable zone** (patch-stable): goal, target base(s), starting capital, recipe,
  outcome odds, inputs measured in currency *items*, risk/variance, why it sells.
- **Dated zone**: one **Worked example** block with real prices, stamped
  `League / Patch / Date`, marked illustrative. The assistant recomputes live
  profit at consult time.

## Rules

- Markdown only — no code, no scripts.
- One method per file, flat inside `method/`. No subdirectories.
- kebab-case filenames; `_template.md` and `README.md` are reserved names.
- Link to `../knowledge/sources.md` for raw mod/odds data rather than copying it.
- Stamp anything that rots (prices, economy claims) with date + league/patch, and
  keep it in the Worked example block.

## What to Avoid

- Do not put build-evaluation logic here — that belongs in `src/`.
- Do not store live economy prices in the durable zone; use the dated Worked
  example for any price-bearing math.
- Do not create subdirectories deeper than one level.
