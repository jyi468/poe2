// Parse PoB2's Data/ModItem.lua to extract the *tier table* (ilvl gates + value
// ranges + affix type + group) for item mods. PoB ships exact tiers/ilvls but its
// `weightVal` entries are only can/can't-spawn flags (1/0), NOT real GGG spawn
// weights — so spawn weights are modelled separately in magic-craft.ts.
//
// $POB_REPO must point at a PathOfBuilding-PoE2 checkout (same env the bridge uses).

import { readFileSync } from "node:fs";
import { join } from "node:path";

const POB_REPO = process.env.POB_REPO ?? join(process.env.HOME ?? "", "projects/PathOfBuilding-PoE2");
const MOD_FILE = join(POB_REPO, "src/Data/ModItem.lua");

export interface ModTier {
  readonly id: string;
  readonly type: "Prefix" | "Suffix";
  readonly affix: string; // e.g. "Tyrannical"
  readonly stat: string; // e.g. "(155-169)% increased Physical Damage"
  readonly level: number; // required item level
  readonly group: string; // mods in one group are mutually exclusive
  readonly weightKeys: readonly string[]; // bases this mod can roll on (e.g. "bow")
  readonly canSpawnOn: (weightKey: string) => boolean;
}

const LINE = /\["([^"]+)"\]\s*=\s*\{[^\n]*?type = "(Prefix|Suffix)"[^\n]*?affix = "([^"]*)", "([^"]*)"[^\n]*?level = (\d+), group = "([^"]*)"[^\n]*?weightKey = \{([^}]*)\}[^\n]*?weightVal = \{([^}]*)\}/;

function parseList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

export function loadModTiers(): ModTier[] {
  const text = readFileSync(MOD_FILE, "utf8");
  const out: ModTier[] = [];
  for (const raw of text.split("\n")) {
    const m = LINE.exec(raw);
    if (!m) continue;
    const [, id, type, affix, stat, level, group, keysRaw, valsRaw] = m;
    const keys = parseList(keysRaw);
    const vals = parseList(valsRaw).map(Number);
    // keys/vals are positional pairs; a base can spawn the mod when its weight > 0.
    const spawnable = new Set<string>();
    keys.forEach((k, i) => {
      if ((vals[i] ?? 0) > 0) spawnable.add(k);
    });
    out.push({
      id,
      type: type as ModTier["type"],
      affix,
      stat,
      level: Number(level),
      group,
      weightKeys: keys,
      canSpawnOn: (wk) => spawnable.has(wk),
    });
  }
  return out;
}

/**
 * Mods of `type` that can spawn at or below `ilvl` on a base whose applicable
 * weight keys are `keys`. A bow inherits weapon-generic mods, so pass
 * ["bow", "weapon"] — a mod qualifies if ANY of its keys has weight > 0.
 */
export function poolFor(
  tiers: readonly ModTier[],
  keys: readonly string[],
  type: "Prefix" | "Suffix",
  ilvl: number,
): ModTier[] {
  return tiers.filter(
    (t) => t.type === type && t.level <= ilvl && keys.some((k) => t.canSpawnOn(k)),
  );
}

/** Parse the numeric low end of a stat string like "(65-84)% ..." or "+4 to ...". */
export function statLow(stat: string): number {
  const range = /\((\d+(?:\.\d+)?)-\d+/.exec(stat);
  if (range) return Number(range[1]);
  const flat = /([+-]?\d+(?:\.\d+)?)/.exec(stat);
  return flat ? Number(flat[1]) : NaN;
}

export function statHigh(stat: string): number {
  const range = /\(\d+(?:\.\d+)?-(\d+(?:\.\d+)?)/.exec(stat);
  if (range) return Number(range[1]);
  return statLow(stat);
}
