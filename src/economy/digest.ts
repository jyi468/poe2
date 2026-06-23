// Pure markdown rendering of a snapshot. No IO; tested directly.

import { byPriceDesc } from "./normalize.js";
import type { EconomySnapshot, NormalizedItem } from "./types.js";

/** Currency categories that map to crafting inputs (omens, catalysts, bones, essences). */
const CRAFTING_INPUT_HINTS = ["omen", "catalyst", "bone", "essence", "preserved", "ancient"];

function isCraftingInput(item: NormalizedItem): boolean {
  const hay = `${item.name} ${item.key}`.toLowerCase();
  return CRAFTING_INPUT_HINTS.some((h) => hay.includes(h));
}

function priceCell(item: NormalizedItem, divinePriceExalted: number | null): string {
  if (item.priceExalted == null) return "—";
  const ex = item.priceExalted;
  const exStr = ex >= 100 ? Math.round(ex).toLocaleString("en-US") : ex.toFixed(1);
  if (divinePriceExalted && divinePriceExalted > 0 && ex >= divinePriceExalted) {
    return `${exStr} ex (${(ex / divinePriceExalted).toFixed(1)} div)`;
  }
  return `${exStr} ex`;
}

function table(
  items: NormalizedItem[],
  divinePriceExalted: number | null,
  limit: number,
): string {
  const rows = byPriceDesc(items)
    .slice(0, limit)
    .map((it) => {
      const label = it.type ? `${it.name} (${it.type})` : it.name;
      return `| ${label} | ${priceCell(it, divinePriceExalted)} | ${it.quantity ?? "—"} |`;
    });
  return ["| Item | Price | Listed qty |", "|------|-------|-----------|", ...rows].join("\n");
}

/** Render a full snapshot as a dated markdown digest. */
export function formatDigest(snapshot: EconomySnapshot, limit = 20): string {
  const { league, realm, pulledAt, divinePriceExalted, currencies, uniques } = snapshot;
  const craftingInputs = currencies.filter(isCraftingInput);

  return [
    `# Economy snapshot — ${league}`,
    "",
    `> Realm \`${realm}\` · pulled ${pulledAt} · source poe2scout.com (live trade-derived).`,
    `> 1 Divine ≈ **${divinePriceExalted ? Math.round(divinePriceExalted).toLocaleString("en-US") : "?"} Exalted**.`,
    "> Prices rot fast — re-pull before any large trade. Generated file; do not hand-edit.",
    "",
    `## Top currencies (${currencies.length} tracked)`,
    "",
    table(currencies, divinePriceExalted, limit),
    "",
    `## Crafting inputs (omens / catalysts / bones / essences)`,
    "",
    craftingInputs.length
      ? table(craftingInputs, divinePriceExalted, limit)
      : "_None matched the crafting-input filter in the pulled categories._",
    "",
    `## Top uniques (${uniques.length} tracked)`,
    "",
    table(uniques, divinePriceExalted, limit),
    "",
  ].join("\n");
}
