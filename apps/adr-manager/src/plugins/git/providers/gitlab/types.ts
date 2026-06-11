/**
 * Minimal typings for the GitLab REST v4 responses the provider actually reads.
 */

export interface GitLabProject {
    path_with_namespace: string;
    default_branch: string | null;
    description: string | null;
    last_activity_at: string;
}

export interface GitLabBranch {
    name: string;
    commit: { id: string };
}

export interface GitLabTreeItem {
    id: string;
    name: string;
    type: "tree" | "blob";
    path: string;
    mode: string;
}

export interface GitLabUser {
    id: number;
    username: string;
    name: string | null;
    email: string | null;
    commit_email: string | null;
}

export interface GitLabTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    created_at: number;
}

/** One file operation in a commit payload (`content` is omitted for deletes). */
export interface GitLabCommitAction {
    action: "create" | "update" | "delete";
    file_path: string;
    content?: string;
}
