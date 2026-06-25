import { ArchitecturalDecisionRecord } from "./classes";
import type { Adr2MdOptions, Md2AdrOptions } from "./parser";
import { DEFAULT_MADR_VERSION, detectMadrVersion, parseMadr, roundTripsMadr, serializeMadr } from "./templates";
import type { MadrRoundTripOptions } from "./templates";
import { parseMadrVersionFromMd, setMadrVersionInMd, stripMadrVersionComment } from "./madr-version";
import { parseRelevantFilesFromMd, setRelevantFilesInMd, stripRelevantFilesComment } from "./relevant-files";
import { parseTagsFromMd, setTagsInMd, stripTagComment } from "./tags";
import { matchesIgnoringFormatting } from "./utils";
import type { MadrTemplateVersion, Tag } from "./types";

export interface AnalyzeAdrOptions {
  /** Parse options forwarded to {@link parseMadr} (and the conformity round-trip). */
  parse?: Md2AdrOptions;
  /** Serialize options used for the conformity round-trip. */
  serialize?: Adr2MdOptions;
  /**
   * Tiebreak anchor for an ambiguous document (no explicit marker, detector disagrees).
   * The web app passes the currently-open version; the VS Code extension lets it default.
   */
  preferredVersion?: MadrTemplateVersion;
  /** Force a version, skipping resolution. */
  version?: MadrTemplateVersion;
  /**
   * Treat 2.1.2 as the lenient fallback template that is never re-serialized, so its
   * conformity is left to the parser instead of a round-trip (VS Code extension behaviour).
   */
  trustClassicTemplate?: boolean;
}

export interface AdrDocumentAnalysis {
  /** Parsed record with `relevantFiles` and (when tracked) `parseErrors` already populated. */
  record: ArchitecturalDecisionRecord;
  /** The resolved (or forced) template version. */
  templateVersion: MadrTemplateVersion;
  /** Tags parsed from the metadata comment. */
  tags: Tag[];
  /** Round-trip conformity verdict (mirrors `record.conforming`). */
  conforming: boolean;
}

/** Removes the three adr-manager metadata comments (version, relevant files, tags). */
export function stripAdrManagerMetadata(md: string): string {
  return stripMadrVersionComment(stripRelevantFilesComment(stripTagComment(md)));
}

// Builds round-trip options that omit (rather than explicitly pass undefined for) the
// parse/serialize keys the caller didn't set, so exactOptionalPropertyTypes stays happy.
function conformityOptions(options: AnalyzeAdrOptions): MadrRoundTripOptions {
  return {
    ...(options.parse ? { parse: options.parse } : {}),
    ...(options.serialize ? { serialize: options.serialize } : {}),
    compare: matchesIgnoringFormatting
  };
}

/**
 * Resolves a document's template version: an explicit marker wins, otherwise the detector
 * decides, and a document that fits the preferred version (a basic ADR matching either
 * template) adopts the preferred version rather than the detector's classic fallback.
 */
export function resolveAdrTemplateVersion(md: string, options: AnalyzeAdrOptions = {}): MadrTemplateVersion {
  const explicit = parseMadrVersionFromMd(md);
  if (explicit) {
    return explicit;
  }
  const clean = stripAdrManagerMetadata(md);
  const detected = detectMadrVersion(clean);
  const preferred = options.preferredVersion ?? DEFAULT_MADR_VERSION;
  if (detected === preferred) {
    return detected;
  }
  const fitsPreferred = roundTripsMadr(clean, preferred, conformityOptions(options));
  return fitsPreferred ? preferred : detected;
}

/**
 * Parses an ADR document into a structured result: the record, its resolved template
 * version, its tags, and whether it conforms (round-trips without loss). Metadata comments
 * are stripped before parsing and the conformity check, so app-level fields never affect it.
 */
export function analyzeAdrDocument(md: string, options: AnalyzeAdrOptions = {}): AdrDocumentAnalysis {
  const version = options.version ?? resolveAdrTemplateVersion(md, options);
  const clean = stripAdrManagerMetadata(md);
  const record = parseMadr(clean, version, options.parse);
  record.relevantFiles = parseRelevantFilesFromMd(md);
  if (!(options.trustClassicTemplate && version === "2.1.2")) {
    record.conforming = roundTripsMadr(clean, version, conformityOptions(options));
  }
  return { record, templateVersion: version, tags: parseTagsFromMd(md), conforming: record.conforming };
}

/**
 * Re-writes a document into `version`, preserving the adr-manager metadata. The body is
 * parsed and re-serialized, then the relevant-files, tags and version comments are
 * re-injected so they survive the conversion.
 */
export function convertAdrDocument(
  md: string,
  version: MadrTemplateVersion,
  options: { parse?: Md2AdrOptions; serialize?: Adr2MdOptions; tags?: Tag[]; relevantFiles?: string[] } = {}
): string {
  const clean = stripAdrManagerMetadata(md);
  const serialized = serializeMadr(parseMadr(clean, version, options.parse), version, options.serialize);
  const withRelevantFiles = setRelevantFilesInMd(serialized, options.relevantFiles ?? []);
  const withTags = setTagsInMd(withRelevantFiles, options.tags ?? []);
  return setMadrVersionInMd(withTags, version);
}
