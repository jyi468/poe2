// Parse the crafting method profit-board (crafting/method/README.md) markdown
// table into structured rows. The Methods tab renders these. Read-only over the
// docs directory — never writes there.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface MethodRow {
  method: string;
  capital: string;
  margin: string;
  risk: string;
  bestWindow: string;
  link: string;
}

const LINK = /\[[^\]]*\]\(([^)]+)\)/;

function cells(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function parseMethodBoard(readmeText: string): MethodRow[] {
  const rows: MethodRow[] = [];
  for (const line of readmeText.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const c = cells(line);
    if (c.length < 6) continue;
    if (/^-+$/.test(c[0].replace(/\s/g, ""))) continue; // separator row
    if (c[0].toLowerCase() === "method") continue; // header
    const linkMatch = LINK.exec(c[5]);
    if (!linkMatch) continue; // only real method rows carry a link
    rows.push({
      method: c[0],
      capital: c[1],
      margin: c[2].replace(/\s*†\s*$/, "").trim(),
      risk: c[3],
      bestWindow: c[4],
      link: linkMatch[1],
    });
  }
  return rows;
}

export async function loadMethodBoard(repoRoot?: string): Promise<MethodRow[]> {
  const root = repoRoot ?? resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
  const text = await readFile(resolve(root, "crafting/method/README.md"), "utf8");
  return parseMethodBoard(text);
}
