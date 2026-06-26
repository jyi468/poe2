import { useEffect, useState } from "react";
import { get, post } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";
import PriceTable, { type PriceItem } from "../components/PriceTable.js";

interface Snapshot {
  league: string;
  pulledAt: string;
  divinePriceExalted: number | null;
  currencies: PriceItem[];
  uniques: PriceItem[];
}

export default function EconomyTab() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => get<Snapshot>("/api/economy").then(setSnap).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setBusy(true); setError(null);
    try { setSnap(await post<Snapshot>("/api/economy/refresh", {})); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const divine = snap?.divinePriceExalted ?? 1;
  const ageHours = snap ? (Date.now() - Date.parse(snap.pulledAt)) / 3.6e6 : 0;

  return (
    <div>
      <ErrorBanner error={error} />
      {snap && (
        <p>
          <span className="stat"><b>{snap.league}</b>league</span>
          <span className="stat"><b>{Math.round(divine)} ex</b>1 divine</span>
          <span className="stat"><b>{ageHours.toFixed(1)} h</b>snapshot age {ageHours > 6 ? "⚠ stale" : ""}</span>
          <button className="act" disabled={busy} onClick={refresh}>{busy ? "Refreshing…" : "Refresh prices"}</button>
        </p>
      )}
      {snap && (
        <>
          <h3>Currencies & crafting inputs</h3>
          <PriceTable items={snap.currencies} divine={divine} />
          <h3>Uniques</h3>
          <PriceTable items={snap.uniques} divine={divine} />
        </>
      )}
    </div>
  );
}
