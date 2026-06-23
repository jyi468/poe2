import { describe, it, expect } from "vitest";
import { hello } from "./index.js";

describe("toolchain", () => {
  it("runs and imports ESM", () => {
    expect(hello()).toBe("poe2-assistant");
  });
});
