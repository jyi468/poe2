# Meta

Popular archetypes / skills / uniques observed this patch. This file answers
"what do meta builds actually want?", which drives *which mods are worth crafting*
in `../crafting/method/`. Source URLs live in `sources.md`.

> **Stamp:** Return of the Ancients (0.5, launched 2026-05-29) / current sub-patch
> 0.5.3 Runes of Aldur / recorded 2026-06-23. Ascendancy tiers are from community
> tier lists (Maxroll 0.5.1, AoEAH 0.5); per-build *usage %* is not captured because
> poe.ninja's live distribution is JS-rendered and was not machine-readable at pull
> time. Treat tiers as demand proxies, not exact popularity. Re-pull each patch.

## Top archetypes (0.5 Runes of Aldur)

**S-tier ascendancies** (Maxroll 0.5.1 league-starter list): Deadeye, Witchhunter,
Titan, Oracle, Pathfinder, Martial Artist.
**A-tier**: Spirit Walker, Disciple of Varashta, Amazon, Tactician, Smith of Kitava,
Shaman, Lich.

Headline builds and their driving skills (AoEAH / Odealo / Maxroll 0.5):

| Archetype | Ascendancy | Core skills | Notes |
|-----------|-----------|-------------|-------|
| Twister combo | Spirit Walker (Huntress) | Twisters + Whirling Slash | "Safest league starter," untouched by nerfs; fastest clear |
| Ice Shot / Snipe | Deadeye (Ranger) | Ice Shot, Snipe, Ice Salvo | Fastest map clear; Mirage Deadeye now channels Snipe |
| Martial combo | Martial Artist (Monk) | Whirling Assault, Falling Thunder, Ice Strike | Triple Tempest Bell; gloves stat-block flagged as overtuned |
| Grenade ballista totems | Warbringer (Warrior) | Mortar/Cluster Grenade ballistas | One-button Blood Magic setup; proven starter |
| Supporting Fire | Tactician (Warrior) | Supporting Fire + Grenades | 14 m radius, zero nerfs |
| Skeletal Storm Mages | Infernalist (Witch) | Skeletal Storm Mages | ~70%+ of Infernalists per poe.ninja; minions broadly buffed |
| Toxic Growth | Pathfinder (Ranger) | Toxic Growth | Nerfed but still top-tier starter |

## In-demand mod tags (the bridge to crafting targets)

Gear-stat priorities most-cited for 0.5 top builds (AoEAH gear-priority list,
cross-checked against the skills above). These are the affixes crafted pieces should
chase:

- **Cold / freeze / chill scaling** — Ice Shot, Ice Strike, Twister-freeze all lean on
  it. *Cold damage + ailment/freeze-buildup* affixes are broadly wanted → aligns with
  the Desecration **Kurgal** (ailment) and **Ulaman** (added elemental) Lich pools.
- **Projectile count** — new bow/quiver modifiers; high demand for bow builds (Ice Shot,
  Twister, Amazon).
- **Power-charge generation** — Martial Artist and crit builds.
- **Attack speed + crit** — martial/bow archetypes (matches the weapon-flip and
  Ulaman-offensive crafts).
- **Armour-applies-to-elemental + evasion/deflection** — hybrid defensive clusters are
  the favoured defence layer this patch → maps to the **greater-essence resist armour**
  and Desecration **Amanamu** (defensive) crafts.
- **Avoid pure Energy Shield** — ES recharge was heavily nerfed; ES-only gear is *lower*
  demand this patch. Do not craft toward pure-ES pieces expecting a premium.

> Crafting implication: cold/freeze and hybrid-defence (armour+evasion, resists) mods are
> the safest demand bets right now; pure-ES is a trap. This favours the Desecration Lich
> method (Kurgal ailment / Amanamu defence pools) and resist-armour essences over
> ES-centric targets. See `../crafting/method/README.md`.

## Chase uniques / corruptions

Live prices are pulled by `pnpm economy` (see `../src/economy/`) into
`../data/economy/latest.md` — that file is the source of truth and refreshes on demand.
The list below is a **dated snapshot, rots fast** — re-pull before quoting.

> Runes of Aldur / 0.5.3 / pulled 2026-06-23 via poe2scout.com. 1 Divine ≈ 348 Exalted.
> Top chase uniques: **Temporalis** (~3,150 div), **The Dancing Dervish** (~2,960 div),
> **Mageblood** (~610 div), **Voices** (~410 div), **Headhunter** (~220 div). These
> anchor attribute-stacking / utility-belt / jewel-socket builds and lift demand for
> adjacent crafted pieces. Full table + currency/crafting-input prices in
> `../data/economy/latest.md`.

**Crafting-input reality check** (same pull): Desecration omens are cheap
(Necromancy/Sovereign/Liege ~1–4 ex; Abyssal Echoes ~92 ex; Blackblooded ~45 ex), so
that method's cost is dominated by the base item, not omens. Catalysts are cheap (Flesh
~2 ex; refined variants ~18–20 ex). **Gap:** poe2scout does not track Preserved/Ancient
Bone prices in any category — source those from in-game trade directly.
