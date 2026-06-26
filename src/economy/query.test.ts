import { describe, expect, it } from "vitest";

import { selectRows } from "./query.js";
import type { NormalizedItem } from "./types.js";

const item = (name: string, priceExalted: number | null): NormalizedItem => ({
  key: name,
  name,
  type: null,
  category: "essences",
  priceExalted,
  quantity: 1,
  time: null,
});

const items = [
  item("Essence of Horror", 182),
  item("Greater Essence of Ruin", 1.8),
  item("Essence of Hysteria", 299),
  item("Perfect Essence of the Body", null),
];

describe("selectRows", () => {
  it("sorts by price descending with unpriced items last", () => {
    const rows = selectRows(items, {});
    expect(rows.map((r) => r.name)).toEqual([
      "Essence of Hysteria",
      "Essence of Horror",
      "Greater Essence of Ruin",
      "Perfect Essence of the Body",
    ]);
  });

  it("filters by case-insensitive name substring", () => {
    const rows = selectRows(items, { grep: "ruin" });
    expect(rows.map((r) => r.name)).toEqual(["Greater Essence of Ruin"]);
  });

  it("caps to top N after sorting", () => {
    const rows = selectRows(items, { top: 2 });
    expect(rows.map((r) => r.name)).toEqual(["Essence of Hysteria", "Essence of Horror"]);
  });
});
