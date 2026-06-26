// Pure EV model for the Desecration (Well of Souls) craft: add an exclusive
// Lich-pool modifier to a near-complete rare, then sell the premium
// (see crafting/method/desecration-lich-modifier.md).
//
// EXACT (callers wire from live data): every consumable cost in divines.
// MODELLED: poolShare `w` = the chance a single revealed mod is one you'd accept
//   (GGG publishes no weights; Ancient Bones shrink the pool, raising w). Passed
//   as low/central/high bands. Refine `w` against craftofexile reveal data.
//
// The decisive lever this patch: Omen of Light is ~8 div, so "clear the bad mod
// and retry on the same base" is very expensive. When a ready base costs less
// than a clear, it is cheaper to start FRESH on a new base than to CLEAR. The
// model computes both and reports the cheaper one.

export interface WeightBand {
  readonly low: number;
  readonly central: number;
  readonly high: number;
}

export interface DesecCosts {
  readonly baseDiv: number; // a near-complete rare ready to desecrate (3–4 good mods, open target side)
  readonly boneDiv: number; // one Preserved/Ancient bone per reveal cycle
  readonly cycleOmensDiv: number; // Necromancy (side) + Lich-pool + Abyssal Echoes per cycle
  readonly clearDiv: number; // Omen of Light + Orb of Annulment to strip a bad desecrated mod
}

export type ResetStrategy = "clear" | "fresh";

export interface DesecPath {
  readonly band: "UNLUCKY (low w)" | "CENTRAL estimate" | "LUCKY (high w)";
  readonly w: number;
  readonly hitPerCycle: number; // p = 1-(1-w)^reveals
  readonly expectedCycles: number; // 1/p
  readonly clearCostDiv: number; // keep base, Light+Annul between misses
  readonly freshCostDiv: number; // buy a new base each miss
  readonly bestStrategy: ResetStrategy;
  readonly bestCostDiv: number;
  readonly evProfitDiv: number;
}

/** P(at least one of `reveals` shown mods is acceptable), given per-mod share w. */
export function hitProb(w: number, reveals: number): number {
  if (w <= 0) return 0;
  if (w >= 1) return 1;
  return 1 - Math.pow(1 - w, reveals);
}

/** Keep the base; pay a Light+Annul clear after every miss (expected cycles - 1 of them). */
export function clearCost(expectedCycles: number, c: DesecCosts): number {
  const perCycle = c.boneDiv + c.cycleOmensDiv;
  return c.baseDiv + expectedCycles * perCycle + (expectedCycles - 1) * c.clearDiv;
}

/** Start over on a fresh ready base every miss — re-pay the base, but no clear cost. */
export function freshCost(expectedCycles: number, c: DesecCosts): number {
  return expectedCycles * (c.baseDiv + c.boneDiv + c.cycleOmensDiv);
}

export interface DesecModel {
  readonly poolShare: WeightBand; // w
  readonly revealsPerCycle: number; // 3 base, 6 with Abyssal Echoes (the cheap reroll)
  readonly soldValue: WeightBand; // realised sale (div) of the finished premium piece
}

/** EV per band: hit odds, cheaper reset strategy, and expected profit. */
export function simulateDesecration(model: DesecModel, costs: DesecCosts): DesecPath[] {
  const bands = ["low", "central", "high"] as const;
  const names = {
    low: "UNLUCKY (low w)",
    central: "CENTRAL estimate",
    high: "LUCKY (high w)",
  } as const;

  return bands.map((b) => {
    const w = model.poolShare[b];
    const p = hitProb(w, model.revealsPerCycle);
    const cycles = p > 0 ? 1 / p : Infinity;
    const clear = clearCost(cycles, costs);
    const fresh = freshCost(cycles, costs);
    const bestStrategy: ResetStrategy = fresh <= clear ? "fresh" : "clear";
    const bestCostDiv = Math.min(clear, fresh);
    return {
      band: names[b],
      w,
      hitPerCycle: p,
      expectedCycles: cycles,
      clearCostDiv: clear,
      freshCostDiv: fresh,
      bestStrategy,
      bestCostDiv,
      evProfitDiv: model.soldValue[b] - bestCostDiv,
    };
  });
}
