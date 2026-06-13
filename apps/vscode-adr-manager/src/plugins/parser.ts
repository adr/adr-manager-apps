import {
  md2adr as coreMd2adr,
  adr2md as coreAdr2md,
  md2adr400,
  adr2md400,
  detectMadrVersion,
  matchesIgnoringFormatting,
  stripTagComment,
  type ArchitecturalDecisionRecord,
  type MadrTemplateVersion
} from "@adr-manager/core";

export { detectMadrVersion };
export type { MadrTemplateVersion };

// The extension passes core's behaviour flags; see core's md2adr/adr2md option docs.
export function md2adr(md: string): ArchitecturalDecisionRecord {
  return coreMd2adr(md, { titleCase: true, stripBackticks: true, aggressiveCleanup: true, trackErrors: true });
}

export function adr2md(adr: ArchitecturalDecisionRecord): string {
  return coreAdr2md(adr, {
    emitYaml: true,
    titleCase: true,
    sanitizeChosenOption: true,
    stripBackticks: true,
    aggressiveCleanup: true
  });
}

/**
 * Parses a markdown document with the parser of its (detected) template version.
 * The 4.0.0 reader has no error listener, so conformance is judged by whether the
 * document round-trips through the writer.
 */
export function parseAdr(
  md: string,
  version: MadrTemplateVersion = detectMadrVersion(md)
): ArchitecturalDecisionRecord {
  // Strip the tag HTML comment before the ANTLR parser sees the markdown.
  // Without this, the comment text is captured as part of the last open-ended
  // field (typically the "because" explanation) when no section heading follows it.
  const cleanMd = stripTagComment(md);
  if (version === "4.0.0") {
    const adr = md2adr400(cleanMd);
    adr.conforming = matchesIgnoringFormatting(cleanMd, adr2md400(adr));
    return adr;
  }
  return md2adr(cleanMd);
}

export function serializeAdr(adr: ArchitecturalDecisionRecord, version: MadrTemplateVersion): string {
  return version === "4.0.0" ? adr2md400(adr) : adr2md(adr);
}
