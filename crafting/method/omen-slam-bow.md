# Omen-Slam Bow (fractured-base endgame craft)

> Method: lock one premium mod with a **fractured base**, fill 3 damage prefixes with
> **Perfect Exalt + Sinistral Exaltation** (top tier free — you only roll the *type*),
> then **desecrate** the crit/attack-speed suffixes. Same toolkit works on quarterstaves;
> this file is the bow build. EV is driven by `pnpm bow-sim`.

## Goal

Craft a ~700+ pDPS endgame crit bow (Obliterator / Warmonger) for a projectile-attack
build, or to sell. The high-value version carries **+4 to Level of all Projectile Skills**;
the budget version locks **crit chance** instead.

## Target base(s)

- **Obliterator Bow** (ilvl 78 base, phys 62–115, 5.00% crit, atk time 909, **−50% proj range**)
- **Warmonger Bow** (ilvl 77 base, phys 56–84, 5.00% crit, atk time 833, no downside)

Both are **craftofexile `id_base 20`** → **identical craftable mod pool**. Obliterator has
the higher pDPS ceiling (more base phys); Warmonger attacks ~9% faster with no range
penalty. Buy the base **already fractured** at ilvl 81 (don't fracture yourself — the
Fracturing Orb locks a *random* mod). Mod pool weights: craftofexile `?game=poe2&b=20`.

## Starting capital

**Tier:** mid

With **Essence-Seeking crit + Abyssal-Echoes** desecration, the +Proj craft bankrolls at
**~55 div** (base ~30 + p85 ~24) — not the ~217 div the old single-reveal/Light-clear loop
implied. Bring **~70 div** if you must desecrate crit instead of essencing it. Only the
worst-case Light-clear loop pushes toward ~200 div.

## Recipe

Steps are laid out node-by-node (with the exact remove/reroll/clear points) in the
flowchart on the Bow tab (`pnpm bow-sim` for the EV table).

**1. Setup.** Buy the fractured ilvl-81 base. Strip it down so only the fractured mod
remains. The fractured mod is always a **suffix** (both `+Proj levels` and `crit chance`),
leaving **3 prefix slots + 2 open suffix slots**.

**2. Prefixes — 3 damage mods (both paths).** Per slot: **Omen of Sinistral Exaltation +
Perfect Exalted Orb** → adds a *top-tier* prefix; you only gamble the *type*, never the tier.
Keep phys / hybrid / elemental. **REROLL** a junk prefix with a plain **Orb of Annulment
(~0.6 div)** *while it is the only/newest prefix* so the annul can't miss — far cheaper than
re-buying the ~30 div base. Allowing **elemental** (flat Lightning is the highest-weight
prefix) takes the per-slam hit from 22.5% → **75.3%** and is equal-or-better total DPS.

**3. Crit (the decisive cost lever).** Two routes:
- **Essence of Seeking → guaranteed crit (~0.02 div).** *Seeking* keys off `Martial Weapon`
  (bows included) and writes the crit suffix into the **crafted slot** — no hunt, no
  variance. This is the cheapest path; it needs the crafted-slot mod injected onto the
  fractured *rare* (Runic/Imbued Alloy in 0.5) — confirm that in-game before relying on it.
- **Desecrate crit** with **Preserved Jawbone + Omen of Dextral Necromancy**, and **Omen of
  Abyssal Echoes** to reroll the 3 options once (≈6 looks/cycle, ~0.6 div). On a miss,
  **CLEAR** with **Omen of Light + Orb of Annulment** and re-desecrate. Use this only if
  essence-crit can't be slotted.

**4. Remaining suffix.** Attack speed via a cheap **Abyssal-Echoes desecrate** (or **Essence
of Haste**, guaranteed, if you spent the crafted slot on crit you instead desecrate it).
Path B (`crit` fractured) desecrates **attack speed + crit damage** instead.

**5. Trapped junk mod?** If a junk mod is stuck among keepers on one side (blind annul would
risk a keeper), **TARGETED-REMOVE** with **Omen of Sinistral/Dextral Erasure** (next Chaos
removes only that side) or **Sinistral/Dextral Annulment** (next Annul removes only that
side). These cost ~4–7 div — insurance, not the default.

**6. Finish.** ~4 Divine Orbs toward high rolls; optional Blacksmith's Infuser for >20%
quality.

