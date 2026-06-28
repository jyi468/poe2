// Builds the Bow Crafting tab payload: the omen-slam method, both fracture paths
// with live-priced EV (via simulateBowSlam), the EXACT prefix odds, real trade2
// resale reference, and equipment-filter trade presets for the live floor puller.
// Pure given a `divOf` price lookup (mirrors jewel-plan.ts / desecration).
//
// EXACT: prefix odds (craftofexile weights, bow id_base 20, ilvl 81) + consumable
//   prices (caller's divOf, live economy snapshot).
// MODELLED: per-desecrate suffix odds + resale assumptions (resale also re-checkable
//   live in the tab via the floor puller).

import {
  simulateBowSlam,
  type FracturePath,
  type SlamCosts,
  type SlamModel,
} from "./bow-omen-slam.js";

export type DivOf = (name: string, fallbackEx: number) => number;

export interface BowBase {
  name: string;
  ilvl: number;
  phys: string;
  critPct: number;
  atkTime: number;
  note: string;
}
export interface OddsRow {
  label: string;
  chaos: string;
  perfectExalt: string;
}
export interface BowPath {
  key: string;
  label: string;
  fracture: "proj" | "crit";
  prefixMode: "elemental" | "physical";
  baseDiv: number;
  consumablesDiv: { mean: number; p50: number; p85: number; p95: number };
  bankrollDiv: number; // base + p85 consumables
  typicalAllInDiv: number; // base + mean consumables
  resaleDiv: number;
  evDiv: number;
  verdict: string;
}
export interface ResaleRow {
  label: string;
  floorDiv: number;
}
export interface BowTradePreset {
  key: string;
  label: string;
  spec: {
    category: string;
    rarity: string;
    stats?: { id: string; min?: number }[];
    crit?: { min: number };
    pdps?: { min: number };
    sort: "asc";
    limit: number;
  };
}
export interface BowPlan {
  divine: number;
  pulledAt: string | null;
  assumptions: string[];
  bases: BowBase[];
  exactOdds: OddsRow[];
  costInputsDiv: Record<string, number>;
  paths: BowPath[];
  resale: ResaleRow[];
  tradePresets: BowTradePreset[];
  flowchart: string;
}

const PROJ_STAT = "explicit.stat_1202301673"; // +# to Level of all Projectile Skills

// EXACT per-slam prefix odds (craftofexile weights, id_base 20, ilvl 81).
const P_PREFIX_ELE = 0.753;
const P_PREFIX_PHYS = 0.225;

// MODELLED desecration reveal odds (per single revealed mod; Abyssal pool — calibrated
// to the source video). Each path overrides critSource / revealsPerCycle.
const BASE_MODEL: Omit<SlamModel, "pPrefix" | "critSource" | "revealsPerCycle"> = {
  pCrit: 0.13,
  pAttackSpeed: 0.2,
  pCritDamage: 0.18,
  prefixCount: 3,
  finishingDivines: 4,
};

// Real trade2 floors (equipment filters, 2026-06-28) — also re-checkable live below.
const RESALE = {
  projFloor: 130, // +4 Proj · crit>=8% (T3) · pDPS>=450
  projTypical: 200, // settled output
  projTop: 500, // +4 Proj · crit>=9% (T1) · pDPS>=600  → ~460-630
  crit: 0.5, // crit+pDPS bow WITHOUT +levels — flooded market
};

interface PathSpec {
  key: string;
  label: string;
  fracture: FracturePath;
  prefixMode: "elemental" | "physical";
  critSource: "essence" | "desecrate";
  revealsPerCycle: number;
  baseDiv: number;
  resaleDiv: number;
  verdict: string;
}

