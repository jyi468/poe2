import { useEffect, useState } from "react";
import { get, post } from "../api.js";
import { freshness } from "../format.js";
import ErrorBanner from "../components/ErrorBanner.js";
import Mermaid from "../components/Mermaid.js";

interface ChaseMod {
  id: string;
  text: string;
}
interface Path {
  band: string;
  w: number;
  expectedCycles: number;
  bestStrategy: string;
  bestCostDiv: number;
  evProfitDiv: number;
}
interface DesecItem {
  key: string;
  label: string;
  bone: string;
  lich: string;
  lichOmen: string;
  side: string;
  tradeCategory: string;
  chaseMods: ChaseMod[];
  costs: { baseDiv: number; boneDiv: number; cycleOmensDiv: number; clearDiv: number };
  paths: Path[];
  soldValue: { low: number; central: number; high: number };
  flowchart: string;
}
interface DesecData {
  pulledAt: string | null;
  divine: number;
  items: DesecItem[];
}
interface TradeListing {
  priceAmount: number | null;
  priceCurrency: string | null;
  priceExalted: number | null;
  typeLine: string;
  mods: string[];
}
interface TradeResult {
  divine: number;
  total: number;
  listings: TradeListing[];
  cached?: boolean;
  fetchedAt?: string;
}

const div = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2);
const central = (item: DesecItem) => item.paths.find((p) => p.band.startsWith("CENTRAL")) ?? item.paths[0];

function FloorPuller({ item, divine }: { item: DesecItem; divine: number }) {
  const [modId, setModId] = useState(item.chaseMods[0].id);
  const [result, setResult] = useState<TradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pull = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const r = await post<TradeResult>("/api/trade", {
        category: item.tradeCategory,
        rarity: "nonunique",
        stats: [{ id: modId }],
        sort: "asc",
        limit: 5,
        refresh,
      });
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const cheapest = result?.listings.find((l) => l.priceExalted != null);
  const floorDiv = cheapest?.priceExalted != null ? cheapest.priceExalted / divine : null;
  const cost = central(item).bestCostDiv;

  return (
    <div className="floor">
      <div className="floor-controls">
        <select value={modId} onChange={(e) => setModId(e.target.value)}>
          {item.chaseMods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.text}
            </option>
          ))}
        </select>
        <button className="act" onClick={() => pull(false)} disabled={loading}>
          {loading ? "pulling…" : "Show sale floor"}
        </button>
        <button className="act ghost" onClick={() => pull(true)} disabled={loading} title="Force a live, throttled re-fetch">
          ↻ live
        </button>
        {result?.fetchedAt && <span className="muted">{freshness(result.fetchedAt, result.cached)}</span>}
      </div>
      <ErrorBanner error={error} />
      {result && (
        <div>
          <p className="muted">
            {result.total} listings.{" "}
            {floorDiv != null ? (
              <>
                Cheapest ≈ <b>{floorDiv.toFixed(2)} div</b> → live margin{" "}
                <b className={floorDiv - cost >= 0 ? "pos" : "neg"}>{div(floorDiv - cost)} div</b> vs{" "}
                {cost.toFixed(2)} div cost.{" "}
              </>
            ) : (
              "No exalt/divine-priced listings (top end is mirror/other currency). "
            )}
            <span className="muted">Asking floors run hot — eyeball the listings.</span>
          </p>
          <table>
            <thead>
              <tr>
                <th>Price</th>
                <th>Item</th>
                <th>Mods</th>
              </tr>
            </thead>
            <tbody>
              {result.listings.map((l, i) => (
                <tr key={i}>
                  <td>
                    {l.priceAmount} {l.priceCurrency}
                  </td>
                  <td>{l.typeLine}</td>
                  <td className="muted">{l.mods.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DesecCard({ item, divine }: { item: DesecItem; divine: number }) {
  const c = central(item);
  return (
    <div className="desec-card">
      <h3>
        {item.label} <span className="muted">· {item.bone} · {item.lichOmen} ({item.lich}) · {item.side}</span>
      </h3>
      <Mermaid chart={item.flowchart} />
      <table>
        <thead>
          <tr>
            <th>Band</th>
            <th>~cycles</th>
            <th>cost (div)</th>
            <th>reset</th>
            <th>modeled sale</th>
            <th>EV profit</th>
          </tr>
        </thead>
        <tbody>
          {item.paths.map((p) => {
            const sale = p.band.startsWith("UNLUCKY")
              ? item.soldValue.low
              : p.band.startsWith("LUCKY")
                ? item.soldValue.high
                : item.soldValue.central;
            return (
              <tr key={p.band}>
                <td>{p.band}</td>
                <td>{p.expectedCycles.toFixed(1)}</td>
                <td>{p.bestCostDiv.toFixed(2)}</td>
                <td>{p.bestStrategy}</td>
                <td>{sale}</td>
                <td className={p.evProfitDiv >= 0 ? "pos" : "neg"}>{div(p.evProfitDiv)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted">
        Inputs live; bone {item.costs.boneDiv} div + base {item.costs.baseDiv} div + sale bands are modeled.
        Central: {c.bestStrategy} resets, {c.bestCostDiv.toFixed(2)} div all-in.
      </p>
      <FloorPuller item={item} divine={divine} />
    </div>
  );
}

export default function DesecrationTab() {
  const [data, setData] = useState<DesecData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<DesecData>("/api/desecration")
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="desec">
      <ErrorBanner error={error} />
      <h2>Desecration — Lich modifier profit by item type</h2>
      <p className="muted">
        Lich-pool desecration works only on <b>weapons + jewellery</b> (amulet/ring/belt) — armour can be
        desecrated (Rib bone) but not Lich-targeted, so it is omitted. Input omens priced live
        {data?.pulledAt ? ` (${data.pulledAt.slice(0, 10)}, 1 div ≈ ${Math.round(data.divine)} ex)` : ""}; bone,
        base, reveal odds, and sale bands are modeled. Lich→mod attribution is thematic — verify the exact mod's
        pool on poe2db before committing.
      </p>
      {!data && !error && <p className="muted">Loading…</p>}
      {data?.items.map((item) => (
        <DesecCard key={item.key} item={item} divine={data.divine} />
      ))}
    </div>
  );
}
