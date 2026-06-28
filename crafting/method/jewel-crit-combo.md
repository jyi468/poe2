# Jewel Crit-Combo Roll

## Goal

Produce rare jewels carrying the universal **crit pair** (increased Critical Hit Chance +
increased Critical Damage Bonus) and sell the hits to crit-scaling builds. The cheap volume
engine this patch is the **Liquid Emotion** play: buy an abundant rare jewel that already has
**one natural crit mod**, then craft the *other* crit mod onto it with a Liquid Emotion. A
near-zero input floor and a 1–15 div ceiling make it a high-volume +EV loop — ideal when you
can source a lot of cheap one-crit jewels.

## The Liquid Emotion engine (read this first — two mechanics decide everything)

A Liquid Emotion is the jewel-only essence analogue (drops from Delirium; tracked under the
`delirium` category — `pnpm prices delirium`). Two confirmed rules shape the whole strategy:

1. **It is remove-1 / add-1 on a RARE jewel** — verbatim: *"Removes a random modifier and
   Augments a Rare Basic Jewel with a new guaranteed Crafted modifier."* It does **not** simply
   fill an open slot. So the natural crit mod you bought can be **deleted by the random removal**.
   For a jewel of **N** mods, P(the crit survives) = **(N−1)/N**. → A sparse **1-mod jewel is a
   guaranteed brick** (the crit *is* the only mod); you want the crit mod **plus junk to dilute**
   the removal (4 mods → 75% keep). This inverts the naive "buy a clean 1-crit jewel" instinct.
2. **One crafted mod per item.** The emotion's mod is a *crafted* mod, and PoE2 0.5 allows only
   one. So you can never emotion in *both* crit mods — the pair must be **1 natural + 1 crafted**.
   The existing crit must be a real explicit roll; the emotion supplies the second.

The two crit emotions (both add a **suffix**, live 2026-06-26):

| Emotion | Crafts | Price |
|---|---|---|
| **Liquid Despair** | increased Critical Hit Chance | ~6.7 ex (0.018 div) |
| **Concentrated Liquid Fear** | increased Critical Damage Bonus | ~26.4 ex (0.073 div) |

So buy a jewel with a **natural crit *chance*** → add crit *damage* with Concentrated Liquid Fear;
or a natural crit *damage* jewel → add crit *chance* with the cheaper Liquid Despair.
**Caveat (verify in-game):** whether the random removal is restricted to the matching side
(suffix) is unconfirmed — test on a 1-ex jewel before buying a stack.

## Target base(s)

Any rare-able jewel base. Pick the base whose mod pool biases toward your target:

- **Sapphire** (Int) — spell/cold/crit stats; the dominant base for crit + cold (ice meta).
- **Emerald** (Dex) — attack/projectile, weapon-specific attack speed (bow/quarterstaff).
- **Ruby** (Str) — physical/attack/fire/warrior stats. **No crit pool** — the target pair is
  **Global Physical Damage + Attack Damage** instead (see *Strength / Ruby variant* below).
- **Diamond** — combined pool of all three (rare; via Reforging one of each base — verify
  current mechanic on poe2db/codex, see ../../knowledge/sources.md).

