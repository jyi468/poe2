# Method index — profit board

> **Start at the [crafting flowchart](../crafting-flowchart.md)** — the decision map (bankroll →
> method, the universal craft loop, tool selector, and the verified-facts ledger) that ties every
> method below together. This table is the per-method index it routes into.

One row per crafting method. Sorted by approachability for a new crafter.
Hard numbers live in each method's dated **Worked example**; the margin column
here is a qualitative band so this index does not rot.

| Method | Capital | Margin (rough) | Risk | Best window | Link |
|--------|---------|----------------|------|-------------|------|
| Greater-essence resist armour | ssf | low–medium † | low | any | [greater-essence-resist-armour.md](greater-essence-resist-armour.md) |
| Movement-speed boots | low | thin/volume (lean) † | low | any | [movement-speed-boots.md](movement-speed-boots.md) |
| Essence value map (cross-method ref) | any | reference † | — | any | [essence-value-map.md](essence-value-map.md) |
| Transmute-augment-regal weapon flip | low | low † | low | any | [transmute-augment-regal-weapon.md](transmute-augment-regal-weapon.md) |
| Jewel crit-combo roll | low | medium (volume) † | low | any | [jewel-crit-combo.md](jewel-crit-combo.md) |
| Void Flux multi-chaos-res | low | medium–high (low volume) † | low–medium | any (flux cheaper late) | [void-flux-chaos-res.md](void-flux-chaos-res.md) |
| Jewel fractured multi-mod | mid | high † | high | any | [jewel-fractured-multimod.md](jewel-fractured-multimod.md) |
| Desecration Lich modifier | mid | high (selective) † | medium | any (inputs cheaper late) | [desecration-lich-modifier.md](desecration-lich-modifier.md) |
| Omen-slam bow (fractured base) | mid | high (+Proj) / buy-don't-craft (Crit) † | medium | any | [omen-slam-bow.md](omen-slam-bow.md) |
| Genesis Breach Ring | high | high wk1–3 / **loss late** † | high | weeks 1–3 only | [genesis-breach-ring.md](genesis-breach-ring.md) |

> Capital tiers: ssf / low / mid / high. See `_template.md` for the entry shape
> and `../CONTEXT.md` for workspace rules.

> † **Verified against live trade 2026-06-23** (official trade2 API + poe2scout; 1 div ≈ 348
> ex). Each method's Worked-example block carries the dated sale-floor numbers. Headlines:
> Desecration is the real earner but only on strong bases + meta-relevant mods; essence
> armour and weapon flip are real-but-small (profit on high rolls only — partial outputs
> sell at a ~1 ex floor); **Breach Ring is underwater late-league** (input ~10–20 div/ring
> in Perfect Exalted slams vs a ~1–2 div output floor) — skip it for profit right now.

> **Best window** = where in a league's lifecycle the method's margin is healthiest,
> a durable property of the method's supply dynamics (not a live price). `any` means
> margin is roughly patch-stable. Genesis Breach Ring decays sharply as Breach supply
> rises — it is a week-1–3 play and roughly break-even late-league. Desecration is
> patch-stable but its Ancient Bone inputs get *cheaper* as the league matures, so
> late-league slightly favours it. Always confirm live prices before committing.

## By budget — which methods to run

> For a staged **learning path** that sequences these methods into a bankroll-building ladder
> (with the deterministic toolkit and live EV via `pnpm boots-sim` / `pnpm desecration-sim`), see
> [`../../knowledge/workflows/crafting-ladder.md`](../../knowledge/workflows/crafting-ladder.md).

Maps a starting bankroll to methods. This is durable guidance (capital bands, not live
prices); recompute actual per-craft cost from `../../data/economy/latest.md` at consult
time. A bankroll can run any method at or below its tier.

| Bankroll | Lead with | Then / scale into | Avoid |
|----------|-----------|-------------------|-------|
| **ssf / a few div** | Greater-essence resist armour | Transmute-augment-regal weapon flip | high-variance slams |
| **low (~5–15 div)** | Weapon flip for reps | Void Flux multi-chaos (scarce output) · first Desecration Lich attempts | Breach Ring (can't absorb variance) |
| **mid (~15–40 div)** | Desecration Lich (main earner) | Omen-slam bow (+Proj, ~55 div w/ Essence-Seeking crit) · Essence armour as a cash-flow floor | committing all-in on one craft |
| **high (~40+ div)** | Desecration Lich at volume | Genesis Breach Ring (week-1–3 only) | pure-ES targets (low demand this patch) |

**Worked allocation — ~50 div, mid/late league, learn-as-you-go** (the canonical
high-tier ask). Stage from cheap → expensive so early reps fund later variance:

1. **~5 div — learn the cheap loops.** Greater-essence resist armour (hybrid resist/armour
   is the favoured defence layer this patch) + a few weapon flips to practice reading mod
   tiers and trade prices.
2. **~30 div — Desecration Lich as the main earner.** Omens are cheap (a few ex each — see
   `latest.md`), so cost is the base item; ~30 div funds many attempts. Pick the Lich pool
   by demand: **Kurgal** (freeze/ailment) and **Ulaman** (added cold) track the cold/freeze
   meta; **Amanamu** (defence) tracks hybrid-defence stackers. Source bones in-game —
   poe2scout does not list them.
3. **~10 div — one Breach Ring as an experiment, optional.** Late-league its margin is gone;
   the real cost driver is Perfect/Greater Exalted Orbs (~3.3 div each), so 10 div is ~3–4
   rings. Treat as learning the Genesis Tree for next league's week-1 window.

Keep ~5 div as a buffer for omen/catalyst price spikes. See `../../knowledge/meta.md` for
the demand side (what sells) and `../../data/economy/latest.md` for live input prices.
