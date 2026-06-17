const RELEVANT_FILES_RE = /\n?<!-- adr-manager-relevant-files: (.+?) -->/;

export function parseRelevantFilesFromMd(md: string): string[] {
  const match = RELEVANT_FILES_RE.exec(md);
  if (!match?.[1]) return [];
  try {
    const parsed = JSON.parse(match[1]) as unknown;
    return Array.isArray(parsed) ? parsed.filter((file): file is string => typeof file === "string") : [];
  } catch {
    return [];
  }
}

export function stripRelevantFilesComment(md: string): string {
  return md.replace(RELEVANT_FILES_RE, "");
}

export function setRelevantFilesInMd(md: string, relevantFiles: string[]): string {
  const base = stripRelevantFilesComment(md);
  if (relevantFiles.length === 0) return base;
  return `${base}\n<!-- adr-manager-relevant-files: ${JSON.stringify(relevantFiles)} -->`;
}
