import type { AdrFile } from "@/types/adr";
import type { Branch, RepositoryInit, RepositoryChanges, StoredRepository } from "@/types/repository";

// The ADR domain model and short-title helper now live in the shared core package.
export { ArchitecturalDecisionRecord, createShortTitle } from "@adr-manager/core";

export class Repository {
    fullName: string;
    activeBranch: string;
    branches: Branch[];
    adrs: AdrFile[];
    adrPath: string;
    addedAdrs: AdrFile[];
    deletedAdrs: AdrFile[];

    constructor({ fullName, activeBranch, branches, adrs, adrPath }: RepositoryInit = {}) {
        if (adrs && adrs.length > 0 && !adrPath) {
            console.warn("There are ADRs but no adr path is given. ADRs:", adrs, " ADR path:", adrPath);
        }
        this.fullName = fullName ?? "";
        this.activeBranch = activeBranch ?? "";
        this.branches = branches ?? [];
        this.adrs = adrs ?? [];
        this.adrPath = adrPath || "docs/decisions/";
        this.addedAdrs = [];
        this.deletedAdrs = [];
    }

    static constructFromString(json: string): Repository {
        // JSON.parse returns `any`; the caller validates structure via isValidRepoList first.
        const repoData: StoredRepository = JSON.parse(json);
        const repo = new Repository(repoData);
        repoData.addedAdrs.forEach((adr) => {
            const equalAdr = repoData.adrs.find(
                (el) => el.path === adr.path && el.editedMd === adr.editedMd && el.originalMd === adr.originalMd
            );
            if (equalAdr) {
                repo.addedAdrs.push(equalAdr);
            } else {
                throw new Error("There was an added adr in the parameter string that didn't match!");
            }
        });
        return repo;
    }

    getChanges(): RepositoryChanges {
        return {
            added: this.addedAdrs,
            changed: this.adrs.filter((adr) => adr.originalMd !== adr.editedMd && !this.addedAdrs.includes(adr)),
            deleted: this.deletedAdrs
        };
    }

    hasChanges(): boolean {
        const changes = this.getChanges();
        return changes.changed.length !== 0 || changes.added.length !== 0 || changes.deleted.length !== 0;
    }

    addAdr(newAdr: AdrFile): void {
        this.adrs.push(newAdr);
        this.addedAdrs.push(newAdr);
    }
}

/**
 * Type guard: checks the minimal shape of a persisted ADR file (originalMd, editedMd, path).
 */
export function isValidAdr(adr: unknown): adr is AdrFile {
    return typeof adr === "object" && adr !== null && "originalMd" in adr && "editedMd" in adr && "path" in adr;
}

/**
 * Type guard for an array of persisted repositories (as loaded from localStorage).
 * Each repo must have the bookkeeping arrays and every contained ADR must be valid.
 */
export function isValidRepoList(repos: unknown): repos is StoredRepository[] {
    return (
        Array.isArray(repos) &&
        repos.every((repo) => {
            const valid =
                typeof repo === "object" &&
                repo !== null &&
                "fullName" in repo &&
                "activeBranch" in repo &&
                "branches" in repo &&
                "addedAdrs" in repo &&
                "deletedAdrs" in repo &&
                "adrs" in repo &&
                Array.isArray(repo.adrs) &&
                repo.adrs.every(isValidAdr);
            if (!valid) {
                console.log("Invalid repository", repo);
            }
            return valid;
        })
    );
}
