import { describe, expect, test } from "vitest";
import {
  ArchitecturalDecisionRecord,
  DEFAULT_FIELD_VISIBILITY,
  FIELD_KEYS,
  applyFieldVisibilityFilter
} from "../src/index";

describe("relevantFiles field visibility", () => {
  test("relevantFiles is a known, default-visible field key", () => {
    expect(FIELD_KEYS).toContain("relevantFiles");
    expect(DEFAULT_FIELD_VISIBILITY.relevantFiles).toBe(true);
  });

  test("a visible relevantFiles field is preserved by the filter", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: ["src/main.ts"] });
    const filtered = applyFieldVisibilityFilter(adr, { ...DEFAULT_FIELD_VISIBILITY });
    expect(filtered.relevantFiles).toStrictEqual(["src/main.ts"]);
  });

  test("a hidden relevantFiles field is zeroed without mutating the original", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: ["src/main.ts"] });
    const filtered = applyFieldVisibilityFilter(adr, { ...DEFAULT_FIELD_VISIBILITY, relevantFiles: false });
    expect(filtered.relevantFiles).toStrictEqual([]);
    expect(adr.relevantFiles).toStrictEqual(["src/main.ts"]);
  });
});

describe("relevantFiles cleanUp", () => {
  test("lenient mode trims entries but keeps empties", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: [" src/main.ts ", ""] });
    expect(adr.relevantFiles).toStrictEqual(["src/main.ts", ""]);
  });

  test("aggressive mode trims and drops empty entries", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: [" src/main.ts ", ""] });
    adr.cleanUp({ aggressive: true });
    expect(adr.relevantFiles).toStrictEqual(["src/main.ts"]);
  });
});
