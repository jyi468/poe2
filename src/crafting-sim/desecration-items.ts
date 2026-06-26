// Per-item-type config + EV assembly for the Desecration (Well of Souls) craft.
// Drives the Desecration tab: for each Lich-targetable item type it builds the
// craft cost from LIVE omen prices, runs the shared EV model, and emits a Mermaid
// flowchart. See crafting/method/desecration-lich-modifier.md.
//
// GAME CONSTRAINT (GGG-intentional): Lich-pool Omens (Sovereign/Liege/Blackblooded)
// work ONLY on weapons + jewellery (amulet/ring/belt). Armour can be desecrated
// (Rib bone) but cannot be Lich-targeted, so it is out of scope here.
//
// EXACT: omen costs (live snapshot). MODELLED + flagged: bone price (sourced
// in-game, not poe2scout-tracked), base price, poolShare `w`, soldValue bands.
// Lich→mod attribution is thematic — verify the exact mod's pool on poe2db.

import { simulateDesecration, type DesecCosts, type DesecModel, type DesecPath } from "./desecration.js";

export type Bone = "Jawbone" | "Collarbone";
export type Lich = "Ulaman" | "Amanamu" | "Kurgal";
export type Side = "prefix" | "suffix";

/** A queryable desecrated mod (trade2 stat id + display text). */
export interface ChaseMod {
  readonly id: string; // trade2 stat id, e.g. "desecrated.stat_2505884597"
  readonly text: string;
}

export interface DesecItem {
  readonly key: string;
  readonly label: string;
  readonly bone: Bone;
  readonly lich: Lich;
  readonly lichOmen: string; // Omen of the Sovereign / Liege / Blackblooded
  readonly side: Side; // primary chase-mod side → which Necromancy omen
  readonly tradeCategory: string; // trade2 category for the live floor search
  readonly chaseMods: readonly ChaseMod[]; // valuable desecrated mods to price
  readonly baseDiv: number; // ready-to-desecrate rare (ASSUMPTION — keep low)
  readonly boneDiv: number; // bone (ASSUMPTION — sourced in-game, not tracked)
  readonly model: DesecModel;
}

const D = (n: string): string => `desecrated.stat_${n}`;
const LICH_OMEN: Record<Lich, string> = {
  Ulaman: "Omen of the Sovereign",
  Amanamu: "Omen of the Liege",
  Kurgal: "Omen of the Blackblooded",
};

// Shared modelled bands. poolShare = chance a revealed mod is acceptable (Ancient
// Bones shrink the pool, raising w); reveals 6 = Abyssal Echoes used every cycle.
const POOL = { low: 0.03, central: 0.05, high: 0.08 };
const REVEALS = 6;

/** The five Lich-targetable item types, each with its chase mods + EV model. */
export const DESEC_ITEMS: readonly DesecItem[] = [
  {
    key: "martial-weapon",
    label: "Martial weapon",
    bone: "Jawbone",
    lich: "Ulaman",
    lichOmen: LICH_OMEN.Ulaman,
    side: "prefix",
    tradeCategory: "weapon",
    chaseMods: [
      { id: D("2505884597"), text: "Gain #% of Damage as Extra Cold Damage" },
      { id: D("3015669065"), text: "Gain #% of Damage as Extra Fire Damage" },
      { id: D("3278136794"), text: "Gain #% of Damage as Extra Lightning Damage" },
      { id: D("3398787959"), text: "Gain #% of Damage as Extra Chaos Damage" },
      { id: D("3032590688"), text: "Adds # to # Physical Damage to Attacks" },
    ],
    baseDiv: 0.3,
    boneDiv: 0.1,
    model: { poolShare: POOL, revealsPerCycle: REVEALS, soldValue: { low: 3, central: 6, high: 12 } },
  },
  {
    key: "caster-weapon",
    label: "Caster weapon (wand/staff)",
    bone: "Jawbone",
    lich: "Ulaman",
    lichOmen: LICH_OMEN.Ulaman,
    side: "prefix",
    tradeCategory: "weapon.wand",
    chaseMods: [
      { id: D("3176481473"), text: "#% increased Spell Damage while on Full Energy Shield" },
      { id: D("2910761524"), text: "#% chance for Spell Skills to fire 2 additional Projectiles" },
      { id: D("274716455"), text: "#% increased Critical Spell Damage Bonus" },
      { id: D("2974417149"), text: "#% increased Spell Damage" },
      { id: D("3981240776"), text: "# to Spirit" },
    ],
    baseDiv: 0.3,
    boneDiv: 0.1,
    model: { poolShare: POOL, revealsPerCycle: REVEALS, soldValue: { low: 3, central: 6, high: 12 } },
  },
  {
    key: "amulet",
    label: "Amulet",
    bone: "Collarbone",
    lich: "Amanamu",
    lichOmen: LICH_OMEN.Amanamu,
    side: "suffix",
    tradeCategory: "accessory.amulet",
    chaseMods: [
      { id: D("2704225257"), text: "# to Spirit" },
      { id: D("1978899297"), text: "#% to all Maximum Elemental Resistances" },
      { id: D("2901986750"), text: "#% to all Elemental Resistances" },
      { id: D("3984865854"), text: "#% increased Spirit" },
    ],
    baseDiv: 0.3,
    boneDiv: 0.1,
    model: { poolShare: POOL, revealsPerCycle: REVEALS, soldValue: { low: 4, central: 8, high: 15 } },
  },
  {
    key: "ring",
    label: "Ring",
    bone: "Collarbone",
    lich: "Amanamu",
    lichOmen: LICH_OMEN.Amanamu,
    side: "suffix",
    tradeCategory: "accessory.ring",
    chaseMods: [
      { id: D("1978899297"), text: "#% to all Maximum Elemental Resistances" },
      { id: D("3465022881"), text: "#% to Lightning and Chaos Resistances" },
      { id: D("378817135"), text: "#% to Fire and Chaos Resistances" },
      { id: D("3393628375"), text: "#% to Cold and Chaos Resistances" },
      { id: D("2704225257"), text: "# to Spirit" },
    ],
    baseDiv: 0.2,
    boneDiv: 0.1,
    model: { poolShare: POOL, revealsPerCycle: REVEALS, soldValue: { low: 2, central: 5, high: 10 } },
  },
  {
    key: "belt",
    label: "Belt",
    bone: "Collarbone",
    lich: "Amanamu",
    lichOmen: LICH_OMEN.Amanamu,
    side: "suffix",
    tradeCategory: "accessory.belt",
    chaseMods: [
      { id: D("1978899297"), text: "#% to all Maximum Elemental Resistances" },
      { id: D("3299347043"), text: "# to maximum Life" },
      { id: D("915769802"), text: "# to Stun Threshold" },
    ],
    baseDiv: 0.2,
    boneDiv: 0.1,
    model: { poolShare: POOL, revealsPerCycle: REVEALS, soldValue: { low: 2, central: 4, high: 8 } },
  },
];

