import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { readLatestSnapshot } from "./pull-core.js";

const fixture = fileURLToPath(new URL("../fixtures/economy-latest.sample.json", import.meta.url));

describe("readLatestSnapshot", () => {
  it("reads and parses a snapshot file at an explicit path", async () => {
    const snap = await readLatestSnapshot(fixture);
    expect(snap.league).toBe("Sample League");
    expect(snap.divinePriceExalted).toBe(341);
    expect(snap.currencies[0].name).toBe("Exalted Orb");
    expect(snap.uniques).toHaveLength(1);
  });
});
