# Desecration Lich Modifier

## Goal

Use the Well of Souls Desecration system to add a exclusive Lich-pool modifier to a well-rolled Rare item, producing a piece with a mod that cannot be obtained through any other crafting route, then sell it to endgame players paying premium for those exclusive affixes.

## Target base(s)

ilvl 80+ Rare **weapon** (Jawbone) or **jewellery** (Collarbone — amulets, rings, belts) that already has 3–4 good mods and at least one open affix slot. The Lich-pool Omens (Blackblooded / Liege / Sovereign) are confirmed by GGG to function **only on weapons and jewellery**; they are incompatible with body armour, helmets, gloves, and boots (the game displays "Omen is Incompatible with this desecrating item" and the restriction is working as intended — see PoE forum thread #3842509). The base ilvl must be high enough to access the top-tier Lich modifier pool. See ../../knowledge/sources.md for exact mod entries on poe2db.tw under "Desecrated modifier."

## Starting capital

**Tier:** mid

Requires access to Act 2's Well of Souls (unlocked after completing the Desecration encounter in the campaign), a stock of Preserved Bones matched to your item slot, and enough Exalted Orbs to buy an already-decent Rare base (20–80 exalts) plus Omens to control which side (prefix/suffix) the desecration targets. A typical single-attempt budget is approximately 50–120 Exalted Orbs in direct currency plus the bone cost.

## Recipe

1. Identify which Lich pool has the mod you want to sell:
   - **Amanamu, Liege of the Lightless** — defensive mods (resistances, life, block)
   - **Ulaman, Sovereign of the Well** — offensive mods (critical strike, added elemental damage)
   - **Kurgal** — ailment mods (chance to ignite/shock/freeze, ailment damage)
2. Acquire or craft a Rare base at ilvl 80+ with 3–4 good mods already in place and an open slot on the target side (prefix or suffix). Buy from trade if crafting from scratch is over budget.
3. Activate the correct **side-targeting Omen** to force desecration onto the open side:
   - Omen of Sinistral Necromancy — forces desecrated mod onto a prefix slot
   - Omen of Dextral Necromancy — forces desecrated mod onto a suffix slot
4. Activate the correct **Lich-targeting Omen** to restrict the modifier pool to one Lich:
   - Omen of the Blackblooded — Kurgal pool
   - Omen of the Liege — Amanamu pool
   - Omen of the Sovereign — Ulaman pool
5. Apply the appropriate **Preserved Bone** to the item: Jawbone for weapons/quivers, Collarbone for jewellery (amulets, rings, belts).
6. Travel to the Well of Souls and insert the item. The Well reveals three modifiers from the targeted Lich pool. Choose the best one.
7. Optional: if all three reveals are poor, activate **Omen of Abyssal Echoes** before choosing to reroll the revealed set into a fresh three options once.
8. If the final outcome is unsatisfactory, activate **Omen of Light** and use an Orb of Annulment to remove the newly added desecrated mod, then repeat from step 3 with a fresh bone.
9. Once you have the desired desecrated mod, inspect the full item. If all mods are solid, list on trade.

## Outcome odds

Each Well of Souls reveal shows 3 out of the targeted Lich's pool of approximately 60–70 modifiers (based on poe2db.tw Desecrated modifier counts, which vary by Lich and patch; see ../../knowledge/sources.md). The chance of at least one of three reveals matching your target modifier is roughly 1-in-20 to 1-in-30 per reveal set without Echoes (3/60 = ~5% base, 3 shown → ~14% chance one is your mod), improving with Echoes omen to a second draw. Use Ancient Bones (ilvl-gated, mod level 40+) to filter out low-tier garbage from the reveal pool, which meaningfully increases the probability of a useful result at the cost of higher bone prices. Precise per-mod weights are not published by GGG; track craft outcomes at craftofexile.com (see ../../knowledge/sources.md) for community-derived approximations.

## Inputs

- 1 Preserved or Ancient Bone (slot-appropriate: Jawbone for weapons, Collarbone for jewellery) per attempt
- 1 Omen of Sinistral or Dextral Necromancy per attempt (side control)
- 1 Omen of the Blackblooded / Liege / Sovereign per attempt (Lich pool control)
- Optional: 1 Omen of Abyssal Echoes per attempt (one free reroll of the three options)
- Optional: Omen of Light + 1 Orb of Annulment per retry (to clear a bad desecrated mod and retry)
- 1 Rare base with 3–4 existing good mods and an open slot (bought or crafted beforehand)

## Risk / variance

Medium-high. The Rare base has substantial sunk cost (20–80 Exalted Orbs). If the Well reveals are all bad and you cannot recover with Echoes, you either accept a mediocre result or spend an Annulment + Omen of Light to clear the slot and retry. Annulment can theoretically remove an existing good mod rather than the desecrated one if isolation is not perfect — always verify that the open slot was cleanly empty before applying the bone. Attempts to reach a specific rare mod may take 3–8 bone applications (qualitative estimate). Budget 3 bones + associated Omens per craft attempt for realistic planning.

## Why it sells

Lich-pool modifiers — such as high-tier ailment application chances, defensive bonuses above the normal Rare mod ceiling, and specific offensive bonuses from Ulaman's pool — are unobtainable through any other means (no essence, no Exalt, no bench craft replicates them). Endgame players theory-crafting around ailment builds or wanting to push maximum defences will pay 1–10 Divines for an item carrying one of these exclusive affixes alongside otherwise strong mods.

## Expected profit (modelled)

> **Reproduce / re-price:** `pnpm desecration-sim` (`src/crafting-sim/desecration-craft.ts`)
> computes EV from the live snapshot. Costs are exact; the reveal share `w` is a modelled band.
>
> **Live finding (2026-06-26):** Omen of Light is **~8.9 div per clear** (Light + Annul), so
> "clear the bad mod and retry on the same base" costs **3–6× more than starting fresh**. Re-bone
> a **fresh cheap base** instead of Light-clearing. At a ~1-div base this craft is **~break-even**;
> it is clearly **+EV only with sub-0.5-div bases and few cycles** (use Abyssal Echoes every cycle —
> a cheap reroll to 6 shown). Keep the base cheap and **never Light-clear at current prices.**

## Worked example

> Runes of Aldur, patch 0.5.3, 2026-06-22 (illustrative)
>
> Target: Ulaman offensive mod (added cold damage, high roll) on an ilvl 82 two-handed weapon with existing phys DPS + attack speed + crit chance  
> Inputs per run: 1 Ancient Jawbone (~15 exalts) + Omen of Sinistral Necromancy (~9 exalts) + Omen of the Sovereign (~12 exalts) + Omen of Abyssal Echoes (~20 exalts) = ~56 exalts / attempt  
> Attempts taken: 4 (hit target Ulaman cold damage mod on 4th attempt)  
> Total input cost: ~224 exalts + base (~60 exalts) = ~284 exalts ≈ ~2.5 div  
> Expected sale: ~5–8 div for a 5-mod weapon with exclusive Ulaman added damage mod  
> Margin:        ~2.5–5.5 div per successful craft
>
> Note: Omen prices are especially volatile mid-league as supply from Ritual accumulates. Verify current prices before committing bones. Ancient Bone prices drop as league matures.

> **Verified prices — Runes of Aldur, 2026-06-23 (official trade2 + poe2scout; 1 div ≈ 348 ex).**
> - **Inputs are cheap and confirmed:** Omen of Sinistral/Dextral Necromancy ~3 ex, Omen of
>   the Sovereign ~3 ex, Omen of the Liege ~1 ex, Omen of the Blackblooded ~45 ex, Omen of
>   Abyssal Echoes ~92 ex. Method cost is dominated by the **base item**, not omens.
>   **Gap:** poe2scout does not track Preserved/Ancient Bone prices — source them in-game.
> - **Output (base-weapon proxy):** I could not filter the desecrated mod directly, so I
>   priced the underlying weapon. A strong 3-mod martial weapon floors at **5–30 ex**,
>   premium ones **1 div+**; the exclusive Lich mod stacks a premium on top of that.
>
> **Verdict: the real earner of the four — but selection-dependent.** Profitable only when
> the base is already top-tier AND the exclusive mod is meta-relevant (cold/freeze →
> Kurgal/Ulaman this patch). A random Lich mod on a weak base still sells near the ~5–10 ex
> floor. Run it selectively; don't desecrate mediocre bases. (Asking floors exceed real
> sold prices; the desecrated-mod premium is inferred, not directly measured.)
