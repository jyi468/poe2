import { useState } from "react";
import { div, ex, fmt } from "../format.js";

export interface PriceItem {
  name: string;
  type: string | null;
  priceExalted: number | null;
  quantity: number | null;
}

export default function PriceTable({ items, divine }: { items: PriceItem[]; divine: number }) {
  const [desc, setDesc] = useState(true);
  const sorted = [...items].sort((a, b) => {
    const av = a.priceExalted ?? 0;
    const bv = b.priceExalted ?? 0;
    return desc ? bv - av : av - bv;
  });
  return (
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th onClick={() => setDesc(!desc)}>Price {desc ? "▼" : "▲"}</th>
          <th>div</th>
          <th>Qty</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((i) => (
          <tr key={i.name + (i.type ?? "")}>
            <td>{i.name}{i.type ? <span className="muted"> ({i.type})</span> : null}</td>
            <td>{ex(i.priceExalted)}</td>
            <td>{div(i.priceExalted, divine)}</td>
            <td className="muted">{i.quantity == null ? "—" : fmt(i.quantity)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
