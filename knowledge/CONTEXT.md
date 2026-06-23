# knowledge/ — Reference docs and analysis workflows

## What This Workspace Is For

Hand-maintained context the assistant reads when reasoning about builds and crafting.
All files here are Markdown — no code. The assistant treats this as its working memory
for the current patch: mechanics notes, meta observations, the owner's personal notes,
and the repeatable build-improvement loop.

## Layout

```
knowledge/
├── README.md                    # Index of this workspace
├── patch-notes.md               # Current patch version + key changes (hand-updated)
├── mechanics.md                 # Damage, EHP, resistances, ailment mechanics
├── meta.md                      # Popular archetypes / skills / uniques this patch
├── notes.md                     # Owner's observations, target items, price sightings
├── sources.md                   # External data sources (poe2db, craftofexile)
└── workflows/
    └── build-analysis.md        # The repeatable build-evaluation + improvement loop
```

## What Each File Is For

| File | Purpose |
|------|---------|
| `patch-notes.md` | Track the active patch version; note changes that affect build math |
| `mechanics.md` | Accumulate game-mechanic notes that inform `evaluateBuild` interpretation |
| `meta.md` | Record observed archetypes / skills so the assistant can suggest relevant comparisons |
| `notes.md` | Owner's raw observations — price sightings, item targets, personal reminders |
| `sources.md` | Canonical URLs for item data (poe2db.tw) and crafting odds (craftofexile.com) |
| `workflows/build-analysis.md` | Step-by-step loop: snapshot → baseline → weak spots → propose → re-eval → diff |

## The Build-Analysis Workflow

The workflow in `workflows/build-analysis.md` ties together the TypeScript functions:

- `snapshotBuild` / `readBuildXml` (from `src/build-io.ts`) — capture the XML
- `evaluateBuild` / `parseEvalOutput` (from `src/pob/evaluate.ts`) — run PoB2 headlessly
- `diffMetrics` (from `src/analyze.ts`) — compare before/after metrics
- `encodeBuildCode` / `decodeBuildCode` (from `src/build-code.ts`) — share variants

Read `workflows/build-analysis.md` before starting any improvement session.

## Rules

- Markdown only — no code
- Keep each file focused on its stated topic
- Update `patch-notes.md` when a new patch drops before any build analysis
- Do not duplicate raw data from external sites — link to `sources.md` instead

## What to Avoid

- Do not put crafting lookup tables here — those go in `crafting/`
- Do not embed currency prices as hard numbers — note them as relative estimates with a date
- Do not reference TypeScript symbols that no longer exist in `src/`
