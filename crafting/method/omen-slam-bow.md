# Omen-Slam Bow (fractured-base endgame craft)

> Method: lock one premium mod with a **fractured base**, then fill the 3 prefixes **and**
> the 2 open suffixes with **Perfect Exalt + Sinistral/Dextral Exaltation** (each adds a
> *top-tier* mod — you only roll the *type*, never the tier). Same toolkit works on
> quarterstaves; this file is the bow build. EV is driven by `pnpm bow-sim`.

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

The +Proj craft (all Perfect-Exalt, real weights) bankrolls at **~150 div** (base ~30 + p85
~118). Typical all-in ~107 div, EV ≈ **+90 div**. The cost is dominated by the **crit
suffix**: crit is only ~7% of the suffix pool, so it takes ~14 Perfect-Exalt slams to land
(but it lands at **T1** when it does).

## Recipe

Steps are laid out node-by-node (with the exact remove/reroll points) in the flowchart on
the Bow tab (`pnpm bow-sim` for the EV table).

**1. Setup.** Buy the fractured ilvl-81 base. Strip it so only the fractured mod remains.
The fractured mod is always a **suffix** (both `+Proj levels` and `crit chance`), leaving
**3 prefix slots + 2 open suffix slots**. The fractured mod is **annul-immune**, which makes
the reroll steps below safe.

**2. Prefixes — 3 damage mods.** Per slot: **Omen of Sinistral Exaltation + Perfect Exalted
Orb** → adds a *top-tier* prefix; you only gamble the *type*, never the tier. Keep phys /
hybrid / elemental. **REROLL** a junk prefix with a plain **Orb of Annulment (~0.6 div)**
*while it is the only/newest prefix*. Allowing **elemental** (flat Lightning is the
highest-weight prefix) takes the per-slam hit from 22.5% → **75.3%** and is equal-or-better
total DPS.

**3. Crit — Perfect-Exalt it (the decisive cost lever).** **Omen of Dextral Exaltation +
Perfect Exalted Orb** into a suffix slot. Crit is only **7.0%** of the suffix pool, so
expect ~14 slams — but because the Exalt is *Perfect*, every crit that lands is **T1
(4.41–5.0%)**, the tier the market pays for. **REROLL** a junk suffix with a plain **Orb of
Annulment**: the fracture is annul-immune, so the annul can only take the junk suffix.

> **Do NOT desecrate crit.** It is the same ~7% type-rarity, but (a) you may hold only **one
> desecrated mod at a time**, (b) each miss costs an **~8.6-div Omen-of-Light clear** (vs a
> ~0.6-div annul), and (c) the bone tier-filter helps the *tier*, not the binding constraint
> (type). `pnpm bow-sim`: desecrating crit runs **~112 div mean vs ~77** for Perfect-Exalt.
> **Essence of Seeking is also impossible** — essences only upgrade a **Magic** base to Rare
> and a +Proj base is bought already **fractured (rare)**.

**4. Second suffix.** **Dextral Exaltation + Perfect Exalt** until **attack speed OR crit
damage** lands (**14.1%** combined, ~7 slams), annulling junk between slams. Path B (`crit`
fractured) fills both open suffixes with attack speed + crit damage the same way.

**5. Trapped junk mod?** If a junk mod is stuck among keepers on one side (a blind annul
would risk a keeper), **TARGETED-REMOVE** with **Omen of Sinistral/Dextral Erasure** (next
Chaos removes only that side) or **Sinistral/Dextral Annulment** (next Annul removes only
that side). ~4–7 div — insurance, not the default.

**6. Finish.** ~4 Divine Orbs toward high rolls; optional Blacksmith's Infuser for >20%
quality.

> **Recombinator is gone in 0.5** (deleted). **Essences write to one crafted slot** and need
> a Magic base. **Desecration adds one mod at a time** and re-desecrating requires clearing
> the previous one (Omen of Light + Annul) — which is exactly why it loses to Perfect-Exalt
> here.

## Outcome odds

EXACT, from craftofexile spawn-weight shares (id_base 20, **ilvl 81**), assuming the slam
samples the normal pool by weight:

