// Staged ~100-div bankroll allocation. Durable guidance (capital bands + method
// sequencing), mirroring crafting/method/README.md's by-budget playbook scaled
// to a 100-div bankroll. Per-craft cost is recomputed live in the Craft sim tab.
export interface Stage {
  budgetDiv: string;
  lead: string;
  why: string;
}

export const STAGES: Stage[] = [
  {
    budgetDiv: "~10 div",
    lead: "Warm up on the cheap loops",
    why: "Greater-essence hybrid resist/armour + a handful of transmute→augment weapon flips to practice reading mod tiers and live prices before risking real capital.",
  },
  {
    budgetDiv: "~55 div",
    lead: "Desecration / Lich modifier as the main earner",
    why: "Verified top earner on strong meta bases (amulets, rings, weapons). Omens are a few ex; the cost driver is the base + bones. Pick the Lich pool by demand: Kurgal/Ulaman for cold-freeze, Amanamu for hybrid-defence. Inputs cheapen as the league ages.",
  },
  {
    budgetDiv: "~25 div",
    lead: "Jewel crafting for liquid swing upside",
    why: "Crit-combo jewels for safe volume; fractured multi-mod jewels for high-margin/high-variance hits. Small stash, broad demand, sells fast.",
  },
  {
    budgetDiv: "~10 div buffer",
    lead: "Hold for omen/catalyst spikes + restocks",
    why: "Keep dry powder so a price spike on a key input never forces a bad sell. Avoid Breach/Genesis rings (underwater late-league) and pure-ES targets (low demand this patch).",
  },
];
