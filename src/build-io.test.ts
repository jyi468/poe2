import { describe, it, expect, afterEach } from "vitest";
import { rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readBuildXml, snapshotBuild } from "./build-io.js";

const FIXTURE = join(import.meta.dirname, "fixtures", "sample-build.xml");
const OUT_DIR = join(import.meta.dirname, "..", ".tmp-builds");

afterEach(() => rmSync(OUT_DIR, { recursive: true, force: true }));

describe("build-io", () => {
  it("reads build XML", () => {
    expect(readBuildXml(FIXTURE)).toContain("<PathOfBuilding2");
  });

  it("snapshots a build into the target dir", () => {
    const dest = snapshotBuild(FIXTURE, OUT_DIR);
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(dest, "utf8")).toContain("Deadeye");
  });
});
