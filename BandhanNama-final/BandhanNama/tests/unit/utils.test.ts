import { describe, expect, it } from "vitest";
import { normalizeDisplayName } from "../../src/lib/utils";

describe("normalizeDisplayName", () => {
  it("trims, collapses whitespace and normalizes case", () => {
    expect(normalizeDisplayName("  Riya   Kumari ")).toBe("riya kumari");
  });

  it("applies Unicode compatibility normalization", () => {
    expect(normalizeDisplayName("Ａｎｕ")).toBe("anu");
  });
});
