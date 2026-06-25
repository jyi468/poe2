import { describe, it, expect } from "vitest";
import { buildBody } from "./trade-core.js";

describe("buildBody", () => {
  it("builds an and-group of stat filters with min/max and type filters", () => {
    const body = buildBody({
      category: "jewel",
      rarity: "nonunique",
      stats: [{ id: "explicit.stat_1", min: 8 }, { id: "explicit.stat_2" }],
      sort: "asc",
    }) as any;
    expect(body.query.status.option).toBe("online");
    expect(body.query.stats[0].type).toBe("and");
    expect(body.query.stats[0].filters[0]).toEqual({ id: "explicit.stat_1", value: { min: 8 } });
    expect(body.query.stats[0].filters[1]).toEqual({ id: "explicit.stat_2" });
    expect(body.query.filters.type_filters.filters.category.option).toBe("jewel");
    expect(body.query.filters.type_filters.filters.rarity.option).toBe("nonunique");
    expect(body.sort.price).toBe("asc");
  });

  it("omits stats and filters when none are given", () => {
    const body = buildBody({}) as any;
    expect(body.query.stats).toBeUndefined();
    expect(body.query.filters).toBeUndefined();
    expect(body.sort.price).toBe("asc");
  });
});
