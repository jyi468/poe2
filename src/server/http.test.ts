import { describe, it, expect } from "vitest";
import type { ServerResponse } from "node:http";
import { wrap } from "./http.js";

function fakeRes() {
  const res = { statusCode: 0, headers: {} as Record<string, string>, body: "" };
  return {
    res: res as unknown as ServerResponse,
    capture: res,
    setHeader: (k: string, v: string) => (res.headers[k] = v),
  };
}

describe("wrap", () => {
  it("wraps a successful handler in {ok:true,data}", async () => {
    const f = fakeRes();
    const res = Object.assign(f.res, { setHeader: f.setHeader, end: (s: string) => (f.capture.body = s) });
    await wrap(async () => ({ value: 42 }))({} as any, res as any, {});
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(f.capture.body)).toEqual({ ok: true, data: { value: 42 } });
  });

  it("wraps a thrown error in {ok:false,error} with status 500", async () => {
    const f = fakeRes();
    const res = Object.assign(f.res, { setHeader: f.setHeader, end: (s: string) => (f.capture.body = s) });
    await wrap(async () => { throw new Error("boom"); })({} as any, res as any, {});
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(f.capture.body)).toEqual({ ok: false, error: "boom" });
  });
});
