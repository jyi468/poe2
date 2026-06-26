import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });

// Module-level counter gives every diagram a unique DOM id, so concurrent
// renders (incl. React StrictMode's double-invoke) never collide.
let mermaidSeq = 0;

interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
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