/** Price lookup: name → divines, with a fallback when the item is untracked. */
export type DivOf = (name: string, fallbackEx: number) => number;

/** Assemble live craft costs for one item type from the omen prices. */
export function buildCosts(item: DesecItem, divOf: DivOf): DesecCosts {
  const sideOmen = item.side === "prefix" ? "Omen of Sinistral Necromancy" : "Omen of Dextral Necromancy";
  return {
    baseDiv: item.baseDiv,
    boneDiv: item.boneDiv,
    cycleOmensDiv:
      divOf(sideOmen, 2) + divOf(item.lichOmen, 4) + divOf("Omen of Abyssal Echoes", 90),
    clearDiv: divOf("Omen of Light", 2929) + divOf("Orb of Annulment", 233),
  };
}

/** Mermaid flowchart for one item type's desecration path. */
export function desecFlowchart(item: DesecItem): string {
  const sideOmen = item.side === "prefix" ? "Omen of Sinistral Necromancy" : "Omen of Dextral Necromancy";
  const example = item.chaseMods[0].text.replace(/"/g, "'");
  return [
    "flowchart TD",
    `  A["Buy ilvl 81+ rare ${item.label}<br/>3-4 good mods + open ${item.side} slot"] --> B`,
    `  B["Activate ${sideOmen}<br/>(forces the mod onto the ${item.side})"] --> C`,
    `  C["Activate ${item.lichOmen}<br/>(restrict to ${item.lich} pool)"] --> D`,
    `  D["Apply ${item.bone} + insert into the Well of Souls"] --> E`,
    `  E["3 mods revealed (6 with Omen of Abyssal Echoes)"] --> F`,
    `  F{"A target mod shown?<br/>e.g. ${example}"}`,
    `  F -->|"yes"| G["Take it. If the whole item is strong, list on trade"]`,
    `  F -->|"no"| H{"Reset"}`,
    `  H -->|"FRESH (cheaper)"| A`,
    `  H -->|"never Light-clear ~8.6 div"| X["Light + Annul = NOT worth it"]`,
  ].join("\n");
}

export interface DesecItemResult {
  readonly key: string;
  readonly label: string;
  readonly bone: Bone;
  readonly lich: Lich;
  readonly lichOmen: string;
  readonly side: Side;
  readonly tradeCategory: string;
  readonly chaseMods: readonly ChaseMod[];
  readonly costs: DesecCosts;
  readonly paths: readonly DesecPath[];
  readonly soldValue: DesecModel["soldValue"];
  readonly flowchart: string;
}

/** Evaluate every item type: live costs, EV paths, and a flowchart each. */
export function evaluateDesecItems(divOf: DivOf): DesecItemResult[] {
  return DESEC_ITEMS.map((item) => {
    const costs = buildCosts(item, divOf);
    return {
      key: item.key,
      label: item.label,
      bone: item.bone,
      lich: item.lich,
      lichOmen: item.lichOmen,
      side: item.side,
      tradeCategory: item.tradeCategory,
      chaseMods: item.chaseMods,
      costs,
      paths: simulateDesecration(item.model, costs),
      soldValue: item.model.soldValue,
      flowchart: desecFlowchart(item),
    };
  });
}
