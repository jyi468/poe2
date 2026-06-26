import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import { get } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";

mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });

// Module-level counter gives every diagram a unique DOM id, so concurrent
// renders (incl. React StrictMode's double-invoke) never collide.
let mermaidSeq = 0;

function Mermaid({ chart }: { chart: string }) {
  const idRef = useRef(`mmd-${mermaidSeq++}`);
  const [svg, setSvg] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    mermaid
      .render(idRef.current, chart)
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (err) return <pre className="mermaid-error">{`${err}\n\n${chart}`}</pre>;
  return <div className="mermaid-svg" dangerouslySetInnerHTML={{ __html: svg }} />;
}

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
