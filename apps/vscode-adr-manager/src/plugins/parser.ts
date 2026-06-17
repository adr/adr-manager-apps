import {
  md2adr as coreMd2adr,
  adr2md as coreAdr2md,
  detectMadrVersion,
  matchesIgnoringFormatting,
  parseMadr,
  roundTripsMadr,
  serializeMadr,
  stripTagComment,
  type ArchitecturalDecisionRecord,
  type Adr2MdOptions,
  type Md2AdrOptions,
  type MadrTemplateVersion
} from "@adr-manager/core";

export { detectMadrVersion };
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

export function parseAdr(
  md: string,
  version: MadrTemplateVersion = detectMadrVersion(md)
): ArchitecturalDecisionRecord {
  const cleanMd = stripTagComment(md);
  const adr = parseMadr(cleanMd, version, PARSE_OPTIONS);
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
