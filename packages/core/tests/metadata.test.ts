import { describe, expect, test } from "vitest";
import {
  parseMadrVersionFromMd,
  parseRelevantFilesFromMd,
  parseTagsFromMd,
  setMadrVersionInMd,
  setRelevantFilesInMd,
  setTagsInMd,
  stripMadrVersionComment,
  stripRelevantFilesComment,
  stripTagComment
} from "../src/index";
import type { Tag } from "../src/index";

const BASE_MD = "# Use PostgreSQL\n\nDecision text.\n";
const TAG_A: Tag = { id: "tag-a", label: "Frontend", color: "#6366f1" };
const TAG_B: Tag = { id: "tag-b", label: "Backend", color: "#22c55e" };

describe("ADR tag metadata comments", () => {
  test("round-trips tag id, label and color", () => {
    const md = setTagsInMd(BASE_MD, [TAG_A, TAG_B]);
    expect(parseTagsFromMd(md)).toStrictEqual([TAG_A, TAG_B]);
  });

  test("replaces an existing tag comment instead of appending another", () => {
    const md = setTagsInMd(setTagsInMd(BASE_MD, [TAG_A]), [TAG_B]);
    expect(parseTagsFromMd(md)).toStrictEqual([TAG_B]);
    expect(md.match(/adr-manager-tags/g)).toHaveLength(1);
  });

  test("strips and clears tag comments", () => {
    const tagged = setTagsInMd(BASE_MD, [TAG_A]);
    expect(stripTagComment(tagged)).toBe(BASE_MD);
    expect(setTagsInMd(tagged, [])).toBe(BASE_MD);
  });

  test("ignores malformed or wrong-shaped tag metadata", () => {
    expect(parseTagsFromMd(`${BASE_MD}\n<!-- adr-manager-tags: not-json -->`)).toStrictEqual([]);
    expect(parseTagsFromMd(`${BASE_MD}\n<!-- adr-manager-tags: {"id":"tag-a"} -->`)).toStrictEqual([]);
    expect(parseTagsFromMd(`${BASE_MD}\n<!-- adr-manager-tags: [{"id":"tag-a"}] -->`)).toStrictEqual([]);
  });
});

describe("ADR relevant-file metadata comments", () => {
  test("round-trips string file paths", () => {
    const paths = ["src/main.ts", "docs/adr with spaces.md"];
    expect(parseRelevantFilesFromMd(setRelevantFilesInMd(BASE_MD, paths))).toStrictEqual(paths);
  });

  test("replaces an existing relevant-file comment instead of appending another", () => {
    const md = setRelevantFilesInMd(setRelevantFilesInMd(BASE_MD, ["src/old.ts"]), ["src/new.ts"]);
    expect(parseRelevantFilesFromMd(md)).toStrictEqual(["src/new.ts"]);
    expect(md.match(/adr-manager-relevant-files/g)).toHaveLength(1);
  });

  test("strips and clears relevant-file comments", () => {
    const linked = setRelevantFilesInMd(BASE_MD, ["src/main.ts"]);
    expect(stripRelevantFilesComment(linked)).toBe(BASE_MD);
    expect(setRelevantFilesInMd(linked, [])).toBe(BASE_MD);
  });

  test("ignores malformed metadata and non-string entries", () => {
    expect(parseRelevantFilesFromMd(`${BASE_MD}\n<!-- adr-manager-relevant-files: not-json -->`)).toStrictEqual([]);
    expect(
      parseRelevantFilesFromMd(`${BASE_MD}\n<!-- adr-manager-relevant-files: ["src/main.ts", 123, null] -->`)
    ).toStrictEqual(["src/main.ts"]);
  });
});

describe("ADR MADR-version metadata comments", () => {
  test("round-trips the pinned template version", () => {
    expect(parseMadrVersionFromMd(setMadrVersionInMd(BASE_MD, "4.0.0"))).toBe("4.0.0");
    expect(parseMadrVersionFromMd(setMadrVersionInMd(BASE_MD, "2.1.2"))).toBe("2.1.2");
  });

  test("replaces an existing version comment instead of appending another", () => {
    const md = setMadrVersionInMd(setMadrVersionInMd(BASE_MD, "2.1.2"), "4.0.0");
    expect(parseMadrVersionFromMd(md)).toBe("4.0.0");
    expect(md.match(/adr-manager-madr-version/g)).toHaveLength(1);
  });

  test("strips the version comment", () => {
    expect(stripMadrVersionComment(setMadrVersionInMd(BASE_MD, "4.0.0"))).toBe(BASE_MD);
  });

  test("ignores a missing or unknown version", () => {
    expect(parseMadrVersionFromMd(BASE_MD)).toBeUndefined();
    expect(parseMadrVersionFromMd(`${BASE_MD}\n<!-- adr-manager-madr-version: "9.9.9" -->`)).toBeUndefined();
  });
});
