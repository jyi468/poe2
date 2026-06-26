// Per-slot mod-pool structure from PoB's tier tables: pool sizes (the variance
// driver) plus the "chase" mods (+skill levels, Spirit, additional projectile)
// with their ilvl gates and value ranges. Pure over an injected tier list.

import { loadModTiers, poolFor, type ModTier } from "./pob-mods.js";

export const SLOT_DEFS: { name: string; keys: string[] }[] = [
  { name: "amulet", keys: ["amulet"] },
  { name: "ring", keys: ["ring"] },
  { name: "wand", keys: ["wand", "weapon"] },
  { name: "sceptre", keys: ["sceptre", "weapon"] },
  { name: "focus", keys: ["focus"] },
  { name: "staff", keys: ["staff", "weapon"] },
  { name: "bow", keys: ["bow", "weapon"] },
  { name: "spear", keys: ["spear", "weapon"] },
  { name: "crossbow", keys: ["crossbow", "weapon"] },
  { name: "quiver", keys: ["quiver"] },
  { name: "gloves", keys: ["gloves"] },
  { name: "boots", keys: ["boots"] },
  { name: "belt", keys: ["belt"] },
  { name: "helmet", keys: ["helmet"] },
  { name: "body_armour", keys: ["body_armour"] },
];

const CHASE = [/to Level of all .* Skills/i, /\bSpirit\b/i, /additional Arrow|additional Projectile/i];

export interface ChaseMod {
  type: "Prefix" | "Suffix";
  affix: string;
  stat: string;
  level: number;
  group: string;
}
export interface SlotSummary {
  slot: string;
  keys: string[];
  prefixCount: number;
  prefixGroups: number;
  suffixCount: number;
  suffixGroups: number;
  chase: ChaseMod[];
}

function groups(pool: ModTier[]): number {
  return new Set(pool.map((t) => t.group)).size;
}

export function scanSlots(ilvl: number, tiers: ModTier[] = loadModTiers()): SlotSummary[] {
  return SLOT_DEFS.map((s) => {
    const pre = poolFor(tiers, s.keys, "Prefix", ilvl);
    const suf = poolFor(tiers, s.keys, "Suffix", ilvl);
    const byGroup = new Map<string, ChaseMod>();
    for (const t of [...pre, ...suf]) {
      if (!CHASE.some((r) => r.test(t.stat))) continue;
      const cur = byGroup.get(t.group);
      if (!cur || t.level > cur.level) {
        byGroup.set(t.group, { type: t.type, affix: t.affix, stat: t.stat, level: t.level, group: t.group });
      }
    }
    return {
      slot: s.name,
      keys: [...s.keys],
      prefixCount: pre.length,
      prefixGroups: groups(pre),
      suffixCount: suf.length,
      suffixGroups: groups(suf),
      chase: [...byGroup.values()].sort((a, b) => b.level - a.level),
    };
  });
}