> **Recombinator is gone in 0.5** (deleted) — it is not an option. **Essences write to one
> crafted slot** (can't stack two), so a finished bow's deterministic anchors are: fracture
> + one essence/alloy + one desecrated mod.

## Outcome odds

EXACT, from craftofexile spawn weights (id_base 20, **ilvl 81**):

| Per-slam target | Chaos-spam (random tier) | **Perfect Exalt + Sinistral** (top tier) |
|---|---|---|
| flat-or-% physical, ≥T3 | 1 in 117 (0.85%) | **1 in 4.4** (22.5%) |
| phys incl. hybrid+acc | 1 in 64 | 1 in 2.9 |
| **phys OR elemental** | 1 in 22 | **1 in 1.3** (75.3%) |

Crit chance is only ~7% of the bloated suffix pool, so **don't blind-exalt it — desecrate
it**. Crit-chance tiers: T1 = 4.41–5.0%, T2 = 3.81–4.4%, T3 = 3.11–3.8%. The craftable
`+Proj` mod caps at **+4** (ilvl 81); +5 needs a corruption.

> Per-desecrate crit/attack-speed/crit-damage chances are **modelled** (the Abyssal pool
> isn't in the craftofexile dump) — see `pnpm bow-sim` and tune there.

## Inputs

Per finished bow (central estimate): ~4 Perfect Exalted Orbs + ~4 Sinistral Exaltation
omens + ~1 Orb of Annulment for the prefixes; **~8–15 Omen of Light** + Preserved Jawbones
+ Dextral Necromancy omens for the suffix desecration; ~4 Divine Orbs to finish. Jawbones
are sourced in-game (not poe2scout-tracked).

## Risk / variance

Variance is dominated by **how you source crit**:
- **Essence-Seeking crit** → crit is guaranteed, so the tail nearly vanishes (~18 div mean,
  p95 ~34). Cheapest and least swingy.
- **Abyssal-Echoes desecrate** → still cheap (~25 div mean) because 6 looks/cycle means few
  Light clears.
- **Single-reveal + Light-clear-per-miss** (the old pessimistic model) → fat-tailed, ~113
  div mean, p95 ~2.5× the median. If you're stuck on this loop and a run blows past p85,
  re-bone rather than Light-chasing.

You can't brick the item (mods add/remove, never destroy). Phys-only prefixes roughly
double prefix churn for equal DPS — take the elemental branch.

## Fracture decision — which base to buy

The fracture's value = how hard the locked mod is to get **any other way**:

- **`+Proj` is NOT in the desecration pool** → fracture is the only clean way to get the
  +4 levels, and **+levels is what the market pays for** (it isn't even in weapon DPS — it's
  a separate skill multiplier and a scarce mod). This is the **only version worth crafting**.
- **`crit` is desecratable** → a crit-fractured bow with NO +levels is a flooded item:
  even crit≈8% / pDPS≥450 rolls **floor at ~0.5 div** (live trade2, 2026-06-28). Crafting
  one costs ~120 div of consumables to make a sub-1-div item — **never do it; just buy one.**

Rule of thumb: **buy `+Proj` fractured and craft that.** If you only want a personal
crit/phys bow with no levels, **buy the finished bow (~0.5 div), don't craft it.**

## Output value (live trade2, equipment filters, 2026-06-28)

Valued by the stats that actually price a bow — **+Proj levels, crit %, physical DPS,
total DPS** (computed weapon properties, not individual mods):

| Finished bow | Real floor |
|---|---|
| crit ≥8% · pDPS ≥450 · **no +levels** | **~0.5 div** (6000+ listings — worthless) |
| **+4 Proj** · crit ≥8% (T3) · pDPS ≥450 | **~130 div** |
| **+4 Proj** · crit ≥9% (T1, ~max 10%) · pDPS ≥600 | **~460–630 div** |

The price ladder inside the +Proj tier is driven by **crit chance** (T3 → ~130; T1 → ~500)
and **pDPS** — so the craft's profit lives in pushing crit to **T1 (≥9% computed)** and the
three damage prefixes high. At the floor you roughly break even vs just buying.

## Worked example

> Runes of Aldur, patch 0.5, 2026-06-26 (live `data/economy/latest.json`, 1 div ≈ 364 ex).
> Consumables only (base NOT included), from `pnpm bow-sim` (20k trials). Crit source is
> the lever:
>
> | Scenario (all +Proj, elemental prefixes) | mean | p50 | p85 | p95 |
> |---|---|---|---|---|
> | **Essence-Seeking crit (guaranteed)** + Echoes AS | **18** | **15** | **24** | **34** |
> | desecrate crit via Abyssal Echoes + Echoes AS | 26 | 21 | 40 | 51 |
> | desecrate crit · Light-clear per miss (pessimistic) | 113 | 95 | 187 | 264 |
> | phys-only prefixes (Echoes crit) | 53 | 49 | 78 | 99 |
> | B · Crit-fractured (buy don't craft) | 22 | 21 | 33 | 44 |
>
> Bankroll & ROI at **live trade2 resale** (2026-06-28):
> - **A `+Proj`, Essence-Seeking crit:** base ~30 + p85 24 → **bring ~55 div**; typical
>   all-in ~48; resale floor ~130, settled ~200 → **EV ≈ +150 div**, T1-crit/pDPS≥600 tier
>   ~460–630. The cheap, low-variance default.
> - **A `+Proj`, Echoes desecrate crit:** **bring ~70 div** if essence-crit can't be slotted.
> - **B `Crit`:** resale ~0.5 → **negative regardless**. Do not craft — **buy** the ~0.5 div
>   bow.
>
> The earlier ~217 div bankroll was the **single-reveal / Light-clear** worst case. With
> Essence-Seeking crit + Abyssal Echoes the same bow bankrolls at **~55 div**, ~4× cheaper
> and far less swingy. Re-run `pnpm bow-sim` as prices move; tune the modelled desecration
> odds against real reveal data.
