import { describe, expect, test } from "vitest";
import { EMPTY_QUERY, extractAdrStatus, extractAdrTitle, isEmptyQuery, matchesAdrSearch } from "../src/index";
import type { AdrSearchQuery, SearchableAdr } from "../src/index";

const ADR: SearchableAdr = {
  title: "Use PostgreSQL for billing",
  status: "accepted",
  tags: [
    { id: "database", label: "Database", color: "#6366f1" },
    { id: "billing", label: "Billing", color: "#22c55e" }
  ]
};

function query(overrides: Partial<AdrSearchQuery> = {}): AdrSearchQuery {
  return { ...EMPTY_QUERY, ...overrides };
}

describe("extractAdrTitle", () => {
  test("returns the first H1 title without surrounding whitespace", () => {
    const md = "Intro text\n\n#   Use PostgreSQL   \n\n## Context\n";
    expect(extractAdrTitle(md)).toBe("Use PostgreSQL");
  });

  test("returns an empty string when no H1 is present", () => {
    expect(extractAdrTitle("## Context\n\nNo title here.")).toBe("");
  });
});

describe("extractAdrStatus", () => {
  test("reads MADR 2.x bullet status case-insensitively", () => {
    expect(extractAdrStatus("* Status: Accepted\n")).toBe("accepted");
    expect(extractAdrStatus("- status: Proposed\n")).toBe("proposed");
  });

  test("reads quoted and unquoted MADR 4.x front-matter status", () => {
    expect(extractAdrStatus('---\nstatus: "accepted"\ndate: 2026-06-10\n---\n')).toBe("accepted");
    expect(extractAdrStatus("---\nstatus: proposed\ndate: 2026-06-10\n---\n")).toBe("proposed");
  });

  test("returns an empty string when no status exists", () => {
    expect(extractAdrStatus("# Use PostgreSQL\n")).toBe("");
  });
});

describe("isEmptyQuery", () => {
  test("treats whitespace-only text as empty", () => {
    expect(isEmptyQuery(query({ text: " \n\t " }))).toBe(true);
  });

  test("returns false when any filter is active", () => {
    expect(isEmptyQuery(query({ statuses: ["accepted"] }))).toBe(false);
    expect(isEmptyQuery(query({ tagIds: ["database"] }))).toBe(false);
  });
});

describe("matchesAdrSearch", () => {
  test("matches title text case-insensitively", () => {
    expect(matchesAdrSearch(ADR, query({ text: "postgres" }))).toBe(true);
    expect(matchesAdrSearch(ADR, query({ text: "redis" }))).toBe(false);
  });

  test("requires a selected status when status filters are active", () => {
    expect(matchesAdrSearch(ADR, query({ statuses: ["accepted"] }))).toBe(true);
    expect(matchesAdrSearch(ADR, query({ statuses: ["rejected"] }))).toBe(false);
  });

  test("matches any selected tag while still requiring other active filters", () => {
    expect(matchesAdrSearch(ADR, query({ tagIds: ["frontend", "billing"] }))).toBe(true);
    expect(matchesAdrSearch(ADR, query({ text: "postgres", tagIds: ["database"] }))).toBe(true);
    expect(matchesAdrSearch(ADR, query({ text: "redis", tagIds: ["database"] }))).toBe(false);
    expect(matchesAdrSearch(ADR, query({ tagIds: ["frontend"] }))).toBe(false);
  });
});
