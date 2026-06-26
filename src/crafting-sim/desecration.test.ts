import { describe, it, expect } from "vitest";
import {
  hitProb,
  clearCost,
  freshCost,
  simulateDesecration,
  type DesecCosts,
  type DesecModel,
} from "./desecration.js";

const COSTS: DesecCosts = {
  baseDiv: 1,
  boneDiv: 0.1,
  cycleOmensDiv: 0.3,
  clearDiv: 8.9, // Omen of Light + Annul, live
};

describe("hitProb", () => {
  it("more reveals strictly raise the hit chance", () => {
    expect(hitProb(0.05, 6)).toBeGreaterThan(hitProb(0.05, 3));
  });
  it("matches the Echoes example (~26% at w=0.05, 6 reveals)", () => {
    expect(hitProb(0.05, 6)).toBeCloseTo(0.2649, 3);
  });
  it("clamps degenerate shares", () => {
    expect(hitProb(0, 6)).toBe(0);
    expect(hitProb(1, 6)).toBe(1);
  });
});

describe("clear vs fresh cost", () => {
  it("fresh wins when a ready base is cheaper than a Light clear", () => {
    const cycles = 4;
    // base 1 < clear 8.9 → fresh should be cheaper
    expect(freshCost(cycles, COSTS)).toBeLessThan(clearCost(cycles, COSTS));
  });

  it("clear wins when the base is expensive relative to a clear", () => {
    const pricey: DesecCosts = { ...COSTS, baseDiv: 30, clearDiv: 2 };
    const cycles = 4;
    expect(clearCost(cycles, pricey)).toBeLessThan(freshCost(cycles, pricey));
  });

  it("single cycle has no reset cost (clear == base+cycle)", () => {
    expect(clearCost(1, COSTS)).toBeCloseTo(COSTS.baseDiv + COSTS.boneDiv + COSTS.cycleOmensDiv, 10);
  });
});

describe("simulateDesecration", () => {
  const model: DesecModel = {
    poolShare: { low: 0.03, central: 0.05, high: 0.08 },
    revealsPerCycle: 6, // Abyssal Echoes
    soldValue: { low: 3, central: 5, high: 9 },
  };

  it("returns three bands and never recommends the costlier reset", () => {
    const paths = simulateDesecration(model, COSTS);
    expect(paths.map((p) => p.band)).toEqual([
      "UNLUCKY (low w)",
      "CENTRAL estimate",
      "LUCKY (high w)",
    ]);
    for (const p of paths) {
      expect(p.bestCostDiv).toBeCloseTo(Math.min(p.clearCostDiv, p.freshCostDiv), 10);
    }
  });

  it("at current Light prices the cheap-base play prefers FRESH resets", () => {
    const central = simulateDesecration(model, COSTS).find((p) => p.band === "CENTRAL estimate")!;
    expect(central.bestStrategy).toBe("fresh");
  });

  it("a cheap base keeps central EV positive; loading the base cost flips it negative", () => {
    const cheap = simulateDesecration({ ...model, poolShare: { low: 0.03, central: 0.05, high: 0.08 } }, { ...COSTS, baseDiv: 0.2 });
    const dear = simulateDesecration(model, { ...COSTS, baseDiv: 6 });
    const cheapCentral = cheap.find((p) => p.band === "CENTRAL estimate")!;
    const dearCentral = dear.find((p) => p.band === "CENTRAL estimate")!;
    expect(cheapCentral.evProfitDiv).toBeGreaterThan(0);
    expect(dearCentral.evProfitDiv).toBeLessThan(0);
  });
});
