# Movement-Speed Boots

## Goal

Buy the hard part — a boots base that already rolls high **movement speed** — then craft
resistances, life, and defence around it deterministically. Movement speed is the bottleneck
suffix every build wants, so a boot pairing 30%+ MS with two resists and high life sells across
the entire player base. The trick is that you don't gamble *for* movement speed; you acquire a
base that has it and add value with cheap, side-controlled slams.

## Target base(s)

ilvl 80+ boots, base chosen to match demand:

- **Evasion / Evasion-Energy-Shield hybrid** — the meta defence layer this patch (Deadeye,
  Spirit Walker, Pathfinder; see `../../knowledge/meta.md`). Widest buyer pool.
- **Energy Shield** — for ES/CI casters and stackers; thinner demand but higher top-end.
- **Armour / Armour-Evasion** — for Witchhunter / heavy-armour builds.

**ilvl 82 is the breakpoint** — the top movement-speed tier (≈30–35%) only appears at **ilvl 82+**;
the tier below it unlocks at **ilvl 70** (confirmed via community crafting data, 2026-06-26 — see
Sources in the worked example). So buy an **ilvl 82** base to have a shot at T1 MS, and treat
**25%+** as the floor a buyer will accept. Movement speed only appears on Magic+ items, so you are
buying a Magic or partial Rare base that already carries the MS suffix — never a white base.
Premium "≈50% MS" boots are this crafted ≈30–35% mod **stacked with a movement-speed rune** in the
socket plus charm/passive sources — worth advertising in the listing. Confirm live tier numbers on
poe2db.tw before relying on them (`../../knowledge/sources.md`); no game data is hard-coded here.

## Starting capital

**Tier:** low–mid

The base item is the only meaningful cost. A Magic boot with a 25–30% MS suffix is a few to a few
dozen Exalts; a Magic boot already carrying MS + one good resist is more. Budget roughly **0.3–1
div per craft** including consumables. Higher tier (`mid`) only if you push top tiers with Perfect
Exalted Orbs (see Inputs).

## Recipe

1. **Acquire the MS base.** Buy a Magic ilvl 80+ boot whose suffix is **25%+ movement speed**
   (ideally 30%+). One-mod Magic MS boots are cheap; a two-mod Magic boot with MS + a useful
   resist saves you a step. Confirm the build-appropriate base type from the target list above.
2. **Thin junk if needed.** If the base is Magic with MS + a useless second mod, use an **Orb of
   Annulment** to try to strip the junk mod, leaving a clean MS-only Magic boot. Skip if MS is the
   only mod or the second mod is already a resist you want.
3. **Lock a resistance with a Greater Essence.** Apply a resist-aligned **Greater Essence**
   (Grounding / Insulation / etc.) to upgrade the boot to Rare with a guaranteed resistance,
   preserving the existing MS suffix. You now have MS + 1 resist locked.
4. **Add a prefix (life / defence).** Use **Omen of Sinistral Exaltation + a regular Exalted Orb**
   (the omen ~0.05 div, the Exalt ~0.003 div — effectively free) to force the slam onto the
   **prefix** side, targeting high life, %ES, or %evasion. **Do NOT default to a Perfect Exalted
   Orb here** — at ~2.4 div it costs more than a typical finished boot sells for; reserve it for a
   genuinely top-end base (see Expected profit).
5. **Add the remaining suffix (second resist / attributes).** Use **Omen of Dextral Exaltation +
   an Exalted Orb** to slam the open **suffix** side for a second resistance or a needed attribute.
   Note: MS + 2 resists already consumes all three suffix slots, so the realistic top-end is
   **30% MS + 2 resists** (suffixes) **+ high life + %defence** (prefixes).
6. **Fill to 5–6 mods**, alternating Sinistral/Dextral Exaltation omens to control sides.
7. **Accept misses — do not "recover" cheap boots.** If a slam lands a dead mod, sell the boot as
   a partial roll. **Omen of Whittling costs ~6.6 div** (live, 2026-06-26) — using it to fix a mod
   on a boot worth 1–3 div is strictly EV-negative. Whittling/Annul recovery is justified **only**
   on a near-top-end base whose clean outcome clears ~6+ div. See Expected profit.
8. List on trade. Lead the listing with the MS roll and resist totals — that is what buyers search.

### Optional finish — Essence of Hysteria (guaranteed 30% MS)

