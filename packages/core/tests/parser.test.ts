import { describe, expect, test } from "vitest";
import { adr2md, md2adr } from "../src/index";
import type { Adr2MdOptions, ArchitecturalDecisionRecord, Md2AdrOptions } from "../src/index";
import {
  MD_ParsedMADR_Pairs as defaultPairs,
  randomStrings,
  validMarkdownADRs as defaultValidADRs
} from "./fixtures/default";
import {
  MD_ParsedMADR_Pairs as optionedPairs,
  validMarkdownADRs as optionedValidADRs,
  yamlMADRs
} from "./fixtures/optioned";

/**
 * The parser is exercised under both option profiles its consumers use:
 * the web app calls it with defaults, the VS Code extension with the
 * cleanup/title-casing/YAML options. Each profile has its own fixture
 * corpus because the options change the canonical output.
 */
const profiles: {
  name: string;
  parse: (md: string) => ArchitecturalDecisionRecord;
  print: (adr: ArchitecturalDecisionRecord) => string;
  pairs: { md: string; adr: ArchitecturalDecisionRecord }[];
  validADRs: string[];
}[] = [
  {
    name: "default options",
    parse: (md) => md2adr(md),
    print: (adr) => adr2md(adr),
    pairs: defaultPairs,
    validADRs: defaultValidADRs
  },
  {
    name: "extension options",
    parse: (md) =>
      md2adr(md, {
        titleCase: true,
        stripBackticks: true,
        aggressiveCleanup: true,
        trackErrors: true
      } satisfies Md2AdrOptions),
    print: (adr) =>
      adr2md(adr, {
        emitYaml: true,
        titleCase: true,
        sanitizeChosenOption: true,
        stripBackticks: true,
        aggressiveCleanup: true
      } satisfies Adr2MdOptions),
    pairs: optionedPairs,
    validADRs: optionedValidADRs
  }
];

for (const { name, parse, print, pairs, validADRs } of profiles) {
  describe(name, () => {
    /**
     * Convergence of the parser:
     * the output of the parser must always be accepted by the parser.
     */
    randomStrings.forEach((rnd) => {
      test("Test parser convergence of random strings.", () => {
        const result1 = print(parse(rnd));
        const result2 = print(parse(result1));
        expect(result2).toBe(result1);
      });
    });

    pairs.forEach((pair) => {
      test("Test parser convergence of possibly incorrect ADRs.", () => {
        const result1 = print(parse(pair.md));
        const result2 = print(parse(result1));
        expect(result2).toBe(result1);
      });
    });

    /**
     * Precision for valid ADRs:
     * the output of the parser should be equal to the input ADR. This only holds for valid MADRs.
     */
    validADRs.forEach((md) => {
      test("Test exact reparsing", () => {
        const result = print(parse(md));
        expect(result).toBe(md);
      });
    });

    /**
     * Test of the function md2adr:
     * compares some parsed ADRs to manually parsed ADRs.
     */
    pairs.forEach((pair) => {
      test("Test md2adr", () => {
        const result = parse(pair.md);
        expect(result).toStrictEqual(pair.adr);
      });
    });
  });
}

// MADRs with YAML front matter (the extension's option profile emits YAML back out).
describe("extension options", () => {
  const { parse, print } = profiles[1]!;
  yamlMADRs.forEach((md) => {
    test("Test parser convergence of ADRs with YAML Front Matter.", () => {
      const result1 = print(parse(md));
      const result2 = print(parse(result1));
      expect(result2).toBe(result1);
    });
  });
});
