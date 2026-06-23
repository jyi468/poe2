import { describe, expect, it } from "vitest";

import { formatDigest } from "./digest.js";
import {
  byPriceDesc,
  latestLog,
  normalizeItem,
  pickCurrentLeague,
} from "./normalize.js";
import type { EconomySnapshot, RawItem, RawLeague } from "./types.js";

describe("latestLog", () => {
  it("returns the most recent log by timestamp regardless of order", () => {
    const log = latestLog([
      { Price: 1, Time: "2026-06-20T00:00:00", Quantity: 5 },
      { Price: 9, Time: "2026-06-23T00:00:00", Quantity: 7 },
      { Price: 3, Time: "2026-06-21T00:00:00", Quantity: 6 },
    ]);
    expect(log?.Price).toBe(9);
  });

  it("returns null for empty or missing logs", () => {
    expect(latestLog([])).toBeNull();
    expect(latestLog(undefined)).toBeNull();
  });

  it("skips null entries the API sometimes embeds in the array", () => {
    const log = latestLog([
      null as never,
      { Price: 5, Time: "2026-06-22T00:00:00", Quantity: 1 },
      null as never,
    ]);
    expect(log?.Price).toBe(5);
  });
});

describe("pickCurrentLeague", () => {
  const leagues: RawLeague[] = [
    { Value: "Old", IsCurrent: false, DivinePrice: 10, BaseCurrencyText: "Exalted Orb" },
    { Value: "Runes of Aldur", IsCurrent: true, DivinePrice: 348, BaseCurrencyText: "Exalted Orb" },
    { Value: "HC Runes of Aldur", IsCurrent: true, DivinePrice: 100, BaseCurrencyText: "Exalted Orb" },
  ];

  it("prefers softcore by default", () => {
    expect(pickCurrentLeague(leagues)?.Value).toBe("Runes of Aldur");
  });

  it("returns the HC entry when hardcore requested", () => {
    expect(pickCurrentLeague(leagues, { hardcore: true })?.Value).toBe("HC Runes of Aldur");
  });

  it("returns null when nothing is current", () => {
    expect(pickCurrentLeague([leagues[0]])).toBeNull();
  });
});

describe("normalizeItem", () => {
  it("prefers CurrentPrice and falls back to the latest log", () => {
    const withCurrent: RawItem = {
      ApiId: null, Text: "Mageblood Utility Belt", Name: "Mageblood", Type: "Utility Belt",
      CategoryApiId: "accessory", CurrentPrice: 223608, CurrentQuantity: 7283,
      PriceLogs: [{ Price: 999, Time: "2026-06-01T00:00:00", Quantity: 1 }],
    };
    expect(normalizeItem(withCurrent, "accessory").priceExalted).toBe(223608);

    const logsOnly: RawItem = {
      ApiId: "mirror", Text: "Mirror of Kalandra", Name: "Mirror of Kalandra", Type: null,
      CategoryApiId: "currency",
      PriceLogs: [{ Price: 1433026, Time: "2026-06-23T00:00:00", Quantity: 743 }],
    };
    const n = normalizeItem(logsOnly, "currency");
    expect(n.priceExalted).toBe(1433026);
    expect(n.key).toBe("mirror");
  });
});

describe("byPriceDesc", () => {
  it("sorts descending and pushes unpriced items last", () => {
    const sorted = byPriceDesc([
      normalizeItem({ ApiId: "a", Text: "A", Name: "A", Type: null, CategoryApiId: "c", CurrentPrice: 5 }, "c"),
      normalizeItem({ ApiId: "b", Text: "B", Name: "B", Type: null, CategoryApiId: "c", CurrentPrice: null, PriceLogs: [] }, "c"),
      normalizeItem({ ApiId: "d", Text: "D", Name: "D", Type: null, CategoryApiId: "c", CurrentPrice: 50 }, "c"),
    ]);
    expect(sorted.map((i) => i.key)).toEqual(["d", "a", "b"]);
  });
});

describe("formatDigest", () => {
  const snapshot: EconomySnapshot = {
    realm: "poe2",
    league: "Runes of Aldur",
    pulledAt: "2026-06-23T12:00:00.000Z",
    divinePriceExalted: 348,
    currencies: [
      normalizeItem({ ApiId: "divine", Text: "Divine Orb", Name: "Divine Orb", Type: null, CategoryApiId: "currency", CurrentPrice: 348, CurrentQuantity: 10 }, "currency"),
      normalizeItem({ ApiId: "omen-sov", Text: "Omen of the Sovereign", Name: "Omen of the Sovereign", Type: null, CategoryApiId: "ritual", CurrentPrice: 12, CurrentQuantity: 40 }, "ritual"),
    ],
    uniques: [
      normalizeItem({ ApiId: null, Text: "Mageblood Utility Belt", Name: "Mageblood", Type: "Utility Belt", CategoryApiId: "accessory", CurrentPrice: 223608, CurrentQuantity: 7283 }, "accessory"),
    ],
  };

  it("renders divine conversion and surfaces crafting inputs", () => {
    const md = formatDigest(snapshot);
    expect(md).toContain("# Economy snapshot — Runes of Aldur");
    expect(md).toContain("1 Divine ≈ **348 Exalted**");
    // omen is a crafting input -> appears in that section
    expect(md).toContain("Omen of the Sovereign");
    // price >= 1 divine renders a div conversion
    expect(md).toContain("div)");
  });
});
