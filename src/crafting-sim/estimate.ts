// Pure EV estimator for a Transmute->Augment magic craft targeting one prefix
// group (optionally above a value threshold) and one suffix stat. Weight bands
// are MODELLED (PoB ships no real spawn weights) — callers pass low/central/high.

import { statHigh, statLow, type ModTier } from "./pob-mods.js";

export interface WeightBand { low: number; central: number; high: number }
export interface OrbPrices { transmute: number; augment: number; divine: number }
export interface CraftInput {
  prefixes: ModTier[];
  suffixes: ModTier[];
  prefixGroup?: string;
  prefixMin?: number;
  suffixStat?: string;
  weights: { pref: WeightBand; suf: WeightBand };
  orb: OrbPrices;
  buyPriceDiv: number;
  baseCostsEx?: number[];
}
export interface CraftScenario {
  label: string;
  pPref: number;
  pSuf: number;
  p: number;
  attempts: number;
  currencyOnlyDiv: number;
  withBase: { baseEx: number; totalDiv: number; cheaperThanBuy: boolean }[];
  breakevenBaseEx: number;
}
export interface TargetTier { affix: string; stat: string; level: number; fracAboveMin: number }
export interface CraftEstimate {
  prefixGroups: number;
  suffixGroups: number;
  targetPrefixTiers: TargetTier[];
  targetSuffix: { affix: string; stat: string; level: number } | null;
  scenarios: CraftScenario[];
}

const DEFAULT_BASE_COSTS = [1, 3, 5, 10, 20];

/** Fraction of a tier's roll-range strictly greater than `min` (uniform). */
export function fracAbove(tier: ModTier, min: number): number {
  const lo = statLow(tier.stat);
  const hi = statHigh(tier.stat);
  if (hi <= min) return 0;
  if (lo > min) return 1;
  return (hi - min) / (hi - lo);
}

function uniqueGroups(pool: ModTier[]): number {
  return new Set(pool.map((t) => t.group)).size;
}

export function estimateCraft(input: CraftInput): CraftEstimate {
  const { prefixes, suffixes, prefixGroup, prefixMin, suffixStat, weights, orb, buyPriceDiv } = input;
  const baseCosts = input.baseCostsEx ?? DEFAULT_BASE_COSTS;

  const groupTiers = prefixGroup ? prefixes.filter((t) => t.group === prefixGroup) : [];
  const min = prefixMin ?? 0;
  const targetPrefixTiers: TargetTier[] = groupTiers.map((t) => ({
    affix: t.affix, stat: t.stat, level: t.level, fracAboveMin: fracAbove(t, min),
  }));
  const bestFrac = targetPrefixTiers.reduce((m, t) => Math.max(m, t.fracAboveMin), 0);
  const prefFracForOdds = prefixGroup ? bestFrac : 1; // no prefix target -> doesn't gate

  const suffixTier = suffixStat ? suffixes.find((t) => t.stat === suffixStat) ?? null : null;
  const targetSuffix = suffixTier
    ? { affix: suffixTier.affix, stat: suffixTier.stat, level: suffixTier.level }
    : null;
  const sufHasTarget = suffixStat ? suffixTier != null : true;

  const make = (label: string, pPrefRaw: number, pSufRaw: number): CraftScenario => {
    const pPref = prefixGroup ? pPrefRaw * prefFracForOdds : 1;
    const pSuf = suffixStat ? (sufHasTarget ? pSufRaw : 0) : 1;
    const p = pPref * pSuf;
    const attempts = p > 0 ? 1 / p : Infinity;
    const costPerAttempt = orb.transmute + (pPref + pSuf) * orb.augment;
    const currencyOnlyDiv = (attempts * costPerAttempt) / orb.divine;
    const budgetEx = buyPriceDiv * orb.divine;
    const breakevenBaseEx = budgetEx / attempts - costPerAttempt;
    const withBase = baseCosts.map((baseEx) => {
      const totalDiv = (attempts * (costPerAttempt + baseEx)) / orb.divine;
      return { baseEx, totalDiv, cheaperThanBuy: totalDiv < buyPriceDiv };
    });
    return { label, pPref, pSuf, p, attempts, currencyOnlyDiv, withBase, breakevenBaseEx };
  };

  return {
    prefixGroups: uniqueGroups(prefixes),
    suffixGroups: uniqueGroups(suffixes),
    targetPrefixTiers,
    targetSuffix,
    scenarios: [
      make("LUCKY (high weights)", weights.pref.high, weights.suf.high),
      make("CENTRAL estimate", weights.pref.central, weights.suf.central),
      make("UNLUCKY (low weights)", weights.pref.low, weights.suf.low),
    ],
  };
}
