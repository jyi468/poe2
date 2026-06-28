export const fmt = (n: number): string => Math.round(n).toLocaleString();
export const ex = (n: number | null): string => (n == null ? "—" : `${fmt(n)} ex`);
export const div = (n: number | null, divine: number): string =>
  n == null ? "—" : `${(n / divine).toFixed(1)} div`;

/** Label for a cache-first trade result: "cached · 3h ago" / "live · just now". */
export function freshness(fetchedAt?: string, cached?: boolean): string {
  if (!fetchedAt) return "";
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(fetchedAt)) / 60000));
  const age =
    mins < 1 ? "just now"
    : mins < 60 ? `${mins}m ago`
    : mins < 1440 ? `${Math.round(mins / 60)}h ago`
    : `${Math.round(mins / 1440)}d ago`;
  return `${cached ? "cached" : "live"} · ${age}`;
}
