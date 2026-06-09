import { md2adr, adr2md, naturalCase2snakeCase, snakeCase2naturalCase } from "@/plugins/parser";

import { randomStrings, MD_ParsedMADR_Pairs, validMarkdownADRs } from "./constants";

randomStrings.forEach((rnd) => {
    test("Test parser convergence of random strings.", () => {
        const result1 = adr2md(md2adr(rnd));
        const result2 = adr2md(md2adr(result1));
        expect(result2).toBe(result1);
    });
});

MD_ParsedMADR_Pairs.forEach((pair) => {
    test("Test parser convergence of possibly incorrect ADRs.", () => {
        const result1 = adr2md(md2adr(pair.md));
        const result2 = adr2md(md2adr(result1));
        expect(result2).toBe(result1);
    });
});

validMarkdownADRs.forEach((md) => {
    test("Test exact reparsing", () => {
        const result = adr2md(md2adr(md));
        expect(result).toBe(md);
    });
});

MD_ParsedMADR_Pairs.forEach((pair) => {
    test("Test md2adr", () => {
        const result = md2adr(pair.md);
        expect(result).toStrictEqual(pair.adr);
    });
});

test("Test snakeCase2naturalCase", () => {
    expect(snakeCase2naturalCase("0005-use-dashes-in-file-names.md")).toBe("0005 Use Dashes In File Names.md");
});

test("Test naturalCase2snakeCase", () => {
    expect(naturalCase2snakeCase("0005 Use dashes in File names.md")).toBe("0005-use-dashes-in-file-names.md");
});
