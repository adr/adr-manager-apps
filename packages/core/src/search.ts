import type { Tag } from "./types";

// ── Query shape ───────────────────────────────────────────────────────────────

export interface AdrSearchQuery {
  /** Free-text matched against the ADR title (case-insensitive substring). */
  text: string;
  /**
   * Whitelisted statuses (lowercase). Empty array = no status filter.
   * e.g. ["accepted", "proposed"]
   */
  statuses: string[];
  /**
   * Whitelisted tag IDs. Empty array = no tag filter.
   * An ADR passes if it has AT LEAST ONE tag whose id is in this set.
   */
  tagIds: string[];
}

export const EMPTY_QUERY: AdrSearchQuery = { text: "", statuses: [], tagIds: [] };

export function isEmptyQuery(q: AdrSearchQuery): boolean {
  return q.text.trim() === "" && q.statuses.length === 0 && q.tagIds.length === 0;
}

// ── Lightweight markdown extractors ──────────────────────────────────────────

const TITLE_RE = /^#\s+(.+)$/m;

// MADR 2.x: "* Status: Accepted"
const STATUS_BULLET_RE = /^[*-]\s+[Ss]tatus:\s*(.+)$/m;
// MADR 4.x front-matter block: "status: accepted"
const STATUS_YAML_RE = /^---[\s\S]*?\nstatus:\s*(\S[^\n]*)[\s\S]*?---/;

/**
 * Returns the title extracted from the first H1 heading in the markdown,
 * or an empty string if none is found.
 */
export function extractAdrTitle(md: string): string {
  return TITLE_RE.exec(md)?.[1]?.trim() ?? "";
}

/**
 * Returns the lowercase status string extracted from the markdown
 * (supports both MADR 2.x bullet syntax and MADR 4.x front-matter).
 * Returns an empty string if no status is found.
 */
export function extractAdrStatus(md: string): string {
  const yaml = STATUS_YAML_RE.exec(md)?.[1]?.trim();
  if (yaml) return yaml.toLowerCase();
  return STATUS_BULLET_RE.exec(md)?.[1]?.trim().toLowerCase() ?? "";
}

// ── Searchable shape (minimal, serializable) ──────────────────────────────────

export interface SearchableAdr {
  title: string;
  /** Lowercase status string, e.g. "accepted". Empty string when not set. */
  status: string;
  tags: Tag[];
}

// ── Matcher ───────────────────────────────────────────────────────────────────

/**
 * Returns true iff the given ADR satisfies every active constraint in the query.
 * All active constraints are ANDed together.
 */
export function matchesAdrSearch(adr: SearchableAdr, query: AdrSearchQuery): boolean {
  if (query.text.trim() !== "") {
    const needle = query.text.trim().toLowerCase();
    if (!adr.title.toLowerCase().includes(needle)) return false;
  }

  if (query.statuses.length > 0) {
    if (!query.statuses.includes(adr.status)) return false;
  }

  if (query.tagIds.length > 0) {
    const adrTagIds = new Set(adr.tags.map((t) => t.id));
    if (!query.tagIds.some((id) => adrTagIds.has(id))) return false;
  }

  return true;
}
