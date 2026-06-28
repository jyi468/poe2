// Pure Monte-Carlo EV core for the omen-slam bow craft (crafting/method/omen-slam-bow.md).
//
// Mechanics (verified in crafting/reference/): exalts add ONE random mod with a minimum
// modifier level — Exalted = none, Greater = 35, Perfect = 50. The floor restricts the
// TIER of the added mod (and so shrinks the pool / lowers the per-slam type odds); it does
// NOT guarantee the top tier. Sinistral/Dextral Exaltation omens steer the slam to a
// prefix/suffix. The +Proj fracture is a suffix and is ANNUL-IMMUNE.
//
// Cost model is ordering-aware, because targeted annul omens are expensive (Dextral ~6.5d,
// Sinistral ~11.6d) while raw annul is ~0.6d, and crit can be expensive to re-make:
//   1. Secure the CHEAP suffix (attack speed, ~14% via a near-free plain Exalt) first, on
//      the otherwise-empty suffix side — junk is the only non-immune suffix, so raw annul
//      clears it cleanly.
//   2. Hunt CRIT last. Each junk now sits beside the cheap attack-speed keeper, so a raw
//      annul only ever risks THAT (cheap to redo) — crit is placed last and is therefore
//      never annulled beside a junk. This protects the expensive (esp. Perfect-built) crit.
//   3. PREFIXES last of all, while suffix keepers exist: a junk prefix must be cleared with
//      a Sinistral Annulment omen to confine the annul to prefixes and protect the suffixes.
//
// EXACT: per-slam type odds are craftofexile weight shares at the build's level floor
//   (crafting/reference/bow-affix-weights.md). Prices are live.

export interface SlamCosts {
  /** Sinistral/Dextral Exaltation omen (steer the slam to prefix/suffix). */
  exaltOmenDiv: number;
  /** Raw Orb of Annulment (removes a random non-immune mod). */
  annulDiv: number;
  /** Sinistral Annulment omen — confines the next annul to prefixes (protect suffixes). */
  sinistralAnnulDiv: number;
  /** Divine Orb — finishing value rerolls. */
  divineDiv: number;
  /** Desecration alternative (kept for comparison): bone / Light clear / Echoes. */
  boneDiv: number;
  lightDiv: number;
  echoesDiv: number;
}

export type CritSource = "exalt" | "desecrate";

export interface SlamModel {
  /** Price of the exalt orb this build uses (Greater ≈ 0.01, Perfect ≈ 2.4). */
  orbDiv: number;
  /** P(a steered prefix slam is a wanted damage mod) at this build's floor. */
  pPrefix: number;
  /** P(a steered suffix slam is acceptable crit) at this build's floor. */
  pCrit: number;
  /** P(a steered suffix slam is attack-speed/crit-damage). 2nd suffix uses a cheap plain Exalt. */
  pSecond: number;
  /** Orb price for the 2nd (non-crit) suffix — a plain Exalted Orb is ~free, tier doesn't matter. */
  secondOrbDiv: number;
  prefixCount: number;
  finishingDivines: number;
  critSource: CritSource;
  /** Desecration alternative. */
  pCritDesecReveal: number;
  revealsPerCycle: number;
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
  stats: SlamStats;
}

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

const randInt = (rng: () => number, n: number) => Math.floor(rng() * n);

/** Suffix side: secure the cheap attack-speed mod first, then hunt crit last (protected). */
function suffixCostExalt(rng: () => number, m: SlamModel, costs: SlamCosts): number {
  let cost = 0;
  // slots holds non-fracture suffixes; fracture is implicit + immune. Capacity 2.
  let slots: Array<"crit" | "second" | "junk"> = [];
  const has = (x: string) => slots.includes(x as never);
  while (!(has("crit") && has("second"))) {
    if (has("junk")) {
      // clear a junk; raw annul picks uniformly among non-immune suffixes (keepers + junk)
      cost += costs.annulDiv;
      slots.splice(randInt(rng, slots.length), 1);
    } else if (slots.length < 2) {
      // attack speed first (cheap orb), crit last so it's the final mod placed and never contested
      const wantSecond = !has("second");
      const orb = wantSecond ? m.secondOrbDiv : m.orbDiv;
      const p = wantSecond ? m.pSecond : m.pCrit;
      cost += orb + costs.exaltOmenDiv;
      slots.push(rng() < p ? (wantSecond ? "second" : "crit") : "junk");
    } else break; // full of two keepers but not the pair we want — impossible by construction
  }
  return cost;
}

/** Prefix side, done last: suffix keepers exist, so junk prefixes need a Sinistral annul. */
function prefixCostExalt(rng: () => number, m: SlamModel, costs: SlamCosts): number {
  let cost = 0;
  let slots: Array<"dmg" | "junk"> = [];
  const dmg = () => slots.filter((s) => s === "dmg").length;
  while (dmg() < m.prefixCount) {
    if (slots.includes("junk")) {
      // confine the annul to prefixes (protect the suffix keepers): Sinistral Annulment omen
      cost += costs.annulDiv + costs.sinistralAnnulDiv;
      slots.splice(randInt(rng, slots.length), 1);
    } else if (slots.length < 3) {
      cost += m.orbDiv + costs.exaltOmenDiv;
      slots.push(rng() < m.pPrefix ? "dmg" : "junk");
    } else break;
  }
  return cost;
}

/** Desecration alternative for crit (one desecrated mod, re-rolled via Light clears). */
function desecCrit(rng: () => number, m: SlamModel, costs: SlamCosts): number {
  const reveals = Math.max(1, m.revealsPerCycle);
  const cycleOmen = reveals > 1 ? costs.echoesDiv : 0;
  const pCycle = 1 - Math.pow(1 - m.pCritDesecReveal, reveals);
  let cost = 0;
  for (;;) {
    cost += costs.boneDiv + cycleOmen;
    if (rng() < pCycle) return cost;
    cost += costs.lightDiv + costs.annulDiv;
  }
}

export interface SimOptions {
  trials?: number;
  seed?: number;
}

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
    const suffix =
      model.critSource === "desecrate"
        ? desecCrit(rng, model, costs) + secondOnly(rng, model, costs)
        : suffixCostExalt(rng, model, costs);
    totals[i] = suffix + prefixCostExalt(rng, model, costs) + model.finishingDivines * costs.divineDiv;
  }
  totals.sort((x, y) => x - y);
  const at = (q: number) => totals[Math.min(trials - 1, Math.floor(q * trials))];
  const mean = totals.reduce((s, v) => s + v, 0) / trials;
  return { path, trials, stats: { mean, p50: at(0.5), p85: at(0.85), p95: at(0.95) } };
}

/** For the desecrate variant: crit is desecrated, the 2nd suffix is still an exalt slam. */
function secondOnly(rng: () => number, m: SlamModel, costs: SlamCosts): number {
  let cost = 0;
  // crit already present (desecrated) → the 2nd suffix is contested from the start.
  let slots: Array<"crit" | "second" | "junk"> = ["crit"];
  const has = (x: string) => slots.includes(x as never);
  while (!has("second")) {
    if (has("junk")) {
      cost += costs.annulDiv;
      slots.splice(randInt(rng, slots.length), 1);
    } else if (slots.length < 2) {
      cost += m.secondOrbDiv + costs.exaltOmenDiv;
      slots.push(rng() < m.pSecond ? "second" : "junk");
    } else break;
  }
  return cost;
}
