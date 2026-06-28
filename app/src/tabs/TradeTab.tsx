import { useState } from "react";
import { post } from "../api.js";
import { freshness } from "../format.js";
import ErrorBanner from "../components/ErrorBanner.js";

interface Listing { priceAmount: number | null; priceCurrency: string | null; priceExalted: number | null; typeLine: string; ilvl?: number; mods: string[] }
interface TradeResp { league: string; divine: number; label: string; total: number; listings: Listing[]; cached?: boolean; fetchedAt?: string }
interface StatHit { label: string; id: string; text: string }

export default function TradeTab() {
  const [category, setCategory] = useState("ring");
  const [statLine, setStatLine] = useState(""); // "id:min,id:min"
  const [find, setFind] = useState("");
  const [resp, setResp] = useState<TradeResp | null>(null);
  const [stats, setStats] = useState<StatHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doFind = async (refresh = false) => {
    setBusy(true); setError(null);
    try { setStats((await post<{ stats: StatHit[] }>("/api/trade", { find, refresh })).stats); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const doSearch = async (refresh = false) => {
    setBusy(true); setError(null);
    const statsArr = statLine.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
      const [id, min] = s.split(":");
      return { id, min: min ? Number(min) : undefined };
    });
    try { setResp(await post<TradeResp>("/api/trade", { category, rarity: "nonunique", stats: statsArr, limit: 8, refresh })); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div>
      <ErrorBanner error={error} />
      <p>
        <label className="stat">Find stat id{" "}
          <input value={find} placeholder="e.g. spirit" onChange={(e) => setFind(e.target.value)} />
        </label>
        <button className="act" disabled={busy} onClick={() => doFind(false)}>Find</button>
        <button className="act ghost" disabled={busy} onClick={() => doFind(true)} title="Force a live, throttled re-fetch">↻ live</button>
      </p>
      {stats.length > 0 && (
        <table>
          <thead><tr><th>label</th><th>id</th><th>text</th></tr></thead>
          <tbody>{stats.slice(0, 20).map((s) => <tr key={s.id}><td>{s.label}</td><td>{s.id}</td><td>{s.text}</td></tr>)}</tbody>
        </table>
      )}
      <p>
        <label className="stat">Category{" "}
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className="stat">Stats (id:min,id:min){" "}
          <input value={statLine} style={{ width: "22rem" }} onChange={(e) => setStatLine(e.target.value)} />
        </label>
        <button className="act" disabled={busy} onClick={() => doSearch(false)}>{busy ? "Searching…" : "Search floor"}</button>
        <button className="act ghost" disabled={busy} onClick={() => doSearch(true)} title="Force a live, throttled re-fetch">↻ live</button>
      </p>
      {resp && (
        <>
          <p className="muted">{resp.label} — {resp.total} listings (cheapest 8). Asking floor ≈ order of magnitude. {resp.fetchedAt && <span>· {freshness(resp.fetchedAt, resp.cached)}</span>}</p>
          {resp.listings.map((l, i) => (
            <div key={i} style={{ marginBottom: ".4rem" }}>
              <b>{l.priceAmount} {l.priceCurrency}</b> <span className="muted">(~{l.priceExalted} ex)</span> · {l.typeLine}
              <ul style={{ margin: ".2rem 0" }}>{(l.mods ?? []).map((m, j) => <li key={j} className="muted">{m}</li>)}</ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
