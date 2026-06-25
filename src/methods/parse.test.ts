import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseMethodBoard } from "./parse.js";

const fixture = fileURLToPath(new URL("../fixtures/method-readme.sample.md", import.meta.url));

describe("parseMethodBoard", () => {
  it("parses each data row, skipping the header/separator and prose", async () => {
    const rows = parseMethodBoard(await readFile(fixture, "utf8"));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      method: "Greater-essence resist armour",
      capital: "ssf",
      margin: "low–medium",
      risk: "low",
      bestWindow: "any",
      link: "greater-essence-resist-armour.md",
    });
    expect(rows[1].method).toBe("Desecration Lich modifier");
    expect(rows[1].link).toBe("desecration-lich-modifier.md");
  });
});
