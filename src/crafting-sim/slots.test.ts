import { describe, it, expect } from "vitest";
import { scanSlots } from "./slots.js";
import type { ModTier } from "./pob-mods.js";

function t(p: Partial<ModTier>): ModTier {
  return {
    id: "x", type: "Suffix", affix: "of the Sniper",
    stat: "+4 to Level of all Projectile Skills", level: 81, group: "ProjLevel",
    weightKeys: ["bow"], canSpawnOn: (k) => k === "bow", ...p,
  };
}

describe("scanSlots", () => {
  it("summarizes pool sizes and flags chase mods per slot", () => {
    const tiers: ModTier[] = [
      t({}),
      t({ id: "y", type: "Prefix", group: "PhysPct", affix: "Tyrannical", stat: "(70-84)% increased Physical Damage" }),
    ];
    const bow = scanSlots(82, tiers).find((s) => s.slot === "bow")!;
    expect(bow.suffixGroups).toBe(1);
    expect(bow.prefixGroups).toBe(1);
    expect(bow.chase.some((c) => c.stat.includes("Projectile Skills"))).toBe(true);
  });
});
