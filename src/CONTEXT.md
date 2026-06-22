# src/ — TypeScript source modules

## What This Workspace Is For

All runnable TypeScript logic: evaluating builds via the PoB2 bridge, reading/snapshotting
build XML files, encoding/decoding build codes, and diffing metrics between build variants.

## Layout

```
src/
├── pob/
│   └── evaluate.ts     # evaluateBuild(xmlPath), parseEvalOutput(raw) → BuildMetrics
├── analyze.ts          # diffMetrics(before, after) → delta object
├── build-io.ts         # readBuildXml(path), snapshotBuild(src, destDir), ONEDRIVE_BUILDS_DIR
├── build-code.ts       # decodeBuildCode(code), encodeBuildCode(xml)
├── index.ts            # re-exports public API
├── *.test.ts           # vitest unit + smoke tests (co-located)
└── fixtures/           # test fixture XML files
```

## Key Workflows

Run tests:
```bash
pnpm test
```

Run a single test file:
```bash
pnpm vitest run src/analyze.test.ts
```

Re-run doctor (checks PoB2 bridge is wired):
```bash
pnpm doctor
```

## Skills

| Skill | Use for |
|-------|---------|
| `everything-claude-code:tdd-workflow` | Write tests first, then implement |
| `everything-claude-code:go-review` | N/A — use `code-review` skill instead |

## Rules

- **ESM imports**: always use `.js` extension even when importing `.ts` files (e.g. `import { foo } from './bar.js'`)
- **TypeScript strict**: `strict: true` is set in `tsconfig.json` — no implicit any, no unsafe casts
- **vitest** for all tests — no Jest, no Mocha
- **pnpm only** — never `npm install` or `yarn add`
- Keep files under ~400 lines; extract utilities if a module grows large
- `BuildMetrics` is the canonical type for PoB2 eval output — defined in `src/pob/evaluate.ts`

## What to Avoid

- Do not shell out to PoB2 directly from this layer — use `evaluateBuild` which wraps `pob/eval.lua`
- Do not mutate `BuildMetrics` objects — `diffMetrics` returns a new delta object
- Do not add runtime dependencies without updating `package.json` via `pnpm add`
