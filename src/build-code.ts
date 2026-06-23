import { deflateSync, inflateSync } from "node:zlib";

// PoB share codes: base64(Deflate(xml)) with + -> -, / -> _ (see PoB ImportTab.lua).
export function decodeBuildCode(code: string): string {
  const b64 = code.trim().replace(/-/g, "+").replace(/_/g, "/");
  return inflateSync(Buffer.from(b64, "base64")).toString("utf8");
}

export function encodeBuildCode(xml: string): string {
  return deflateSync(Buffer.from(xml, "utf8"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
