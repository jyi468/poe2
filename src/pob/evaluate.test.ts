import { describe, it, expect } from "vitest";
import { parseEvalOutput } from "./evaluate.js";

describe("parseEvalOutput", () => {
  it("extracts JSON from the last brace-line ignoring PoB log noise", () => {
    const stdout =
      "Loading main script...\n" +
      "Initialising mod cache\n" +
      '{"Life":4200,"EnergyShield":120,"TotalDPS":1850000,"LightningResist":75}\n';
    const m = parseEvalOutput(stdout);
    expect(m.Life).toBe(4200);
    expect(m.TotalDPS).toBe(1850000);
    expect(m.LightningResist).toBe(75);
  });

  it("throws on a structured engine error", () => {
    expect(() => parseEvalOutput('{"error":"failed to load build: boom"}'))
      .toThrowError(/failed to load build: boom/);
  });

  it("throws when no JSON line is present", () => {
    expect(() => parseEvalOutput("just logs\nno json here"))
      .toThrowError(/no JSON/i);
  });
});

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const GOLDEN = "/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds/UR HOMO.xml";
function luajitAvailable(): boolean {
  try { execSync("command -v luajit", { stdio: "ignore" }); return true; } catch { return false; }
}
const liveRun = luajitAvailable() && existsSync(GOLDEN);

describe.runIf(liveRun)("evaluateBuild (live PoB engine)", () => {
  it("produces positive Life for the golden build", async () => {
    const { evaluateBuild } = await import("./evaluate.js");
    const m = evaluateBuild(GOLDEN);
    expect(m.Life ?? 0).toBeGreaterThan(0);
  });
});
