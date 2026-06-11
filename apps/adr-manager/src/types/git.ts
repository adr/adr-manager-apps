/**
 * Provider-neutral domain types shared by all git provider implementations.
 * Provider-specific wire types live next to each implementation.
 */

export type GitProviderId = "github" | "gitlab";

export interface RepoSummary {
    /** Opaque identifier, may contain more than one slash (GitLab subgroups). */
    fullName: string;
    defaultBranch: string;
    description: string | null;
    updatedAt: string;
}

export interface UserInfo {
    username: string;
    /** Falls back to the username when the provider has no display name. */
    displayName: string;
    /** Empty string when the provider exposes no usable email. */
    email: string;
}

export interface CommitAuthor {
    name: string;
    email: string;
}

export type FileChangeAction = "create" | "update" | "delete";

export interface FileChange {
    action: FileChangeAction;
    path: string;
    /** Empty string for deletes. */
    content: string;
}

export interface CommitInput {
    repoFullName: string;
    branch: string;
    message: string;
    author: CommitAuthor;
    changes: FileChange[];
}

export type { Branch } from "./repository";