**Essence of Hysteria** adds a guaranteed **30% movement speed** to boots (remove-1/add-1 on a Rare),
the only deterministic MS source — there is no standard MS essence. **It is a narrow finishing move,
not a default**, for two reasons confirmed against live trade (2026-06-26):
- **Raw 30–35% MS boots floor at ~1–2 ex.** Hysteria costs **~0.84 div** (`pnpm prices essences`). Paying
  0.84 div to *add* MS only nets out if the rest of the boot is already premium (life + 2 capped resists
  + chaos) **and** its suffixes are full so MS cannot just be slammed for ~free.
- **It corrupts the item** — no further crafting after, and it removes a *random* existing mod, so only
  apply when there is a junk mod to lose.

Use it to rescue an otherwise-finished, suffix-full boot that is missing only MS. For the normal lean
path, keep buying a base that already rolled MS (step 1) — it is far cheaper. See
[`essence-value-map.md`](essence-value-map.md) for the full essence cost/value picture.

## Outcome odds

Movement speed is bought, not rolled, so it is effectively guaranteed; the essence resist is
guaranteed; variance lives only in the 2–4 added prefix/suffix mods. With side-control omens you
choose the *side* of each slam, but the *tier and stat* are still random within that side's open
pool. Order-of-magnitude: on an ilvl 82 boot a side-forced Exalt has roughly **30–40%** chance of
a useful resist/life/defence mod (the rest of the side's pool is attributes, mana, niche stats).
Expect **2–4 slams** to reach a clean two-resist + life result. No craftofexile-sourced exact
weight is embedded here — query craftofexile.com for live per-mod weights on your exact base/tier
(see `../../knowledge/sources.md`).

## Inputs

- 1 Magic ilvl 80+ boot base with a 25%+ movement-speed suffix (bought)
- 1 resist-aligned **Greater Essence** (~1–2 ex)
- 2–4 **Exalted Orbs** for filling slots (~1 ex each ≈ free)
- **Omen of Sinistral / Dextral Exaltation**, ~1 per slam, for side control (live ~0.05 / ~0.014
  div — cheap; the workhorse consumable here)
- **Premium-only, EV-negative on ordinary boots:** **1 Perfect Exalted Orb** (~2.4 div) to
  guarantee one high tier; **Orb of Annulment** (~0.68 div) / **Omen of Whittling** (~6.6 div) for
  recovery. Only on a base whose clean outcome clears ~6+ div — see Expected profit.

## Risk / variance

Low–medium, and notably safer than slam-for-MS approaches because the expensive stat (movement
speed) is locked in before you spend on the rest. Worst case a slam adds a dead mod; you recover
with Whittling + Chaos or accept a single-resist boot, which still sells at a reduced price. The
real risk is over-investing Perfect Exalted Orbs (3.2 div each) into a base that can't support a
divine-level sale — keep Perfect Exalts for genuinely premium bases (high MS + already-good rolls).
A partial result (30% MS + one resist + life) is never bricked; it floors at a low-ex sale.

## Why it sells

Movement speed is the universal gating stat: every build, every archetype, every progression
character wants boots, and a boot under ~25% MS is close to unsellable regardless of its other
mods. Pairing guaranteed 30% MS with resistances and life patches two of the biggest gearing
bottlenecks at once (mobility + resist caps), so the buyer pool is the entire player base rather
than one archetype. That breadth is why even mid-roll movement boots clear quickly, and clean
tri-stat pieces on a meta base (evasion/ES this patch) command a premium. See
`../../knowledge/meta.md` for the demand side.

## Expected profit (modelled)

> Costs are **live/exact** (poe2scout snapshot 2026-06-26, 1 div ≈ 345 ex). The outcome
> probabilities are **modelled estimates** — GGG does not publish spawn weights and PoB ships
> only can-spawn flags (same caveat as `src/crafting-sim/magic-craft.ts`). Treat EV as a band,
> not a guarantee. Re-pull prices and sanity-check P-values on craftofexile before relying on this.
>
> **Reproduce / re-price:** `pnpm boots-sim` (`src/crafting-sim/boots-craft.ts`) recomputes the
> tables below from the live economy snapshot; edit the modelled `u/h/R` bands in that file to
> match craftofexile weights. The numbers here are its central-band output.

**Cost per finished boot (exact inputs):**

| Variant | Spend | All-in |
|---------|-------|--------|
| **Lean** (regular Exalts + side omens) | base ~0.1–0.2 + essence ~0.005 + 4× Exalt 0.012 + 3 Sinistral + 1 Dextral omen ~0.16 | **~0.3–0.4 div** |
| **+1 Perfect Exalt** (guarantee one T1 tier) | lean + 2.40 | **~2.7 div** |
| **+Omen of Whittling** (per recovery) | + 6.60 each | **margin-negative** |

**Modelled outcome distribution (lean path):**

| Outcome | ~P | Asking |
|---------|----|--------|
| Premium — 30% MS + 2 capped resist + 80+ life + defence | ~8% | ~3 div |
| Good — 30% MS + 2 resist + mid life | ~22% | ~1 div |
| Mediocre — 30% MS + 1 resist + filler | ~40% | ~0.3 div |
| Junk floor | ~30% | ~0.1 div |

EV(asking) ≈ **0.6 div**; discounting to real sold prices (asking floors run hot — see the
essence-armour file) ≈ **0.35–0.45 div** realised.

**Expected profit per craft:**

| Path | EV revenue (sold) | Cost | **EV profit** |
|------|-------------------|------|---------------|
| **Lean** | ~0.4 div | ~0.35 div | **≈ +0.05 to +0.2 div** — thin, positive, scales on volume |
| **+Perfect Exalt** | ~1.0 div | ~2.7 div | **≈ −1.5 div** — only wins if the base ceilings at ~6–10 div |
| **+Whittling recovery** | rescues a ~1 div boot | +6.6 div | **deeply negative — never on a sub-6-div item** |

**Bottom line:** a **low-capital, thin-margin, volume** method. Divines come from running many
cheap *lean* crafts and catching the ~8% premium tail — **not** from buying tier insurance. The
expensive consumables (Perfect Exalt 2.4 div, Whittling 6.6 div) are EV-negative on ordinary boots
and pay off only on a genuinely top-end base. To scale profit, raise *volume* and *base quality*,
not consumable spend.

## Worked example

> Runes of Aldur, patch 0.5.3, 2026-06-26 (illustrative)
>
> Base: ilvl 82 Magic evasion boot, **30% movement speed** (T1) suffix only — bought ~20 ex
> Greater Essence of Insulation (lightning resist) → Rare, MS + lightning res locked — ~2 ex
> Omen of Sinistral Exaltation + Exalted Orb → high life prefix — ~few ex
> Omen of Dextral Exaltation + Exalted Orb → cold resist suffix — ~few ex
> 1 Perfect Exalted Orb → %evasion prefix at high tier — ~3.2 div
> Result: 30% MS + lightning res + cold res + high life + %evasion (5-mod evasion boot)
> Input cost:    ~3.4 div (base + essence + omens + 1 Perfect Exalt)
> Expected sale: this build hit the ~8% premium tail → ~3 div asking (~1.5–2 div realised); the
>                modal lean outcome is ~0.3–1 div (see Expected profit for the full distribution)
> Margin:        this Perfect-Exalt run only nets out if the base genuinely clears ~6+ div —
>                otherwise the 2.4 div Perfect Exalt eats it. The lean path (no Perfect Exalt) is
>                the +EV default at ~+0.05–0.2 div/craft on volume.

> **Calibration note — Runes of Aldur, 2026-06-26 (poe2scout snapshot; 1 div ≈ 345 ex).**
> Consistent with the other methods in this folder: **asking floors run well above real sold
> prices, and partial/low rolls do not sell** (cf. the essence-armour file — dual-resist chests
> floored at 1 ex with 1000+ listings; only triple-stat pieces moved). Treat divine-level boots
> sales as **high rolls only**: a clean 30%+ MS + two capped resists + 80+ life on a meta
> evasion/ES base is the piece that earns; everything below it is a low-ex flip.
> **Run the economy: lead with cheap Exalted Orbs and reserve Perfect Exalts (3.2 div) for bases
> already strong enough to clear several div — otherwise the Perfect Exalt eats the margin.**
> Re-pull `../../data/economy/latest.md` before committing currency.
>
> **Sources (2026-06-26):** movement-speed ilvl breakpoints (T1 @ ilvl 82, next tier @ ilvl 70)
> from community crafting guides via web search (mobalytics.gg / mmojugg) and corroborated by
> poe2db.tw unique boots capping fixed MS at 30%; prices from the poe2scout snapshot in
> `../../data/economy/latest.md`. Always reconfirm tiers on poe2db.tw and prices live before
> committing — see `../../knowledge/sources.md`.
