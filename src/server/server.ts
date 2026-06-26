// node:http server for the command center. Serves the JSON API under /api and,
// in production, the built Vite app from app/dist. Dev uses Vite's proxy, so the
// static fallback is only hit by `pnpm app:serve`.

import { createServer as createHttp, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readBody, sendJson, wrap, type Handler } from "./http.js";
import {
  getDesecration, getEconomy, getFlowchart, getMethods, getSlots, postCraft, postTrade, refreshEconomy,
} from "./routes.js";

const PORT = Number(process.env.PORT ?? 5179);
const DIST = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../app/dist");

const ROUTES: Record<string, Handler> = {
  "GET /api/economy": getEconomy,
  "POST /api/economy/refresh": refreshEconomy,
  "GET /api/methods": getMethods,
  "GET /api/flowchart": getFlowchart,
  "GET /api/desecration": getDesecration,
  "GET /api/slots": getSlots,
  "POST /api/craft": postCraft,
  "POST /api/trade": postTrade,
};

const MIME: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml",
};

async function serveStatic(url: string, res: ServerResponse): Promise<void> {
  const rel = url === "/" ? "index.html" : url.replace(/^\//, "");
  try {
    const file = join(DIST, rel);
    const data = await readFile(file);
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[extname(file)] ?? "application/octet-stream");
    res.end(data);
  } catch {
    try {
      const data = await readFile(join(DIST, "index.html")); // SPA fallback
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.end(data);
    } catch {
      sendJson(res, 404, { ok: false, error: "not found (run pnpm app:build)" });
    }
  }
}

export function createServer() {
  return createHttp(async (req: IncomingMessage, res: ServerResponse) => {
    const url = (req.url ?? "/").split("?")[0];
    const key = `${req.method} ${url}`;
    const route = ROUTES[key];
    if (route) {
      const body = req.method === "POST" ? await readBody(req).catch(() => ({})) : {};
      return wrap(route)(req, res, body);
    }
    if (req.method === "GET" && !url.startsWith("/api")) return serveStatic(url, res);
    sendJson(res, 404, { ok: false, error: `no route ${key}` });
  });
}

createServer().listen(PORT, () => console.log(`command-center API on http://localhost:${PORT}`));
