// Pure Monte-Carlo EV core for the omen-slam bow craft (crafting/method/omen-slam-bow.md).
// +Proj is fractured (a suffix, annul-immune). The 3 prefixes and the 2 open suffixes are
// filled with Perfect Exalt steered by Sinistral/Dextral Exaltation omens — each adds a
// TOP-tier mod, so you only gamble the mod TYPE, never the tier (crit lands at T1).
//
// Real-weight finding: crit is only ~7% of the suffix pool, so Perfect-Exalt slamming it
// (T1 guaranteed, cheap annul misses) beats DESECRATION (same ~7% type rarity, but you may
// only hold one desecrated mod and each miss costs an ~8.6-div Omen-of-Light clear). The
// "desecrate" critSource is kept only to show that it is the more expensive option.
//
// EXACT: prefix + suffix odds are craftofexile spawn-weight shares (id_base 20, ilvl 81),
//   assuming exalt/desecrate sample the normal suffix pool by weight. Prices are live.
// MODELLED: only the desecration reveal count (Abyssal Echoes) and the choice to annul-in-
//   place vs buy a fresh base.

export interface SlamCosts {
  /** Perfect Exalted Orb — adds one top-tier modifier. */
  perfectExaltDiv: number;
  /** Sinistral/Dextral Exaltation omen — directs the slam to a prefix/suffix. */
  exaltOmenDiv: number;
  /** Orb of Annulment — removes a junk modifier (the REROLL step). */
  annulDiv: number;
  /** Omen of Light — strips a bad desecrated mod (the CLEAR step). Desecrate path only. */
  lightDiv: number;
  /** Ancient Jawbone — one desecrate (min mod level 40). Desecrate path only. */
  boneDiv: number;
  /** Omen of Abyssal Echoes — rerolls the 3 desecration options once. Desecrate path only. */
  echoesDiv: number;
  /** Divine Orb — finishing value rerolls. */
  divineDiv: number;
}

/** Crit source: "exalt" (Perfect Exalt + Dextral, T1) or "desecrate" (Ancient bone). */
export type CritSource = "exalt" | "desecrate";

export interface SlamModel {
  /** P(a Perfect-Exalt+Sinistral prefix is a wanted damage mod). EXACT (weights). */
  pPrefix: number;
  critSource: CritSource;
  /** P(a Perfect-Exalt+Dextral suffix is crit chance) — lands T1. EXACT (weight share). */
  pCritSuffix: number;
  /** P(a Perfect-Exalt+Dextral suffix is attack-speed OR crit-damage). EXACT (weight share). */
  pSecondSuffix: number;
  /** P(a single desecration reveal is acceptable crit) — bone-filtered. Desecrate path. */
  pCritDesecReveal: number;
  /** Desecration options seen per cycle: 3 base, 6 with Abyssal Echoes. */
  revealsPerCycle: number;
  /** Damage prefixes to fill (normally 3). */
  prefixCount: number;
  /** Finishing Divine rerolls once the item is assembled. */
  finishingDivines: number;
}

export type FracturePath = "proj" | "crit";

export interface SlamStats {
  mean: number;
  p50: number;
  p85: number;
  p95: number;
}

export interface SlamResult {
  path: FracturePath;
  trials: number;
  /** Consumable cost only (base item NOT included), in divines. */
  stats: SlamStats;
}

/** Deterministic PRNG (mulberry32) so the sim is reproducible across runs/tests. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fill `n` mod slots via Perfect Exalt + Exaltation omen; junk is annulled and re-slammed. */
function fillByExalt(rng: () => number, p: number, n: number, costs: SlamCosts): number {
  let cost = 0;
  let got = 0;
  while (got < n) {
    cost += costs.perfectExaltDiv + costs.exaltOmenDiv;
    if (rng() < p) got++;
    else cost += costs.annulDiv; // junk mod — annul (while isolated) and re-slam
  }
  return cost;
}

/** One desecrated crit, with Abyssal-Echoes reveals and a Light+Annul CLEAR per miss. */
function desecCrit(rng: () => number, model: SlamModel, costs: SlamCosts): number {
  const reveals = Math.max(1, model.revealsPerCycle);
  const cycleOmen = reveals > 1 ? costs.echoesDiv : 0;
  const pCycle = 1 - Math.pow(1 - model.pCritDesecReveal, reveals);
  let cost = 0;
  for (;;) {
    cost += costs.boneDiv + cycleOmen;
    if (rng() < pCycle) return cost;
    cost += costs.lightDiv + costs.annulDiv;
  }
}

function suffixCost(rng: () => number, model: SlamModel, costs: SlamCosts): number {
  const crit =
    model.critSource === "desecrate"
      ? desecCrit(rng, model, costs)
      : fillByExalt(rng, model.pCritSuffix, 1, costs);
  // The other open suffix (attack speed or crit damage) is always a normal exalt slam.
  return crit + fillByExalt(rng, model.pSecondSuffix, 1, costs);
}

export interface SimOptions {
  trials?: number;
  seed?: number;
}

/** Monte-Carlo the consumable cost (div) to assemble the bow. */
export function simulateBowSlam(
  path: FracturePath,
  model: SlamModel,
  costs: SlamCosts,
  opts: SimOptions = {},
): SlamResult {
  const trials = opts.trials ?? 40000;
  const rng = mulberry32(opts.seed ?? 42);
  const totals = new Array<number>(trials);
  for (let i = 0; i < trials; i++) {
    totals[i] =
      fillByExalt(rng, model.pPrefix, model.prefixCount, costs) +
      suffixCost(rng, model, costs) +
      model.finishingDivines * costs.divineDiv;
  }
  totals.sort((x, y) => x - y);
  const at = (q: number) => totals[Math.min(trials - 1, Math.floor(q * trials))];
  const mean = totals.reduce((s, v) => s + v, 0) / trials;
  return { path, trials, stats: { mean, p50: at(0.5), p85: at(0.85), p95: at(0.95) } };
}
