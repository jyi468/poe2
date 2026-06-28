# Omen-Slam Bow (fractured-base endgame craft)

> Method: lock **+Proj** with a fractured base, then fill the 3 prefixes and 2 open suffixes
> with **Exalt + Sinistral/Dextral Exaltation**. Exalts add one random mod with a **minimum
> modifier level** (Exalted = none, Greater = 35, Perfect = 50) — they set the *tier* and
> shrink the pool, they do **not** guarantee the top tier. Two builds: **Greater** (cheap,
> T3 floor) and **Perfect** (chase T1). EV from `pnpm bow-sim`. Exact mechanics:
> `crafting/reference/` (regenerate with `pnpm reference`).

## Goal

Craft a ~700+ pDPS endgame crit bow (Obliterator / Warmonger) carrying **+4 to Level of all
Projectile Skills**, for a projectile-attack build or to sell.

## Target base(s)

- **Obliterator Bow** (ilvl 78 base, phys 62–115, 5.00% crit, atk time 909, **−50% proj range**)
- **Warmonger Bow** (ilvl 77 base, phys 56–84, 5.00% crit, atk time 833, no downside)

Both are **craftofexile `id_base 20`** → identical craftable mod pool (weights in
`crafting/reference/bow-affix-weights.md`). Buy the base **already fractured** at ilvl 81 —
don't fracture yourself (the Fracturing Orb locks a *random* mod).

## The key mechanic — exalts are level-floor filters, not "top tier"

`crafting/reference/currency.md`: **Greater Exalted Orb = min mod level 35**, **Perfect
Exalted Orb = min 50**. The floor restricts which *tiers* can roll, which also shrinks the
pool — so a target's per-slam share *changes* with the orb. Crit is the lever:

| Per-slam target | Exalted (min 1) | **Greater (min 35)** | Perfect (min 50) |
|---|---|---|---|
| damage prefix (phys/ele/hybrid) | 87.2% | 86.4% | 90.4% |
| **crit chance ≥T3** | 1.6% | **3.6%** ✓ | 2.4% (T2+) |
| attack-speed / crit-dmg | 14.1% | 5.2% | 2.4% |

**Greater Exalt is the best crit tool** (3.6% ≥T3) and costs ~**0.01 div** — essentially
free to spam. **Perfect Exalt** forces crit T2+ and top prefixes but costs ~**2.4 div** each,
which is the whole reason the Perfect build is ~2.5× pricier.

## Recipe (order matters — protect the expensive crit)

Two flowcharts (Greater build, Perfect build) on the Bow tab. The ordering is the same:

**1. Setup.** Buy the fractured ilvl-81 base; strip to the bare fracture. The **+Proj
fracture is a suffix and is annul-IMMUNE** — that is what makes the suffix hunts safe.

**2. Attack speed first (cheap).** **Omen of Dextral Exaltation + a plain Exalted Orb**
(~free, 14%). The suffix side is otherwise empty, so a junk suffix is the *only* removable
suffix (fracture immune) → a **RAW Orb of Annulment (~0.6 div) clears it cleanly**.

**3. Crit last.** **Omen of Dextral Exaltation + Greater Exalted Orb** (Greater build, 3.6%)
or **Perfect Exalted Orb** (Perfect build, 2.4%). On a junk, **RAW annul** — it can only hit
the *cheap attack-speed keeper* (re-add it later). Because crit is the **last** mod placed,
it is never annulled beside a junk, so the expensive crit is protected.

**4. Prefixes last — 3 damage mods.** **Omen of Sinistral Exaltation + the build's exalt.**
A junk prefix must be cleared with **Omen of Sinistral Annulment + Orb of Annulment** — this
**confines the annul to prefixes** so it can't eat the crit / attack-speed suffixes. It costs
~12 div, but damage prefixes hit ~87–90%, so junk is rare here.

**5. Finish.** ~4 Divine Orbs toward high rolls; optional Blacksmith's Infuser for >20% quality.

> **Why raw annul is dangerous (and where targeted annul earns its cost).** Raw Orb of
> Annulment removes a *random* mod, so once keepers exist it can delete one. The fix is
> ordering + the immune fracture (so most removals are clean raw annuls on an isolated side),
> and a **Sinistral/Dextral Annulment omen** only at the moment a junk is trapped beside
> keepers on the *other* side. Targeted annul is *expensive* (Sinistral ~12d, Dextral ~6.5d),
> so you use it sparingly, not on every miss.

> **Don't desecrate crit, and don't essence it.** Desecration fights the same crit-type
> rarity with ~8.6-div Omen-of-Light clears (one desecrated mod at a time) — `pnpm bow-sim`
> has it ~level with the near-free Greater slam, so there's no reason. **Essence-Seeking is
> impossible**: essences upgrade a **Magic** base to Rare, and a +Proj base is already a
> fractured **rare**. Recombinator is removed in 0.5.

## Fracture decision — which base to buy

- **`+Proj` is the only version worth crafting.** It isn't slammable or desecratable, and
  +levels is what the market pays for (a separate skill multiplier, scarce).
- **`crit`-fractured with no +levels is a flooded item** — crit≈8% / pDPS≥450 rolls **floor
  at ~0.5 div** (live trade2, 2026-06-28). Crafting one costs ~90 div to make a sub-1-div
  item — **buy it, don't craft.**

## Output value (live trade2, equipment filters, 2026-06-28)

| Finished bow | Real floor |
|---|---|
| crit ≥8% · pDPS ≥450 · **no +levels** | **~0.5 div** (flooded — worthless) |
| **+4 Proj** · crit ≥8% (T3) · pDPS ≥450 | **~130 div** (Greater-build target) |
| **+4 Proj** · crit ≥9% (T1) · pDPS ≥600 | **~460–630 div** (Perfect-build target) |

## Worked example

> Runes of Aldur, patch 0.5, 2026-06-28 (live `data/economy/latest.json`, 1 div ≈ 364 ex).
> Consumables only (base NOT included), `pnpm bow-sim` (30k trials):
>
> | Build (all +Proj, elemental prefixes) | mean | p50 | p85 | p95 | bankroll | EV |
> |---|---|---|---|---|---|---|
> | **Greater (min 35) · crit T3+** ✅ | **93** | 70 | 166 | 253 | ~196d | **+77d** |
> | Perfect (min 50) · crit T2+ · chase T1 | 235 | 170 | 431 | 658 | ~461d | +195d |
> | Greater build, but desecrate crit | 94 | 73 | 167 | 247 | ~197d | +75d |
>
> - **Greater build (recommended):** Greater Exalt ≈ free, so spamming crit at 3.6% is cheap.
>   Bring **~150–200 div**, expect ~123 all-in, resale ~130 (floor) to ~200 (settled) → **EV
>   ≈ +77 div**. Lowest cost and variance; lands crit T3/T2/T1.
> - **Perfect build (chase T1):** forces crit T2+ and top-tier prefixes for the ~460–630 tier,
>   but Perfect orbs (~2.4d) drive cost to ~235 mean and a **fat tail (p95 ~658 > resale)** —
>   only run it with a deep bankroll and tolerance for variance.
> - **Crit-fractured:** resale ~0.5 → strongly negative. Buy, don't craft.
>
> Re-run `pnpm bow-sim` as prices move; refresh mechanics/weights with `pnpm reference`.
