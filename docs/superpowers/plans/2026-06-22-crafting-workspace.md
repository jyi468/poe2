# Crafting Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the empty, scaffolded `crafting/` workspace into a method-centric profit-crafting playbook with 3–5 seeded crafting methods for the current patch.

**Architecture:** This is a **markdown-only** workspace (no code, per project rules). The unit of value is a *method* — one file per crafting technique. "Budget" is demoted from a folder axis to a `starting-capital` field. Content has a durable zone (patch-stable recipe/odds/inputs) and a dated zone (illustrative worked example with prices). `base/` remains reference data; `method/README.md` is a scannable index.

**Tech Stack:** Markdown. Verification via `bash` (file/structure/content checks). No build, no vitest — `crafting/` is docs only.

**Spec:** `docs/superpowers/specs/2026-06-22-crafting-workspace-design.md`

## Global Constraints

- **Markdown only** in `crafting/` — no code, no scripts.
- **One method per file**, flat inside `crafting/method/`. No subdirectories under an axis directory.
- **kebab-case** filenames (e.g. `essence-spam-spirit-amulets.md`).
- **Link, don't duplicate** — reference `knowledge/sources.md` (poe2db.tw, craftofexile.com) for raw mod/odds data instead of copying it.
- **Stamp anything that rots** — every price/economy claim carries a `date + league/patch` stamp and lives in the dated zone.
- **Starting-capital vocabulary is fixed to four tiers:** `ssf`, `low`, `mid`, `high`.
- **Immutability / no secrets** — N/A here (no code), but do not hardcode OneDrive paths.
- **pnpm only** if any tooling is ever invoked (none expected in this plan).

## File Structure

- `crafting/CONTEXT.md` — **rewrite** to describe the method-centric layout (Task 1).
- `crafting/method/_template.md` — **create**, copyable method skeleton (Task 1).
- `crafting/budget/` (+ `ssf-league-start/`, `mid/`, `mirror/`) — **delete** (Task 1).
- `knowledge/patch-notes.md` — **modify** to record the current patch (Task 2).
- `crafting/method/<method-name>.md` ×3–5 — **create**, seeded entries (Task 3).
- `crafting/method/README.md` — **create**, the profit-board index (Task 4).

---

### Task 1: Restructure `crafting/` to method-centric layout

**Files:**
- Delete: `crafting/budget/ssf-league-start/.gitkeep`, `crafting/budget/mid/.gitkeep`, `crafting/budget/mirror/.gitkeep` (and the now-empty `crafting/budget/` tree)
- Create: `crafting/method/_template.md`
- Create: `crafting/method/.gitkeep` (placeholder so `method/` exists before entries land — removed in Task 3)
- Modify: `crafting/CONTEXT.md` (full rewrite)

**Interfaces:**
- Produces: the `crafting/method/_template.md` skeleton that Tasks 3 and 4 copy from. Required headings (exact text): `## Goal`, `## Target base(s)`, `## Starting capital`, `## Recipe`, `## Outcome odds`, `## Inputs`, `## Risk / variance`, `## Why it sells`, `## Worked example`.

- [ ] **Step 1: Remove the `budget/` axis**

Run:
```bash
cd /home/jyi46/projects/poe2
git rm -r crafting/budget
```
Expected: the three `.gitkeep` files under `crafting/budget/` are staged for deletion.

- [ ] **Step 2: Verify `budget/` is gone**

Run:
```bash
test ! -d crafting/budget && echo "OK: budget/ removed" || echo "FAIL: budget/ still present"
```
Expected: `OK: budget/ removed`

- [ ] **Step 3: Create the method directory placeholder**

Run:
```bash
mkdir -p crafting/method && touch crafting/method/.gitkeep
```
Expected: `crafting/method/.gitkeep` exists.

- [ ] **Step 4: Create the method template**

Create `crafting/method/_template.md` with exactly this content:

```markdown
# <Method name>

> Copy this file to `crafting/method/<method-name>.md` and fill every section.
> Durable zone = patch-stable, edit only if game mechanics change.
> Dated zone (Worked example) = illustrative, re-stamp when prices shift.

## Goal

<What you're crafting and why it sells, 1–2 lines.>

## Target base(s)

<Item base type(s). Link to the relevant `../base/<file>.md` when one exists.>

## Starting capital

**Tier:** <ssf | low | mid | high>
<One line on the rough currency floor needed to begin.>

## Recipe

1. <Step>
2. <Step>

## Outcome odds

<Chance to hit each sellable result, e.g. "≈12% for a T1 double-resist roll".
Cite craftofexile / poe2db — see ../../knowledge/sources.md.>

## Inputs

<Consumables measured in currency ITEMS, not prices.
e.g. "~40 Greater Essences + ~10 Exalts per attempt".>

## Risk / variance

<How swingy; can you brick the item; expected attempts to a sellable result.>

## Why it sells

<Demand driver — which builds / slots want this output.>

## Worked example

> <League>, patch <0.x.x>, <YYYY-MM-DD> (illustrative)
> Input cost:    ~<X> div
> Expected sale: ~<Y> div (median sellable outcome)
> Margin:        ~<Y-X> div / craft, before failed attempts
```

