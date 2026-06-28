import { describe, expect, it } from "vitest";
import { simulateBowSlam, type SlamCosts, type SlamModel } from "./bow-omen-slam.js";

const COSTS: SlamCosts = {
  perfectExaltDiv: 2.38,
  exaltOmenDiv: 0.04,
  annulDiv: 0.58,
  lightDiv: 8.65,
  jawboneDiv: 0.02,
  divineDiv: 1.0,
};

const MODEL: SlamModel = {
  pPrefix: 0.753, // phys OR elemental, top tier (EXACT from craftofexile weights)
  pCrit: 0.13,
  pAttackSpeed: 0.2,
  pCritDamage: 0.18,
  prefixCount: 3,
  finishingDivines: 4,
};

describe("simulateBowSlam", () => {
  it("is deterministic for a fixed seed", () => {
    const a = simulateBowSlam("proj", MODEL, COSTS, { trials: 5000, seed: 1 });
    const b = simulateBowSlam("proj", MODEL, COSTS, { trials: 5000, seed: 1 });
    expect(a.stats).toEqual(b.stats);
  });

  it("orders percentiles p50 <= p85 <= p95", () => {
    const r = simulateBowSlam("proj", MODEL, COSTS, { trials: 8000, seed: 7 });
    expect(r.stats.p50).toBeLessThanOrEqual(r.stats.p85);
    expect(r.stats.p85).toBeLessThanOrEqual(r.stats.p95);
  });

  it("crit-fractured path is cheaper than +proj path (no rare-crit desecration)", () => {
    const proj = simulateBowSlam("proj", MODEL, COSTS, { trials: 20000, seed: 3 });
    const crit = simulateBowSlam("crit", MODEL, COSTS, { trials: 20000, seed: 3 });
    expect(crit.stats.mean).toBeLessThan(proj.stats.mean);
  });

  it("elemental-allowed prefixes beat phys-only prefixes", () => {
    const ele = simulateBowSlam("crit", MODEL, COSTS, { trials: 20000, seed: 5 });
    const physOnly = simulateBowSlam(
      "crit",
      { ...MODEL, pPrefix: 0.225 },
      COSTS,
      { trials: 20000, seed: 5 },
    );
    expect(ele.stats.mean).toBeLessThan(physOnly.stats.mean);
  });

  it("reports a fat right tail (p95 well above the median)", () => {
    const r = simulateBowSlam("proj", MODEL, COSTS, { trials: 20000, seed: 9 });
    expect(r.stats.p95).toBeGreaterThan(r.stats.p50 * 1.5);
  });
});
