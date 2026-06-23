# Jewel Crit-Combo Roll

## Goal

Roll cheap/spare base jewels into rare jewels carrying the universal **crit pair**
(increased Critical Hit Chance + increased Critical Damage Bonus) plus one or two
high-roll, build-matched damage mods, then sell the hits to crit-scaling builds. A
near-zero input floor and a 1–15 div ceiling make this a high-volume lottery craft —
ideal when you have a large stock of spare jewels.

## Target base(s)

Any rare-able jewel base. Pick the base whose mod pool biases toward your target:

- **Sapphire** (Int) — spell/cold/crit stats; the dominant base for crit + cold (ice meta).
- **Emerald** (Dex) — attack/projectile, weapon-specific attack speed (bow/quarterstaff).
- **Ruby** (Str) — physical/bleed/ignite.
- **Diamond** — combined pool of all three (rare; via Reforging one of each base — verify
  current mechanic on poe2db/codex, see ../../knowledge/sources.md).

Note jewel attack-speed and weapon-damage mods are **weapon-type-specific** ("with
Quarterstaves", "with Bows"), so match the base/roll to the build's weapon.

## Starting capital

**Tier:** low

Base jewels are near-free (1 ex or self-found) and the rolling currency (Transmutation /
Augmentation / Regal / Exalted, or Chaos for rerolls) is cheap. The cost is **volume of
attempts**, not per-attempt currency. A meaningful session is a stack of jewels plus a few
dozen common orbs; optionally a few jewel essences ("Liquid Emotions") to guarantee a mod.

## Recipe

The crit pair are **suffixes** (both observed as S1-tier); the damage mods are **prefixes**
(P1). A perfect jewel is 2 crit suffixes + 1–2 damage prefixes, all high roll.

1. Take a base jewel matched to your target (Sapphire for crit+cold, etc.).
2. Transmute → Augment to a 2-mod Magic jewel. Keep only if it already has one crit mod or a
   high-roll target damage mod; otherwise reroll (Alteration) or move to the next jewel.
3. Regal to Rare (adds a 3rd mod), then Exalt to fill remaining slots, aiming for both crit
   suffixes + a build damage prefix.
4. **Salvage near-misses:** a jewel essence / Liquid Emotion removes a random mod and adds a
   guaranteed one — use it to convert a 3-mod (crit pair + junk) into a 4-mod by swapping the
   junk for a damage mod or the missing crit mod. (Confirm the exact jewel-essence list for
   the current patch — see ../../knowledge/sources.md.)
5. Keep anything with **both** crit mods at high roll; vendor/sell the rest at floor.
6. List hits; re-pull live prices before pricing (../../data/economy/latest.md, `pnpm trade`).

## Outcome odds

Hitting both crit suffixes at high roll plus a matched damage prefix on one jewel is rare per
attempt — this is a volume play, not a targeted craft. Exact per-mod weights are not published
by GGG; the practical model from live listings: most rolled jewels are junk (floor value),
a minority land the crit pair, and a small fraction reach the 4-mod high-roll tier. Track
weights at craftofexile.com (see ../../knowledge/sources.md). Use essences to raise the hit
rate on the mod you can guarantee.

## Inputs

- A stock of base jewels (spare / self-found / ~1 ex each)
- Transmutation + Augmentation + Regal + Exalted Orbs (and Alterations for Magic rerolls)
- Optional: jewel essences / Liquid Emotions to guarantee or fix a mod
- Optional: Chaos Orbs to reroll a Rare that has the crit pair but bad prefixes

## Risk / variance

Low downside, high variance. A miss sells at the ~1 ex floor, so per-jewel loss is negligible
— the cost is the rolling currency spread across many attempts. There is no expensive base to
brick. Profit is realized across a session of many jewels, not on any single one.

## Why it sells

Critical Hit Chance + Critical Damage Bonus scale nearly every crit build, and the meta this
patch (Ice Shot/Ice Strike/Monk crit, see ../../knowledge/meta.md) leans heavily on crit +
cold. Buyers pay a steep premium for jewels that stack the crit pair with their build's damage
type because the exact 4-mod combination is rare on trade.

## Worked example

> Runes of Aldur, patch 0.5.3, 2026-06-23 (verified via official trade2 API; 1 div ≈ 341 ex)
>
> **Live value ladder for the crit-combo jewel (cheapest-first asking floor):**
> - Crit pair at *moderate* roll (≥8% each), 2–3 mods → **~1 ex** (abundant junk).
> - Crit pair at *high* roll (~15% crit chance + ~16% crit damage bonus), 3 mods → **80 ex – 1 div**.
> - Crit pair (high) + a matched damage mod (cold/spell/chaos), 4 mods → **5 div**.
> - Cold + crit pair (high), 3 mods → **1 div**; with a 4th useful mod (max ES / spell dmg) → **10–15 div**.
>
> Input per hit: a spare jewel + a handful of common orbs (≈ a few ex). Misses ≈ 1 ex floor.
> Expected sale: ~1 div for a clean crit pair, **5–15 div** for a 4-mod high-roll.
> Margin: dominated by hit rate — each high-roll hit is ~1–15 div over a near-zero input.
>
> Note: asking floors run above real sold prices; the crit pair are suffixes and damage mods
> prefixes, so target 2 suffix + 2 prefix. Re-pull with `pnpm trade` before pricing.
