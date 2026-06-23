# poe2-assistant

PoE2 build assistant — evaluates Path of Building 2 builds headlessly and guides crafting decisions.

## Tech Stack

- **Runtime**: Node 20, TypeScript (ESM, strict), pnpm
- **Tests**: vitest
- **PoB2 bridge**: LuaJIT running `pob/eval.lua` (requires `$POB_REPO` pointing at a PoB2 checkout)
- **Build file storage**: OneDrive at `ONEDRIVE_BUILDS_DIR` (Windows path via WSL)

## Workspaces

```
poe2-assistant/
├── src/              # TypeScript source modules
│   └── economy/      # Live price pull (poe2scout) → data/economy/
├── pob/              # Headless PoB2 Lua bridge + doctor script
├── knowledge/        # Hand-maintained reference docs + workflow
│   └── workflows/    # Repeatable analysis loops
├── crafting/         # Method-centric profit playbook
│   ├── method/       # PRIMARY — one file per crafting method (+ README profit board)
│   └── base/         # item bases & mod pools (reference)
├── data/             # Generated artifacts (gitignored snapshots)
│   └── economy/      # latest.{json,md} from `pnpm economy`
└── docs/             # Setup guides and specs
    └── superpowers/  # Plans, specs
```

## Routing Table

| Task | Workspace | Key files | Skip |
|------|-----------|-----------|------|
| Evaluate / diff a build | `src/` | `src/analyze.ts`, `src/pob/evaluate.ts` | `crafting/`, `knowledge/` |
| Read or snapshot a build XML | `src/` | `src/build-io.ts` | `pob/` |
| Encode / decode a build code | `src/` | `src/build-code.ts` | `pob/` |
| Run / debug the PoB2 bridge | `pob/` | `pob/eval.lua`, `pob/doctor.sh` | `src/`, `crafting/` |
| Look up crafting method / cost | `crafting/` | `crafting/method/README.md`, `crafting/method/*.md` | `src/`, `pob/` |
| Pull / read live economy prices | `src/economy/` | `src/economy/pull.ts`, `data/economy/latest.md` | `pob/`, `crafting/` |
| Research mechanics / meta | `knowledge/` | `knowledge/mechanics.md`, `knowledge/meta.md` | `src/`, `crafting/` |
| Run the build-improvement loop | `knowledge/workflows/` | `knowledge/workflows/build-analysis.md` | `crafting/` |
| First-time setup | `docs/` | `docs/pob-setup.md` | all others |

## Naming Conventions

- TypeScript source files: `kebab-case.ts` under `src/`
- Test files: co-located `*.test.ts` alongside source
- Crafting lookup files: `kebab-case.md` inside the appropriate axis directory
- Knowledge files: lowercase single-word `.md` names

## Project-Wide Rules

- **pnpm only** — never npm or yarn
- **ESM imports** — always include `.js` extension in TypeScript import paths
- **Immutability** — return new objects; never mutate inputs
- **No hardcoded secrets** — OneDrive paths come from `ONEDRIVE_BUILDS_DIR` env var
- **No code changes in `knowledge/` or `crafting/`** — those directories are docs only
- Do not commit the `.superpowers/` scratch directory
