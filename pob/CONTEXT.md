# pob/ — Headless PoB2 Lua bridge

## What This Workspace Is For

The thin shell that runs Path of Building 2's calculation engine without a GUI.
`eval.lua` is invoked by `evaluateBuild` in `src/pob/evaluate.ts`; it emits a single
JSON object to stdout (or `{"error": "..."}` on failure). Nothing else in the project
should shell out to PoB2 directly.

## Layout

```
pob/
├── eval.lua      # Entry point — invoke via luajit; reads XML path from argv[1]
│                 # Must be run with cwd=$POB_REPO/src (PoB2 checkout root)
└── doctor.sh     # Sanity-checks the bridge: luajit on PATH, $POB_REPO set, eval.lua runs
```

## Key Workflows

Run the doctor check:
```bash
pnpm doctor
# or directly:
bash pob/doctor.sh
```

Run a manual eval (for debugging):
```bash
cd "$POB_REPO/src" && luajit /path/to/poe2-assistant/pob/eval.lua /path/to/build.xml
```

Setup instructions (first time): see `docs/pob-setup.md`.

## Rules

- `eval.lua` must remain runnable standalone — no Node dependencies
- The JSON contract: on success, last line starting with `{` is the metrics JSON;
  on failure, `{"error": "<message>"}` on stdout and non-zero exit code
- `$POB_REPO` must point to the PoB2 checkout root; `doctor.sh` verifies this
- Do not add Lua dependencies that are not part of PoB2's own vendored libs

## What to Avoid

- Do not import `eval.lua` from TypeScript directly — always go through `evaluateBuild`
- Do not modify `eval.lua` without verifying `pnpm doctor` still passes
- Do not commit PoB2 source files here — `$POB_REPO` is a separate checkout
