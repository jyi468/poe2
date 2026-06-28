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

// EXACT weight shares (craftofexile, bow id_base 20, ilvl 81).
const P_PREFIX_ELE = 0.753; // a top-tier prefix is phys OR elemental
const P_PREFIX_PHYS = 0.225; // phys-only
const P_CRIT_SUFFIX = 3875 / 55050; // 7.04% — a Perfect-Exalt suffix is crit (lands T1)
const P_SECOND_SUFFIX = (3900 + 3875) / 55050; // 14.1% — attack speed OR crit damage
const P_CRIT_DESEC_ANCIENT = 875 / 21400; // 4.09% — crit ≥T3 per reveal under an Ancient bone

const BASE_MODEL: Omit<SlamModel, "pPrefix" | "critSource"> = {
  pCritSuffix: P_CRIT_SUFFIX,
  pSecondSuffix: P_SECOND_SUFFIX,
  pCritDesecReveal: P_CRIT_DESEC_ANCIENT,
  revealsPerCycle: 6, // Abyssal Echoes
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
  critSource: "exalt" | "desecrate";
  baseDiv: number;
  resaleDiv: number;
  verdict: string;
}

// Real weights show crit is only ~7% of the suffix pool, so Perfect-Exalt slamming crit
// (lands T1, cheap annul misses) beats DESECRATING it (same type-rarity, one mod at a time,
// ~8.6-div Light clears). Essence-Seeking is impossible (essences need a Magic base; this
// one is a fractured rare). Recombinator is removed in 0.5.
const PATH_SPECS: PathSpec[] = [
  {
    key: "proj-exalt",
    label: "+Proj · Perfect-Exalt crit (lands T1) + attack speed · elemental prefixes",
    fracture: "proj",
    prefixMode: "elemental",
    critSource: "exalt",
    baseDiv: 30,
    resaleDiv: RESALE.projTypical,
    verdict: "RECOMMENDED. Crit at ~7%/slam but T1 free; annul misses cheap. The +EV craft.",
  },
  {
    key: "proj-desecrate",
    label: "+Proj · desecrate crit (Ancient bone) + exalt attack speed · elemental",
    fracture: "proj",
    prefixMode: "elemental",
    critSource: "desecrate",
    baseDiv: 30,
    resaleDiv: RESALE.projTypical,
    verdict: "More expensive — desecration fights the same ~7% crit-type rarity with ~8.6-div Light clears. Don't.",
  },
  {
    key: "proj-phys",
    label: "+Proj · Perfect-Exalt crit · physical-only prefixes",
    fracture: "proj",
    prefixMode: "physical",
    critSource: "exalt",
    baseDiv: 30,
    resaleDiv: RESALE.projTypical,
    verdict: "Phys-only doubles prefix churn for ~equal DPS — prefer elemental.",
  },
  {
    key: "crit-ele",
    label: "Crit-fractured · elemental prefixes",
    fracture: "crit",
    prefixMode: "elemental",
    critSource: "exalt",
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
    lightDiv: divOf("Omen of Light", 3149), // desecrate alternative only
    boneDiv: divOf("Ancient Jawbone", 3505), // desecrate alternative only
    echoesDiv: divOf("Omen of Abyssal Echoes", 210), // desecrate alternative only
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
      "Base ilvl 81. Prefix + suffix odds are EXACT craftofexile weight shares (bow id_base 20).",
      "Suffixes filled with Perfect Exalt + Dextral Exaltation (top tier): crit is 7.04% of the pool but lands T1; attack-speed-or-crit-damage is 14.1%. Junk is annulled in place (~0.6 div), not re-bought.",
      "Crit by EXALT beats DESECRATION: you may hold one desecrated mod at a time, crit is ~7% either way, and desec misses cost ~8.6-div Omen-of-Light clears. Essence-Seeking is impossible (needs a Magic base; this is a fractured rare).",
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
      { label: "PREFIX · phys OR elemental (per Perfect Exalt)", chaos: "1 in 22", perfectExalt: "1 in 1.3 (75.3%)" },
      { label: "PREFIX · flat-or-% physical, ≥T3", chaos: "1 in 117", perfectExalt: "1 in 4.4 (22.5%)" },
      { label: "SUFFIX · crit chance (Perfect Exalt → T1)", chaos: "—", perfectExalt: "1 in 14 (7.0%)" },
      { label: "SUFFIX · attack speed OR crit damage", chaos: "—", perfectExalt: "1 in 7 (14.1%)" },
    ],
    costInputsDiv: {
      "Perfect Exalted Orb": costs.perfectExaltDiv,
      "Sinistral/Dextral Exaltation omen": costs.exaltOmenDiv,
      "Orb of Annulment (reroll)": costs.annulDiv,
      "Omen of Light (desec-only clear)": costs.lightDiv,
      "Ancient Jawbone (desec-only)": costs.boneDiv,
      "Omen of Abyssal Echoes (desec-only)": costs.echoesDiv,
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
      '  A["1. Buy ilvl-81 fractured +Proj bow (rare).<br/>Fracture is a suffix and is annul-IMMUNE."] --> B["2. Strip to the bare fracture<br/>(annul the extra mods down)"]',
      '  B --> P1["3. Add a PREFIX:<br/>Omen of Sinistral Exaltation + Perfect Exalted Orb (top tier)"]',
      "  P1 --> P2{Damage prefix?<br/>phys or elemental}",
      '  P2 -->|"No · junk"| PA["REROLL · Orb of Annulment (~0.6 div)<br/>remove the junk prefix while it is the only/newest one"]',
      "  PA --> P1",
      "  P2 -->|Yes · keep| P3{3 damage prefixes yet?}",
      "  P3 -->|No| P1",
      '  P3 -->|Yes| S1["4. CRIT = a SUFFIX slam:<br/>Omen of Dextral Exaltation + Perfect Exalted Orb.<br/>Crit is ~7% of the pool but lands T1 when it hits."]',
      "  S1 --> S2{Crit chance?}",
      '  S2 -->|"No · junk suffix"| SA["REROLL · Orb of Annulment<br/>(fracture is immune, so annul takes the junk suffix)"]',
      "  SA --> S1",
      '  S2 -->|Yes · keep| S3["5. Other suffix · Dextral Exaltation + Perfect Exalt<br/>until attack speed OR crit damage (14%)"]',
      "  S3 --> S4{Got it?}",
      "  S4 -->|No · junk| SA2[REROLL · Orb of Annulment]",
      "  SA2 --> S3",
      "  S4 -->|Yes| F1",
      '  F1["6. Finish · ~4 Divine Orb rolls toward high values + quality"]',
      '  ALT["ALT — more expensive, NOT recommended:<br/>desecrate crit instead (Ancient Jawbone + Abyssal Echoes,<br/>CLEAR misses with Omen of Light + Annul). Same ~7% crit-type<br/>rarity but ~8.6-div clears, one desecrated mod at a time.<br/>Essence-Seeking impossible — needs a Magic base."]',
      "  S1 -.-> ALT",
    ].join("\n"),
  };
}
