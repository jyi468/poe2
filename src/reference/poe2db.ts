// Minimal poe2db.tw scraper for crafting consumables (omens, currency, essences, bones).
// poe2db renders each item's effect inside `class="explicitMod"` spans, with structured
// property rows like "Minimum Modifier Level: 50" and "Stack Size: 1 / 20". We pull a
// curated set of item pages and extract those fields. HTML-by-regex is deliberate — no
// dependency, and the markup is stable enough for a periodic reference refresh.

const UA = "Mozilla/5.0 (poe2-assistant reference puller)";
const BASE = "https://poe2db.tw/us";

export interface RefItem {
  slug: string;
  name: string;
  /** The effect text (joined explicitMod lines). */
  effect: string;
  /** "Minimum Modifier Level" if the page lists one (Greater=35, Perfect=50, …). */
  minModLevel: number | null;
  stackSize: string | null;
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1] : null;
}

export function parseItem(slug: string, html: string): RefItem {
  const titleRaw = firstMatch(html, /<title>(.*?)<\/title>/s) ?? slug;
  const name = stripTags(titleRaw).replace(/\s*[-|].*$/, "").trim() || slug.replace(/_/g, " ");

  // The item's own effect is the FIRST explicitMod; later ones are drop-table/related
  // mods poe2db appends, so we keep only the primary line.
  const effects = [...html.matchAll(/class="explicitMod"[^>]*>(.*?)<\/div>/gs)]
    .map((m) => stripTags(m[1]))
    .filter((s) => s.length > 0);
  const effect = effects[0] ?? "";

  const minLvlStr = firstMatch(html, /Minimum Modifier Level[^0-9]{0,40}?(\d+)/s);
  const stack = firstMatch(html, /Stack Size[^0-9]{0,20}?(\d+\s*\/\s*\d+)/s);

  return {
    slug,
    name,
    effect,
    minModLevel: minLvlStr ? Number(minLvlStr) : null,
    stackSize: stack ? stack.replace(/\s+/g, "") : null,
  };
}

/**
 * Discover every item slug linked from a poe2db category/list page.
 * `slugPattern` is a regex fragment matching the whole slug, e.g. "Omen_of_[A-Za-z0-9_]+".
 */
export async function discoverSlugs(listSlug: string, slugPattern: string): Promise<string[]> {
  const res = await fetch(`${BASE}/${listSlug}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${listSlug}: HTTP ${res.status}`);
  const html = await res.text();
  // poe2db links are relative on list pages (href="Omen_of_X"), absolute elsewhere.
  const re = new RegExp(`href="(?:/us/)?(${slugPattern})"`, "g");
  return [...new Set([...html.matchAll(re)].map((m) => m[1]))].sort();
}

export async function fetchItem(slug: string): Promise<RefItem> {
  const res = await fetch(`${BASE}/${slug}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  return parseItem(slug, await res.text());
}

/** Fetch many slugs politely (small concurrency); failures returned as nulls. */
export async function fetchAll(
  slugs: readonly string[],
  concurrency = 4,
): Promise<Array<RefItem | null>> {
  const out: Array<RefItem | null> = new Array(slugs.length).fill(null);
  let i = 0;
  async function worker() {
    while (i < slugs.length) {
      const idx = i++;
      try {
        out[idx] = await fetchItem(slugs[idx]);
      } catch (e) {
        process.stderr.write(`  ! ${slugs[idx]}: ${(e as Error).message}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}