Note jewel attack-speed and weapon-damage mods are **weapon-type-specific** ("with
Quarterstaves", "with Bows"), so match the base/roll to the build's weapon.

## Starting capital

**Tier:** low

Base jewels are near-free (1 ex or self-found) and the rolling currency (Transmutation /
Augmentation / Regal / Exalted, or Chaos for rerolls) is cheap. The cost is **volume of
attempts**, not per-attempt currency. A meaningful session is a stack of jewels plus a few
dozen common orbs; plus the Liquid Emotion (jewel-only essence analogue) that crafts the pair-mate crit.

## Recipe

The crit pair are **suffixes** (both S1-tier); damage mods are **prefixes** (P1). A perfect
jewel is 2 crit suffixes + 1–2 damage prefixes, all high roll. The emotion engine targets the
crit *pair* deterministically; everything else is the natural roll you bought or Exalt for.

**The emotion loop (primary, cheap, high-volume):**

1. Source **rare** jewels (Sapphire for crit+cold, the meta) that already carry **one natural
   crit suffix** — crit chance *or* crit damage — **plus a few other mods**. These are abundant
   and cheap. **Do not buy sparse 1-mod jewels** — the emotion would delete the lone crit.
   Aim for **3–4 mods** so the random removal most likely eats junk, not the crit (keep = (N−1)/N).
2. Apply the **complementary** crit emotion: natural crit chance → **Concentrated Liquid Fear**
   (crafts crit damage); natural crit damage → **Liquid Despair** (crafts crit chance, cheaper).
3. The emotion removes one random mod and adds the crafted crit. **Keep** every jewel that comes
   out with **both** crit mods (≈75% of 4-mod attempts); the rest dropped the natural crit → floor.
4. Optional finish on a keeper: **Exalt** an open slot for a build damage mod (cold/spell for the
   ice meta). Exalt-added mods are *not* crafted, so they don't conflict with the one-crafted limit.
5. List keepers; re-pull live prices before pricing (`pnpm prices delirium`, `pnpm trade`,
   ../../data/economy/latest.md).

**Roll-from-scratch (fallback, when you can't source natural-crit jewels):** Transmute → Augment
→ Regal → Exalt a spare base toward a crit suffix, then run the emotion loop above. Higher orb
spend per jewel; only worth it if cheap natural-crit bases dry up.

## Outcome odds

With the emotion engine the crafted crit is **guaranteed**; the only randomness is whether the
removal keeps your natural crit — **P(keep) = (N−1)/N** for an N-mod jewel (75% at 4 mods). The
roll *value* of each crit is random within its range and not controllable (no published weights;
track at craftofexile.com — see ../../knowledge/sources.md). So a 4-mod buy lands the crit pair
~75% of the time; the high-roll + matched-damage premium on top is the lottery tail. Roll-quality
is why a clean pair is ~1 div but a maxed pair + cold mod clears 10–15 div.

## Inputs

- A stock of **rare jewels with one natural crit suffix + a few junk mods** (the volume input —
  cheap; Sapphire for the cold/crit meta)
- **Liquid Despair** (~6.7 ex, crafts crit chance) and/or **Concentrated Liquid Fear** (~26.4 ex,
  crafts crit damage) — one per attempt, matched to the missing crit
- Optional: Exalted Orbs to add a build damage mod to a keeper's open slot
- Fallback only: Transmutation / Augmentation / Regal / Alteration to roll a crit base from scratch

## Risk / variance

Low downside, high variance. The only real risk is the emotion's random removal nuking the
natural crit (a ~1 ex brick); per-jewel loss is just the base + emotion (~0.1 div). No expensive
base to brick. Profit is realized across a session of many jewels, not on any single one.
**Mitigate the removal risk by buying 3–4-mod jewels** (more junk to absorb the removal).

## Expected profit (modelled)

> **Reproduce / re-price:** `pnpm jewel-sim` (`src/crafting-sim/jewel-craft.ts`) computes EV from
> the live emotion price. EXACT: emotion cost (`delirium` category in the snapshot). MODELLED:
> base cost, sale bands, and the uniform-removal `keepProb`.
>
> **Live finding (2026-06-26, 1 div ≈ 364 ex):** with **Concentrated Liquid Fear** at ~26 ex and a
> clean crit pair selling ~1.5 div, the loop is strongly **+EV** and scales on volume:
>
> | Bought jewel | P(keep crit) | Cost / keeper | EV / attempt (central) |
> |---|---|---|---|
> | 2-mod (crit + 1 junk) | 50% | 0.19 div | **+0.66 div** |
> | 3-mod (crit + 2 junk) | 67% | 0.14 div | **+0.91 div** |
> | 4-mod (crit + 3 junk) | 75% | 0.12 div | **+1.03 div** |
>
> More junk = higher keep rate and lower cost-per-keeper, so **prefer 4-mod jewels**. Even the
> unlucky band (low sale) stays positive. The cap is *sourcing* enough cheap natural-crit jewels.

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

## Strength / Ruby variant — the phys + attack pair

Rubies have **no crit pool**, so the crit emotion engine above does not apply. The Ruby analog
of the crit pair is **% increased Global Physical Damage + % increased Attack Damage** (both
**prefixes**, P1; cap ≈ 15% phys / ≈ 14–15% attack). It scales most Strength attack builds
(maces/warrior, spears). Because the pair are *prefixes*, the suffix-crafting crit emotions
(Despair/Fear) don't help here — roll/Exalt toward the pair, and check `pnpm prices delirium`
for a phys/attack Liquid Emotion before assuming one exists.

As with crit jewels, **the 3rd/4th mods decide whether it's 1 ex or 1 div** — the pair alone is
cheap; the pair + *useful supports* is the package buyers pay for:

- **good supports:** % of Life Leeched · Stun Threshold · Stun Buildup · Life Regen rate ·
  Attack Speed *with your weapon* (Maces / Quarterstaves / Spears)
- **junk that floors it at ~1 ex:** Banner/Glory generation · "Gain Rage on/when Hit" ·
  Minion Physical Damage Reduction · Presence Area of Effect
- **not in the Str pool:** % maximum Life returns **0 listings** with the pair — don't aim for it on Ruby.

> **Live value ladder — Ruby phys+attack pair (Runes of Aldur, 2026-06-26; verified listings,
> 1 div ≈ 374–415 ex — divine rate was volatile this day, treat ex loosely).** Re-pull:
> `pnpm trade --category jewel --type Ruby --stat explicit.stat_1310194496:13 --stat explicit.stat_2843214518:12 --stat <support>`
> - Pair + **junk filler** (Rage-on-hit, Banner) → **~1 ex** — *even with high Life Leech, a single junk 4th mod floors it.*
> - Pair + **one decent support, lower rolls** → **~25 ex**
> - **High/near-max pair + 1–2 clean useful supports → ~1 div** (verified: gphys15+attack12+stun-threshold13; gphys13+attack12+stun-buildup20+leech8)
> - **Near-max pair + two high supports** (leech 13 + regen) → **~5 div**
>
> Smoking gun: the *same* pair + Life Leech 11 sells at **1 ex** with a junk Rage 4th mod but
> **1 div** with clean warrior supports — value is in the support quality, not the pair alone.
> Demand is thinner than Sapphire/Emerald (cold/crit meta), so Rubies are mostly a 1-ex
> commodity and liquidity is shallow. **Ignore the descending-sort "hundreds of div" listings** —
> that's the trade-tool mirror/other-currency misread (see crafting-flowchart §4), not a real price.

Other Ruby angles (lower demand, **~1 ex floor**): Fire Damage + Attack (fire-attack / ignite)
and Damage with Maces + Attack/Stun Buildup (mace-warrior). The **phys + attack pair is the only
Ruby combo that reliably reaches div-tier.**
