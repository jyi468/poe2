import { useState } from "react";
import EconomyTab from "./tabs/EconomyTab.js";
import MethodsTab from "./tabs/MethodsTab.js";
import CraftSimTab from "./tabs/CraftSimTab.js";
import TradeTab from "./tabs/TradeTab.js";
import FlowchartTab from "./tabs/FlowchartTab.js";
import DesecrationTab from "./tabs/DesecrationTab.js";

const TABS = [
  { id: "flowchart", label: "Flowchart", el: <FlowchartTab /> },
  { id: "desecration", label: "Desecration", el: <DesecrationTab /> },
  { id: "economy", label: "Economy", el: <EconomyTab /> },
  { id: "methods", label: "Methods", el: <MethodsTab /> },
  { id: "craft", label: "Craft sim", el: <CraftSimTab /> },
  { id: "trade", label: "Trade", el: <TradeTab /> },
];

export default function App() {
  const [active, setActive] = useState("flowchart");
  return (
    <>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === active ? "active" : ""} onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main>{TABS.find((t) => t.id === active)?.el}</main>
    </>
  );
}
