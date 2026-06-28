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
  target: string;
  exalted: string;
  greater: string;
  perfect: string;
}
interface BowFlowchart {
  key: string;
  label: string;
  chart: string;
}
interface BowPath {
  key: string;
  label: string;
  fracture: "proj" | "crit";
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
  flowcharts: BowFlowchart[];
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
        Lock <b>+Proj</b> with a fractured ilvl-81 base, then fill prefixes + suffixes with{" "}
        <b>Exalt + Sinistral/Dextral Exaltation</b>. Exalts gate the <i>minimum mod level</i>{" "}
        (Greater = 35, Perfect = 50) — they set the tier, not "top tier". Secure cheap attack
        speed first, hunt crit last. Two builds below: <b>Greater</b> (cheap, T3 floor) vs{" "}
        <b>Perfect</b> (chase T1). Prices live
        {data?.pulledAt ? ` (${data.pulledAt.slice(0, 10)}, 1 div ≈ ${Math.round(data.divine)} ex)` : ""}.
      </p>
      {!data && !error && <p className="muted">Loading…</p>}

      {data && (
        <>
          <div className="callout">
            <b>Bottom line:</b> craft the <b>+Proj</b> fracture, <b>Greater build</b> (≈196 div bankroll, EV
            +77, low variance). Perfect build only to gamble on the ~460–630 T1 tier with a deep bankroll. A
            crit-fractured bow with no +levels resells for ~0.5 div — <b>buy that, don't craft it.</b>
          </div>

          <h3>Recommended run — Greater build</h3>
          <ol className="recipe">
            <li>
              <b>Buy</b> the fractured +Proj ilvl-81 base (~30d) and strip to the bare fracture (it's
              annul-immune — that protects the suffix hunts).
            </li>
            <li>
              <b>Attack speed first</b> — <b>plain Exalted Orb</b> + Omen of Dextral Exaltation. Take <i>any</i>{" "}
              decent hit (don&apos;t tier-chase — ~8d), raw-annul junk. The side is isolated, so the annul is clean.
            </li>
            <li>
              <b>Crit last</b> — <b>Greater Exalted Orb</b> + Dextral Exaltation until crit ≥T3 (3.6%/slam, ~28
              slams; Greater ≈ 0.01d). Raw-annul junk — only risks the cheap attack-speed keeper, never the crit.
            </li>
            <li>
              <b>Prefixes</b> — 3 damage mods, <b>Greater Exalt</b> + Sinistral Exaltation (~86%). Clear a junk
              prefix with an <b>Omen of Sinistral Annulment</b> to protect the suffixes.
            </li>
            <li>
              <b>Finish</b> — ~4 Divine Orbs. Bring <b>~150–200 div</b> (covers ~85%).
            </li>
          </ol>
          <p className="muted">
            <b>Shopping list:</b> 1× fractured +Proj base · a stack of <b>Greater Exalted Orbs</b> (crit + 3
            prefixes) · a few <b>plain Exalted Orbs</b> (attack speed) · <b>Orbs of Annulment</b> (the real cost,
            ~0.58d each) · 1–2 <b>Sinistral Annulment omens</b> · Dextral/Sinistral Exaltation omens (cheap) · ~4
            Divine Orbs. Use <b>Greater Exalt for crit + prefixes, plain Exalt for attack speed</b> (its tiers are
            all low-ilvl, so a level floor only makes it rarer).
          </p>

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

          <h3>Per-slam odds by exalt floor (exact — craftofexile weights, ilvl 81)</h3>
          <p className="muted">
            A higher exalt floor raises the <i>tier</i> of the added mod but shrinks the pool, so crit's
            share <i>falls</i>. Greater Exalt (min 35) is the sweet spot for usable crit ≥T3.
          </p>
          <table>
            <thead>
              <tr>
                <th>Target mod</th>
                <th>Exalted (min 1)</th>
                <th>Greater (min 35)</th>
                <th>Perfect (min 50)</th>
              </tr>
            </thead>
            <tbody>
              {data.exactOdds.map((o) => (
                <tr key={o.target}>
                  <td>{o.target}</td>
                  <td className="muted">{o.exalted}</td>
                  <td>
                    <b>{o.greater}</b>
                  </td>
                  <td>{o.perfect}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Expected cost &amp; EV by path</h3>
          <p className="muted">
            Consumables only (base shown separately). p85 = bring-this-much bankroll; the rare crit-suffix hunt
            (3.6% Greater / 2.4% Perfect) drives the tail, so p95 &gt; p50. Resale = live trade2 floor reference.
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

          <h3>Decision flow — two builds</h3>
          {data.flowcharts.map((f) => (
            <div key={f.key}>
              <h4>{f.label}</h4>
              <Mermaid chart={f.chart} />
            </div>
          ))}

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
