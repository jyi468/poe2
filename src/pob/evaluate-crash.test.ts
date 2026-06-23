/**
 * Isolated test for evaluateBuild crash diagnostics.
 * Uses top-level vi.mock so Vitest hoists the mocks before module load.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  spawnSync: vi.fn().mockReturnValue({
    status: 1,
    stdout: "boom log\n",
    stderr: "luajit: segfault",
    error: undefined,
  }),
  execSync: vi.fn(() => { throw new Error("not available"); }),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  copyFileSync: vi.fn(),
}));

describe("evaluateBuild crash diagnostics", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("surfaces luajit exit status and stderr when stdout has no JSON", async () => {
    const { evaluateBuild } = await import("./evaluate.js");
    expect(() => evaluateBuild("/fake/build.xml")).toThrowError(/luajit exit=1/);
    expect(() => evaluateBuild("/fake/build.xml")).toThrowError(/segfault/);
  });
});
