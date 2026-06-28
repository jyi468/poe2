# Void Flux — multi-chaos-resistance conversion

> Durable zone = patch-stable, edit only if game mechanics change.
> Dated zone (Worked example / verified prices) = illustrative, re-stamp when prices shift.

## Goal

Take a cheap Rare with several elemental-resistance mods and use **Void Flux** to convert
them all into **chaos-resistance** mods at once — producing a **multi-chaos-res** piece, which
is otherwise nearly unobtainable (no essence or slam makes two chaos-res mods). Sell to
CI / Energy-Shield and deep-endgame players who pay a premium to patch chaos-res holes.

## Target base(s)

Rare **ring** or **belt** carrying **2–3 *separate single-element* resist mods** (fire / cold /
lightning) plus life. Cheap life+double-res rings/belts are the ideal feedstock.

- **The value is rerolled — buy cheap, don't pay for high rolls.** Void Flux rerolls each
  converted mod's magnitude into the chaos-res range; your input *number* (e.g. 45% lightning)
  does **not** carry over. What carries is the **tier**: T8–5 → +2 tiers, T4–3 → +1, T2–1 retain.
  So feedstock value lives in (a) the **count** of separate resist mods and (b) their **tiers**
  being decent — not their rolls. A junk-tier resist still boosts into a real chaos-res mod.
- **Chaos-res rolls smaller than elemental.** The chaos-res affix tops out lower per mod than
  elemental res, so a high ele-res input becomes a smaller chaos number. Big totals come from
  *stacking multiple* chaos mods (which is exactly what flux enables) plus catalysts.
- **Avoid "+#% to all Elemental Resistances" bases** — the flux does **not** transform the
  all-res mod, so it converts nothing useful. You want *individual* resist mods.
- Amulets work mechanically but the chaos-res-amulet market is untested (≈0 listings) —
  test one before committing.

See [greater-essence-resist-armour.md](greater-essence-resist-armour.md) (single guaranteed
chaos res) and [essence-value-map.md](essence-value-map.md) for the resist-mod economics.

## Starting capital

**Tier:** low

One Void Flux (~27 ex / ~0.07 div) plus a cheap multi-ele-res base (~1–5 ex). A few exalts
gets you started; no omens or exalts are needed for the conversion itself.

## Recipe

1. Buy a cheap Rare ring/belt with **2–3 individual elemental-resist mods + life** (these floor
   at ~1–5 ex — see `pnpm trade`). Confirm the resists are *single-element*, not "all elemental".
2. Apply **Void Flux** to the item. Every fire/cold/lightning resist mod becomes a chaos-res
   mod; values are rerolled (low tiers boosted). A 2-mod base → 2 chaos-res mods, etc.
3. Inspect the result. The conversion is guaranteed; only the *roll sizes* vary. If the life mod
   and the chaos rolls are solid, list it. Lead the listing with the chaos-res total.

## Outcome odds

**The conversion always succeeds** — this is the method's edge over desecration. A 2-mod
ele-res base *reliably* yields a 2-chaos-res piece; the variance is in the rerolled magnitude
(bounded by the chaos-res tier, and improved for low-tier inputs by the +1/+2 tier boost), not
in whether it works. There is no brick and no "all reveals bad" failure mode. Source for the
tier-boost rules: PoE2 Wiki / poe2db — see [../../knowledge/sources.md](../../knowledge/sources.md).

## Inputs

- 1 **Void Flux** per item
- 1 Rare base with 2–3 single-element resist mods + life (bought beforehand)
- *(optional)* an Exalt or Greater Essence first, if you want to build the multi-resist feedstock
  yourself rather than buy it

## Risk / variance

Low-to-medium, but for unusual reasons:

- **No brick risk** — conversion is deterministic; worst case is mediocre rerolled chaos values.
- **Demand is thin.** Chaos res is niche (CI / ES / deep endgame). Only ~5–9 multi-chaos pieces
  list per slot and some dump at a ~5 ex floor. Great margin *per unit*, but **low throughput** —
  this is not a volume grind; expect slow sales.
- **Don't use it for a *single* chaos-res mod.** One guaranteed chaos res is cheaper via a
  [Greater Essence of Ruin](greater-essence-resist-armour.md) (~1.8 ex) than via flux (~27 ex).
  Void Flux only earns its cost when it makes **2–3** chaos-res mods on one item.

## Why it sells

Chaos resistance rolls on far fewer base mods than elemental res, and there is **no "all chaos
resistance" mod** to stack. A piece with two or three chaos-res mods is therefore close to
unobtainable by any other route — essence guarantees only one, and you can't slam a second copy
of the same mod. CI/ES builds (which run negative chaos res by default) and endgame players
patching a chaos hole pay div-tier for these. This is the same "monetize a roll you can't add
deterministically" play as [desecration](desecration-lich-modifier.md) — but cheaper, lower
variance, and the *only* source of multi-chaos pieces.

## Worked example

> Runes of Aldur, patch 0.5.x, 2026-06-26 (illustrative)
>
> Input: cheap Rare ring, ~90 life + 40% cold + 40% lightning (~1–5 ex) **+ 1 Void Flux (~27 ex)**
>   → ~0.08–0.09 div in
> Output: ring with life + **double chaos resistance** — a comparable double-chaos + 118-life ring
>   was listed at **~2 div**; single high-chaos (65%) pieces sit ~1 div; chaos+life belts ~1 div
> Margin: **~1–2 div per successful flip**, before reroll variance and (slow) sale time
>
> Throttle: thin chaos-res demand — high margin per unit, low volume. Don't stockpile.

> **Verified prices — Runes of Aldur, 2026-06-26 (official trade2 + poe2scout; 1 div ≈ 372 ex).**
> - **Void Flux ~27 ex (0.072 div), 545 listed** — cheap and liquid. *(`pnpm prices expedition --grep flux`)*
> - **Outputs** *(`pnpm trade --category accessory.ring/belt --stat explicit.stat_2923486259:…`)*:
>   entry double-chaos + life ring **~2 div**; **high-rolled double-chaos ring (e.g. +51% & +30%) up
>   to ~55 div**; single high-chaos ring 1–35 div; chaos + life belt **~1 div** floor, high single
>   rolls (+50–61%) **10–25 div**; chaos+life **amulet = 0 listings** (scarce/untested).
> - **Cap context:** chaos resistance caps at the same **75%** as elemental, but is far harder to
>   reach — the per-mod chaos affix is smaller and there is **no "+all chaos resistance" mod** — which
>   is why multi-chaos pieces command div-tier.
> - **Feedstock** floors at ~1–5 ex (life + double ele-res rings/belts). *(`pnpm trade … explicit.stat_3299347043 + resist stats`)*
>
> **Verdict: worth it — better current EV than desecration.** A ~30 ex input yields a ~1–2 div
> scarce output, clearly +EV, and is the sole route to multi-chaos pieces. Capped only by chaos-res
> demand depth. Use Greater Essence (not flux) when you only need one chaos-res mod.
