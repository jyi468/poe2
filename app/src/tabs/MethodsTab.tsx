import { useEffect, useState } from "react";
import { get } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";
import { STAGES } from "../allocation.js";

interface MethodRow {
  method: string; capital: string; margin: string; risk: string; bestWindow: string; link: string;
}

export default function MethodsTab() {
  const [rows, setRows] = useState<MethodRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { get<MethodRow[]>("/api/methods").then(setRows).catch((e) => setError(e.message)); }, []);

  return (
    <div>
      <ErrorBanner error={error} />
      <h3>Staged ~100-div allocation</h3>
      <ol>
        {STAGES.map((s) => (
          <li key={s.lead} style={{ marginBottom: ".5rem" }}>
            <b>{s.budgetDiv} — {s.lead}.</b> <span className="muted">{s.why}</span>
          </li>
        ))}
      </ol>
      <h3>Method profit board</h3>
      <table>
        <thead>
          <tr><th>Method</th><th>Capital</th><th>Margin</th><th>Risk</th><th>Best window</th><th>Doc</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.method}>
              <td>{r.method}</td><td>{r.capital}</td><td>{r.margin}</td><td>{r.risk}</td><td>{r.bestWindow}</td><td className="muted">{r.link}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Board parsed live from crafting/method/README.md. Per-craft cost: use the Craft sim tab.</p>
    </div>
  );
}
