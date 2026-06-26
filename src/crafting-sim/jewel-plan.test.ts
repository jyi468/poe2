import { describe, expect, it } from "vitest";

import { buildJewelPlan, jewelFlowchart, type DivOf } from "./jewel-plan.js";

const divOf: DivOf = (name, fb) => {
  const ex: Record<string, number> = {
    "Concentrated Liquid Fear": 26,
    "Liquid Despair": 7,
  };
  return (ex[name] ?? fb) / 364;
};

describe("jewelFlowchart", () => {
  it("emits a balanced flowchart mentioning the keep formula", () => {
    const chart = jewelFlowchart();
    expect(chart.startsWith("flowchart TD")).toBe(true);
    expect(chart).toContain("(N-1)/N");
    expect((chart.match(/"/g) ?? []).length % 2).toBe(0);
    expect((chart.match(/\[/g) ?? []).length).toBe((chart.match(/\]/g) ?? []).length);
  });
});

describe("buildJewelPlan", () => {
  it("returns both emotion recipes with live prices and 3 mod-count scenarios", () => {
    const plan = buildJewelPlan(divOf);
    expect(plan.recipes.map((r) => r.key)).toEqual(["fear-crit-damage", "despair-crit-chance"]);
    for (const r of plan.recipes) {
      expect(r.scenarios.map((s) => s.modCount)).toEqual([2, 3, 4]);
      expect(r.searchStats.length).toBeGreaterThan(0);
      for (const s of r.searchStats) expect(s.id).toMatch(/^explicit\.stat_\d+$/);
    }
  });

  it("keep prob rises with mod count and EV stays positive at live prices", () => {
    const fear = buildJewelPlan(divOf).recipes.find((r) => r.key === "fear-crit-damage")!;
    const keeps = fear.scenarios.map((s) => s.keepProb);
    expect(keeps).toEqual([0.5, expect.closeTo(0.6667, 3), 0.75]);
    expect(fear.scenarios.every((s) => s.evPerAttemptDiv > 0)).toBe(true);
    // 4-mod EV per attempt should beat 2-mod (lower removal risk).
    expect(fear.scenarios[2].evPerAttemptDiv).toBeGreaterThan(fear.scenarios[0].evPerAttemptDiv);
  });

  it("Despair (cheaper emotion) costs less per keeper than Fear at the same mod count", () => {
    const plan = buildJewelPlan(divOf);
    const fear4 = plan.recipes[0].scenarios[2].costPerKeeperDiv;
    const despair4 = plan.recipes[1].scenarios[2].costPerKeeperDiv;
    expect(despair4).toBeLessThan(fear4);
  });
});
