// Builds the Bow Crafting tab payload: the omen-slam method as two builds (Greater-Exalt
// vs Perfect-Exalt), live-priced EV (via simulateBowSlam), per-exalt-floor odds, real
// trade2 resale reference, two flowcharts, and equipment-filter trade presets.
//
// EXACT: per-slam odds are craftofexile weight shares at each exalt's minimum-modifier-level
//   floor (crafting/reference/bow-affix-weights.md) + consumable prices (caller's divOf).
// MODELLED: resale assumptions (re-checkable live in the tab via the floor puller).

import { simulateBowSlam, type FracturePath, type SlamCosts, type SlamModel } from "./bow-omen-slam.js";

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
  target: string;
  exalted: string;
  greater: string;
  perfect: string;
}
export interface BowPath {
  key: string;
  label: string;
  fracture: "proj" | "crit";
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
export interface BowFlowchart {
  key: string;
  label: string;
  chart: string;
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
  flowcharts: BowFlowchart[];
}

const PROJ_STAT = "explicit.stat_1202301673"; // +# to Level of all Projectile Skills

// EXACT per-slam shares at each exalt's min-mod-level floor (crafting/reference/bow-affix-weights.md).
const FLOOR = {
  // damage prefix (phys/ele/hybrid, i.e. anything but pure accuracy)
  prefix: { exalted: 0.872, greater: 0.864, perfect: 0.904 },
  // crit chance ≥T3 (the usable tiers)
  critT3: { exalted: 0.016, greater: 0.036, perfect: 0.024 },
  // attack-speed OR crit-damage — taken with a near-free plain Exalt, tier doesn't matter
  second: 0.141,
  // crit ≥T3 per single desecration reveal under an Ancient bone (min mod level 40)
  critDesecAncient: 875 / 21400,
};

// Real trade2 floors (equipment filters, 2026-06-28) — re-checkable live below.
const RESALE = {
  greater: 200, // +4 Proj, crit mostly T3 (≥8%), pDPS≥450 → settled ~200
  perfect: 460, // +4 Proj, crit T2+ / high pDPS → ~460–630 (high variance)
  projFloor: 130,
  projTop: 500,
  crit: 0.5, // crit+pDPS bow WITHOUT +levels — flooded market
};

interface BuildSpec {
  key: string;
  label: string;
  fracture: FracturePath;
  orb: "greater" | "perfect";
  critSource: "exalt" | "desecrate";
  baseDiv: number;
  resaleDiv: number;
  verdict: string;
}

const BUILDS: BuildSpec[] = [
  {
    key: "greater",
    label: "Greater build — Greater Exalt (min mod lvl 35) · crit T3+ · elemental prefixes",
    fracture: "proj",
    orb: "greater",
    critSource: "exalt",
    baseDiv: 30,
    resaleDiv: RESALE.greater,
    verdict: "RECOMMENDED. Greater Exalt ≈ free, so crit at 3.6%/slam is cheap to spam; lands T3/T2/T1. Lowest cost, lowest variance.",
  },
  {
    key: "perfect",
    label: "Perfect build — Perfect Exalt (min mod lvl 50) · crit T2+ · high-tier prefixes",
    fracture: "proj",
    orb: "perfect",
    critSource: "exalt",
    baseDiv: 30,
    resaleDiv: RESALE.perfect,
    verdict: "Chase the ~460–630 T1 tier: forces crit T2+ and top prefixes, but Perfect orbs (~2.4d) make it ~2.5× pricier and high-variance.",
  },
  {
    key: "greater-desecrate",
    label: "Greater build, but DESECRATE crit (Ancient bone) instead of slamming it",
    fracture: "proj",
    orb: "greater",
    critSource: "desecrate",
    baseDiv: 30,
    resaleDiv: RESALE.greater,
    verdict: "Worse — desecration fights the same crit-type rarity with ~8.6-div Light clears, one desecrated mod at a time. Slam it.",
  },
  {
    key: "crit-frac",
    label: "Crit-fractured base (no +levels)",
    fracture: "crit",
    orb: "greater",
    critSource: "exalt",
    baseDiv: 32,
    resaleDiv: RESALE.crit,
    verdict: "Negative — no +levels means ~0.5 div resale. Buy one, don't craft.",
  },
];

function costsFrom(divOf: DivOf): SlamCosts {
  return {
    exaltOmenDiv: divOf("Omen of Sinistral Exaltation", 14), // steer the slam (Dextral is cheaper still)
    annulDiv: divOf("Orb of Annulment", 212), // raw — clean while the working side is isolated
    sinistralAnnulDiv: divOf("Omen of Sinistral Annulment", 4222), // protect suffixes when clearing a junk prefix
    divineDiv: 1.0,
    boneDiv: divOf("Ancient Jawbone", 3505), // desecrate alternative only
    lightDiv: divOf("Omen of Light", 3149),
    echoesDiv: divOf("Omen of Abyssal Echoes", 106),
  };
}

const round = (n: number) => Math.round(n);

function modelFor(spec: BuildSpec, divOf: DivOf): SlamModel {
  const orbDiv =
    spec.orb === "perfect" ? divOf("Perfect Exalted Orb", 865) : divOf("Greater Exalted Orb", 3.3);
  return {
    orbDiv,
    pPrefix: FLOOR.prefix[spec.orb],
    pCrit: FLOOR.critT3[spec.orb],
    pSecond: FLOOR.second,
    secondOrbDiv: divOf("Exalted Orb", 1), // 2nd suffix via a near-free plain Exalt
    prefixCount: 3,
    finishingDivines: 4,
    critSource: spec.critSource,
    pCritDesecReveal: FLOOR.critDesecAncient,
    revealsPerCycle: 6,
  };
}

function flowchart(
  orbName: string,
  floor: string,
  crit: string,
  critTarget: string,
  resale: string,
): string {
  return [
    "flowchart TD",
    `  A["1. Buy ilvl-81 fractured +Proj bow. The +Proj fracture is a<br/>suffix and is ANNUL-IMMUNE — that protects the suffix hunts.<br/>Target: +4 Proj (max craftable, ilvl 81)"] --> B["2. Strip to the bare fracture"]`,
    `  B --> S1["3. Secure ATTACK SPEED first (cheap):<br/>Omen of Dextral Exaltation + plain Exalted Orb (~free), 14%.<br/>Suffix side empty, so a junk suffix is the ONLY removable one."]`,
    `  S1 --> S2{"Attack speed?<br/>keep any T3+ ≈ 11–19%<br/>(don't chase T1 — least-important mod)"}`,
    `  S2 -->|"No · junk"| SA["RAW Orb of Annulment (~0.6d) — clean:<br/>fracture is immune, junk is the only removable suffix"]`,
    "  SA --> S1",
    `  S2 -->|Yes · keep| C1["4. Hunt CRIT last: Omen of Dextral Exaltation + ${orbName}<br/>(${floor}). ${crit}"]`,
    `  C1 --> C2{"Crit chance?<br/>aim ${critTarget}"}`,
    `  C2 -->|"No · junk"| CA["RAW Orb of Annulment — only risks the CHEAP attack-speed<br/>keeper (re-add it later). Crit is placed last, so it is never<br/>annulled beside a junk."]`,
    "  CA --> C1",
    `  C2 -->|Yes| P1["5. PREFIXES last — 3 damage mods:<br/>Omen of Sinistral Exaltation + ${orbName}"]`,
    `  P1 --> P2{"Damage prefix?<br/>top tier (${floor.includes("50") ? "ilvl ≥50" : "ilvl ≥35"})<br/>phys / elemental / hybrid"}`,
    `  P2 -->|"No · junk"| PA["TARGETED clear · Omen of SINISTRAL Annulment + Annul<br/>(confines the annul to PREFIXES so it cannot eat the<br/>crit/attack-speed suffixes). ~12d — but junk is rare here."]`,
    "  PA --> P1",
    "  P2 -->|Yes| P3{3 damage prefixes?}",
    "  P3 -->|No| P1",
    `  P3 -->|Yes| F1["6. Finish · ~4 Divine Orbs · resale ${resale}"]`,
  ].join("\n");
}

export function buildBowPlan(divOf: DivOf, divine: number, pulledAt: string | null): BowPlan {
  const costs = costsFrom(divOf);

  const paths: BowPath[] = BUILDS.map((spec) => {
    const { stats } = simulateBowSlam(spec.fracture, modelFor(spec, divOf), costs, {
      trials: 20000,
      seed: 42,
    });
    const bankroll = spec.baseDiv + stats.p85;
    const typical = spec.baseDiv + stats.mean;
    return {
      key: spec.key,
      label: spec.label,
      fracture: spec.fracture,
      baseDiv: spec.baseDiv,
      consumablesDiv: {
        mean: round(stats.mean),
        p50: round(stats.p50),
        p85: round(stats.p85),
        p95: round(stats.p95),
      },
      bankrollDiv: round(bankroll),
      typicalAllInDiv: round(typical),
      resaleDiv: spec.resaleDiv,
      evDiv: round(spec.resaleDiv - typical),
      verdict: spec.verdict,
    };
  });

  const pct = (n: number) => (n * 100).toFixed(1) + "%";
  return {
    divine,
    pulledAt,
    assumptions: [
      "Exalts add ONE random mod with a MINIMUM modifier level: Exalted = none, Greater = 35, Perfect = 50. The floor sets the TIER (and shrinks the pool → lowers per-slam type odds) — it does NOT guarantee the top tier. (crafting/reference/currency.md)",
      "Per-slam odds are EXACT craftofexile weight shares at each floor (crafting/reference/bow-affix-weights.md). Crit ≥T3 is best via Greater Exalt (3.6%); Perfect (2.4%) forces T2+.",
      "Order matters: secure cheap attack speed first, hunt crit LAST so it is never annulled beside a junk. Raw annul is clean on the empty suffix side; clearing a junk PREFIX needs a Sinistral Annulment omen (~12d) to protect the suffix keepers.",
      "Greater Exalt ≈ 0.01d so slamming is near-free; Perfect ≈ 2.4d, which is why the Perfect build costs ~2.5× more. Resale = live trade2 floors (crit %, pDPS, +Proj) — re-check below.",
    ],
    bases: [
      { name: "Obliterator Bow", ilvl: 78, phys: "62–115", critPct: 5, atkTime: 909, note: "Higher pDPS ceiling; −50% projectile range implicit." },
      { name: "Warmonger Bow", ilvl: 77, phys: "56–84", critPct: 5, atkTime: 833, note: "~9% faster, no downside. Identical mod pool (id_base 20)." },
    ],
    exactOdds: [
      { target: "damage prefix (phys/ele/hybrid)", exalted: pct(FLOOR.prefix.exalted), greater: pct(FLOOR.prefix.greater), perfect: pct(FLOOR.prefix.perfect) },
      { target: "crit chance ≥T3 (suffix)", exalted: pct(FLOOR.critT3.exalted), greater: pct(FLOOR.critT3.greater) + " ✓ best", perfect: pct(FLOOR.critT3.perfect) + " (T2+)" },
      { target: "attack-speed/crit-dmg (suffix)", exalted: pct(FLOOR.second), greater: "5.2%", perfect: "2.4%" },
    ],
    costInputsDiv: {
      "Greater Exalted Orb": divOf("Greater Exalted Orb", 3.3),
      "Perfect Exalted Orb": divOf("Perfect Exalted Orb", 865),
      "Exalted Orb (2nd suffix)": divOf("Exalted Orb", 1),
      "Exaltation omen (steer)": costs.exaltOmenDiv,
      "Orb of Annulment (raw)": costs.annulDiv,
      "Sinistral Annulment omen (protect suffixes)": costs.sinistralAnnulDiv,
    },
    paths,
    resale: [
      { label: "crit ≥8% · pDPS ≥450 · NO +levels (flooded)", floorDiv: RESALE.crit },
      { label: "+4 Proj · crit ≥8% (T3) · pDPS ≥450", floorDiv: RESALE.projFloor },
      { label: "+4 Proj · crit ≥9% (T1) · pDPS ≥600", floorDiv: RESALE.projTop },
    ],
    tradePresets: [
      { key: "a-floor", label: "Greater target — +4 Proj · crit≥8 · pDPS≥450", spec: { category: "weapon.bow", rarity: "nonunique", stats: [{ id: PROJ_STAT, min: 4 }], crit: { min: 8 }, pdps: { min: 450 }, sort: "asc", limit: 5 } },
      { key: "a-top", label: "Perfect target — +4 Proj · crit≥9 · pDPS≥600", spec: { category: "weapon.bow", rarity: "nonunique", stats: [{ id: PROJ_STAT, min: 4 }], crit: { min: 9 }, pdps: { min: 600 }, sort: "asc", limit: 5 } },
      { key: "b-noproj", label: "Crit-fractured — crit≥8 · pDPS≥450 · no levels", spec: { category: "weapon.bow", rarity: "nonunique", crit: { min: 8 }, pdps: { min: 450 }, sort: "asc", limit: 5 } },
    ],
    flowcharts: [
      {
        key: "greater",
        label: "Greater build (recommended · T3 floor)",
        chart: flowchart(
          "Greater Exalted Orb",
          "min mod lvl 35 → crit T3/T2/T1",
          "Crit is 3.6% of suffixes — but Greater Exalt ≈ free, so just spam.",
          "≥T3 · 3.11–5% mod → ~8–10% computed crit",
          "~200d",
        ),
      },
      {
        key: "perfect",
        label: "Perfect build (chase T1 · higher cost/variance)",
        chart: flowchart(
          "Perfect Exalted Orb",
          "min mod lvl 50 → crit T2/T1",
          "Crit is 2.4%; Perfect orbs ~2.4d each, so this hunt is the cost.",
          "≥T2 · 3.81–5% mod → ~9–10% computed crit",
          "~460–630d",
        ),
      },
    ],
  };
}
