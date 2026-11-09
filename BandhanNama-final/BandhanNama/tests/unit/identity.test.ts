import { describe, expect, it } from "vitest";
import { normalizeName } from "../../src/lib/security/normalization";

describe("normalizeName", () => {
  it("trims, collapses whitespace and ignores case", () => {
    expect(normalizeName("  Priya   Kumari ")).toBe("priya kumari");
  });
  it("normalizes compatibility characters", () => {
    expect(normalizeName("Ｐｒｉｙａ")).toBe("priya");
  });
});
