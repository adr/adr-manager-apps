import axios from "axios";
import { BASE_URL_REPO } from "./config";
import { apiContext } from "./context";
import { request } from "./request";
import type { GitHubBranch, GitHubCommitAuthor, GitHubRef, GitHubShaResponse, GitHubTreeInput } from "@/types/github";

export async function getCommitSha(): Promise<GitHubBranch | undefined> {
    const { repoOwner, repoName, branch } = apiContext();
    return request(axios.get<GitHubBranch>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/branches/${branch}`));
}

export async function createBlobs(file: string): Promise<GitHubShaResponse | undefined> {
    const { repoOwner, repoName } = apiContext();
    return request(
        axios.post<GitHubShaResponse>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/git/blobs`, {
            content: file,
            encoding: "utf-8"
        })
    );
}

export async function createFileTree(
    lastCommitSha: string,
    folderTree: GitHubTreeInput[]
): Promise<GitHubShaResponse | undefined> {
    const { repoOwner, repoName } = apiContext();
    return request(
        axios.post<GitHubShaResponse>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/git/trees`, {
            base_tree: lastCommitSha,
            tree: folderTree
        })
    );
}

export async function createCommit(
    commitMessage: string,
    authorInfos: GitHubCommitAuthor,
    lastCommitSha: string,
    treeSha: string
): Promise<GitHubShaResponse | undefined> {
    const { repoOwner, repoName } = apiContext();
    return request(
        axios.post<GitHubShaResponse>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/git/commits`, {
            message: commitMessage,
            author: authorInfos,
            parents: [lastCommitSha],
            tree: treeSha
        })
    );
}

export async function pushToGitHub(newCommitSha: string): Promise<GitHubRef | undefined> {
    const { repoOwner, repoName, branch } = apiContext();
    return request(
        axios.post<GitHubRef>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/git/refs/heads/${branch}`, {
            ref: "refs/heads/" + branch,
            sha: newCommitSha
        })
    );
}
