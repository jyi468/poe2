import type { BuildMetrics } from "./pob/evaluate.js";

export interface MetricDelta {
  key: string;
  before: number | null;
  after: number | null;
  delta: number;
  pct: number | null;
}

export function diffMetrics(before: BuildMetrics, after: BuildMetrics): MetricDelta[] {
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
  const deltas: MetricDelta[] = [];
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    const bv = typeof b === "number" ? b : null;
    const av = typeof a === "number" ? a : null;
    const delta = (av ?? 0) - (bv ?? 0);
    const pct = bv && bv !== 0 ? (delta / bv) * 100 : null;
    deltas.push({ key, before: bv, after: av, delta, pct });
  }
  return deltas.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}
