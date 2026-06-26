// Tiny HTTP helpers for the command-center API: JSON send, body parse, and a
// wrap() that enforces the {ok,data}|{ok,error} envelope and turns thrown
// errors into 500s instead of crashing the server.

import type { IncomingMessage, ServerResponse } from "node:http";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type Handler = (req: IncomingMessage, body: unknown) => Promise<unknown>;

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const text = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(text);
}

export async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

export function wrap(handler: Handler) {
  return async (req: IncomingMessage, res: ServerResponse, body: unknown): Promise<void> => {
    try {
      const data = await handler(req, body);
      sendJson(res, 200, { ok: true, data });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  };
}
