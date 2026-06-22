import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

export interface BuildMetrics {
  TotalDPS?: number;
  CombinedDPS?: number;
  FullDPS?: number;
  Life?: number;
  EnergyShield?: number;
  Mana?: number;
  TotalEHP?: number;
  FireResist?: number;
  ColdResist?: number;
  LightningResist?: number;
  ChaosResist?: number;
  [key: string]: number | undefined;
}

const HERE = dirname(fileURLToPath(import.meta.url)); // <root>/src/pob
const REPO_ROOT = join(HERE, "..", "..");
const POB_REPO = process.env.POB_REPO ?? join(homedir(), "projects", "PathOfBuilding-PoE2");
const POB_SRC = join(POB_REPO, "src");
const EVAL_LUA = process.env.POB_EVAL_LUA ?? join(REPO_ROOT, "pob", "eval.lua");

export function parseEvalOutput(stdout: string): BuildMetrics {
  const line = stdout
    .split("\n")
    .map((l) => l.trim())
    .reverse()
    .find((l) => l.startsWith("{"));
  if (!line) throw new Error(`no JSON found in eval output:\n${stdout}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw new Error(`invalid JSON from eval.lua: ${line}`);
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.error === "string") {
    throw new Error(`PoB eval error: ${obj.error}`);
  }
  return obj as BuildMetrics;
}

export function evaluateBuild(buildXmlPath: string): BuildMetrics {
  if (!existsSync(buildXmlPath)) {
    throw new Error(`build file not found: ${buildXmlPath}`);
  }
  const res = spawnSync("luajit", [EVAL_LUA, buildXmlPath], {
    cwd: POB_SRC,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (res.error) {
    throw new Error(`failed to spawn luajit (is it installed?): ${res.error.message}`);
  }
  const stdout = res.stdout ?? "";
  if (!stdout.trim()) {
    throw new Error(`empty output from eval.lua. stderr: ${res.stderr ?? ""}`);
  }
  return parseEvalOutput(stdout);
}
