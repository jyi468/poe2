import { describe, it, expect } from "vitest";
import { estimateCraft, fracAbove, type CraftInput } from "./estimate.js";
import type { ModTier } from "./pob-mods.js";

function tier(partial: Partial<ModTier>): ModTier {
  return {
    id: "x", type: "Prefix", affix: "T", stat: "(60-84)% increased Physical Damage",
    level: 1, group: "G", weightKeys: ["bow"], canSpawnOn: () => true, ...partial,
  };
}

describe("fracAbove", () => {
  it("is 1 when whole range clears the threshold", () => {
    expect(fracAbove(tier({ stat: "(70-84)% increased Physical Damage" }), 66)).toBe(1);
  });
  it("is 0 when whole range is below", () => {
    expect(fracAbove(tier({ stat: "(40-60)% increased Physical Damage" }), 66)).toBe(0);
  });
  it("is the partial fraction for a straddling range", () => {
    // (60-84): portion above 66 = (84-66)/(84-60) = 18/24 = 0.75
    expect(fracAbove(tier({ stat: "(60-84)% increased Physical Damage" }), 66)).toBeCloseTo(0.75, 5);
  });
});

describe("estimateCraft", () => {
  const input: CraftInput = {
    prefixes: [tier({ group: "PhysPct", stat: "(60-84)% increased Physical Damage" })],
    suffixes: [tier({ type: "Suffix", group: "ProjLevel", stat: "+4 to Level of all Projectile Skills", affix: "of the Sniper", level: 81 })],
    prefixGroup: "PhysPct",
    prefixMin: 66,
    suffixStat: "+4 to Level of all Projectile Skills",
    weights: { pref: { low: 0.04, central: 0.07, high: 0.1 }, suf: { low: 0.004, central: 0.008, high: 0.015 } },
    orb: { transmute: 0.16, augment: 0.28, divine: 341 },
    buyPriceDiv: 30,
  };

  it("computes central scenario odds and attempts", () => {
    const est = estimateCraft(input);
    const central = est.scenarios.find((s) => s.label.includes("CENTRAL"))!;
    // pPref central is weight*fracAbove = 0.07*0.75 = 0.0525; pSuf = 0.008
    expect(central.pPref).toBeCloseTo(0.0525, 4);
    expect(central.pSuf).toBeCloseTo(0.008, 4);
    expect(central.p).toBeCloseTo(0.0525 * 0.008, 6);
    expect(central.attempts).toBeCloseTo(1 / (0.0525 * 0.008), 1);
  });

  it("reports the target tiers and suffix availability", () => {
    const est = estimateCraft(input);
    expect(est.targetPrefixTiers[0].fracAboveMin).toBeCloseTo(0.75, 5);
    expect(est.targetSuffix?.stat).toBe("+4 to Level of all Projectile Skills");
  });
});
