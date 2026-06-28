// Route handlers for the command-center API. Each returns plain data; http.wrap
// adds the envelope. Network/disk errors surface as {ok:false,error}.

import type { IncomingMessage } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getLeagues } from "../economy/client.js";
import { pullEconomy, readLatestSnapshot, writeSnapshot } from "../economy/pull-core.js";
import { buildBody, findStats, searchTrade, type QuerySpec, type TradeResult } from "../economy/trade-core.js";
import { cacheKey, getCached, setCached } from "../economy/trade-cache.js";
import { loadModTiers, poolFor } from "../crafting-sim/pob-mods.js";
import { estimateCraft } from "../crafting-sim/estimate.js";
import { scanSlots, SLOT_DEFS } from "../crafting-sim/slots.js";
import { evaluateDesecItems } from "../crafting-sim/desecration-items.js";
import { buildJewelPlan } from "../crafting-sim/jewel-plan.js";
import { buildBowPlan } from "../crafting-sim/bow-plan.js";
import { loadMethodBoard } from "../methods/parse.js";

export const getEconomy = async () => readLatestSnapshot();

/** Serve the crafting decision flowchart markdown for the Flowchart tab. */
export const getFlowchart = async (): Promise<{ markdown: string }> => {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const file = resolve(here, "../../crafting/crafting-flowchart.md");
  return { markdown: await readFile(file, "utf8") };
};

export const refreshEconomy = async () => {
  const snapshot = await pullEconomy({ realm: "poe2" });
  await writeSnapshot(snapshot);
  return snapshot;
};

export const getMethods = async () => loadMethodBoard();

export const getSlots = async () => scanSlots(82);

/**
 * Jewel crit-pair (Liquid Emotion) plan: live emotion prices, EV scenarios by
 * mod count, a flowchart, and "find natural-crit jewels" trade presets. The
 * actual floor search runs on demand via POST /api/trade.
 */
export const getJewel = async () => {
  const snap = await readLatestSnapshot().catch(() => null);
  const divine = snap?.divinePriceExalted ?? 345;
  const byName = new Map((snap?.currencies ?? []).map((c) => [c.name, c.priceExalted]));
  const divOf = (name: string, fallbackEx: number) => (byName.get(name) ?? fallbackEx) / divine;
  const plan = buildJewelPlan(divOf);
  const recipes = plan.recipes.map((r) => ({ ...r, priceEx: byName.get(r.emotionName) ?? null }));
  return {
    pulledAt: snap?.pulledAt ?? null,
    divine,
    searchCategory: "jewel",
    flowchart: plan.flowchart,
    assumptions: plan.assumptions,
    recipes,
    rubyVariant: plan.rubyVariant,
  };
};

/**
 * Omen-slam bow craft: both fracture paths with live-priced EV (Monte Carlo),
 * exact prefix odds, real trade2 resale reference, and equipment-filter trade
 * presets. Output floors are re-checkable on demand via POST /api/trade.
 */
export const getBow = async () => {
  const snap = await readLatestSnapshot().catch(() => null);
  const divine = snap?.divinePriceExalted ?? 345;
  const byName = new Map((snap?.currencies ?? []).map((c) => [c.name, c.priceExalted]));
  const divOf = (name: string, fallbackEx: number) => (byName.get(name) ?? fallbackEx) / divine;
  return buildBowPlan(divOf, divine, snap?.pulledAt ?? null);
};

/**
 * Per-item-type Desecration EV, built from live omen prices. Bone/base/reveal
 * odds are modelled (flagged in the payload); sale floors are fetched on demand
 * via POST /api/trade with each item's desecrated stat id.
 */
export const getDesecration = async () => {
  const snap = await readLatestSnapshot().catch(() => null);
  const divine = snap?.divinePriceExalted ?? 345;
  const byName = new Map((snap?.currencies ?? []).map((c) => [c.name, c.priceExalted]));
  const divOf = (name: string, fallbackEx: number) => (byName.get(name) ?? fallbackEx) / divine;
  const omen = (name: string) => byName.get(name) ?? null;
  return {
    pulledAt: snap?.pulledAt ?? null,
    divine,
    // Live omen prices (ex) the EV is built from — surfaced for transparency.
    omenPricesEx: {
      "Omen of Sinistral Necromancy": omen("Omen of Sinistral Necromancy"),
      "Omen of Dextral Necromancy": omen("Omen of Dextral Necromancy"),
      "Omen of the Sovereign": omen("Omen of the Sovereign"),
      "Omen of the Liege": omen("Omen of the Liege"),
      "Omen of the Blackblooded": omen("Omen of the Blackblooded"),
      "Omen of Abyssal Echoes": omen("Omen of Abyssal Echoes"),
      "Omen of Light": omen("Omen of Light"),
    },
    items: evaluateDesecItems(divOf),
  };
};

