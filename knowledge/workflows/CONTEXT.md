# knowledge/workflows/ — repeatable analysis loops

## What This Workspace Is For

Step-by-step playbooks for the recurring analysis loops in this project. Each file is a
procedure you follow end to end — not reference facts (those live one level up in
`knowledge/`). Docs only.

## Layout

```
knowledge/workflows/
├── build-analysis.md    # the build-improvement loop (evaluate → diff → recommend)
└── crafting-ladder.md   # crafting progression / ladder workflow
```

## Rules

- **Docs only** — no code here. Workflows describe how to drive `src/`, `crafting/`, and the
  command center; they don't contain runnable logic.
- Keep each workflow self-contained and ordered: a fresh session should be able to execute it
  cold, top to bottom.
- When a workflow references a script or file path, keep it current with the actual code —
  stale step references are worse than none.

## What to Avoid

- Do not mix reference material (mechanics, meta, prices) into a workflow file — link to the
  `knowledge/` reference docs instead.
