# data/ — generated artifacts

## What This Workspace Is For

Machine-generated output, not hand-authored content. Today this is economy snapshots written
by `pnpm economy`. These files are gitignored snapshots — treat them as a cache, not source.

## Layout

```
data/
└── economy/
    ├── latest.json            # most recent snapshot (consumed by GET /api/economy)
    ├── latest.md              # human-readable digest of the latest snapshot
    └── snapshot-YYYY-MM-DD.json  # dated historical snapshots
```

## Key Workflows

```bash
pnpm economy    # refresh latest.{json,md} + write a dated snapshot
```

The command center's `POST /api/economy/refresh` writes here too.

## Rules

- **Generated only** — never hand-edit these files; regenerate via the economy pull.
- Writers live in `src/economy/pull-core.ts` (`writeSnapshot` / `readLatestSnapshot`). Don't
  write to this directory from anywhere else.
- Snapshots are gitignored — don't commit them.

## What to Avoid

- Do not treat a snapshot as a source of truth for prices long-term; it's a point-in-time
  capture. Re-pull before making decisions that depend on current market state.
