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

**Tier:** high

You need to absorb a fat-tailed desecration hunt without getting stranded mid-craft.
Bring **~185–220 div** (base + p85 consumables). Do not start the **+Proj** path with
< ~150 div.

## Recipe

**Setup.** Buy the fractured ilvl-81 base. Strip it down so only the fractured mod remains.
The fractured mod is always a **suffix** (both `+Proj levels` and `crit chance` are
suffixes), leaving **3 prefix slots + 2 open suffix slots**.

**Prefixes — 3 damage mods (both paths).** Per slot: **Omen of Sinistral Exaltation +
Perfect Exalted Orb** → adds a top-tier prefix; you only gamble the *type*, never the tier.
Keep phys / hybrid / elemental; **Orb of Annulment** any junk and re-slam. Allowing
**elemental** (flat Lightning is the highest-weight prefix in the pool) takes the per-slam
hit rate from 22.5% → **75.3%** and is equal-or-better total DPS.

**Suffixes — desecration.** Fill the 2 open suffixes from the Abyssal pool with
**Preserved Jawbone + Omen of Dextral Necromancy** (desecrate a suffix); **Omen of Light +
Orb of Annulment** wipes a bad reveal so you can re-desecrate.

- **Path A — `+Proj` fractured:** desecrate **crit chance** + **attack speed**. (Omen of
  Leash Desecration can guarantee the attack-speed companion mod once crit is in.)
- **Path B — `crit` fractured:** crit is already locked at ~T1; desecrate **attack speed**
  + **crit damage**.

**Finish.** ~4 Divine Orbs to roll the kept mods toward their high ends; optional
Blacksmith's Infuser for >20% quality.

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

The desecration crit hunt is the cost driver and **fat-tailed**: typical runs finish near
the median but the p95 is ~2.5× the median. You can't brick the item (mods are
add/remove, not destroy), but you can bleed Omen of Light chasing a stubborn crit tier — if
a run blows past p85, **re-bone a fresh base instead of Light-chasing**. Phys-only prefixes
roughly double prefix cost via annul churn; take the elemental branch.

## Fracture decision — which base to buy

The fracture's value = how hard the locked mod is to get **any other way**:

- **`crit` is desecratable** → locking it with a fracture is partly redundant, but it
  *guarantees* a near-max crit and deletes the whole crit hunt. Cheapest, most
  deterministic; **self-use** (output lacks the +levels premium, so flip ROI is thin).
- **`+Proj` is NOT in the desecration pool** → fracture is the only clean way to get the
  +4 levels, which carries most of the resale value. **Profit play** (and a damage
  multiplier), at the cost of the crit desecration hunt.

Rule of thumb: want to **sell / scale gem levels → buy `+Proj` fractured**; want a
**cheap reliable personal bow → buy `crit` fractured**. If a 4.8% crit-fractured base
(already T1) costs ~the same as a +4 base and you don't need levels, the crit base is the
cheaper *finish*.

## Worked example

> Runes of Aldur, patch 0.5, 2026-06-26 (live `data/economy/latest.json`, 1 div ≈ 364 ex).
> Consumables only (base NOT included), from `pnpm bow-sim` (40k trials):
>
> | Scenario | mean | p50 | p85 | p95 |
> |---|---|---|---|---|
> | A · +Proj · ele prefixes · crit ≥T3 | 113 | 95 | 187 | 264 |
> | A · +Proj · ele · chase crit T1 | 175 | 141 | 298 | 437 |
> | A · +Proj · phys-only prefixes | 141 | 124 | 219 | 297 |
> | **B · Crit · ele prefixes** | **93** | **79** | **153** | **215** |
> | B · Crit · phys-only prefixes | 121 | 109 | 186 | 245 |
>
> Bankroll & ROI at example trade prices (base/resale are market inputs — edit in the CLI):
> - **A `+Proj`:** base ~30 + p85 187 → **bring ~217 div**; typical all-in ~143; resale
>   ~300 → **EV ≈ +157 div** (profit).
> - **B `Crit`:** base ~32 + p85 153 → **bring ~185 div**; typical all-in ~125; resale
>   ~90 → **EV ≈ −35 div** (make to use, not to flip).
>
> Take the **elemental-allowed prefix branch** and **settle for ≥T3 crit** rather than
> chasing T1. Re-run `pnpm bow-sim` as omen prices move; tune the modelled desecration
> odds (`pCrit`/`pAttackSpeed`/`pCritDamage`) against real reveal data.
