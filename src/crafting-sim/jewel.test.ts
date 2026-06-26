import { describe, expect, it } from "vitest";

import { keepProb, simulateJewel, type JewelInputs } from "./jewel.js";

describe("keepProb", () => {
  it("is 0 for a lone-crit jewel (always nuked)", () => {
    expect(keepProb(1)).toBe(0);
    expect(keepProb(0)).toBe(0);
  });

  it("rises with more junk mods to dilute the random removal", () => {
    expect(keepProb(2)).toBeCloseTo(0.5, 5);
    expect(keepProb(3)).toBeCloseTo(0.6667, 3);
    expect(keepProb(4)).toBeCloseTo(0.75, 5);
    expect(keepProb(4)).toBeGreaterThan(keepProb(2));
  });
});

describe("simulateJewel", () => {
  const base: JewelInputs = {
    baseDiv: 0.02,
    emotionDiv: 0.073,
    modCount: 4,
    floorDiv: 0.003,
    sellPair: { low: 0.5, central: 1, high: 5 },
  };

  it("returns three sale bands sharing one keep prob and attempt cost", () => {
    const paths = simulateJewel(base);
    expect(paths).toHaveLength(3);
    expect(paths.every((p) => p.keepProb === 0.75)).toBe(true);
    expect(paths.every((p) => Math.abs(p.attemptCostDiv - 0.093) < 1e-9)).toBe(true);
  });

  it("cost per keeper exceeds attempt cost because failures still pay", () => {
    const central = simulateJewel(base).find((p) => p.band.startsWith("CENTRAL"))!;
    // 0.093 / 0.75 = 0.124
    expect(central.costPerKeeperDiv).toBeCloseTo(0.124, 3);
    expect(central.costPerKeeperDiv).toBeGreaterThan(central.attemptCostDiv);
  });

  it("is strongly +EV per attempt when a keeper sells far above input", () => {
    const central = simulateJewel(base).find((p) => p.band.startsWith("CENTRAL"))!;
    // 0.75*1 + 0.25*0.003 - 0.093 ≈ 0.658
    expect(central.evPerAttemptDiv).toBeCloseTo(0.658, 2);
    expect(central.evPerAttemptDiv).toBeGreaterThan(0);
  });

  it("a 1-mod jewel is a guaranteed brick (keep 0, negative EV)", () => {
    const lone = simulateJewel({ ...base, modCount: 1 });
    expect(lone[0].keepProb).toBe(0);
    expect(lone[0].costPerKeeperDiv).toBe(Infinity);
    expect(lone.every((p) => p.evPerAttemptDiv < 0)).toBe(true);
  });
});
