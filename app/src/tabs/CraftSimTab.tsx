import { useEffect, useMemo, useState } from "react";
import { get, post } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";

interface ChaseMod { type: string; affix: string; stat: string; level: number; group: string }
interface SlotSummary {
  slot: string; prefixGroups: number; suffixGroups: number; chase: ChaseMod[];
}
interface TargetTier { affix: string; stat: string; level: number; fracAboveMin: number }
interface Scenario {
  label: string; pPref: number; pSuf: number; p: number; attempts: number;
  currencyOnlyDiv: number; breakevenBaseEx: number;
  withBase: { baseEx: number; totalDiv: number; cheaperThanBuy: boolean }[];
}
interface CraftEstimate {
  prefixGroups: number; suffixGroups: number;
  targetPrefixTiers: TargetTier[]; targetSuffix: { affix: string; stat: string; level: number } | null;
  scenarios: Scenario[];
}

const pct = (x: number) => (x * 100).toPrecision(3) + "%";

export default function CraftSimTab() {
  const [slots, setSlots] = useState<SlotSummary[]>([]);
  const [slot, setSlot] = useState("bow");
  const [suffixStat, setSuffixStat] = useState("");
  const [prefixGroup, setPrefixGroup] = useState("");
  const [prefixMin, setPrefixMin] = useState(0);
  const [buyPriceDiv, setBuyPriceDiv] = useState(30);
  const [est, setEst] = useState<CraftEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { get<SlotSummary[]>("/api/slots").then(setSlots).catch((e) => setError(e.message)); }, []);
  const current = useMemo(() => slots.find((s) => s.slot === slot), [slots, slot]);

  const run = async () => {
    setError(null);
    try {
      setEst(await post<CraftEstimate>("/api/craft", {
        slot, ilvl: 82,
        prefixGroup: prefixGroup || undefined,
        prefixMin: prefixMin || undefined,
        suffixStat: suffixStat || undefined,
        buyPriceDiv,
      }));
    } catch (e) { setError((e as Error).message); }
  };

  return (
    <div>
      <ErrorBanner error={error} />
      <p>
        <label className="stat">Slot{" "}
          <select value={slot} onChange={(e) => { setSlot(e.target.value); setSuffixStat(""); setPrefixGroup(""); }}>
            {slots.map((s) => <option key={s.slot} value={s.slot}>{s.slot}</option>)}
          </select>
        </label>
        <label className="stat">Target suffix{" "}
          <select value={suffixStat} onChange={(e) => setSuffixStat(e.target.value)}>
            <option value="">(none)</option>
            {current?.chase.filter((c) => c.type === "Suffix").map((c) => (
              <option key={c.group} value={c.stat}>{c.stat} (ilvl {c.level})</option>
            ))}
          </select>
        </label>
        <label className="stat">Prefix group{" "}
          <input value={prefixGroup} placeholder="e.g. LocalPhysicalDamagePercent"
            onChange={(e) => setPrefixGroup(e.target.value)} />
        </label>
        <label className="stat">Prefix min{" "}
          <input type="number" value={prefixMin} style={{ width: "4rem" }}
            onChange={(e) => setPrefixMin(Number(e.target.value))} />
        </label>
        <label className="stat">Buy price (div){" "}
          <input type="number" value={buyPriceDiv} style={{ width: "4rem" }}
            onChange={(e) => setBuyPriceDiv(Number(e.target.value))} />
        </label>
        <button className="act" onClick={run}>Estimate</button>
      </p>

      {current && (
        <p className="muted">
          Pool: {current.prefixGroups} prefix groups · {current.suffixGroups} suffix groups (variance driver).
        </p>
      )}

      {est && (
        <>
          {est.targetPrefixTiers.length > 0 && (
            <table>
              <thead><tr><th>Prefix tier</th><th>Range</th><th>ilvl</th><th>clears min</th></tr></thead>
              <tbody>
                {est.targetPrefixTiers.map((t) => (
                  <tr key={t.affix + t.level}>
                    <td>{t.affix}</td><td>{t.stat}</td><td>{t.level}</td>
                    <td>{t.fracAboveMin === 0 ? "✗" : t.fracAboveMin === 1 ? "✓" : `~${pct(t.fracAboveMin)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="muted">Weight bands are MODELLED (PoB ships no real spawn weights) — see low/central/high.</p>
          <table>
            <thead>
              <tr><th>Scenario</th><th>P/attempt</th><th>Attempts</th><th>Currency-only</th><th>Break-even base</th></tr>
            </thead>
            <tbody>
              {est.scenarios.map((s) => (
                <tr key={s.label}>
                  <td>{s.label}</td>
                  <td>{pct(s.p)}</td>
                  <td>{Number.isFinite(s.attempts) ? Math.round(s.attempts).toLocaleString() : "∞"}</td>
                  <td>{s.currencyOnlyDiv.toFixed(1)} div</td>
                  <td>{s.breakevenBaseEx.toFixed(1)} ex</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
