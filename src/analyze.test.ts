import { describe, it, expect } from "vitest";
import { diffMetrics } from "./analyze.js";

describe("diffMetrics", () => {
  it("computes deltas and percentages, sorted by magnitude", () => {
    const before = { Life: 4000, TotalDPS: 1_000_000, FireResist: 75 };
    const after = { Life: 4200, TotalDPS: 1_500_000, FireResist: 75 };
    const d = diffMetrics(before, after);
    expect(d[0].key).toBe("TotalDPS");
    expect(d[0].delta).toBe(500_000);
    const life = d.find((x) => x.key === "Life")!;
    expect(life.pct).toBeCloseTo(5, 5);
  });

  it("handles new keys with null pct", () => {
    const d = diffMetrics({}, { EnergyShield: 300 });
    expect(d[0]).toMatchObject({ key: "EnergyShield", before: null, after: 300, delta: 300, pct: null });
  });
});
