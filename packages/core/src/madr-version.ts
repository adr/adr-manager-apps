import { MADR_TEMPLATE_ADAPTERS } from "./templates";
import type { MadrTemplateVersion } from "./types";

/**
 * A basic ADR that only uses the sections both templates share is indistinguishable
 * between MADR versions from its markdown alone, so the chosen version is pinned in an
 * HTML comment (committed to git, like tags and relevant files).
 */
const MADR_VERSION_RE = /\n?<!-- adr-manager-madr-version: "(.+?)" -->/;

function isMadrTemplateVersion(value: string): value is MadrTemplateVersion {
  return MADR_TEMPLATE_ADAPTERS.some((adapter) => adapter.version === value);
}

export function parseMadrVersionFromMd(md: string): MadrTemplateVersion | undefined {
  const value = MADR_VERSION_RE.exec(md)?.[1];
  return value !== undefined && isMadrTemplateVersion(value) ? value : undefined;
}

export function stripMadrVersionComment(md: string): string {
  return md.replace(MADR_VERSION_RE, "");
}

export function setMadrVersionInMd(md: string, version: MadrTemplateVersion): string {
  return `${stripMadrVersionComment(md)}\n<!-- adr-manager-madr-version: "${version}" -->`;
}
