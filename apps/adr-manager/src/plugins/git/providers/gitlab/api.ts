import axios from "axios";
import type { AxiosInstance } from "axios";
import { attachAuthInterceptors } from "./auth";
import { gitlabBaseUrl } from "./config";
import type { Branch, CommitInput, RepoSummary, UserInfo } from "@/types/git";
import type { GitLabBranch, GitLabCommitAction, GitLabProject, GitLabTreeItem, GitLabUser } from "./types";

// Backstop against pathological repositories: 200 pages of 100 entries each.
const MAX_PAGES = 200;

let http: AxiosInstance | null = null;
let httpBaseUrl = "";

/** Dedicated instance so the GitLab token and base URL never touch the global axios defaults. */
function gitlabHttp(): AxiosInstance {
    const baseUrl = gitlabBaseUrl();
    if (!http || httpBaseUrl !== baseUrl) {
        http = axios.create({ baseURL: `${baseUrl}/api/v4` });
        httpBaseUrl = baseUrl;
        attachAuthInterceptors(http);
    }
    return http;
}

/** GitLab addresses projects by URL-encoded full path, slashes included. */
function projectId(repoFullName: string): string {
    return encodeURIComponent(repoFullName);
}

/**
 * Follows offset pagination via the x-next-page header (empty on the last page).
 * x-total-pages is not used: gitlab.com omits it for collections beyond 10k items.
 */
async function fetchAllPages<T>(url: string, params: Record<string, string | number | boolean> = {}): Promise<T[]> {
    const instance = gitlabHttp();
    const all: T[] = [];
    let page = "1";
    let fetchedPages = 0;
    while (page && fetchedPages < MAX_PAGES) {
        const response = await instance.get<T[]>(url, { params: { ...params, per_page: 100, page } });
        all.push(...response.data);
        page = String(response.headers["x-next-page"] ?? "");
        fetchedPages++;
    }
    if (page) {
        console.warn(`GitLab pagination stopped after ${MAX_PAGES} pages for ${url}; results are truncated.`);
    }
    return all;
}

function toRepoSummary(project: GitLabProject): RepoSummary {
    return {
        fullName: project.path_with_namespace,
        defaultBranch: project.default_branch ?? "main",
        description: project.description,
        updatedAt: project.last_activity_at
    };
}

export async function listRepositories(page: number, perPage: number): Promise<RepoSummary[]> {
    const response = await gitlabHttp().get<GitLabProject[]>("/projects", {
        params: {
            membership: true,
            order_by: "last_activity_at",
            sort: "desc",
            simple: true,
            page,
            per_page: perPage
        }
    });
    return response.data.map(toRepoSummary);
}

export async function searchRepositories(query: string, maxResults: number): Promise<RepoSummary[]> {
    try {
        const response = await gitlabHttp().get<GitLabProject[]>("/projects", {
            params: {
                membership: true,
                order_by: "last_activity_at",
                sort: "desc",
                simple: true,
                search: query,
                // Make "group/project"-style queries match the namespace path too.
                search_namespaces: true,
                page: 1,
                per_page: Math.min(maxResults, 100)
            }
        });
        return response.data.map(toRepoSummary);
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function listBranches(repoFullName: string): Promise<Branch[] | undefined> {
    try {
        const branches = await fetchAllPages<GitLabBranch>(`/projects/${projectId(repoFullName)}/repository/branches`);
        return branches.map((branch) => ({ name: branch.name, commit: { sha: branch.commit.id } }));
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export async function listFiles(repoFullName: string, branch: string): Promise<string[] | undefined> {
    try {
        const tree = await fetchAllPages<GitLabTreeItem>(`/projects/${projectId(repoFullName)}/repository/tree`, {
            recursive: true,
            ref: branch
        });
        return tree.filter((item) => item.type === "blob").map((item) => item.path);
    } catch (error) {
        // An empty repository or unknown ref answers 404 ("Tree Not Found").
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return [];
        }
        console.error(error);
        return undefined;
    }
}

export async function readFile(repoFullName: string, branch: string, filePath: string): Promise<string | undefined> {
    try {
        const response = await gitlabHttp().get<string>(
            `/projects/${projectId(repoFullName)}/repository/files/${encodeURIComponent(filePath)}/raw`,
            {
                params: { ref: branch },
                responseType: "text",
                // Keep JSON-looking file contents as the raw string instead of a parsed object.
                transformResponse: [(data: string) => data]
            }
        );
        return response.data;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export async function getUser(): Promise<UserInfo | undefined> {
    try {
        const { data } = await gitlabHttp().get<GitLabUser>("/user");
        const host = new URL(gitlabBaseUrl()).host;
        // commit_email already honors the user's "private commit email" preference.
        const email = data.commit_email ?? data.email ?? `${data.id}-${data.username}@users.noreply.${host}`;
        return { username: data.username, displayName: data.name ?? data.username, email };
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export async function commitFiles({ repoFullName, branch, message, author, changes }: CommitInput): Promise<void> {
    const actions: GitLabCommitAction[] = changes.map((change) => ({
        action: change.action,
        file_path: change.path,
        ...(change.action !== "delete" && { content: change.content })
    }));
    try {
        await gitlabHttp().post(`/projects/${projectId(repoFullName)}/repository/commits`, {
            branch,
            commit_message: message,
            ...(author.name && { author_name: author.name }),
            ...(author.email && { author_email: author.email }),
            actions
        });
    } catch (error) {
        throw new Error(commitErrorMessage(error), { cause: error });
    }
}

function commitErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string } | undefined)?.message;
        if (message) {
            return `Could not push the commit: ${message}`;
        }
    }
    return "Could not push the commit.";
}
