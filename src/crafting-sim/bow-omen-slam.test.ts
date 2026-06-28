import { describe, expect, it } from "vitest";
import { simulateBowSlam, type SlamCosts, type SlamModel } from "./bow-omen-slam.js";

const COSTS: SlamCosts = {
  exaltOmenDiv: 0.04,
  annulDiv: 0.58,
  sinistralAnnulDiv: 11.6,
  divineDiv: 1.0,
  boneDiv: 9.63,
  lightDiv: 8.65,
  echoesDiv: 0.29,
};

// Greater build — real weight shares at the min-35 floor (crafting/reference/bow-affix-weights.md).
const GREATER: SlamModel = {
  orbDiv: 0.01,
  pPrefix: 0.864,
  pCrit: 0.036,
  pSecond: 0.141,
  secondOrbDiv: 0.003,
  prefixCount: 3,
  finishingDivines: 4,
  critSource: "exalt",
  pCritDesecReveal: 0.0409,
  revealsPerCycle: 6,
};
const PERFECT: SlamModel = { ...GREATER, orbDiv: 2.38, pPrefix: 0.904, pCrit: 0.024 };

describe("simulateBowSlam", () => {
  it("is deterministic for a fixed seed", () => {
    const a = simulateBowSlam("proj", GREATER, COSTS, { trials: 5000, seed: 1 });
    const b = simulateBowSlam("proj", GREATER, COSTS, { trials: 5000, seed: 1 });
    expect(a.stats).toEqual(b.stats);
  });

  it("orders percentiles p50 <= p85 <= p95", () => {
    const r = simulateBowSlam("proj", GREATER, COSTS, { trials: 8000, seed: 7 });
    expect(r.stats.p50).toBeLessThanOrEqual(r.stats.p85);
    expect(r.stats.p85).toBeLessThanOrEqual(r.stats.p95);
  });

  it("Greater build is much cheaper than the Perfect build (Perfect orbs dominate)", () => {
    const g = simulateBowSlam("proj", GREATER, COSTS, { trials: 20000, seed: 3 });
    const p = simulateBowSlam("proj", PERFECT, COSTS, { trials: 20000, seed: 3 });
    expect(g.stats.mean).toBeLessThan(p.stats.mean);
    expect(p.stats.mean).toBeGreaterThan(g.stats.mean * 1.5);
  });

  it("desecrating crit is not cheaper than slamming it with a near-free Greater Exalt", () => {
    const slam = simulateBowSlam("proj", GREATER, COSTS, { trials: 20000, seed: 5 });
    const desec = simulateBowSlam("proj", { ...GREATER, critSource: "desecrate" }, COSTS, { trials: 20000, seed: 5 });
    expect(desec.stats.mean).toBeGreaterThan(slam.stats.mean * 0.9);
  });

  it("the rare crit hunt drives a fat tail (p95 well above p50)", () => {
    const r = simulateBowSlam("proj", GREATER, COSTS, { trials: 20000, seed: 9 });
    expect(r.stats.p95).toBeGreaterThan(r.stats.p50 * 1.5);
  });
});
