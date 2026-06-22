import { describe, it, expect } from "vitest";
import { decodeBuildCode, encodeBuildCode } from "./build-code.js";

describe("build-code", () => {
  it("round-trips XML through encode then decode", () => {
    const xml = '<?xml version="1.0"?>\n<PathOfBuilding2><Build level="96"/></PathOfBuilding2>';
    expect(decodeBuildCode(encodeBuildCode(xml))).toBe(xml);
  });

  it("produces URL-safe output (no +, /, or =-padding chars from the alphabet)", () => {
    const code = encodeBuildCode("<PathOfBuilding2/>");
    expect(code).not.toMatch(/[+/]/);
  });
});
