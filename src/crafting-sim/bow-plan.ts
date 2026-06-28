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

// MODELLED desecration reveal odds (Abyssal pool — calibrated to the source video).
const BASE_MODEL: Omit<SlamModel, "pPrefix"> = {
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
  pCrit?: number;
  baseDiv: number;
  resaleDiv: number;
  verdict: string;
}

const PATH_SPECS: PathSpec[] = [
  {
    key: "proj-ele-t3",
    label: "+Proj · elemental prefixes · crit ≥T3",
    fracture: "proj",
    prefixMode: "elemental",
    baseDiv: 30,
    resaleDiv: RESALE.projTypical,
    verdict: "Only +EV craft. Break-even at floor; profit is the high-crit tail.",
  },
  {
    key: "proj-ele-t1",
    label: "+Proj · elemental · chase crit T1 (≥9%)",
    fracture: "proj",
    prefixMode: "elemental",
    pCrit: 0.07,
    baseDiv: 30,
    resaleDiv: RESALE.projTop,
    verdict: "Pricier hunt, but lands the ~460–630 div tier.",
  },
  {
    key: "proj-phys",
    label: "+Proj · physical-only prefixes · crit ≥T3",
    fracture: "proj",
    prefixMode: "physical",
    baseDiv: 30,
    resaleDiv: RESALE.projTypical,
    verdict: "Phys-only doubles prefix churn for ~equal DPS — prefer elemental.",
  },
  {
    key: "crit-ele",
    label: "Crit-fractured · elemental prefixes",
    fracture: "crit",
    prefixMode: "elemental",
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
      pCrit: s.pCrit ?? BASE_MODEL.pCrit,
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
      "Omen of Sinistral Exaltation": costs.exaltOmenDiv,
      "Orb of Annulment": costs.annulDiv,
      "Omen of Light": costs.lightDiv,
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
      "  A[Buy ilvl-81 fractured bow] --> B{Which fracture?}",
      '  B -->|"+Proj levels"| C[Path A · +EV]',
      '  B -->|"Crit chance"| Z["Path B · ~0.5 div resale<br/>buy instead, do not craft"]',
      "  C --> D[Fill 3 dmg prefixes<br/>Perfect Exalt + Sinistral · allow elemental]",
      "  D --> E[Desecrate suffixes<br/>crit + attack speed · Omen of Light to re-roll]",
      "  E --> F{Crit tier?}",
      '  F -->|"≥T3 (~8%)"| G[Floor ~130 div · settle]',
      '  F -->|"T1 (≥9%)"| H[Tail ~460–630 div · chase]',
      "  G --> I[Finish: ~4 Divine rolls + quality]",
      "  H --> I",
    ].join("\n"),
  };
}
