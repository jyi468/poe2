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
    expect(body.query.status.option).toBe("securable");
    expect(body.query.stats[0].type).toBe("and");
    expect(body.query.stats[0].filters[0]).toEqual({ id: "explicit.stat_1", value: { min: 8 } });
    expect(body.query.stats[0].filters[1]).toEqual({ id: "explicit.stat_2" });
    expect(body.query.filters.type_filters.filters.category.option).toBe("jewel");
    expect(body.query.filters.type_filters.filters.rarity.option).toBe("nonunique");
    expect(body.query.filters.trade_filters.filters.collapse.option).toBe("true");
    expect(body.sort.price).toBe("asc");
  });

  it("defaults to securable + collapse, overridable via status/collapse", () => {
    const dflt = buildBody({}) as any;
    expect(dflt.query.stats).toBeUndefined();
    expect(dflt.query.status.option).toBe("securable");
    expect(dflt.query.filters.trade_filters.filters.collapse.option).toBe("true");
    expect(dflt.sort.price).toBe("asc");

    const loose = buildBody({ status: "online", collapse: false }) as any;
    expect(loose.query.status.option).toBe("online");
    expect(loose.query.filters.trade_filters.filters.collapse.option).toBe("false");
  });
});
