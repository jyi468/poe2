# Crafting Ladder — building a bankroll at ~15–40 div

A staged learning path that earns while it teaches the deterministic crafting
toolkit. Built for a mid bankroll (~15–40 div) that wants **active** profit and to
**learn the techniques** — not to chase a single hero item. Each rung teaches one
technique and funds the next, so you never risk the bankroll to learn.

> Why a ladder, not a hero craft: endgame "flex" items (e.g. an 800-div
> quarterstaff) are real but require hitting a top-tier DPS bar across ~6 near-max
> mods, plus capital to absorb the variance and a thin market to sell into. The
> currency that *funds* those crafts comes from liquid, repeatable crafts sold in
> volume and reinvested. Build the bankroll first; the hero item is downstream.

## The deterministic toolkit (what every rung practises)

The clever parts of any big craft scale down to cheap items. Learn these:

| Technique | What it does | Cost to use (live ~2026-06-26) |
|-----------|--------------|--------------------------------|
| **Essence-lock** | Guarantee a specific mod; white/blue → rare | Greater/Perfect Essence ~**free** (~0.005 div) |
| **Omen side-control** | Force an Exalt slam onto prefix *or* suffix | Sinistral/Dextral Exaltation ~**0.05 div** |
| **Fracture-lock** | Buy a base with the chase mod *permanently* locked | in the base price |
| **Annul-reset** | Bad roll? Annul it back rather than brick | Orb of Annulment ~0.68 div |
| **Perfect-Exalt finish** | Guarantee a *high tier* on the final slot | Perfect Exalted Orb ~2.4 div (use once, near the end) |
| **Targeted removal** | Strip one *specific* mod | Whittling ~6.6 + Erasure ~7–8 div — **expensive, rare** |
| **Desecration** | Add an exclusive Lich-only mod | Necromancy + Lich omens ~free + a bone |

Core principle: **win with the cheap omens (essence, side-control) and annul-resets;
the expensive omens (Whittling, Erasure, Light) are where margins die.** Re-pull
`../../data/economy/latest.md` before committing — these prices rot.

## The rungs (each funds the next)

### Rung 1 — Lean movement boots · *learn: essence-lock + side-control + annul-reset*
Cheapest reps, sells instantly. Your cash-flow floor. Keep ~5 div rolling here.
- Method: [`crafting/method/movement-speed-boots.md`](../../crafting/method/movement-speed-boots.md)
- EV: `pnpm boots-sim` → **lean ≈ +0.2 div/craft** (volume game; **skip** Perfect Exalt /
  Whittling on ordinary boots — they are EV-negative there).

### Rung 2 — Fractured jewels · *learn: fracture-lock + targeted fill*
Buy a jewel with a good *fractured* mod (cheap, locked), build around it with
controlled slams. The hero-craft technique at ~1/20th the cost; downside capped by
the cheap base. Outputs ~10–25 div on a hit.
- Method: [`crafting/method/jewel-fractured-multimod.md`](../../crafting/method/jewel-fractured-multimod.md)

### Rung 3 — Desecration on rings/amulets · *learn: Lich omens + reset discipline*
Add an exclusive Lich mod and sell the premium. The real earner at this tier —
**but only with cheap bases and no Light-clearing.**
- Method: [`crafting/method/desecration-lich-modifier.md`](../../crafting/method/desecration-lich-modifier.md)
- EV: `pnpm desecration-sim`. Live finding: **Omen of Light is ~8.9 div/clear**, so
  *re-bone a fresh cheap base instead of clearing a bad mod*. At a 1-div base it is
  ~break-even; **+EV lives in sub-0.5-div bases + few cycles** (use Abyssal Echoes
  every cycle — cheap reroll to 6 shown).

### Rung 4 — "One mod away" Perfect-Exalt flips · *learn: finish + buy-low*
Buy an under-priced item one deterministic step from valuable (a strong 5-mod base
with an open slot → one Perfect Exalt; a near-complete jewel → one essence), finish
it, resell. Low variance, scales with whatever you have stacked.

## Operating rules

- **Liquidity beats per-craft margin.** A 0.5-div craft that sells in minutes
  compounds faster than a 5-div craft that sits for a week. Lead with what turns over.
- **Keep input cheap; reserve the expensive omens** (Perfect Exalt, Whittling,
  Erasure, Light) for items whose clean output genuinely clears several div.
- **Settle, don't chase.** Most losses are over-rolling a good-enough item.
- **Buffer ~5 div** for omen/essence price spikes. Re-pull prices each session
  (`pnpm economy`) and re-check method EVs (`pnpm boots-sim`, `pnpm desecration-sim`).

See [`crafting/method/README.md`](../../crafting/method/README.md) for the full profit
board and [`knowledge/meta.md`](../meta.md) for the demand side (what sells).
