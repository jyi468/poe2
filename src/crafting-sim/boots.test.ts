import { describe, it, expect } from "vitest";
import {
  bucketDist,
  evRevenue,
  pathCost,
  simulateBoots,
  type BootsCosts,
  type BootsModel,
  type OutcomeValues,
  type SlamOdds,
} from "./boots.js";

const COSTS: BootsCosts = {
  baseDiv: 0.15,
  essenceDiv: 0.005,
  exaltDiv: 0.003,
  sideOmenDiv: 0.05,
  perfectExaltDiv: 2.4,
};

const VALUES: OutcomeValues = { premium: 3, good: 1, mediocre: 0.3, junk: 0.1 };

describe("bucketDist", () => {
  it("buckets always sum to 1", () => {
    const slams: SlamOdds[] = [
      { u: 0.4, h: 0.35 },
      { u: 0.4, h: 0.35 },
      { u: 0.4, h: 0.35 },
    ];
    const d = bucketDist(slams, 0.4);
    expect(d.premium + d.good + d.mediocre + d.junk).toBeCloseTo(1, 10);
  });

  it("no second resist (R=0) zeroes premium and good", () => {
    const d = bucketDist([{ u: 0.5, h: 0.5 }], 0);
    expect(d.premium).toBe(0);
    expect(d.good).toBe(0);
    expect(d.junk).toBeCloseTo(0.5, 10); // (1-R)*(1-u) = 1*0.5
    expect(d.mediocre).toBeCloseTo(0.5, 10);
  });

  it("guaranteed resist + guaranteed high prefix is all premium", () => {
    const d = bucketDist([{ u: 1, h: 1 }], 1);
    expect(d.premium).toBeCloseTo(1, 10);
  });

  it("more prefix slams raise premium probability (monotone)", () => {
    const one = bucketDist([{ u: 0.4, h: 0.4 }], 0.4).premium;
    const three = bucketDist(
      [
        { u: 0.4, h: 0.4 },
        { u: 0.4, h: 0.4 },
        { u: 0.4, h: 0.4 },
      ],
      0.4,
    ).premium;
    expect(three).toBeGreaterThan(one);
  });
});

describe("evRevenue", () => {
  it("applies the sold discount to the asking EV", () => {
    const dist = { premium: 0.1, good: 0.2, mediocre: 0.4, junk: 0.3 };
    const r = evRevenue(dist, VALUES, 0.6);
    // asking = .1*3 + .2*1 + .4*.3 + .3*.1 = .3+.2+.12+.03 = .65
    expect(r.asking).toBeCloseTo(0.65, 10);
    expect(r.sold).toBeCloseTo(0.39, 10);
  });
});

describe("pathCost", () => {
  it("lean cost sums base, essence, and per-slam exalt+omen", () => {
    // 4 slams: 0.15 + 0.005 + 4*(0.003+0.05) = 0.155 + 0.212 = 0.367
    expect(pathCost(4, 0, COSTS)).toBeCloseTo(0.367, 10);
  });

  it("a Perfect Exalt swaps one regular Exalt for its price", () => {
    const lean = pathCost(4, 0, COSTS);
    const perfect = pathCost(4, 1, COSTS);
    expect(perfect - lean).toBeCloseTo(COSTS.perfectExaltDiv - COSTS.exaltDiv, 10);
  });
});

describe("simulateBoots", () => {
  const model: BootsModel = {
    openPrefixSlots: 3,
    openSuffixSlots: 1,
    pUsefulPrefix: { low: 0.3, central: 0.4, high: 0.5 },
    pHighTier: { low: 0.25, central: 0.35, high: 0.45 },
    pResistSuffix: { low: 0.3, central: 0.4, high: 0.5 },
  };

  it("returns three bands, each with lean and perfect paths", () => {
    const scen = simulateBoots(model, COSTS, VALUES, 0.6);
    expect(scen.map((s) => s.band)).toEqual([
      "UNLUCKY (low weights)",
      "CENTRAL estimate",
      "LUCKY (high weights)",
    ]);
    for (const s of scen) {
      expect(s.lean.dist.premium + s.lean.dist.good + s.lean.dist.mediocre + s.lean.dist.junk).toBeCloseTo(1, 10);
    }
  });

  it("the Perfect-Exalt path costs ~2.4 div more and rarely recovers it on a 3-div ceiling", () => {
    const central = simulateBoots(model, COSTS, VALUES, 0.6).find((s) => s.band === "CENTRAL estimate")!;
    expect(central.perfect.costDiv - central.lean.costDiv).toBeCloseTo(COSTS.perfectExaltDiv - COSTS.exaltDiv, 10);
    // Guaranteeing one tier lifts revenue, but not by 2.4 div on a 3-div premium ceiling.
    expect(central.perfect.evRevenueSold - central.lean.evRevenueSold).toBeLessThan(COSTS.perfectExaltDiv - COSTS.exaltDiv);
    expect(central.perfect.evProfitDiv).toBeLessThan(central.lean.evProfitDiv);
  });
});