- [ ] **Step 5: Rewrite `crafting/CONTEXT.md`**

Replace the entire contents of `crafting/CONTEXT.md` with:

```markdown
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
```

- [ ] **Step 6: Verify the new structure**

Run:
```bash
cd /home/jyi46/projects/poe2
test -f crafting/method/_template.md && echo "OK: template" || echo "FAIL: template"
for h in '## Goal' '## Target base(s)' '## Starting capital' '## Recipe' '## Outcome odds' '## Inputs' '## Risk / variance' '## Why it sells' '## Worked example'; do
  grep -qF "$h" crafting/method/_template.md || echo "FAIL: missing heading $h"
done
grep -qF 'method-centric' crafting/CONTEXT.md && echo "OK: CONTEXT rewritten" || echo "FAIL: CONTEXT"
grep -qi 'budget/' crafting/CONTEXT.md && echo "WARN: CONTEXT still references budget/ (only the 'no budget/ directory' note is allowed)"
echo "done"
```
Expected: `OK: template`, `OK: CONTEXT rewritten`, `done`, and no `FAIL:` lines. (A single `WARN` is acceptable only because CONTEXT explicitly states there is *no* `budget/` directory.)

- [ ] **Step 7: Commit**

```bash
cd /home/jyi46/projects/poe2
git add -A crafting/
git commit -m "refactor: make crafting workspace method-centric, drop budget axis"
```

---

### Task 2: Record the current patch

**Files:**
- Modify: `knowledge/patch-notes.md`

**Interfaces:**
- Produces: a recorded `Current patch: <version>` string + league name in `knowledge/patch-notes.md`, consumed by Task 3 for stamping worked examples.

- [ ] **Step 1: Research the current patch**

Determine the current live PoE2 patch version and league name as of the execution date. Sources, in order:
1. `knowledge/sources.md` links (poe2db.tw shows the data version).
2. Web search for "Path of Exile 2 current patch" / official patch notes.

Record the version string (e.g. `0.x.x`), the league name, and whether it is the temp league or Standard.

- [ ] **Step 2: Update `knowledge/patch-notes.md`**

Replace the line `Current patch: _record version here when known._` with the researched value, formatted:

```markdown
Current patch: <version> — <league name> (recorded <YYYY-MM-DD>). Sources: see sources.md.
```

- [ ] **Step 3: Verify**

Run:
```bash
cd /home/jyi46/projects/poe2
grep -q 'record version here when known' knowledge/patch-notes.md && echo "FAIL: placeholder still present" || echo "OK: patch recorded"
```
Expected: `OK: patch recorded`

- [ ] **Step 4: Commit**

```bash
cd /home/jyi46/projects/poe2
git add knowledge/patch-notes.md
git commit -m "docs: record current PoE2 patch in patch-notes"
```

---

### Task 3: Research and write 3–5 seeded method entries

**Files:**
- Create: `crafting/method/<method-name>.md` (3 to 5 files, kebab-case)
- Delete: `crafting/method/.gitkeep` (no longer needed once real entries exist)

**Interfaces:**
- Consumes: `crafting/method/_template.md` headings (Task 1); the patch/league string from `knowledge/patch-notes.md` (Task 2) for the Worked example stamp.
- Produces: 3–5 method files, each with all nine template headings filled. Their filenames + Starting-capital tier + a qualitative margin band are consumed by Task 4's index.

- [ ] **Step 1: Research profitable methods for the current patch**

Identify 3–5 distinct, currently-profitable crafting methods. Sources:
- `craftofexile.com` (`?game=poe2`) — recipes, mod pools, outcome odds, expected cost.
- `poe2db.tw` — authoritative bases, mods, tiers, tags.
- Community guides / current-patch crafting writeups (web search).