const PATH_SPECS: PathSpec[] = [
  {
    key: "proj-essence",
    label: "+Proj · Essence-Seeking crit (guaranteed) · Echoes attack speed",
    fracture: "proj",
    prefixMode: "elemental",
    critSource: "essence",
    revealsPerCycle: 6,
    baseDiv: 30,
    resaleDiv: RESALE.projTypical,
    verdict: "Cheapest + lowest variance — crit guaranteed via Essence of Seeking. Needs crafted-slot injection on the fractured rare (confirm in-game).",
  },
  {
    key: "proj-echoes",
    label: "+Proj · desecrate crit via Abyssal Echoes · Echoes attack speed",
    fracture: "proj",
    prefixMode: "elemental",
    critSource: "desecrate",
    revealsPerCycle: 6,
    baseDiv: 30,
    resaleDiv: RESALE.projTypical,
    verdict: "Fallback if essence-crit can't be slotted. Cheap 6-reveal desecrate, not Light-per-miss.",
  },
  {
    key: "proj-conservative",
    label: "+Proj · desecrate crit · Light-clear per miss (pessimistic)",
    fracture: "proj",
    prefixMode: "elemental",
    critSource: "desecrate",
    revealsPerCycle: 1,
    baseDiv: 30,
    resaleDiv: RESALE.projTypical,
    verdict: "Original conservative model — single reveal, Omen-of-Light clears. Upper-bound cost.",
  },
  {
    key: "crit-ele",
    label: "Crit-fractured · elemental prefixes",
    fracture: "crit",
    prefixMode: "elemental",
    critSource: "desecrate",
    revealsPerCycle: 6,
    baseDiv: 32,
    resaleDiv: RESALE.crit,
    verdict: "Negative — no +levels means ~0.5 div resale. Buy one, don't craft.",
  },
];

function costsFrom(divOf: DivOf): SlamCosts {
  return {
    perfectExaltDiv: divOf("Perfect Exalted Orb", 865),
    exaltOmenDiv: divOf("Omen of Sinistral Exaltation", 14),
    annulDiv: divOf("Orb of Annulment", 212),
    lightDiv: divOf("Omen of Light", 3149),
    jawboneDiv: 0.02, // Preserved Jawbone + Dextral Necromancy — sourced in-game
    echoesDiv: divOf("Omen of Abyssal Echoes", 210),
    essenceSeekingDiv: divOf("Greater Essence of Seeking", 6),
    divineDiv: 1.0,
  };
}

const round = (n: number) => Math.round(n);

