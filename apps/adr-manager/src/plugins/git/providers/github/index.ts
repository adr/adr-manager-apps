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
import { clearSession, signInWithGitHubPopup } from "./auth";
import { encodeFilePath } from "../../paths";
import type { GitProvider } from "../../provider";
import type { GitHubTreeInput } from "./types";

const lastPushByBranch = new Map<string, { parent: string; head: string }>();

function pushKey(repoFullName: string, branch: string): string {
    return `${repoFullName}#${branch}`;
}

export const githubProvider: GitProvider = {
    id: "github",

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
        // Tokens are injected per request by the auth interceptor; nothing to apply globally.
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

        const tipSha = lastCommit.commit.sha;
        const cached = lastPushByBranch.get(pushKey(repoFullName, branch));
        // A reported tip equal to our previous parent means GitHub's replica lags, so build on the commit we pushed.
        const parentSha = cached && tipSha === cached.parent ? cached.head : tipSha;

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

        const newTree = await createTree(repoFullName, parentSha, tree);
        if (!newTree) {
            throw new Error("Could not create the file tree.");
        }

        const commit = await createCommit(repoFullName, message, author, parentSha, newTree.sha);
        if (!commit) {
            throw new Error("Could not create the commit.");
        }

        const pushedRef = await updateBranchRef(repoFullName, branch, commit.sha);
        if (!pushedRef) {
            throw new Error("Could not push the commit.");
        }

        lastPushByBranch.set(pushKey(repoFullName, branch), { parent: parentSha, head: commit.sha });
    }
};
