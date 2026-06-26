import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { get } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";
import Mermaid from "../components/Mermaid.js";

export default function FlowchartTab() {
  const [md, setMd] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<{ markdown: string }>("/api/flowchart")
      .then((d) => setMd(d.markdown))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Split on fenced mermaid blocks: even segments are markdown, odd are diagrams.
  const segments = md.split(/```mermaid\n([\s\S]*?)```/g);

  return (
    <div className="flowchart">
      <ErrorBanner error={error} />
      {!md && !error && <p className="muted">Loading crafting/crafting-flowchart.md…</p>}
      {segments.map((seg, i) =>
        i % 2 === 1 ? (
          <Mermaid key={i} chart={seg.trim()} />
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {seg}
          </ReactMarkdown>
        ),
      )}
      <p className="muted">
        Rendered live from <code>crafting/crafting-flowchart.md</code> — edit that file and reload.
      </p>
    </div>
  );
}
