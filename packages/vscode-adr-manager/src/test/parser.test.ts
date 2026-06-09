// Tested functionality
import { md2adr, adr2md } from "../plugins/parser";

// Needed for testing
import { randomStrings, MD_ParsedMADR_Pairs, validMarkdownADRs, yamlMADRs } from "./constants";

/**
 * Convergence of the parser:
 * The output of the parser must always be accepted by the parser.
 */
for (let i = 0; i < randomStrings.length; i++) {
	test("Test parser convergence of random strings.", () => {
		const result1 = adr2md(md2adr(randomStrings[i]));
		const result2 = adr2md(md2adr(result1));
		expect(result2).toBe(result1);
	});
}

for (let i = 0; i < MD_ParsedMADR_Pairs.length; i++) {
	test("Test parser convergence of possibly incorrect ADRs.", () => {
		const result1 = adr2md(md2adr(MD_ParsedMADR_Pairs[i].md));
		const result2 = adr2md(md2adr(result1));
		expect(result2).toBe(result1);
	});
}

// MADRs with YAML Front Matter:
for (let i = 0; i < yamlMADRs.length; i++) {
	test("Test parser convergence of ADRs with YAML Front Matter.", () => {
		const result1 = adr2md(md2adr(yamlMADRs[i]));
		const result2 = adr2md(md2adr(result1));
		expect(result2).toBe(result1);
	});
}

/**
 * Precision for valid ADRs:
 * The output of the parser should be equal to the input ADR. This only holds for valid MADRs.
 */
for (let i = 0; i < validMarkdownADRs.length; i++) {
	test("Test exact reparsing", () => {
		const result = adr2md(md2adr(validMarkdownADRs[i]));
		expect(result).toBe(validMarkdownADRs[i]);
	});
}

/**
 * Test of the function md2adr.
 * Compares some parsed ADRs to manually parsed ADRs.
 */
MD_ParsedMADR_Pairs.forEach(function (pair) {
	test("Test md2adr", () => {
		const result = md2adr(pair.md);
		expect(result).toStrictEqual(pair.adr);
	});
});
