# Crafting Workspace — Design

**Date:** 2026-06-22
**Status:** Approved (shape + approach)
**Parent design:** `docs/superpowers/specs/2026-06-22-poe2-build-crafting-assistant-design.md` (Layer 3b)

## Purpose

Turn the scaffolded-but-empty `crafting/` workspace into a **profit-crafting
playbook for the current patch**: a beginner-friendly set of crafting methods the
owner can pick from to craft items and **sell them for more than the inputs
cost**.

This reframes the workspace from "craft to upgrade my own build" to "craft to make
profit." The unit of value is a **method** (a repeatable crafting technique with
known economics), not a budget tier.

## Key Decisions

1. **Method is the primary unit.** The workspace is organized around crafting
   methods. Each method is one markdown file and stands on its own.
2. **Budget is demoted from a folder axis to an attribute.** "How much currency do
   I need to start?" becomes a **starting-capital tier** field on each method, not
   a top-level directory. The `budget/` subtree is removed.
3. **`base/` stays as reference.** Item-base notes (mod pools, tiers, tags) remain
   supporting data that methods link to. Not the entry point.
4. **Profit is split into durable vs. dated content** so entries don't rot every
   price patch (see Method Entry Template).
5. **Seed by research.** The initial content is researched from current-patch
   sources and written up as 3–5 method entries plus an index.

## Structure

```
crafting/
├── CONTEXT.md              # updated to describe the method-centric layout
├── method/                 # PRIMARY — one file per crafting method (the playbook)
│   ├── README.md           # index / "profit board": table of methods
│   └── <method-name>.md    # one method per file
└── base/                   # reference — item bases & their mod pools
```

- **Removed:** `crafting/budget/` and its `ssf-league-start/`, `mid/`, `mirror/`
  subdirectories. The capital idea survives as the `starting-capital` field.
- `method/README.md` is an **index, not a new axis** — a scannable table so a
  beginner can compare methods at a glance and click into the detail file.
- `base/` keeps its existing role and `.gitkeep` until base notes are added.

## Method Entry Template

Each `crafting/method/<method-name>.md` has two clearly separated zones.

### Durable zone (patch-stable — changes only when game mechanics change)

| Field | Content |
|-------|---------|
| **Goal** | What you're crafting and why it sells (one or two lines). |
| **Target base(s)** | Item base type(s), linked to the relevant `base/` file when one exists. |
| **Starting capital** | Tier: `ssf` / `low` / `mid` / `high`, with a one-line note on the rough currency floor to begin. |
| **Recipe** | Numbered step-by-step procedure. |
| **Outcome odds** | Chance to hit each sellable result (e.g. "≈12% for a T1 double-resist roll"). Cite craftofexile/poe2db. |
| **Inputs** | Consumables measured in **currency items**, not prices (e.g. "~40 Greater Essences + ~10 Exalts per attempt"). |
| **Risk / variance** | How swingy the method is; can you brick the item; expected attempts to a sellable result. |
| **Why it sells** | Demand driver — which builds/slots want this output. |

### Dated zone (volatile — explicitly illustrative)

A single **worked example** block, stamped with `League / Patch / Date`, marked as
illustrative:

```
> Worked example — Standard, patch 0.x.x, 2026-06-22 (illustrative)
> Input cost:  ~3.5 div
> Expected sale: ~9 div (median sellable outcome)
> Margin:       ~5.5 div / craft, before failed attempts
```

The assistant **recomputes live profit at consult time** from current prices; the
worked example only anchors the math and shows the shape of the return.

## Conventions

- **Markdown only** — no code, no scripts (consistent with workspace rules).
- **One method per file**, flat inside `method/`. No subdirectories under an axis.
- **kebab-case** filenames (e.g. `essence-spam-spirit-amulets.md`).
- **Link, don't duplicate.** Reference `knowledge/sources.md` (poe2db.tw,
  craftofexile.com) for raw mod/odds data rather than copying it.
- **Stamp anything that rots.** Every price or economy claim carries a
  `date + league/patch` stamp and lives in the dated zone.
- **Starting-capital vocabulary** is fixed to four tiers: `ssf`, `low`, `mid`,
  `high`.

## Index / Profit Board (`method/README.md`)

A single table, one row per method, sorted by approachability for a new crafter:

| Method | Capital | Margin (rough) | Risk | Link |
|--------|---------|----------------|------|------|

"Margin (rough)" is a qualitative band (e.g. low / medium / high) so the index
itself does not rot; the hard numbers live in each method's dated worked example.

## Seed Plan

1. **Confirm the current patch** (record it in `knowledge/patch-notes.md` if still
   blank) — required to research relevant methods.
2. **Research** current-patch profitable crafting methods from poe2db.tw,
   craftofexile.com, and community guides.
3. **Write 3–5 method entries** using the template above, spanning a range of
   starting-capital tiers (at least one `ssf`/`low` entry for a true beginner
   start).
4. **Write `method/README.md`** index covering the seeded methods.
5. **Update `crafting/CONTEXT.md`** to describe the method-centric layout and the
   removal of the `budget/` axis.
6. Owner reviews and corrects.

## Out of Scope (this spec)

- **Programmatic data pulls** from poe2db/craftofexile — manual distillation only
  for now (deferred to the economy phase in the parent design).
- **Live price feeds / economy module** — the assistant uses current prices at
  consult time by hand; no automated pricing here.
- **Base/ reference content buildout** beyond what seeded methods need to link to.
- **Build-improvement crafting** (crafting to upgrade the owner's own build) —
  this workspace is profit-first; build analysis lives in `src/` + the analysis
  workflow.

## Maintenance Note

Methods are durable by construction; only worked-example blocks need refreshing.
When a method's economics shift, update its dated block and re-stamp — do not edit
the durable zone unless game mechanics changed.