interface CraftBody {
  slot: string;
  ilvl?: number;
  prefixGroup?: string;
  prefixMin?: number;
  suffixStat?: string;
  buyPriceDiv?: number;
  weights?: CraftInputWeights;
}
interface CraftInputWeights {
  pref: { low: number; central: number; high: number };
  suf: { low: number; central: number; high: number };
}
const DEFAULT_WEIGHTS: CraftInputWeights = {
  pref: { low: 0.04, central: 0.07, high: 0.1 },
  suf: { low: 0.004, central: 0.008, high: 0.015 },
};

export const postCraft = async (_req: IncomingMessage, body: unknown) => {
  const b = body as CraftBody;
  const def = SLOT_DEFS.find((s) => s.name === b.slot);
  if (!def) throw new Error(`unknown slot "${b.slot}"`);
  const ilvl = b.ilvl ?? 82;
  const tiers = loadModTiers();
  const prefixes = poolFor(tiers, def.keys, "Prefix", ilvl);
  const suffixes = poolFor(tiers, def.keys, "Suffix", ilvl);
  const snap = await readLatestSnapshot().catch(() => null);
  const divine = snap?.divinePriceExalted ?? 341;
  const orbEx = (name: string, fallback: number) =>
    snap?.currencies.find((c) => c.name === name)?.priceExalted ?? fallback;
  return estimateCraft({
    prefixes,
    suffixes,
    prefixGroup: b.prefixGroup,
    prefixMin: b.prefixMin,
    suffixStat: b.suffixStat,
    weights: b.weights ?? DEFAULT_WEIGHTS,
    orb: {
      transmute: orbEx("Orb of Transmutation", 0.16),
      augment: orbEx("Orb of Augmentation", 0.28),
      divine,
    },
    buyPriceDiv: b.buyPriceDiv ?? 30,
  });
};

/**
 * Resolve the current league + divine price, cache-first. This pings poe2scout,
 * so we save it and reuse it; pass refresh to re-pull (e.g. after a new league or
 * a big divine move).
 */
const LEAGUE_KEY = cacheKey("league", "poe2");
async function currentLeague(refresh: boolean): Promise<{ league: string; divine: number; fetchedAt: string }> {
  if (!refresh) {
    const hit = await getCached<{ league: string; divine: number }>(LEAGUE_KEY);
    if (hit) return { ...hit.value, fetchedAt: hit.fetchedAt };
  }
  const leagues = await getLeagues("poe2");
  const current = leagues.find((l) => l.IsCurrent && !l.Value.startsWith("HC "));
  if (!current) throw new Error("no current league");
  const value = { league: current.Value, divine: current.DivinePrice ?? 1 };
  const saved = await setCached(LEAGUE_KEY, value, new Date().toISOString());
  return { ...value, fetchedAt: saved.fetchedAt };
}

/**
 * Trade2 lookup, cache-first. A saved result for the exact query is returned with
 * no API call (cached:true); `refresh:true` forces a live, throttled fetch and
 * overwrites the cache. This is the on-demand-only path — nothing here runs unless
 * a button is clicked, and identical clicks never re-hit the rate-limited API.
 */
export const postTrade = async (_req: IncomingMessage, body: unknown) => {
  const spec = body as QuerySpec & { find?: string; refresh?: boolean };
  const refresh = spec.refresh === true;
  const { league, divine } = await currentLeague(refresh);

  if (spec.find) {
    const key = cacheKey("stats", spec.find.toLowerCase());
    if (!refresh) {
      const hit = await getCached<{ label: string; id: string; text: string }[]>(key);
      if (hit) return { league, stats: hit.value, cached: true, fetchedAt: hit.fetchedAt };
    }
    const stats = await findStats(spec.find);
    const saved = await setCached(key, stats, new Date().toISOString());
    return { league, stats, cached: false, fetchedAt: saved.fetchedAt };
  }

  const key = cacheKey("search", { body: buildBody(spec), limit: spec.limit ?? 6, league });
  if (!refresh) {
    const hit = await getCached<TradeResult>(key);
    if (hit) return { league, divine, ...hit.value, cached: true, fetchedAt: hit.fetchedAt };
  }
  const result = await searchTrade(spec, league, divine);
  const saved = await setCached(key, result, new Date().toISOString());
  return { league, divine, ...result, cached: false, fetchedAt: saved.fetchedAt };
};
