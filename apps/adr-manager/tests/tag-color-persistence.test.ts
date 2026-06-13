/**
 * Tests for tag color persistence across the full lifecycle:
 *
 *   1. parseTagsFromMd correctly extracts the color stored in an ADR markdown comment.
 *   2. setTagsInMd → parseTagsFromMd round-trip preserves all three tag fields.
 *   3. availableTags (from useAdrSearch) returns the correct colors when reading
 *      Repository objects populated with tagged ADR markdown.
 *   4. Remove-and-re-add scenario: creating a fresh Repository with the same markdown
 *      content (as happens when a user removes then re-adds a repo) yields identical
 *      tag objects — same id, label, and color.
 *
 * This covers the fact that tags are stored exclusively in the ADR markdown file
 * (as a `<!-- adr-manager-tags: [...] -->` comment) and therefore must survive any
 * in-memory state reset that does not modify the underlying file.
 */
import { describe, it, expect } from "vitest";
import { parseTagsFromMd, setTagsInMd } from "@adr-manager/core";
import { Repository } from "@/plugins/classes";
import { useAdrSearch } from "@/composables/useAdrSearch";
import type { Tag, AdrFile } from "@/types/adr";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TAG_A: Tag = { id: "a1", label: "frontend", color: "#6366f1" };
const TAG_B: Tag = { id: "b2", label: "backend",  color: "#22c55e" };
const TAG_C: Tag = { id: "c3", label: "infra",    color: "#f59e0b" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAdrFile(md: string, id = 1): AdrFile {
    return {
        path: `docs/decisions/${String(id).padStart(4, "0")}-example.md`,
        originalMd: md,
        editedMd: md,
        id
    };
}

function makeRepo(adrs: AdrFile[]): Repository {
    return new Repository({
        fullName: "org/repo",
        activeBranch: "main",
        branches: [],
        adrs,
        adrPath: "docs/decisions/"
    });
}

const BASE_MD = "# ADR 1 – Use PostgreSQL\n\nUse PostgreSQL as the primary database.";

// ── Tests ─────────────────────────────────────────────────────────────────────

const { availableTags } = useAdrSearch();

// ── 1. parseTagsFromMd color extraction ──────────────────────────────────────
describe("parseTagsFromMd – color extraction", () => {
    it("extracts the exact color hex stored in the markdown comment", () => {
        const md = `${BASE_MD}\n<!-- adr-manager-tags: [{"id":"a1","label":"frontend","color":"#6366f1"}] -->`;
        const [tag] = parseTagsFromMd(md);
        expect(tag.color).toBe("#6366f1");
    });

    it("extracts distinct colors for each tag in a multi-tag comment", () => {
        const md = setTagsInMd(BASE_MD, [TAG_A, TAG_B, TAG_C]);
        const tags = parseTagsFromMd(md);
        expect(tags.map((t) => t.color)).toEqual([TAG_A.color, TAG_B.color, TAG_C.color]);
    });

    it("returns an empty array when the markdown has no tag comment", () => {
        expect(parseTagsFromMd(BASE_MD)).toEqual([]);
    });

    it("returns an empty array for malformed JSON in the tag comment", () => {
        const md = `${BASE_MD}\n<!-- adr-manager-tags: not-valid-json -->`;
        expect(parseTagsFromMd(md)).toEqual([]);
    });
});

// ── 2. setTagsInMd → parseTagsFromMd round-trip ──────────────────────────────
describe("setTagsInMd → parseTagsFromMd round-trip", () => {
    it("preserves id, label, and color for a single tag", () => {
        const md = setTagsInMd(BASE_MD, [TAG_A]);
        expect(parseTagsFromMd(md)).toEqual([TAG_A]);
    });

    it("preserves all three fields for multiple tags with distinct colors", () => {
        const md = setTagsInMd(BASE_MD, [TAG_A, TAG_B, TAG_C]);
        expect(parseTagsFromMd(md)).toEqual([TAG_A, TAG_B, TAG_C]);
    });

    it("replacing tags updates the comment and new colors are returned", () => {
        let md = setTagsInMd(BASE_MD, [TAG_A]);
        md = setTagsInMd(md, [TAG_B, TAG_C]);
        const tags = parseTagsFromMd(md);
        expect(tags).toEqual([TAG_B, TAG_C]);
    });

    it("clearing tags (empty array) removes the comment entirely", () => {
        const md = setTagsInMd(setTagsInMd(BASE_MD, [TAG_A]), []);
        expect(parseTagsFromMd(md)).toEqual([]);
    });

    it("round-trip does not introduce extra fields", () => {
        const md = setTagsInMd(BASE_MD, [TAG_A]);
        const [tag] = parseTagsFromMd(md);
        expect(Object.keys(tag).sort()).toEqual(["color", "id", "label"]);
    });
});

// ── 3. availableTags returns correct colors from Repository ───────────────────
describe("availableTags – color correctness from repository ADRs", () => {
    it("returns the tag with the correct color from a single ADR file", () => {
        const repo = makeRepo([makeAdrFile(setTagsInMd(BASE_MD, [TAG_A]))]);
        const tags = availableTags([repo]);
        expect(tags[0].color).toBe(TAG_A.color);
    });

    it("returns distinct colors from multiple ADR files", () => {
        const md1 = setTagsInMd("# ADR 1\nContent.", [TAG_A]);
        const md2 = setTagsInMd("# ADR 2\nContent.", [TAG_B]);
        const repo = makeRepo([makeAdrFile(md1, 1), makeAdrFile(md2, 2)]);
        const tags = availableTags([repo]);
        const byId = Object.fromEntries(tags.map((t) => [t.id, t.color]));
        expect(byId[TAG_A.id]).toBe(TAG_A.color);
        expect(byId[TAG_B.id]).toBe(TAG_B.color);
    });

    it("deduplicates a tag that appears in multiple ADR files, keeping one entry", () => {
        const md1 = setTagsInMd("# ADR 1\nContent.", [TAG_A]);
        const md2 = setTagsInMd("# ADR 2\nContent.", [TAG_A, TAG_B]);
        const repo = makeRepo([makeAdrFile(md1, 1), makeAdrFile(md2, 2)]);
        const tags = availableTags([repo]);
        expect(tags.filter((t) => t.id === TAG_A.id)).toHaveLength(1);
    });

    it("returns an empty array when no ADR has tags", () => {
        const repo = makeRepo([makeAdrFile(BASE_MD)]);
        expect(availableTags([repo])).toEqual([]);
    });
});

// ── 4. Remove repo → re-add repo: tag colors stay consistent ─────────────────
describe("remove and re-add repository – tag color consistency", () => {
    const TAGGED_MD = setTagsInMd(BASE_MD, [TAG_A, TAG_B]);

    it("tags have the same colors after a repo is removed and re-added", () => {
        const firstLoad  = availableTags([makeRepo([makeAdrFile(TAGGED_MD)])]);
        const secondLoad = availableTags([makeRepo([makeAdrFile(TAGGED_MD)])]);
        expect(secondLoad.map((t) => t.color)).toEqual(firstLoad.map((t) => t.color));
    });

    it("tag IDs are stable across a remove/re-add cycle", () => {
        const firstIds  = availableTags([makeRepo([makeAdrFile(TAGGED_MD)])]).map((t) => t.id);
        const secondIds = availableTags([makeRepo([makeAdrFile(TAGGED_MD)])]).map((t) => t.id);
        expect(secondIds).toEqual(firstIds);
    });

    it("tag labels are stable across a remove/re-add cycle", () => {
        const firstLabels  = availableTags([makeRepo([makeAdrFile(TAGGED_MD)])]).map((t) => t.label);
        const secondLabels = availableTags([makeRepo([makeAdrFile(TAGGED_MD)])]).map((t) => t.label);
        expect(secondLabels).toEqual(firstLabels);
    });

    it("full tag objects are identical after remove and re-add", () => {
        const before = availableTags([makeRepo([makeAdrFile(TAGGED_MD)])]);
        const after  = availableTags([makeRepo([makeAdrFile(TAGGED_MD)])]);
        expect(after).toEqual(before);
    });

    it("colors are consistent across multiple ADRs with different tags after re-add", () => {
        const md1 = setTagsInMd("# ADR 1\nContent.", [TAG_A]);
        const md2 = setTagsInMd("# ADR 2\nContent.", [TAG_B, TAG_C]);
        const files = [makeAdrFile(md1, 1), makeAdrFile(md2, 2)];

        const before = availableTags([makeRepo(files)]);
        const after  = availableTags([makeRepo(files)]);
        expect(after).toEqual(before);
    });

    it("a single specific tag color matches the original after re-add", () => {
        const md = setTagsInMd(BASE_MD, [TAG_C]);

        const [before] = availableTags([makeRepo([makeAdrFile(md)])]);
        const [after]  = availableTags([makeRepo([makeAdrFile(md)])]);
        expect(after.color).toBe(before.color);
        expect(after.color).toBe(TAG_C.color);
    });
});
