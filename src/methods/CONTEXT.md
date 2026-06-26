# src/methods/ — crafting method board parser

## What This Workspace Is For

Turning the hand-maintained crafting profit board (`crafting/method/README.md`) into
structured rows the Methods tab can render. This is the read-only bridge between the docs
in `crafting/` and the app.

## Layout

```
src/methods/
├── parse.ts       # loadMethodBoard() → MethodRow[] (parses the markdown table)
└── parse.test.ts  # vitest
```

`MethodRow`: `{ method, capital, margin, risk, bestWindow, link }`.

## Rules

- **Read-only over `crafting/`** — this module parses `crafting/method/README.md`; it never
  writes to the docs directory (`crafting/` is docs-only per the project rules).
- When the README table's columns change, update the parser and its test together.
- **ESM imports**: always `.js` extension.

## What to Avoid

- Do not move crafting content into `src/` — the board stays authored as markdown in
  `crafting/method/`; this layer only reads it.
