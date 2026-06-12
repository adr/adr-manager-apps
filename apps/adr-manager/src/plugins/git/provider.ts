import type { Branch, CommitInput, GitProviderId, RepoPage, RepoSummary, UserInfo } from "@/types/git";

/**
 * A git hosting provider behind which all host-specific API calls live.
 * Implementations must not leak provider wire types through these methods.
 */
export interface GitProvider {
    readonly id: GitProviderId;

    /** How long the UI should block a follow-up push after a commit. */
    readonly commitCooldownMs: number;

    /**
     * Starts interactive sign-in. May resolve after a popup (GitHub) or navigate
     * away for a redirect flow and never resolve (GitLab).
     */
    signIn(): Promise<void>;

    /** Completes a redirect-based sign-in on app boot. Returns true if a session was established. */
    completeSignIn(): Promise<boolean>;

    signOut(): void;

    /** Synchronous token presence check, used by the router guard. */
    isAuthenticated(): boolean;

    /** Re-applies the persisted token to the HTTP layer at startup. */
    restoreSession(): void;

    getUser(): Promise<UserInfo | undefined>;

    /** One page of the user's repositories, newest activity first. Throws on HTTP error. */
    listRepositories(page: number, perPage: number): Promise<RepoPage>;

    /** Repositories matching `query`, capped at maxResults. Never throws. */
    searchRepositories(query: string, maxResults: number): Promise<RepoSummary[]>;

    /** All branches of the repository. Throws on HTTP error. */
    listBranches(repoFullName: string): Promise<Branch[]>;

    /**
     * All file (blob) paths in the repository at the given branch, recursive.
     * Returns [] for an empty repository, throws on any other HTTP error.
     */
    listFiles(repoFullName: string, branch: string): Promise<string[]>;

    /** Decoded UTF-8 file content, or undefined on failure. */
    readFile(repoFullName: string, branch: string, filePath: string): Promise<string | undefined>;

    /** Commits all changes as one commit on the branch. Throws an Error with a user-facing message. */
    commitFiles(input: CommitInput): Promise<void>;
}
