import { useEffect, useState } from "react";
import { get, post } from "../api.js";
import { freshness } from "../format.js";
import ErrorBanner from "../components/ErrorBanner.js";
import Mermaid from "../components/Mermaid.js";

interface BowBase {
  name: string;
  ilvl: number;
  phys: string;
  critPct: number;
  atkTime: number;
  note: string;
}
interface OddsRow {
  label: string;
  chaos: string;
  perfectExalt: string;
}
interface BowPath {
  key: string;
  label: string;
  fracture: "proj" | "crit";
  prefixMode: string;
  baseDiv: number;
  consumablesDiv: { mean: number; p50: number; p85: number; p95: number };
  bankrollDiv: number;
  typicalAllInDiv: number;
  resaleDiv: number;
  evDiv: number;
  verdict: string;
}
interface ResaleRow {
  label: string;
  floorDiv: number;
}
interface TradePreset {
  key: string;
  label: string;
  spec: Record<string, unknown>;
}
interface BowPlan {
  divine: number;
  pulledAt: string | null;
  assumptions: string[];
  bases: BowBase[];
  exactOdds: OddsRow[];
  costInputsDiv: Record<string, number>;
  paths: BowPath[];
  resale: ResaleRow[];
  tradePresets: TradePreset[];
  flowchart: string;
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

const ev = (n: number) => (n >= 0 ? "+" : "") + n + " div";

function FloorPuller({ presets }: { presets: TradePreset[] }) {
  const [key, setKey] = useState(presets[0]?.key);
  const [result, setResult] = useState<TradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preset = presets.find((p) => p.key === key);

  const pull = async (refresh = false) => {
    if (!preset) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await post<TradeResult>("/api/trade", { ...preset.spec, refresh }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const cheapest = result?.listings.find((l) => l.priceExalted != null);
  const floorDiv = cheapest?.priceExalted != null && result ? cheapest.priceExalted / result.divine : null;

  return (
    <div className="floor">
      <div className="floor-controls">
        <select value={key} onChange={(e) => setKey(e.target.value)}>
          {presets.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <button className="act" onClick={() => pull(false)} disabled={loading}>
          {loading ? "pulling…" : "Show live floor"}
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
                Cheapest ≈ <b>{floorDiv.toFixed(2)} div</b>.{" "}
              </>
            ) : (
              "No exalt/divine-priced listings (top end is mirror/other currency). "
            )}
            <span className="muted">Equipment-filtered (computed crit % / pDPS). Asking floors run hot.</span>
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

export default function BowTab() {
  const [data, setData] = useState<BowPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<BowPlan>("/api/bow")
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="bow">
      <ErrorBanner error={error} />
      <h2>Bow Crafting — omen-slam fractured base</h2>
      <p className="muted">
        Lock one premium mod with a fractured ilvl-81 base, then fill the 3 prefixes{" "}
        <b>and</b> the 2 open suffixes with <b>Perfect Exalt + Sinistral/Dextral Exaltation</b>{" "}
        (top tier free — roll only the type). Crit is ~7% of the suffix pool but lands T1;
        Perfect-Exalting it beats desecration. Prices live
        {data?.pulledAt ? ` (${data.pulledAt.slice(0, 10)}, 1 div ≈ ${Math.round(data.divine)} ex)` : ""}.
      </p>
      {!data && !error && <p className="muted">Loading…</p>}

      {data && (
        <>
          <div className="callout">
            <b>Bottom line:</b> only the <b>+Proj</b> fracture is +EV — its profit is the T1-crit / high-pDPS
            tail (~460–630 div). A crit-fractured bow with no +levels resells for ~0.5 div, so <b>buy that, don't
            craft it.</b>
          </div>

          <h3>Bases — identical mod pool (id_base 20)</h3>
          <table>
            <thead>
              <tr>
                <th>Base</th>
                <th>ilvl</th>
                <th>Phys</th>
                <th>Crit</th>
                <th>Atk time</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {data.bases.map((b) => (
                <tr key={b.name}>
                  <td>{b.name}</td>
                  <td>{b.ilvl}</td>
                  <td>{b.phys}</td>
                  <td>{b.critPct}%</td>
                  <td>{b.atkTime}</td>
                  <td className="muted">{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Per-slam prefix odds (exact — craftofexile weights, ilvl 81)</h3>
          <table>
            <thead>
              <tr>
                <th>Target prefix</th>
                <th>Chaos-spam (random tier)</th>
                <th>Perfect Exalt + Sinistral (top tier)</th>
              </tr>
            </thead>
            <tbody>
              {data.exactOdds.map((o) => (
                <tr key={o.label}>
                  <td>{o.label}</td>
                  <td className="muted">{o.chaos}</td>
                  <td>
                    <b>{o.perfectExalt}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Expected cost &amp; EV by path</h3>
          <p className="muted">
            Consumables only (base shown separately). p85 = bring-this-much bankroll; the ~7% crit-suffix hunt
            drives the tail, so p95 &gt; p50. Resale = live trade2 floor reference.
          </p>
          <table>
            <thead>
              <tr>
                <th>Path</th>
                <th>base</th>
                <th>p50</th>
                <th>mean</th>
                <th>p85</th>
                <th>p95</th>
                <th>bankroll</th>
                <th>resale</th>
                <th>EV</th>
              </tr>
            </thead>
            <tbody>
              {data.paths.map((p) => (
                <tr key={p.key}>
                  <td>
                    {p.label}
                    <div className="muted">{p.verdict}</div>
                  </td>
                  <td>{p.baseDiv}</td>
                  <td>{p.consumablesDiv.p50}</td>
                  <td>{p.consumablesDiv.mean}</td>
                  <td>{p.consumablesDiv.p85}</td>
                  <td>{p.consumablesDiv.p95}</td>
                  <td>
                    <b>{p.bankrollDiv}</b>
                  </td>
                  <td>{p.resaleDiv}</td>
                  <td className={p.evDiv >= 0 ? "pos" : "neg"}>{ev(p.evDiv)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Decision flow</h3>
          <Mermaid chart={data.flowchart} />

          <h3>Output value — live floor check (equipment filters)</h3>
          <table>
            <thead>
              <tr>
                <th>Finished bow</th>
                <th>Reference floor</th>
              </tr>
            </thead>
            <tbody>
              {data.resale.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td>{r.floorDiv} div</td>
                </tr>
              ))}
            </tbody>
          </table>
          <FloorPuller presets={data.tradePresets} />

          <h3>Live cost inputs (div)</h3>
          <p className="muted">
            {Object.entries(data.costInputsDiv)
              .map(([k, v]) => `${k} ${v.toFixed(2)}`)
              .join(" · ")}
          </p>
          <ul className="muted">
            {data.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
