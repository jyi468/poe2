import { useEffect, useState } from "react";
import { get, post } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";
import Mermaid from "../components/Mermaid.js";

interface SearchStat {
  id: string;
  label: string;
}
interface Scenario {
  modCount: number;
  keepProb: number;
  costPerKeeperDiv: number;
  evPerAttemptDiv: number;
}
interface Recipe {
  key: string;
  emotionName: string;
  crafts: string;
  buyNatural: string;
  priceEx: number | null;
  priceDiv: number;
  searchStats: SearchStat[];
  scenarios: Scenario[];
}
interface RubyVariant {
  label: string;
  pairLabel: string;
  note: string;
  searchType: string;
  searchStats: SearchStat[];
}
interface JewelData {
  pulledAt: string | null;
  divine: number;
  searchCategory: string;
  flowchart: string;
  assumptions: { baseDiv: number; floorDiv: number; sellPair: { low: number; central: number; high: number } };
  recipes: Recipe[];
  rubyVariant: RubyVariant;
}
interface TradeListing {
  priceAmount: number | null;
  priceCurrency: string | null;
  typeLine: string;
  mods: string[];
}
interface TradeResult {
  total: number;
  listings: TradeListing[];
}

const div = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2);
const pct = (n: number) => (n * 100).toFixed(0) + "%";

function JewelFinder({
  hint,
  category,
  type,
  searchStats,
  tip,
}: {
  hint: string;
  category: string;
  type?: string;
  searchStats: SearchStat[];
  tip: string;
}) {
  const [statId, setStatId] = useState(searchStats[0].id);
  const [result, setResult] = useState<TradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        category,
        rarity: "rare",
        stats: [{ id: statId }],
        sort: "asc",
        limit: 6,
      };
      if (type) body.type = type;
      const r = await post<TradeResult>("/api/trade", body);
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="floor">
      <div className="floor-controls">
        <span className="muted">{hint}</span>
        <select value={statId} onChange={(e) => setStatId(e.target.value)}>
          {searchStats.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="act" onClick={find} disabled={loading}>
          {loading ? "searching…" : "Find jewels"}
        </button>
      </div>
      <ErrorBanner error={error} />
      {result && (
        <div>
          <p className="muted">
            {result.total} listings. {tip}
          </p>
          <table>
            <thead>
              <tr>
                <th>Price</th>
                <th>Base</th>
                <th>Mods</th>
              </tr>
            </thead>
            <tbody>
              {result.listings.map((l, i) => (
                <tr key={i}>
                  <td>
                    {l.priceAmount} {l.priceCurrency}
                  </td>
                  <td>
                    {l.typeLine} <span className="muted">({l.mods.length})</span>
                  </td>
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

function RecipeCard({ recipe, category, divine }: { recipe: Recipe; category: string; divine: number }) {
  const priceEx = recipe.priceEx != null ? `${recipe.priceEx.toFixed(1)} ex` : "untracked";
  return (
    <div className="desec-card">
      <h3>
        {recipe.emotionName} <span className="muted">→ crafts {recipe.crafts} · buy natural {recipe.buyNatural} · {priceEx} ({recipe.priceDiv.toFixed(3)} div)</span>
      </h3>
      <table>
        <thead>
          <tr>
            <th>Bought jewel</th>
            <th>P(keep crit)</th>
            <th>cost / keeper</th>
            <th>EV / attempt</th>
          </tr>
        </thead>
        <tbody>
          {recipe.scenarios.map((s) => (
            <tr key={s.modCount}>
              <td>
                {s.modCount}-mod (crit + {s.modCount - 1} junk)
              </td>
              <td>{pct(s.keepProb)}</td>
              <td>{s.costPerKeeperDiv === Infinity ? "∞" : s.costPerKeeperDiv.toFixed(2) + " div"}</td>
              <td className={s.evPerAttemptDiv >= 0 ? "pos" : "neg"}>{div(s.evPerAttemptDiv)} div</td>
            </tr>
          ))}
        </tbody>
      </table>
      <JewelFinder
        hint={`Find cheap natural-${recipe.buyNatural} jewels:`}
        category={category}
        searchStats={recipe.searchStats}
        tip="Prefer 3–4-mod jewels (more junk dilutes the random removal)."
      />
    </div>
  );
}

function RubyCard({ variant, category }: { variant: RubyVariant; category: string }) {
  return (
    <div className="desec-card">
      <h3>
        {variant.label} <span className="muted">· {variant.pairLabel}</span>
      </h3>
      <p className="muted">{variant.note}</p>
      <JewelFinder
        hint="Find cheap Ruby phys/attack jewels:"
        category={category}
        type={variant.searchType}
        searchStats={variant.searchStats}
        tip="Both mods are prefixes — pair + useful supports (leech / stun threshold / % life / attack speed) is what clears div-tier."
      />
    </div>
  );
}

export default function JewelTab() {
  const [data, setData] = useState<JewelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<JewelData>("/api/jewel")
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="desec">
      <ErrorBanner error={error} />
      <h2>Jewel crit-pair — Liquid Emotion engine</h2>
      <p className="muted">
        Buy a <b>rare</b> jewel with one <b>natural</b> crit suffix + junk, then craft the other crit with a Liquid
        Emotion. The emotion <b>removes a random mod</b> first (P(keep) = (N−1)/N — so prefer 3–4-mod jewels), and only
        <b> one crafted mod</b> is allowed, so the pair is 1 natural + 1 crafted. Emotion prices live
        {data?.pulledAt ? ` (${data.pulledAt.slice(0, 10)}, 1 div ≈ ${Math.round(data.divine)} ex)` : ""}; base
        {data ? ` ${data.assumptions.baseDiv} div` : ""}, sale bands, and keep odds are modeled.
      </p>
      {data && <Mermaid chart={data.flowchart} />}
      {!data && !error && <p className="muted">Loading…</p>}
      {data?.recipes.map((r) => (
        <RecipeCard key={r.key} recipe={r} category={data.searchCategory} divine={data.divine} />
      ))}
      {data && <RubyCard variant={data.rubyVariant} category={data.searchCategory} />}
      <p className="muted">
        Caveat: whether the removal is restricted to the suffix side is unconfirmed — verify in-game on a 1-ex jewel
        before buying a stack. Re-price: <code>pnpm prices delirium</code>.
      </p>
    </div>
  );
}
