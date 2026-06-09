import { md2adr as coreMd2adr, adr2md as coreAdr2md, type ArchitecturalDecisionRecord } from "@adr-manager/core";

/**
 * Parses Markdown into an ADR using the VS Code extension's behaviour: title-cased headings,
 * backtick stripping, aggressive clean-up, and syntax-error tracking (sets `conforming`/`parseErrors`).
 */
export function md2adr(md: string): ArchitecturalDecisionRecord {
  return coreMd2adr(md, { titleCase: true, stripBackticks: true, aggressiveCleanup: true, trackErrors: true });
}

/**
 * Serializes an ADR to Markdown using the VS Code extension's behaviour: YAML front-matter,
 * title-cased heading, sanitized chosen option, backtick stripping, and aggressive clean-up.
 */
export function adr2md(adr: ArchitecturalDecisionRecord): string {
  return coreAdr2md(adr, {
    emitYaml: true,
    titleCase: true,
    sanitizeChosenOption: true,
    stripBackticks: true,
    aggressiveCleanup: true
  });
}
