import {
  md2adr as coreMd2adr,
  adr2md as coreAdr2md,
  analyzeAdrDocument,
  convertAdrDocument,
  detectMadrVersion,
  DEFAULT_MADR_VERSION,
  resolveAdrTemplateVersion,
  serializeMadr,
  type ArchitecturalDecisionRecord,
  type Adr2MdOptions,
  type Md2AdrOptions,
  type MadrTemplateVersion,
  type Tag
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
  return resolveAdrTemplateVersion(md, { parse: PARSE_OPTIONS, serialize: SERIALIZE_OPTIONS });
}

export function parseAdr(
  md: string,
  version: MadrTemplateVersion = resolveMadrVersion(md)
): ArchitecturalDecisionRecord {
  return analyzeAdrDocument(md, {
    version,
    parse: PARSE_OPTIONS,
    serialize: SERIALIZE_OPTIONS,
    trustClassicTemplate: true
  }).record;
}

export function serializeAdr(adr: ArchitecturalDecisionRecord, version: MadrTemplateVersion): string {
  return serializeMadr(adr, version, SERIALIZE_OPTIONS);
}

/**
 * Re-writes a document into `version` using the extension's parse/serialize options, preserving
 * the adr-manager metadata (tags, relevant files, version marker). Backs the convert view.
 */
export function convertAdr(
  md: string,
  version: MadrTemplateVersion,
  options: { tags?: Tag[]; relevantFiles?: string[] } = {}
): string {
  return convertAdrDocument(md, version, {
    parse: PARSE_OPTIONS,
    serialize: SERIALIZE_OPTIONS,
    ...(options.tags ? { tags: options.tags } : {}),
    ...(options.relevantFiles ? { relevantFiles: options.relevantFiles } : {})
  });
}
