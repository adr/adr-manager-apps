import { lsGet, lsSet } from "@/plugins/storage";
import {
    createBlob,
    createCommit,
    createTree,
    getLastCommit,
    getUser,
    listBranches,
    listFiles,
    listRepositories,
    readFile,
    searchRepositories,
    updateBranchRef
} from "./api";
import { applyAuthHeader, clearSession, signInWithGitHubPopup } from "./auth";
import { encodeFilePath } from "../../paths";
import type { GitProvider } from "../../provider";
import type { GitHubTreeInput } from "./types";

export const githubProvider: GitProvider = {
    id: "github",

    // GitHub needs ~a minute before the new commit sha is consistently readable, so a push
    // within that window risks overwriting the previous one with an outdated parent sha.
    commitCooldownMs: 60000,

    async signIn() {
        await signInWithGitHubPopup();
        lsSet("gitProvider", "github");
    },

    async completeSignIn() {
        return false;
    },

    async signOut() {
        await clearSession();
    },

    isAuthenticated() {
        return lsGet("authId") !== null;
    },

    restoreSession() {
        applyAuthHeader();
    },

    getUser,
    listRepositories,
    searchRepositories,
    listBranches,
    listFiles,
    readFile,

    fileWebUrl(repoFullName, branch, filePath) {
        return `https://github.com/${repoFullName}/blob/${encodeFilePath(branch)}/${encodeFilePath(filePath)}`;
    },

    async commitFiles({ repoFullName, branch, message, author, changes }) {
        const lastCommit = await getLastCommit(repoFullName, branch);
        if (!lastCommit) {
            throw new Error("Could not load the latest commit.");
        }

        const tree: GitHubTreeInput[] = await Promise.all(
            changes
                .filter((change) => change.action !== "delete")
                .map(async (change) => {
                    const blob = await createBlob(repoFullName, change.content);
                    if (!blob) {
                        throw new Error(`Could not create blob for ${change.path}.`);
                    }
                    return { path: change.path, mode: "100644", type: "blob" as const, sha: blob.sha };
                })
        );
        for (const change of changes) {
            if (change.action === "delete") {
                tree.push({ path: change.path, mode: "100644", type: "blob", sha: null });
            }
        }

        const newTree = await createTree(repoFullName, lastCommit.commit.sha, tree);
        if (!newTree) {
            throw new Error("Could not create the file tree.");
        }

        const commit = await createCommit(repoFullName, message, author, lastCommit.commit.sha, newTree.sha);
        if (!commit) {
            throw new Error("Could not create the commit.");
        }

        const pushedRef = await updateBranchRef(repoFullName, branch, commit.sha);
        if (!pushedRef) {
            throw new Error("Could not push the commit.");
        }
    }
};
