import type { AdrFile } from "./adr";

/** A git branch as seen by the app (GitHub branch objects carry `commit.sha`). */
export interface Branch {
    name: string;
    commit?: { sha: string };
}

export interface RepositoryInit {
    fullName?: string;
    activeBranch?: string;
    branches?: Branch[];
    adrs?: AdrFile[];
    adrPath?: string;
}

/** The full repository shape as persisted in localStorage (what `constructFromString` parses). */
export interface StoredRepository {
    fullName: string;
    activeBranch: string;
    branches: Branch[];
    adrPath: string;
    adrs: AdrFile[];
    addedAdrs: AdrFile[];
    deletedAdrs: AdrFile[];
}

export interface RepositoryChanges {
    added: AdrFile[];
    changed: AdrFile[];
    deleted: AdrFile[];
}
