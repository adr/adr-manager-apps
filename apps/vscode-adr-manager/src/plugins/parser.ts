import { md2adr as coreMd2adr, adr2md as coreAdr2md, type ArchitecturalDecisionRecord } from "@adr-manager/core";

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
