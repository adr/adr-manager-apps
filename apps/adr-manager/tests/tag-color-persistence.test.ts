/**
 * Tags live exclusively in the ADR markdown (a `<!-- adr-manager-tags: [...] -->`
 * comment), so availableTags must re-derive them from the file every time. These tests
 * cover that derivation and its consequence: a repository rebuilt from the same markdown
 * (e.g. removed then re-added) yields identical tag objects. Exhaustive parsing of the
 * comment itself is covered in @adr-manager/core (metadata.test.ts).
 */
import { describe, it, expect } from "vitest";
import { parseTagsFromMd, setTagsInMd } from "@adr-manager/core";
import { Repository } from "@/plugins/classes";
import { useAdrSearch } from "@/composables/useAdrSearch";
import type { Tag, AdrFile } from "@/types/adr";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TAG_A: Tag = { id: "a1", label: "frontend", color: "#6366f1" };
const TAG_B: Tag = { id: "b2", label: "backend", color: "#22c55e" };
const TAG_C: Tag = { id: "c3", label: "infra", color: "#f59e0b" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAdrFile(md: string, id = 1): AdrFile {
    const path = `docs/decisions/${String(id).padStart(4, "0")}-example.md`;
    return {
        path,
        originalPath: path,
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

// ── 1. Markdown round-trip (web app re-export, exhaustive coverage in core) ────
describe("tag markdown round-trip", () => {
    it("preserves id, label, and color for multiple tags", () => {
        const md = setTagsInMd(BASE_MD, [TAG_A, TAG_B, TAG_C]);
        expect(parseTagsFromMd(md)).toEqual([TAG_A, TAG_B, TAG_C]);
    });

    it("returns an empty array for malformed tag metadata", () => {
        expect(parseTagsFromMd(`${BASE_MD}\n<!-- adr-manager-tags: not-valid-json -->`)).toEqual([]);
    });
});

// ── 2. availableTags returns correct colors from Repository ───────────────────
describe("availableTags – color correctness from repository ADRs", () => {
    it("returns the tag with the correct color from a single ADR file", () => {
        const repo = makeRepo([makeAdrFile(setTagsInMd(BASE_MD, [TAG_A]))]);
        const tags = availableTags([repo]);
        expect(tags).toEqual([TAG_A]);
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

// ── 3. Tags survive an in-memory repository reset (remove → re-add) ───────────
// Removing and re-adding a repo rebuilds it from the same ADR markdown. Because tags live
// only in the markdown, availableTags yields byte-identical Tag objects each time.
describe("tags are re-derived from markdown across a repository reset", () => {
    it("rebuilding a repository from the same markdown yields identical tag objects", () => {
        const md = setTagsInMd(BASE_MD, [TAG_A, TAG_B]);
        const before = availableTags([makeRepo([makeAdrFile(md)])]);
        const after = availableTags([makeRepo([makeAdrFile(md)])]);
        expect(after).toEqual(before);
        expect(after).toEqual([TAG_A, TAG_B]);
    });

    it("holds across multiple ADRs carrying different tags", () => {
        const files = [
            makeAdrFile(setTagsInMd("# ADR 1\nContent.", [TAG_A]), 1),
            makeAdrFile(setTagsInMd("# ADR 2\nContent.", [TAG_B, TAG_C]), 2)
        ];
        const before = availableTags([makeRepo(files)]);
        const after = availableTags([makeRepo(files)]);
        expect(after).toEqual(before);
        expect(after).toEqual([TAG_A, TAG_B, TAG_C]);
    });
});
