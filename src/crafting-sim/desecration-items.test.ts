import { describe, expect, it } from "vitest";

import {
  DESEC_ITEMS,
  buildCosts,
  desecFlowchart,
  evaluateDesecItems,
  type DivOf,
} from "./desecration-items.js";

// Fake price book (ex), 1 div = 100 ex for round numbers.
const PRICES: Record<string, number> = {
  "Omen of Sinistral Necromancy": 1,
  "Omen of Dextral Necromancy": 2,
  "Omen of the Sovereign": 4,
  "Omen of the Liege": 1,
  "Omen of Abyssal Echoes": 90,
  "Omen of Light": 800,
  "Orb of Annulment": 200,
};
const divOf: DivOf = (name, fb) => (PRICES[name] ?? fb) / 100;

describe("DESEC_ITEMS config", () => {
  it("covers exactly the five Lich-targetable item types", () => {
    expect(DESEC_ITEMS.map((i) => i.key)).toEqual([
      "martial-weapon",
      "caster-weapon",
      "amulet",
      "ring",
      "belt",
    ]);
  });

  it("only uses Jawbone (weapons) or Collarbone (jewellery) — never armour", () => {
    for (const item of DESEC_ITEMS) {
      expect(["Jawbone", "Collarbone"]).toContain(item.bone);
    }
  });

  it("every chase mod is a desecrated trade stat id", () => {
    for (const item of DESEC_ITEMS) {
      expect(item.chaseMods.length).toBeGreaterThan(0);
      for (const m of item.chaseMods) expect(m.id).toMatch(/^desecrated\.stat_\d+$/);
    }
  });
});

describe("buildCosts", () => {
  it("picks the side omen from the item's primary side", () => {
    const weapon = DESEC_ITEMS.find((i) => i.key === "martial-weapon")!; // prefix → Sinistral
    const ring = DESEC_ITEMS.find((i) => i.key === "ring")!; // suffix → Dextral
    // Sinistral 1 + Sovereign 4 + Echoes 90 = 95 ex = 0.95 div
    expect(buildCosts(weapon, divOf).cycleOmensDiv).toBeCloseTo(0.95, 5);
    // Dextral 2 + Liege 1 + Echoes 90 = 93 ex = 0.93 div
    expect(buildCosts(ring, divOf).cycleOmensDiv).toBeCloseTo(0.93, 5);
  });

  it("clear cost = Light + Annul (the expensive reset)", () => {
    const costs = buildCosts(DESEC_ITEMS[0], divOf);
    expect(costs.clearDiv).toBeCloseTo((800 + 200) / 100, 5);
  });
});

describe("desecFlowchart", () => {
  it("emits a balanced flowchart naming the bone and Lich omen", () => {
    for (const item of DESEC_ITEMS) {
      const chart = desecFlowchart(item);
      expect(chart.startsWith("flowchart TD")).toBe(true);
      expect(chart).toContain(item.bone);
      expect(chart).toContain(item.lichOmen);
      expect((chart.match(/"/g) ?? []).length % 2).toBe(0);
      expect((chart.match(/\[/g) ?? []).length).toBe((chart.match(/\]/g) ?? []).length);
    }
  });
});

describe("evaluateDesecItems", () => {
  it("returns one result per item with three EV bands and a flowchart", () => {
    const results = evaluateDesecItems(divOf);
    expect(results).toHaveLength(DESEC_ITEMS.length);
    for (const r of results) {
      expect(r.paths).toHaveLength(3);
      expect(r.flowchart).toContain("flowchart TD");
      expect(typeof r.paths[1].evProfitDiv).toBe("number");
    }
  });
});
