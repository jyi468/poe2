// Pure Monte-Carlo EV core for the omen-slam bow craft
// (crafting/method/omen-slam-bow.md). Models the two fracture paths:
//   - "proj": buy a +Proj-levels-fractured base, then DESECRATE crit + attack speed.
//   - "crit": buy a crit-fractured base, then desecrate attack speed + crit damage.
// Prefixes (3 damage mods) are filled with Perfect Exalt + Sinistral Exaltation in
// both paths.
//
// EXACT: per-slam prefix odds (pPrefix) are computed from real craftofexile spawn
//   weights for bow id_base 20 at ilvl 81 — the caller passes them in.
// MODELLED: the per-desecrate success chances (pCrit/pAttackSpeed/pCritDamage) are
//   estimates for the Abyssal desecration pool (not in the craftofexile dump) —
//   passed as documented inputs and clearly labelled by the CLI.
//
// No I/O here (mirrors estimate.ts): callers supply prices and the model. The RNG is
// seeded so results are deterministic and testable.

export interface SlamCosts {
  /** Perfect Exalted Orb — adds one top-tier modifier. */
  perfectExaltDiv: number;
  /** Sinistral/Dextral Exaltation omen — directs the slam to a prefix/suffix. */
  exaltOmenDiv: number;
  /** Orb of Annulment — removes a junk modifier. */
  annulDiv: number;
  /** Omen of Light — wipes a bad desecrated mod so you can re-desecrate. */
  lightDiv: number;
  /** Preserved Jawbone + Dextral Necromancy omen — one desecrate (≈free). */
  jawboneDiv: number;
  /** Divine Orb — finishing value rerolls. */
  divineDiv: number;
}

export interface SlamModel {
  /** P(a Perfect-Exalt+Sinistral prefix is a wanted damage mod). EXACT (weights). */
  pPrefix: number;
  /** P(a desecrate reveals an acceptable crit-chance mod). MODELLED. Path "proj" only. */
  pCrit: number;
  /** P(a desecrate reveals an acceptable attack-speed mod). MODELLED. */
  pAttackSpeed: number;
  /** P(a desecrate reveals an acceptable crit-damage mod). MODELLED. Path "crit" only. */
  pCritDamage: number;
  /** Damage prefixes to fill (normally 3). */
  prefixCount: number;
  /** Finishing Divine rerolls applied once the item is assembled. */
  finishingDivines: number;
}

export type FracturePath = "proj" | "crit";

export interface SlamStats {
  mean: number;
  /** Typical run. */
  p50: number;
  /** Bad run — size your bankroll to this. */
  p85: number;
  /** Cursed run. */
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

/** Number of Bernoulli(p) trials up to and including the first success. */
function trialsToHit(rng: () => number, p: number): number {
  if (p <= 0) return Infinity;
  let n = 1;
  while (rng() >= p) n++;
  return n;
}

/** Fill `prefixCount` damage prefixes via Perfect Exalt + Sinistral Exaltation. */
function prefixCost(rng: () => number, model: SlamModel, costs: SlamCosts): number {
  let cost = 0;
  for (let i = 0; i < model.prefixCount; i++) {
    const slams = trialsToHit(rng, model.pPrefix);
    cost += slams * (costs.perfectExaltDiv + costs.exaltOmenDiv);
    cost += (slams - 1) * costs.annulDiv; // every miss is a junk prefix to remove
  }
  return cost;
}

/** Desecrate one suffix until an acceptable mod is revealed (Light+Annul to retry). */
function desecCost(rng: () => number, p: number, costs: SlamCosts): number {
  const tries = trialsToHit(rng, p);
  // Each try costs a jawbone; every miss also costs a Light+Annul wipe before retry.
  return tries * costs.jawboneDiv + (tries - 1) * (costs.lightDiv + costs.annulDiv);
}

function suffixCost(
  rng: () => number,
  path: FracturePath,
  model: SlamModel,
  costs: SlamCosts,
): number {
  if (path === "proj") {
    // +Proj is fractured; desecrate the two open suffixes: crit + attack speed.
    return desecCost(rng, model.pCrit, costs) + desecCost(rng, model.pAttackSpeed, costs);
  }
  // Crit is fractured; desecrate attack speed + crit damage.
  return desecCost(rng, model.pAttackSpeed, costs) + desecCost(rng, model.pCritDamage, costs);
}

export interface SimOptions {
  trials?: number;
  seed?: number;
}

/** Monte-Carlo the consumable cost (div) to assemble the bow for one fracture path. */
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
    const c =
      prefixCost(rng, model, costs) +
      suffixCost(rng, path, model, costs) +
      model.finishingDivines * costs.divineDiv;
    totals[i] = c;
  }
  totals.sort((x, y) => x - y);
  const at = (q: number) => totals[Math.min(trials - 1, Math.floor(q * trials))];
  const mean = totals.reduce((s, v) => s + v, 0) / trials;
  return {
    path,
    trials,
    stats: { mean, p50: at(0.5), p85: at(0.85), p95: at(0.95) },
  };
}
