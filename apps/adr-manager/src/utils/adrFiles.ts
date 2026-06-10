import type { AdrFile } from "@/types/adr";
import type { Repository } from "@/plugins/classes";

export function sortedAdrs(repo: Repository): AdrFile[] {
    return [...repo.adrs].sort((a, b) => a.path.localeCompare(b.path));
}

export function fileLabel(file: AdrFile): string {
    return file.path.split("/").pop() ?? file.path;
}

export function isDirty(file: AdrFile): boolean {
    return file.originalMd !== file.editedMd;
}
