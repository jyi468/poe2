# Essence Value Map

Where essences earn for a mid bankroll, and — just as important — where they don't.
A cross-method reference, not a single recipe. Re-price before acting:
`pnpm prices essences` (full live table) and `pnpm trade --category … --stat …` (finished-item floors).

## The one fact that governs everything (verified)

**No single mod sells for real money — not even a scarce or essence-exclusive one.**
Live floors, official trade2 API, 2026-06-26 (1 div ≈ 356 ex):

| Item searched (one good mod + filler) | Floor |
|---|---|
| Ring, **+25% chaos resistance** (+ cast speed + dex) | **~1 ex** |
| Boots, **30–35% movement speed** (+ life + resist) | **~1–2 ex** |
| Wand, **+3 to all Spell Skill levels** (+ 69% spell dmg) | **~1 ex** |
| Wand, **near-perfect package** (118% spell + +5 levels + 46% cast spd + 73% crit) | **mirror-tier** |

So an essence does **not** earn by guaranteeing one mod and reselling it. It earns by
**cheaply locking the hardest-to-roll component of a multi-mod package you then finish** —
your slams only have to cover the *rest*. Profit lives in the near-perfect tail; partial
items floor at ~1 ex (same brutal floor the boots and resist-armour files document).
Patch 0.5 reinforces this: **one essence/crafted mod per item**, so the only question is
*which single mod is hardest to hit* — guarantee that one, slam the rest.

## How the tiers apply

- **Lesser / Normal / Greater** — consume a **Magic** item → **Rare** with one guaranteed mod
  at a tier scaling with essence tier (deterministic Regal). Use these to *start* a craft.
- **Perfect** — on a **Rare**: **remove a random mod, add a guaranteed exclusive mod**. Use to
  *finish*. Only apply when the item has a junk mod it can afford to lose.
- **Corrupted exclusives** (Hysteria / Horror / Delirium / Insanity / Abyss) — like Perfect
  (remove-1/add-1 on a Rare) **but they corrupt the item** → no further crafting. Finishing move only.

## Where an essence genuinely helps — ranked

Value = (essence is cheap) × (guaranteed mod is scarce/hard to roll) × (mod belongs in a sellable package).

1. **Greater Essence of Ruin → guaranteed chaos resistance.** ~**1.8 ex** (liquid, qty 444).
   Chaos res is high-demand, low-weight, with no cheap roll path, and slots onto rings, amulets,
   belts, gloves, boots, helmet, body. The cheapest scarce-suffix lock on the board — confirms the
   project's "chaos beats elemental res" finding (elemental is high-weight/cheap to supply; chaos
   sits in its own bucket). Use it as the *anchor* of a multi-res piece, then slam life + a second res.
2. **Perfect Essence of Sorcery → +to Spell Skill levels** (wand/staff/focus). ~**4.4 ex** (qty 830).
   The single hardest caster-weapon component, essentially essence-only. Cheap relative to a finished
   chase wand — but the wand still needs spell dmg + cast speed + crit to sell. Locks the rare piece; doesn't replace the build.
3. **Perfect Essence of Battle → +to Attack Skill levels** (martial weapons). ~**16 ex** (qty 1453).
   Martial equivalent; same logic.
4. **Essence of the Infinite → attributes** (rings/amulets). Base thin; **Perfect Infinite ~24.5 ex**
   (%attributes, amulet-only, qty 2063). Attributes are a scarce, requirement-gating suffix.
5. **Flat-damage prefix essences** (Abrasion / Flames / Ice / Electricity) — near-vendor. Lock a
   guaranteed damage prefix on a weapon build so slams only fill the rest.

## Premium corrupted exclusives — narrow, finishing-only

These cost real div and **corrupt the item**, so they pay off only on an *already near-complete* piece:

- **Hysteria → 30% movement speed on boots** (~**0.84 div**, qty 1049). **Verified not worth it.** MS is
  a **prefix**, and a **T1 35% magic base floors at ~1 ex** (400+ listings) — top-tier MS is the cheapest
  part to acquire. Hysteria gives a *worse* 30% (T2) for 0.84 div + a Crystallisation omen (0.11–0.38 div)
  and **corrupts** the item (no crafting after). It pairs with Omen of Crystallisation (Dextral removes a
  suffix / Sinistral a prefix) to control the removal, but that determinism solves a non-problem: you'd
  just start from the 1-ex 35% base. Niche only: salvaging an already-near-perfect non-MS boot. Full
  breakdown in `movement-speed-boots.md`.
- **Horror → 100% increased effect of socketed items** (gloves/boots, ~**0.51 div**, qty 726). Build-enabler for specific rune/socket setups; niche demand.
- **Delirium → random notable passive on body armour** (~**0.28 div**, qty 482). Lottery upside.

## Where essences do NOT help (so don't try)

- **Spirit** — no essence exists; stays slam/alloy-gated (which is why Spirit gear is expensive).
- **Movement speed** standard — only the corrupted Hysteria.
- **Life / elemental resist** — high-weight, easy to roll. An essence here only buys the guaranteed
  *tier*, a tiny spread. Use as a cheap floor-setter, not a value play.

## Live essence prices (re-pull before acting)

`pnpm prices essences` — 2026-06-26 snapshot, 1 div ≈ 356 ex. The premium exclusives sit at top; the
standard guaranteeing essences are near-free. **Liquidity matters** — `qty` columns under ~10 are
one-or-two-listing noise (e.g. Ruin base qty 3, the Infinite base qty 2); prefer the liquid variant.

| Essence | ex | div | qty | Use |
|---|--:|--:|--:|---|
| Essence of Hysteria | 299 | 0.84 | 1049 | MS-on-boots finish (corrupts) |
| Essence of Horror | 182 | 0.51 | 726 | socketed-effect gloves/boots (corrupts) |
| Essence of Delirium | 101 | 0.28 | 482 | notable on body (corrupts) |
| Perfect Essence of the Infinite | 24.5 | 0.069 | 2063 | %attributes on amulet |
| Perfect Essence of Battle | 16.4 | 0.046 | 1453 | +attack skill levels on weapons |
| Perfect Essence of Sorcery | 4.4 | 0.012 | 830 | +spell skill levels on caster weapons |
| Greater Essence of Ruin | 1.8 | 0.005 | 444 | guaranteed chaos res (the workhorse) |

> **Caveats.** No published PoE2 spawn weights exist — "low-weight" is qualitative (poe2db/guides).
> Battle vs Haste naming for attack-speed vs +skill-levels conflicts across sources — **confirm the
> exact essence name in-client before buying.** Corrupted/Perfect essences remove a *random* mod.
> Prices rot — re-run `pnpm prices essences` and `pnpm trade` each session.
