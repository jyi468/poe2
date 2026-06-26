// Pure EV model for the jewel crit-pair craft via Liquid Emotion
// (see crafting/method/jewel-crit-combo.md).
//
// Strategy: buy a cheap RARE jewel that ALREADY has a NATURAL crit mod plus some
// junk, then apply a Liquid Emotion to add the OTHER crit as the single allowed
// CRAFTED mod — Concentrated Liquid Fear = crit damage, Liquid Despair = crit
// chance. Two mechanic facts shape the EV:
//   1. The emotion REMOVES a random existing mod before adding, so the natural
//      crit can be nuked. For a jewel of N mods, P(keep) = (N-1)/N — more junk
//      dilutes the risk.
//   2. One crafted mod per item, so the pair is always 1 natural + 1 crafted.
//
// EXACT (callers wire live): emotionDiv, baseDiv. MODELLED + flagged: sellPair
// bands, floor, and the simplifying assumption that removal is UNIFORM over all
// N mods (in-game side-targeting is unconfirmed — verify, then refine keepProb).

export interface WeightBand {
  readonly low: number;
  readonly central: number;
  readonly high: number;
}

export interface JewelInputs {
  readonly baseDiv: number; // a rare jewel with a natural crit mod + (modCount-1) others
  readonly emotionDiv: number; // the Liquid Emotion that crafts the second crit mod
  readonly modCount: number; // N existing mods on the bought jewel (incl. the natural crit)
  readonly floorDiv: number; // sale of a brick (crit mod nuked) — ~1 ex
  readonly sellPair: WeightBand; // realised sale of a clean crit-pair jewel
}

export interface JewelPath {
  readonly band: "UNLUCKY (low sale)" | "CENTRAL estimate" | "LUCKY (high sale)";
  readonly keepProb: number; // P(natural crit survives the random removal)
  readonly attemptCostDiv: number; // base + emotion, paid every attempt
  readonly costPerKeeperDiv: number; // attemptCost / keepProb (failures still cost)
  readonly evPerAttemptDiv: number; // keep*sellPair + (1-keep)*floor - attemptCost
  readonly evPerKeeperDiv: number; // sellPair - costPerKeeper
}

/** P(the natural crit mod survives) for a jewel of `modCount` mods, uniform removal. */
export function keepProb(modCount: number): number {
  if (modCount <= 1) return 0; // a 1-mod jewel: the crit IS the only mod → always nuked
  return (modCount - 1) / modCount;
}

/** EV per sale band: keep odds, per-attempt and per-keeper economics. */
export function simulateJewel(inp: JewelInputs): JewelPath[] {
  const keep = keepProb(inp.modCount);
  const attemptCost = inp.baseDiv + inp.emotionDiv;
  const costPerKeeper = keep > 0 ? attemptCost / keep : Infinity;
  const bands = ["low", "central", "high"] as const;
  const names = {
    low: "UNLUCKY (low sale)",
    central: "CENTRAL estimate",
    high: "LUCKY (high sale)",
  } as const;
  return bands.map((b) => {
    const sale = inp.sellPair[b];
    return {
      band: names[b],
      keepProb: keep,
      attemptCostDiv: attemptCost,
      costPerKeeperDiv: costPerKeeper,
      evPerAttemptDiv: keep * sale + (1 - keep) * inp.floorDiv - attemptCost,
      evPerKeeperDiv: sale - costPerKeeper,
    };
  });
}