Coverage requirement: at least **one** method must be `ssf` or `low` starting-capital so a true beginner has an entry point. Span tiers where possible (don't make all five `high`).

For each method capture: target base(s), step-by-step recipe, outcome odds (with source), inputs as currency *items*, risk/variance, demand driver, and a current illustrative price example (input cost → median sale → margin).

- [ ] **Step 2: Write each method file**

For each chosen method, copy `crafting/method/_template.md` to `crafting/method/<method-name>.md` and fill **every** section. Rules:
- `## Starting capital` **Tier** must be exactly one of `ssf` / `low` / `mid` / `high`.
- `## Inputs` lists currency **items**, never prices.
- `## Outcome odds` cites the source (link or `see ../../knowledge/sources.md`).
- `## Worked example` is stamped with the league + patch from `knowledge/patch-notes.md` and the execution date, and labelled `(illustrative)`.
- Leave no `<...>` placeholder text from the template.

- [ ] **Step 3: Remove the placeholder**

Run:
```bash
cd /home/jyi46/projects/poe2
git rm crafting/method/.gitkeep
```
Expected: `.gitkeep` staged for deletion (real entries now hold the directory).

- [ ] **Step 4: Verify every entry is complete**

Run:
```bash
cd /home/jyi46/projects/poe2
entries=$(ls crafting/method/*.md | grep -vE '/(README|_template)\.md$')
count=$(echo "$entries" | grep -c .)
[ "$count" -ge 3 ] && [ "$count" -le 5 ] && echo "OK: $count entries" || echo "FAIL: $count entries (need 3-5)"
for f in $entries; do
  for h in '## Goal' '## Target base(s)' '## Starting capital' '## Recipe' '## Outcome odds' '## Inputs' '## Risk / variance' '## Why it sells' '## Worked example'; do
    grep -qF "$h" "$f" || echo "FAIL: $f missing $h"
  done
  grep -qE '\*\*Tier:\*\* (ssf|low|mid|high)' "$f" || echo "FAIL: $f missing valid capital tier"
  grep -qF '<' "$f" && echo "FAIL: $f still has <placeholder> text"
done
grep -lE '\*\*Tier:\*\* (ssf|low)' $entries >/dev/null && echo "OK: has a beginner-tier entry" || echo "FAIL: no ssf/low entry"
echo "done"
```
Expected: `OK: N entries`, `OK: has a beginner-tier entry`, `done`, and no `FAIL:` lines.

- [ ] **Step 5: Commit**

```bash
cd /home/jyi46/projects/poe2
git add -A crafting/method/
git commit -m "docs: seed crafting method entries for current patch"
```

---

### Task 4: Write the profit-board index

**Files:**
- Create: `crafting/method/README.md`

**Interfaces:**
- Consumes: the filenames, Starting-capital tiers, and content of the method entries from Task 3.

- [ ] **Step 1: Write `crafting/method/README.md`**

Create the file with this exact structure, then fill one table row per seeded method (sorted easiest-to-start first). "Margin (rough)" is a qualitative band — `low` / `medium` / `high` — so the index itself does not rot:

```markdown
# Method index — profit board

One row per crafting method. Sorted by approachability for a new crafter.
Hard numbers live in each method's dated **Worked example**; the margin column
here is a qualitative band so this index does not rot.

| Method | Capital | Margin (rough) | Risk | Link |
|--------|---------|----------------|------|------|
| <name> | <ssf\|low\|mid\|high> | <low\|medium\|high> | <low\|medium\|high> | [link](<file>.md) |

> Capital tiers: ssf / low / mid / high. See `_template.md` for the entry shape
> and `../CONTEXT.md` for workspace rules.
```

Replace the single example row with one real row per method file from Task 3. Every link must resolve to an existing file.

- [ ] **Step 2: Verify the index**

Run:
```bash
cd /home/jyi46/projects/poe2
test -f crafting/method/README.md && echo "OK: README exists" || echo "FAIL: no README"
# every linked .md target must exist
grep -oE '\]\(([a-z0-9-]+\.md)\)' crafting/method/README.md | sed -E 's/\]\(|\)//g' | while read -r t; do
  test -f "crafting/method/$t" || echo "FAIL: dead link -> $t"
done
# every seeded entry should appear in the index
for f in $(ls crafting/method/*.md | grep -vE '/(README|_template)\.md$'); do
  b=$(basename "$f")
  grep -qF "$b" crafting/method/README.md || echo "FAIL: $b not listed in index"
done
echo "done"
```
Expected: `OK: README exists`, `done`, and no `FAIL:` lines.

- [ ] **Step 3: Commit**

```bash
cd /home/jyi46/projects/poe2
git add crafting/method/README.md
git commit -m "docs: add crafting method profit-board index"
```

---

## Self-Review

**Spec coverage:**
- Method-centric structure, `budget/` removed → Task 1. ✓
- Method entry template (durable + dated zones, all fields) → Task 1 (`_template.md`) + enforced in Task 3. ✓
- Conventions (markdown-only, kebab-case, link-not-duplicate, stamp rot, 4 capital tiers) → Global Constraints + Task 1 CONTEXT + Task 3/4 checks. ✓
- `method/README.md` profit board → Task 4. ✓
- Confirm current patch / record in patch-notes → Task 2. ✓
- Research + 3–5 entries spanning tiers, ≥1 beginner tier → Task 3. ✓
- Update `crafting/CONTEXT.md` → Task 1 Step 5. ✓
- Out of scope (programmatic pulls, live price feeds, base/ buildout, build-improvement crafting) → not included. ✓

**Placeholder scan:** Template `<...>` tokens are intentional fill-in markers inside the *deliverable* files, and Task 3 Step 4 explicitly fails the build if any survive in real entries. No plan-level TODO/TBD steps. ✓

**Type consistency:** The nine `##` headings are identical across `_template.md` (Task 1), the Task 3 verify loop, and the Task 4 index references. Capital tiers `ssf/low/mid/high` are spelled identically in Global Constraints, CONTEXT, template, and both verify scripts. ✓
