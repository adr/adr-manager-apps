import { commitFiles, getUser, listBranches, listFiles, listRepositories, readFile, searchRepositories } from "./api";
import { beginAuthorizeRedirect, completeOAuthCallback, loadTokens, signOutGitLab } from "./auth";
import type { GitProvider } from "../../provider";

export const gitlabProvider: GitProvider = {
    id: "gitlab",

    // GitLab commits through one atomic API call, so no consistency cooldown is needed.
    commitCooldownMs: 0,

    async signIn() {
        await beginAuthorizeRedirect();
    },

    completeSignIn: completeOAuthCallback,

    signOut() {
        signOutGitLab();
    },

    isAuthenticated() {
        return loadTokens() !== null;
    },

    restoreSession() {
        // Tokens are injected per request by the auth interceptor; nothing to apply globally.
    },

    getUser,
    listRepositories,
    searchRepositories,
    listBranches,
    listFiles,
    readFile,
    commitFiles
};
