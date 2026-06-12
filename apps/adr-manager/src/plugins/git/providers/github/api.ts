import axios from "axios";
import { request } from "../../request";
import type { Branch, CommitAuthor, RepoPage, RepoSummary, UserInfo } from "@/types/git";
import type {
    GitHubBranch,
    GitHubContent,
    GitHubEmail,
    GitHubFileTree,
    GitHubRef,
    GitHubRepoSummary,
    GitHubShaResponse,
    GitHubTreeInput,
    GitHubUser
} from "./types";

const BASE_URL_USER = "https://api.github.com/user";
const BASE_URL_REPO = "https://api.github.com/repos";

function toRepoSummary(repo: GitHubRepoSummary): RepoSummary {
    return {
        fullName: repo.full_name,
        defaultBranch: repo.default_branch,
        description: repo.description,
        updatedAt: repo.updated_at
    };
}

export async function listRepositories(page: number, perPage: number): Promise<RepoPage> {
    const response = await axios.get<GitHubRepoSummary[]>(
        `${BASE_URL_USER}/repos?sort=updated&direction=desc&page=${page}&per_page=${perPage}`
    );
    return {
        repositories: (response.data ?? []).map(toRepoSummary),
        totalPages: lastPageFromLinkHeader(response.headers["link"]) ?? page
    };
}

/** GitHub reports the page count only via the Link header, which omits rel="last" on the last page. */
function lastPageFromLinkHeader(link: unknown): number | undefined {
    if (typeof link !== "string") {
        return undefined;
    }
    const match = /[?&]page=(\d+)[^>]*>;\s*rel="last"/.exec(link);
    return match?.[1] ? Number(match[1]) : undefined;
}

export async function searchRepositories(query: string, maxResults: number): Promise<RepoSummary[]> {
    const results: RepoSummary[] = [];
    let page = 1;
    const perPage = 100;

    // GitHub has no name filter on /user/repos, so pages are filtered client-side.
    let hasNextPage = true;
    while (results.length < maxResults && hasNextPage) {
        try {
            const { repositories, totalPages } = await listRepositories(page, perPage);
            for (const repo of repositories) {
                if (results.length < maxResults && repo.fullName.includes(query)) {
                    results.push(repo);
                }
            }
            hasNextPage = totalPages !== undefined && page < totalPages;
        } catch {
            hasNextPage = false;
        }
        page++;
    }
    return results;
}

export async function listBranches(repoFullName: string): Promise<Branch[]> {
    const response = await axios.get<GitHubBranch[]>(`${BASE_URL_REPO}/${repoFullName}/branches?per_page=999`);
    return response.data;
}

export async function listFiles(repoFullName: string, branch: string): Promise<string[]> {
    try {
        const response = await axios.get<GitHubFileTree>(
            `${BASE_URL_REPO}/${repoFullName}/git/trees/${branch}?recursive=1`
        );
        return response.data.tree.filter((entry) => entry.type === "blob").map((entry) => entry.path);
    } catch (error) {
        // An empty repository answers 409 "Git Repository is empty".
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            return [];
        }
        throw error;
    }
}

export async function readFile(repoFullName: string, branch: string, filePath: string): Promise<string | undefined> {
    const content = await request(
        axios.get<GitHubContent>(`${BASE_URL_REPO}/${repoFullName}/contents/${filePath}?ref=${branch}`)
    );
    return content ? decodeUnicode(content.content) : undefined;
}

function decodeUnicode(str: string): string {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(
        atob(str)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
    );
}

export async function getUser(): Promise<UserInfo | undefined> {
    const user = await request(axios.get<GitHubUser>(BASE_URL_USER));
    if (!user) {
        return undefined;
    }
    const emails = await request(axios.get<GitHubEmail[]>(`${BASE_URL_USER}/public_emails`));
    const email = (emails?.find((entry) => entry.primary) ?? emails?.[0])?.email ?? "";
    return { username: user.login, displayName: user.name ?? user.login, email };
}

export async function getLastCommit(repoFullName: string, branch: string): Promise<GitHubBranch | undefined> {
    return request(axios.get<GitHubBranch>(`${BASE_URL_REPO}/${repoFullName}/branches/${branch}`));
}

export async function createBlob(repoFullName: string, content: string): Promise<GitHubShaResponse | undefined> {
    return request(
        axios.post<GitHubShaResponse>(`${BASE_URL_REPO}/${repoFullName}/git/blobs`, {
            content,
            encoding: "utf-8"
        })
    );
}

export async function createTree(
    repoFullName: string,
    baseTreeSha: string,
    tree: GitHubTreeInput[]
): Promise<GitHubShaResponse | undefined> {
    return request(
        axios.post<GitHubShaResponse>(`${BASE_URL_REPO}/${repoFullName}/git/trees`, {
            base_tree: baseTreeSha,
            tree
        })
    );
}

export async function createCommit(
    repoFullName: string,
    message: string,
    author: CommitAuthor,
    parentSha: string,
    treeSha: string
): Promise<GitHubShaResponse | undefined> {
    return request(
        axios.post<GitHubShaResponse>(`${BASE_URL_REPO}/${repoFullName}/git/commits`, {
            message,
            author,
            parents: [parentSha],
            tree: treeSha
        })
    );
}

export async function updateBranchRef(
    repoFullName: string,
    branch: string,
    commitSha: string
): Promise<GitHubRef | undefined> {
    return request(
        axios.post<GitHubRef>(`${BASE_URL_REPO}/${repoFullName}/git/refs/heads/${branch}`, {
            ref: "refs/heads/" + branch,
            sha: commitSha
        })
    );
}
