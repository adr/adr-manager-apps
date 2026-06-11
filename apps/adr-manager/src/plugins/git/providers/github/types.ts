/**
 * Minimal typings for the GitHub REST responses the provider actually reads.
 */

export interface GitHubUser {
    login: string;
    name: string | null;
}

export interface GitHubEmail {
    email: string;
    primary: boolean;
    verified: boolean;
    visibility: string | null;
}

export interface GitHubBranch {
    name: string;
    commit: { sha: string };
}

export interface GitHubRepoSummary {
    full_name: string;
    default_branch: string;
    description: string | null;
    updated_at: string;
}

export interface GitHubTreeEntry {
    path: string;
    mode: string;
    type: "blob" | "tree";
    sha: string;
}

export interface GitHubFileTree {
    tree: GitHubTreeEntry[];
}

export interface GitHubContent {
    content: string;
    encoding: string;
}

export interface GitHubShaResponse {
    sha: string;
}

export interface GitHubRef {
    ref: string;
    object: { sha: string };
}

/** A single entry in the tree sent when creating a commit (`sha: null` deletes a file). */
export interface GitHubTreeInput {
    path: string;
    mode: string;
    type: "blob";
    sha: string | null;
}
