import { describe, expect, it } from "vitest";
import { simulateBowSlam, type SlamCosts, type SlamModel } from "./bow-omen-slam.js";

const COSTS: SlamCosts = {
  perfectExaltDiv: 2.5,
  exaltOmenDiv: 0.04,
  annulDiv: 0.58,
  lightDiv: 8.65,
  boneDiv: 9.63,
  echoesDiv: 0.58,
  divineDiv: 1.0,
};

// Real craftofexile weight shares (bow id_base 20, ilvl 81).
const MODEL: SlamModel = {
  pPrefix: 0.753, // phys OR elemental, top tier
  critSource: "exalt",
  pCritSuffix: 0.0704, // crit chance share of the suffix pool (Perfect Exalt → T1)
  pSecondSuffix: 0.141, // attack speed OR crit damage share
  pCritDesecReveal: 0.0409, // crit ≥T3 per reveal under an Ancient bone
  revealsPerCycle: 6,
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

  it("Perfect-Exalt crit is cheaper than desecrating crit (real weights)", () => {
    const exalt = simulateBowSlam("proj", MODEL, COSTS, { trials: 30000, seed: 3 });
    const desec = simulateBowSlam(
      "proj",
      { ...MODEL, critSource: "desecrate" },
      COSTS,
      { trials: 30000, seed: 3 },
    );
    expect(exalt.stats.mean).toBeLessThan(desec.stats.mean);
  });

  it("elemental prefixes beat phys-only prefixes", () => {
    const ele = simulateBowSlam("proj", MODEL, COSTS, { trials: 20000, seed: 5 });
    const phys = simulateBowSlam("proj", { ...MODEL, pPrefix: 0.225 }, COSTS, { trials: 20000, seed: 5 });
    expect(ele.stats.mean).toBeLessThan(phys.stats.mean);
  });

  it("crit (7%) is rarer than the second-suffix slot (14%), so it dominates suffix cost", () => {
    const r = simulateBowSlam("proj", MODEL, COSTS, { trials: 20000, seed: 9 });
    expect(r.stats.p95).toBeGreaterThan(r.stats.p50 * 1.4);
  });
});