| Per-slam target | Chaos-spam (random tier) | **Perfect Exalt + Exaltation** (top tier) |
|---|---|---|
| PREFIX · phys OR elemental | 1 in 22 | **1 in 1.3** (75.3%) |
| PREFIX · flat-or-% physical, ≥T3 | 1 in 117 (0.85%) | 1 in 4.4 (22.5%) |
| SUFFIX · **crit chance** (lands T1) | — | **1 in 14** (7.04%) |
| SUFFIX · attack speed OR crit damage | — | 1 in 7 (14.1%) |

Crit-chance tiers: T1 = 4.41–5.0%, T2 = 3.81–4.4%, T3 = 3.11–3.8%. A Perfect Exalt always
adds the top tier, so a landed crit is **T1**. The craftable `+Proj` mod caps at **+4**
(ilvl 81); +5 needs a corruption.

> **Why not desecrate?** Bone math, for the record: a Preserved bone reveals crit at all
> tiers (only 22.6% of crit reveals are ≥T3); an **Ancient** bone (min mod level 40) makes
> 100% of crit reveals ≥T3 — but it also **locks out attack speed entirely** (AS tops out at
> ilvl 37 < 40). Either way desecration fights the same ~7% crit *type* odds with expensive
> Light clears, so Perfect-Exalt wins. Bone choice only matters if you desecrate at all,
> which you shouldn't here.

## Inputs

Per finished bow (central estimate): ~4 Perfect Exalted Orbs + ~4 Sinistral Exaltation omens
+ ~1 Annul for the prefixes; **~14 Perfect Exalt + Dextral Exaltation** (+ annuls) for the
crit suffix; **~7 more** for the second suffix; ~4 Divine Orbs to finish.

## Risk / variance

Variance is dominated by the **crit suffix hunt** (~7% per slam). The misses are cheap
(~0.6-div annuls), so the tail is moderate: `pnpm bow-sim` gives p95 ≈ 1.4× the median.
If a run blows well past p85 on the crit suffix, keep slamming — annul misses are cheap, so
there's no "re-buy the base" decision the way the old desecration loop forced.

You can't brick the item (mods add/remove, never destroy). Phys-only prefixes roughly double
prefix churn for equal DPS — take the elemental branch.

## Fracture decision — which base to buy

The fracture's value = how hard the locked mod is to get **any other way**:

- **`+Proj` is NOT obtainable by slam or desecration** → fracture is the only clean way to
  get the +4 levels, and **+levels is what the market pays for** (it isn't in weapon DPS —
  it's a separate skill multiplier and a scarce mod). This is the **only version worth
  crafting**.
- **`crit` is just a normal suffix** → a crit-fractured bow with NO +levels is a flooded
  item: even crit≈8% / pDPS≥450 rolls **floor at ~0.5 div** (live trade2, 2026-06-28).
  Crafting one costs ~110 div of consumables to make a sub-1-div item — **never; just buy.**

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
and **pDPS**. Perfect-Exalting crit lands it at **T1 directly**, so the craft naturally
targets the high tier; profit then lives in pushing the three damage prefixes high.

## Worked example

> Runes of Aldur, patch 0.5, 2026-06-28 (live `data/economy/latest.json`, 1 div ≈ 364 ex).
> Consumables only (base NOT included), from `pnpm bow-sim` (40k trials):
>
> | Scenario (all +Proj, elemental prefixes) | mean | p50 | p85 | p95 |
> |---|---|---|---|---|
> | **Perfect-Exalt crit (T1) + attack speed** ✅ | **77** | **67** | **118** | **166** |
> | desecrate crit (Ancient bone) + exalt AS | 112 | 90 | 183 | 268 |
> | phys-only prefixes (exalt crit) | 105 | 94 | 154 | 199 |
> | B · Crit-fractured (buy don't craft) | 77 | 67 | 118 | 166 |
>
> Bankroll & ROI at **live trade2 resale** (2026-06-28):
> - **A `+Proj` (Perfect-Exalt crit):** base ~30 + p85 118 → **bring ~150 div**; typical
>   all-in ~107; resale floor ~130, settled ~200 → **EV ≈ +90 div**, T1-crit/pDPS≥600 tier
>   ~460–630. This is the recommended path.
> - **B `Crit`:** resale ~0.5 → **negative regardless**. Do not craft — **buy** the ~0.5 div
>   bow.
>
> The earlier desecration-centred numbers (~41 div with a modelled 25% crit-reveal rate) were
> wrong: real craftofexile weights put crit at **7% of the suffix pool**, which Perfect-Exalt
> handles more cheaply than desecration. Re-run `pnpm bow-sim` as prices move.