export function buildBowPlan(divOf: DivOf, divine: number, pulledAt: string | null): BowPlan {
  const costs = costsFrom(divOf);

  const paths: BowPath[] = PATH_SPECS.map((s) => {
    const model: SlamModel = {
      ...BASE_MODEL,
      pPrefix: s.prefixMode === "elemental" ? P_PREFIX_ELE : P_PREFIX_PHYS,
      critSource: s.critSource,
      revealsPerCycle: s.revealsPerCycle,
    };
    const { stats } = simulateBowSlam(s.fracture, model, costs, { trials: 20000, seed: 42 });
    const bankroll = s.baseDiv + stats.p85;
    const typical = s.baseDiv + stats.mean;
    return {
      key: s.key,
      label: s.label,
      fracture: s.fracture,
      prefixMode: s.prefixMode,
      baseDiv: s.baseDiv,
      consumablesDiv: {
        mean: round(stats.mean),
        p50: round(stats.p50),
        p85: round(stats.p85),
        p95: round(stats.p95),
      },
      bankrollDiv: round(bankroll),
      typicalAllInDiv: round(typical),
      resaleDiv: s.resaleDiv,
      evDiv: round(s.resaleDiv - typical),
      verdict: s.verdict,
    };
  });

  return {
    divine,
    pulledAt,
    assumptions: [
      "Base ilvl 81. Prefix odds EXACT from craftofexile weights (bow id_base 20).",
      "Desecration reveal odds (crit/attack-speed/crit-damage) are MODELLED — tune vs real reveals.",
      "Consumable prices live from the economy snapshot; jawbones sourced in-game (assumption).",
      "Resale = live trade2 floors via equipment filters (crit %, pDPS, +Proj) — re-check below.",
    ],
    bases: [
      {
        name: "Obliterator Bow",
        ilvl: 78,
        phys: "62–115",
        critPct: 5,
        atkTime: 909,
        note: "Higher pDPS ceiling; −50% projectile range implicit.",
      },
      {
        name: "Warmonger Bow",
        ilvl: 77,
        phys: "56–84",
        critPct: 5,
        atkTime: 833,
        note: "~9% faster, no downside. Identical craftable mod pool (id_base 20).",
      },
    ],
    exactOdds: [
      { label: "flat-or-% physical, ≥T3", chaos: "1 in 117 (0.85%)", perfectExalt: "1 in 4.4 (22.5%)" },
      { label: "phys incl. hybrid+acc", chaos: "1 in 64", perfectExalt: "1 in 2.9" },
      { label: "phys OR elemental", chaos: "1 in 22", perfectExalt: "1 in 1.3 (75.3%)" },
    ],
    costInputsDiv: {
      "Perfect Exalted Orb": costs.perfectExaltDiv,
      "Sinistral Exaltation omen": costs.exaltOmenDiv,
      "Orb of Annulment (reroll)": costs.annulDiv,
      "Omen of Light (clear)": costs.lightDiv,
      "Omen of Abyssal Echoes": costs.echoesDiv,
      "Greater Essence of Seeking (crit)": costs.essenceSeekingDiv,
      "Preserved Jawbone (in-game)": costs.jawboneDiv,
    },
    paths,
    resale: [
      { label: "crit ≥8% · pDPS ≥450 · NO +levels (flooded)", floorDiv: RESALE.crit },
      { label: "+4 Proj · crit ≥8% (T3) · pDPS ≥450", floorDiv: RESALE.projFloor },
      { label: "+4 Proj · crit ≥9% (T1) · pDPS ≥600", floorDiv: RESALE.projTop },
    ],
    tradePresets: [
      {
        key: "a-floor",
        label: "Path A floor — +4 Proj · crit≥8 · pDPS≥450",
        spec: {
          category: "weapon.bow",
          rarity: "nonunique",
          stats: [{ id: PROJ_STAT, min: 4 }],
          crit: { min: 8 },
          pdps: { min: 450 },
          sort: "asc",
          limit: 5,
        },
      },
      {
        key: "a-top",
        label: "Path A top — +4 Proj · crit≥9 · pDPS≥600",
        spec: {
          category: "weapon.bow",
          rarity: "nonunique",
          stats: [{ id: PROJ_STAT, min: 4 }],
          crit: { min: 9 },
          pdps: { min: 600 },
          sort: "asc",
          limit: 5,
        },
      },
      {
        key: "b-noproj",
        label: "Path B — crit≥8 · pDPS≥450 · no levels",
        spec: {
          category: "weapon.bow",
          rarity: "nonunique",
          crit: { min: 8 },
          pdps: { min: 450 },
          sort: "asc",
          limit: 5,
        },
      },
    ],
    flowchart: [
      "flowchart TD",
      '  A["1. Buy ilvl-81 fractured +Proj bow (rare)"] --> B["2. Strip to the bare fracture<br/>(annul extra mods down)"]',
      '  B --> P1["3. Add a prefix:<br/>Omen of Sinistral Exaltation + Perfect Exalted Orb"]',
      "  P1 --> P2{Damage prefix?<br/>phys or elemental}",
      '  P2 -->|"No · junk"| PA["REROLL · Orb of Annulment<br/>remove the junk prefix while it is the only/newest one"]',
      "  PA --> P1",
      "  P2 -->|Yes · keep| P3{3 damage prefixes yet?}",
      "  P3 -->|No| P1",
      "  P3 -->|Yes| C0{Crit source}",
      '  C0 -->|"Essence-Seeking (crafted slot)"| C1["4a. Crit GUARANTEED ~0.02 div"]',
      '  C0 -->|"Desecrate"| D1["4b. Desecrate a suffix + Omen of Abyssal Echoes<br/>(3 options, reroll once)"]',
      "  D1 --> D2{Crit revealed?}",
      '  D2 -->|"No"| DC["CLEAR · Omen of Light + Orb of Annulment<br/>strip the bad desecrated mod, then re-desecrate"]',
      "  DC --> D1",
      "  D2 -->|Yes| C1",
      '  C1 --> S1["5. Attack speed:<br/>desecrate + Abyssal Echoes (or Essence of Haste)"]',
      "  S1 --> S2{Attack speed revealed?}",
      '  S2 -->|"No"| SC["CLEAR · Omen of Light + Annul → re-desecrate"]',
      "  SC --> S1",
      "  S2 -->|Yes| T0{Junk mod trapped<br/>among keepers on one side?}",
      '  T0 -->|"Yes"| TE["TARGETED REMOVE · Omen of Sinistral/Dextral Erasure<br/>(chaos removes only that side) · or Sinistral/Dextral Annulment"]',
      "  TE --> F1",
      "  T0 -->|No| F1",
      '  F1["6. Finish · ~4 Divine Orb rolls toward high values + quality"]',
    ].join("\n"),
  };
}
