import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, basename } from "node:path";

export const ONEDRIVE_BUILDS_DIR =
  process.env.ONEDRIVE_BUILDS_DIR ??
  "/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds";

export function readBuildXml(path: string): string {
  return readFileSync(path, "utf8");
}

export function snapshotBuild(srcPath: string, destDir = "builds"): string {
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, basename(srcPath));
  copyFileSync(srcPath, dest);
  return dest;
}
