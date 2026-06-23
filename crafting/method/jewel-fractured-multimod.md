# Jewel Fractured Multi-Mod (premium)

## Goal

The high-investment counterpart to [jewel-crit-combo.md](jewel-crit-combo.md): lock a
high-roll **Critical Damage Bonus** foundation with a Fracturing Orb, then essence/omen the
remaining slots into an all-high-roll 4–5 mod jewel (optionally a Diamond base, optionally
corrupted), producing a top-tier jewel that sells for 15–25+ div. More currency in, far
higher ceiling, more variance.

## Target base(s)

- **Sapphire / Emerald / Ruby** — single-pool premium jewels (Sapphire for crit + cold, the
  current meta).
- **Diamond** — combined pool of all three regular jewels (made by Reforging one of each base;
  verify the current mechanic on poe2db / the crafting codex, see ../../knowledge/sources.md).
  Diamonds can roll cross-archetype combinations impossible on single bases (e.g. cold +
  weapon-specific damage + the crit pair) and command the biggest premiums.

## Starting capital

**Tier:** mid

A serious attempt runs ~5–15 div: a Fracturing Orb (~5–6 div, see ../../data/economy/latest.md
— snapshot ~1,960 ex) or a pre-fractured base, plus Greater/Perfect Essences, side-targeting
Omens, Exalted Orbs, and an optional Vaal Orb. The fracture is the gateway: it makes the
foundation permanent so later Exalts/corruption cannot destroy it.

## Recipe

The crit pair are **suffixes** (Critical Hit Chance + Critical Damage Bonus); damage mods are
**prefixes**. The plan is to permanently secure the most valuable mod, then build around it.

1. Roll or buy a jewel that has a **high-roll Critical Damage Bonus** with few other mods.
2. **Fracture it** (Fracturing Orb fractures a *random* existing mod — fewer mods = better odds
   it lands on the crit damage bonus; reroll/retry until the fracture lands on the foundation).
3. With the foundation locked, use **Greater/Perfect Essence** to guarantee a second high-value
   mod. Leave the open slot on the essence's side and use the **opposite-side Omen** (Sinistral
   / Dextral) to delete known filler — the "isolation" trick for controlling prefix vs suffix
   layout (see ../../knowledge/sources.md for the current omen list).
4. **Exalt** to fill to 4–5 mods, targeting Critical Hit Chance (suffix) + 1–2 build damage
   prefixes (cold / spell for the ice meta).
5. Once you hold **4+ excellent mods**, optionally **Vaal-corrupt** for a 5th/6th mod or a
   higher tier. The fracture protects the foundation, so a bad corrupt cannot brick the key mod
   — but corruption is still irreversible, so commit only at the end.
6. Re-pull live prices (`pnpm trade`, ../../data/economy/latest.md) and list.

## Outcome odds

Each step is individually swingy: the fracture must land on the foundation, Exalt slams must
hit on-theme high rolls, and corruption is a gamble. GGG does not publish weights; the live
market shows that fully on-theme high-roll multi-mod jewels are *very* thin in supply (often
0–2 listings — see Worked example), which is exactly why they sell high. Track weights at
craftofexile.com (see ../../knowledge/sources.md) and expect several attempts per premium
result.

## Inputs

- 1 Fracturing Orb per fracture attempt (or buy a pre-fractured crit-damage base)
- ~1–3 Greater / Perfect Essences for guaranteed mods
- ~2–4 Sinistral / Dextral Omens for side control (the isolation trick)
- ~3–6 Exalted Orbs to fill slots
- Optional: 1 Vaal Orb for the corruption finish
- Optional: 3 regular jewels (one of each base) to Reforge into a Diamond base

## Risk / variance

High. Multiple gamble gates (fracture target, Exalt rolls, corruption) and a real per-attempt
cost (~5–15 div) — unlike the cheap crit-combo roll, a failed premium attempt hurts. Mitigate
by fracturing the foundation first (so the worst case keeps the most valuable mod) and only
corrupting an already-sellable jewel. Profitable in expectation across several attempts, not
guaranteed on one.

## Why it sells

Top crit builds pay a steep premium for a jewel that stacks the crit pair with their exact
damage type at high rolls — and the supply of such jewels is tiny. Diamond jewels add scarcity
plus cross-archetype combos no single base can roll, which is why they top the market.

## Worked example

> Runes of Aldur, patch 0.5.3, 2026-06-23 (verified via official trade2 API; 1 div ≈ 345 ex)
>
> **Live premium ladder (cheapest-first asking floor):**
> - 4-mod high-roll Sapphire (cold + spell + crit pair) → **15 div** (1 listing).
> - **Diamond** + high crit pair (15% / 20%) + 2 minor mods → **25 div** (only 2 Diamonds listed total).
> - **Corrupted** crit-pair Sapphire (spell + chaos + crit pair, high roll) → **8 div**.
> - 3 *maxed* mods (≥14% each) → **0 listings** — top tier sells on contact.
>
> Input: Fracturing Orb ~5–6 div + essences/omens/exalts ~2–5 div ≈ **~8–12 div / attempt**.
> Expected sale: **15–25+ div** for an on-theme 4-mod high-roll; Diamonds and clean corrupts higher.
> Margin: high but variance-driven — a premium hit clears ~10–15 div over input; misses cost the attempt.
>
> Note: asking floors exceed real sold prices, and top-tier supply is thin (fast sales). Verify
> the Fracturing Orb price and re-pull listings before committing — this method's input cost is
> real, unlike the crit-combo roll.
