import type { Tag } from "./types";

// Matches the tag comment injected at the end of an ADR markdown file.
const TAG_RE = /\n?<!-- adr-manager-tags: (.+?) -->/;

function isTag(value: unknown): value is Tag {
  if (typeof value !== "object" || value === null) return false;
  const tag = value as Partial<Record<keyof Tag, unknown>>;
  return typeof tag.id === "string" && typeof tag.label === "string" && typeof tag.color === "string";
}

/** Parse tags embedded in ADR markdown. Returns an empty array if none are found. */
export function parseTagsFromMd(md: string): Tag[] {
  const match = TAG_RE.exec(md);
  if (!match?.[1]) return [];
  try {
    const parsed = JSON.parse(match[1]) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isTag) : [];
  } catch {
    return [];
  }
}

/** Remove the tag comment from markdown (use before round-trip checks). */
export function stripTagComment(md: string): string {
  return md.replace(TAG_RE, "");
}

/** Inject (or replace) the tag comment at the end of the markdown. */
export function setTagsInMd(md: string, tags: Tag[]): string {
  const base = stripTagComment(md);
  if (tags.length === 0) return base;
  return `${base}\n<!-- adr-manager-tags: ${JSON.stringify(tags)} -->`;
}

export const TAG_PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"] as const;

export type TagPaletteColor = (typeof TAG_PALETTE)[number];
