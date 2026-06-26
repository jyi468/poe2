export const fmt = (n: number): string => Math.round(n).toLocaleString();
export const ex = (n: number | null): string => (n == null ? "—" : `${fmt(n)} ex`);
export const div = (n: number | null, divine: number): string =>
  n == null ? "—" : `${(n / divine).toFixed(1)} div`;
