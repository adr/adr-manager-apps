import {
  md2adr as coreMd2adr,
  adr2md as coreAdr2md,
  detectMadrVersion,
  DEFAULT_MADR_VERSION,
  matchesIgnoringFormatting,
  parseMadr,
  parseMadrVersionFromMd,
  parseRelevantFilesFromMd,
  roundTripsMadr,
  serializeMadr,
  stripMadrVersionComment,
  stripRelevantFilesComment,
  stripTagComment,
  type ArchitecturalDecisionRecord,
  type Adr2MdOptions,
  type Md2AdrOptions,
  type MadrTemplateVersion
} from "@adr-manager/core";

export { detectMadrVersion, DEFAULT_MADR_VERSION };
export type { MadrTemplateVersion };

const PARSE_OPTIONS = {
  titleCase: true,
  stripBackticks: true,
  aggressiveCleanup: true,
  trackErrors: true
} satisfies Md2AdrOptions;

const SERIALIZE_OPTIONS = {
  emitYaml: true,
  titleCase: true,
  sanitizeChosenOption: true,
  stripBackticks: true,
  aggressiveCleanup: true
} satisfies Adr2MdOptions;

export function md2adr(md: string): ArchitecturalDecisionRecord {
  return coreMd2adr(md, PARSE_OPTIONS);
}

export function adr2md(adr: ArchitecturalDecisionRecord): string {
  return coreAdr2md(adr, SERIALIZE_OPTIONS);
}

/**
 * Resolves the template version of a stored ADR. An explicit marker wins; otherwise the
 * version is detected from the content. A document that can't be classified (a basic ADR
 * fitting either template) round-trips under the default version, so it adopts the default
 * rather than the detector's classic fallback.
 */
export function resolveMadrVersion(md: string): MadrTemplateVersion {
  const explicit = parseMadrVersionFromMd(md);
  if (explicit) {
    return explicit;
  }
  const cleanMd = stripAdrManagerMetadata(md);
  const detected = detectMadrVersion(cleanMd);
  if (detected === DEFAULT_MADR_VERSION) {
    return detected;
  }
  const fitsDefault = roundTripsMadr(cleanMd, DEFAULT_MADR_VERSION, {
    parse: PARSE_OPTIONS,
    serialize: SERIALIZE_OPTIONS,
    compare: matchesIgnoringFormatting
  });
  return fitsDefault ? DEFAULT_MADR_VERSION : detected;
}

export function parseAdr(
  md: string,
  version: MadrTemplateVersion = resolveMadrVersion(md)
): ArchitecturalDecisionRecord {
  const cleanMd = stripAdrManagerMetadata(md);
  const adr = parseMadr(cleanMd, version, PARSE_OPTIONS);
  adr.relevantFiles = parseRelevantFilesFromMd(md);
  if (version !== "2.1.2") {
    adr.conforming = roundTripsMadr(cleanMd, version, {
      parse: PARSE_OPTIONS,
      serialize: SERIALIZE_OPTIONS,
      compare: matchesIgnoringFormatting
    });
  }
  return adr;
}

export function serializeAdr(adr: ArchitecturalDecisionRecord, version: MadrTemplateVersion): string {
  return serializeMadr(adr, version, SERIALIZE_OPTIONS);
}

function stripAdrManagerMetadata(md: string): string {
  return stripMadrVersionComment(stripRelevantFilesComment(stripTagComment(md)));
}
