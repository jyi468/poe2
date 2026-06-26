# docs/ — setup guides and specs

## What This Workspace Is For

Setup instructions and design records. First-time wiring (the PoB2 bridge) and the
plan/spec history for each feature built in this repo. Docs only.

## Layout

```
docs/
├── pob-setup.md          # first-time setup: wiring $POB_REPO and the headless bridge
└── superpowers/
    ├── plans/            # dated implementation plans (one per feature)
    └── specs/            # dated design specs (paired with the plans)
```

## Conventions

- **Plans and specs are dated**: `YYYY-MM-DD-<feature>.md`, with a matching `-design.md` spec.
  They are a historical record — append new ones, don't rewrite old ones to match later reality.
- `pob-setup.md` is living setup documentation — keep it current as the bridge setup changes.

## Rules

- **Docs only** — no code.
- Start here for first-time setup before touching `pob/` or `src/`.

## What to Avoid

- Do not confuse `docs/superpowers/` (committed plans/specs) with the `.superpowers/` scratch
  directory at the repo root — the latter is gitignored and must not be committed.
