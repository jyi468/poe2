// Pure EV model for the "buy-the-movement-speed, craft-the-rest" boots method
// (see crafting/method/movement-speed-boots.md). The boot starts with movement
// speed + one essence resist LOCKED; we then fill the open affix slots with
// side-controlled Exalt slams and value the *distribution* of finished boots.
//
// EXACT (callers wire these from live data): every input cost in divines.
// MODELLED: the per-slam category-share probabilities (GGG ships no spawn
// weights; PoB has only can/can't-spawn flags) — passed as low/central/high
// bands, same contract as estimate.ts. Plug real craftofexile weights to tighten.

export interface WeightBand {
  readonly low: number;
  readonly central: number;
  readonly high: number;
}

/** One forced-side Exalt slam: P(lands a wanted stat) and P(high tier | wanted). */
export interface SlamOdds {
  readonly u: number; // P(useful stat on this forced-prefix slam)
  readonly h: number; // P(high tier | useful) — a Perfect Exalt sets h = 1
}

export interface BucketDist {
  readonly premium: number; // 2 resist + a high-tier life/defence prefix
  readonly good: number; // 2 resist + useful prefixes, mid tier
  readonly mediocre: number; // 1 resist, or 2 resist + only filler prefixes
  readonly junk: number; // 1 resist + only filler prefixes (floor)
}

export interface OutcomeValues {
  readonly premium: number;
  readonly good: number;
  readonly mediocre: number;
  readonly junk: number;
}

export interface BootsCosts {
  readonly baseDiv: number; // bought MS magic base
  readonly essenceDiv: number; // greater essence (resist lock)
  readonly exaltDiv: number; // one regular Exalted Orb
  readonly sideOmenDiv: number; // one Sinistral/Dextral Exaltation omen
  readonly perfectExaltDiv: number; // one Perfect Exalted Orb
}

export interface PathResult {
  readonly label: string;
  readonly dist: BucketDist;
  readonly evRevenueAsking: number;
  readonly evRevenueSold: number;
  readonly costDiv: number;
  readonly evProfitDiv: number;
}

/**
 * Finished-boot bucket distribution.
 *
 * Locked before any slam: movement speed + 1 resist (essence). `R` is the
 * chance the single forced-suffix slam lands a 2nd resist. `prefixSlams` are the
 * forced-prefix slams; premium needs a high-tier useful prefix, good needs a
 * useful (any tier) prefix. Buckets are mutually exclusive and sum to 1.
 */
export function bucketDist(prefixSlams: readonly SlamOdds[], R: number): BucketDist {
  // A = P(no useful prefix at all); B = P(no high-tier useful prefix).
  const A = prefixSlams.reduce((acc, s) => acc * (1 - s.u), 1);
  const B = prefixSlams.reduce((acc, s) => acc * (1 - s.u * s.h), 1);
  const premium = R * (1 - B);
  const good = R * (B - A); // useful-but-not-high  (B >= A always)
  const mediocre = R * A + (1 - R) * (1 - A);
  const junk = (1 - R) * A;
  return { premium, good, mediocre, junk };
}

/** Expected sale value of a bucket distribution, asking and discounted-to-sold. */
export function evRevenue(
  dist: BucketDist,
  values: OutcomeValues,
  saleDiscount: number,
): { asking: number; sold: number } {
  const asking =
    dist.premium * values.premium +
    dist.good * values.good +
    dist.mediocre * values.mediocre +
    dist.junk * values.junk;
  return { asking, sold: asking * saleDiscount };
}

function leanCost(slams: number, c: BootsCosts): number {
  return c.baseDiv + c.essenceDiv + slams * (c.exaltDiv + c.sideOmenDiv);
}

/** Cost of one finished boot for a given path (lean = all regular Exalts). */
export function pathCost(slams: number, perfectExalts: number, c: BootsCosts): number {
  // Each Perfect Exalt replaces one regular Exalt on a slam already counted in lean.
  return leanCost(slams, c) + perfectExalts * (c.perfectExaltDiv - c.exaltDiv);
}

function makePath(
  label: string,
  prefixSlams: readonly SlamOdds[],
  R: number,
  suffixSlams: number,
  perfectExalts: number,
  costs: BootsCosts,
  values: OutcomeValues,
  saleDiscount: number,
): PathResult {
  const dist = bucketDist(prefixSlams, R);
  const rev = evRevenue(dist, values, saleDiscount);
  const slams = prefixSlams.length + suffixSlams;
  const costDiv = pathCost(slams, perfectExalts, costs);
  return {
    label,
    dist,
    evRevenueAsking: rev.asking,
    evRevenueSold: rev.sold,
    costDiv,
    evProfitDiv: rev.sold - costDiv,
  };
}

export interface BootsModel {
  readonly openPrefixSlots: number; // forced-prefix slams (life/defence)
  readonly openSuffixSlots: number; // forced-suffix slams (2nd resist) — usually 1
  readonly pUsefulPrefix: WeightBand; // u
  readonly pHighTier: WeightBand; // h
  readonly pResistSuffix: WeightBand; // R
}

export interface BootsScenario {
  readonly band: "LUCKY (high weights)" | "CENTRAL estimate" | "UNLUCKY (low weights)";
  readonly lean: PathResult;
  readonly perfect: PathResult; // lean + one prefix slam upgraded to a Perfect Exalt
}

/** Run lean vs +1-Perfect-Exalt for each of the three modelled weight bands. */
export function simulateBoots(
  model: BootsModel,
  costs: BootsCosts,
  values: OutcomeValues,
  saleDiscount: number,
): BootsScenario[] {
  const bands = ["low", "central", "high"] as const;
  const names = {
    low: "UNLUCKY (low weights)",
    central: "CENTRAL estimate",
    high: "LUCKY (high weights)",
  } as const;

  return bands.map((b) => {
    const u = model.pUsefulPrefix[b];
    const h = model.pHighTier[b];
    const R = model.pResistSuffix[b];
    const leanPrefixes: SlamOdds[] = Array.from({ length: model.openPrefixSlots }, () => ({ u, h }));
    // Perfect Exalt guarantees TIER (h = 1) on one prefix slam, not the stat (still u).
    const perfectPrefixes: SlamOdds[] =
      model.openPrefixSlots > 0
        ? [{ u, h: 1 }, ...leanPrefixes.slice(1)]
        : leanPrefixes;
    return {
      band: names[b],
      lean: makePath("lean", leanPrefixes, R, model.openSuffixSlots, 0, costs, values, saleDiscount),
      perfect: makePath(
        "+1 Perfect Exalt",
        perfectPrefixes,
        R,
        model.openSuffixSlots,
        1,
        costs,
        values,
        saleDiscount,
      ),
    };
  });
}
