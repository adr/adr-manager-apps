import axios from "axios";
import { Repository } from "@/plugins/classes";
import { BASE_URL_REPO, BASE_URL_USER } from "@/plugins/apiConfig/config";
import type { AdrFile } from "@/types/adr";
import type {
    GitHubBranch,
    GitHubCommitAuthor,
    GitHubContent,
    GitHubEmail,
    GitHubFileTree,
    GitHubRef,
    GitHubRepoSummary,
    GitHubShaResponse,
    GitHubTreeEntry,
    GitHubTreeInput,
    GitHubUser
} from "@/types/github";

let repoOwner = "";
let repoName = "";
let branch = "";

export function setInfosForApi(currRepoOwner: string, currRepoName: string, currBranch: string): void {
    repoName = currRepoName;
    repoOwner = currRepoOwner;
    branch = currBranch;
}

export async function getUserEmail(): Promise<GitHubEmail[] | undefined> {
    return axios
        .get<GitHubEmail[]>(`${BASE_URL_USER}/public_emails`)
        .then((response) => response.data)
        .catch((err) => {
            console.log(err);
            return undefined;
        });
}

export async function getUserName(): Promise<GitHubUser | undefined> {
    return axios
        .get<GitHubUser>(BASE_URL_USER)
        .then((response) => response.data)
        .catch((err) => {
            console.log(err);
            return undefined;
        });
}

export async function getCommitSha(): Promise<GitHubBranch | undefined> {
    return axios
        .get<GitHubBranch>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/branches/${branch}`)
        .then((response) => response.data)
        .catch((err) => {
            console.log(err);
            return undefined;
        });
}

export async function createBlobs(file: string): Promise<GitHubShaResponse | undefined> {
    return axios
        .post<GitHubShaResponse>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/git/blobs`, {
            content: file,
            encoding: "utf-8"
        })
        .then((response) => response.data)
        .catch((err) => {
            console.log(err);
            return undefined;
        });
}

export async function createFileTree(
    lastCommitSha: string,
    folderTree: GitHubTreeInput[]
): Promise<GitHubShaResponse | undefined> {
    return axios
        .post<GitHubShaResponse>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/git/trees`, {
            base_tree: lastCommitSha,
            tree: folderTree
        })
        .then((response) => response.data)
        .catch((err) => {
            console.log(err);
            return undefined;
        });
}

export async function createCommit(
    commitMessage: string,
    authorInfos: GitHubCommitAuthor,
    lastCommitSha: string,
    treeSha: string
): Promise<GitHubShaResponse | undefined> {
    return axios
        .post<GitHubShaResponse>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/git/commits`, {
            message: commitMessage,
            author: authorInfos,
            parents: [lastCommitSha],
            tree: treeSha
        })
        .then((response) => response.data)
        .catch((err) => {
            console.log(err);
            return undefined;
        });
}

export async function pushToGitHub(newCommitSha: string): Promise<GitHubRef | undefined> {
    return axios
        .post<GitHubRef>(`${BASE_URL_REPO}/${repoOwner}/${repoName}/git/refs/heads/${branch}`, {
            ref: "refs/heads/" + branch,
            sha: newCommitSha
        })
        .then((response) => response.data)
        .catch((err) => {
            console.log(err);
            return undefined;
        });
}

// On error, this returns the message string to preserve the original UI behavior.
export async function loadRepositoryList(
    _searchText = "",
    page = 1,
    perPage = 5
): Promise<GitHubRepoSummary[] | string> {
    try {
        const response = await axios.get<GitHubRepoSummary[]>(
            `${BASE_URL_USER}/repos?sort=updated&direction=desc&page=${page}&per_page=${perPage}`
        );
        if (!response?.data) {
            return [];
        }
        return response.data;
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
}

export async function searchRepositoryList(
    searchString: string,
    maxResults = 2,
    searchResults: GitHubRepoSummary[] = []
): Promise<GitHubRepoSummary[]> {
    let page = 1;
    const perPage = 100;

    let hasNextPage = true;
    while (searchResults.length < maxResults && hasNextPage) {
        try {
            const repositoryList = await loadRepositoryList("", page, perPage);
            if (repositoryList instanceof Array) {
                const filteredArr = repositoryList.filter((repo) => repo.full_name.includes(searchString));
                filteredArr.forEach((repo) => {
                    if (searchResults.length < maxResults) {
                        searchResults.push(repo);
                    }
                });
            } else {
                hasNextPage = false;
            }
            if (repositoryList.length < perPage) {
                hasNextPage = false;
            }
        } catch {
            hasNextPage = false;
        }

        page++;
    }
    return searchResults;
}

export async function loadFileTreeOfRepository(
    repoFullName: string,
    branchName: string
): Promise<GitHubFileTree | undefined> {
    return axios
        .get<GitHubFileTree>(`${BASE_URL_REPO}/${repoFullName}/git/trees/${branchName}?recursive=1`)
        .then((response) => response.data)
        .catch((err) => {
            console.log(err);
            return undefined;
        });
}

export async function loadBranchesName(repo: string, username: string): Promise<GitHubBranch[] | undefined> {
    return axios
        .get<GitHubBranch[]>(`${BASE_URL_REPO}/${username}/${repo}/branches?per_page=999`)
        .then((response) => response.data)
        .catch((err) => {
            console.log(err);
            return undefined;
        });
}

export async function loadRawFile(
    repoFullName: string,
    branchName: string,
    filePath: string
): Promise<string | undefined> {
    if (typeof branchName !== "string") {
        console.log(
            "Invalid values for loadContentsForRepository. Given Repository full name: " +
                repoFullName +
                ", Branch:" +
                branchName +
                ", file path: " +
                filePath
        );
        return undefined;
    }
    return axios
        .get<GitHubContent>(`${BASE_URL_REPO}/${repoFullName}/contents/${filePath}?ref=${branchName}`)
        .then((response) => decodeUnicode(response.data.content))
        .catch((err) => {
            console.log(err);
            return undefined;
        });
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

export async function loadAllRepositoryContent(
    repoList: ReadonlyArray<{ fullName: string; branch: string }>
): Promise<Repository[]> {
    const repoObjectList: Repository[] = [];
    const repoPromises = repoList.map((repo) =>
        loadARepositoryContent(repo.fullName, repo.branch).then((loaded) => {
            repoObjectList.push(loaded);
        })
    );
    await Promise.all(repoPromises);
    return repoObjectList;
}

const ADR_PATH_CANDIDATES = [
    "/docs/adr/",
    "/docs/adrs/",
    "/docs/ADR/",
    "/doc/adr/",
    "/docs/decisions/",
    "/docs/design/",
    "/technical-overview/adr/"
] as const;

export async function loadARepositoryContent(repoFullName: string, branchName: string): Promise<Repository> {
    const adrPromises: Promise<void>[] = [];
    const repoObject = new Repository({
        fullName: repoFullName,
        activeBranch: branchName,
        adrPath: "",
        adrs: []
    });

    const data = await loadFileTreeOfRepository(repoFullName, branchName);
    if (data) {
        let adrPath: string | undefined = undefined;
        const adrList: GitHubTreeEntry[] = data.tree.filter((file) => {
            const matchedPaths = ADR_PATH_CANDIDATES.filter(
                (path) => ("/" + file.path).includes(path) || file.path.startsWith("adr/")
            );

            const firstMatch = matchedPaths[0];
            if (!adrPath && matchedPaths.length === 1 && firstMatch) {
                adrPath = firstMatch.slice(1);
            } else if (
                matchedPaths.length > 1 ||
                (matchedPaths.length === 1 && firstMatch && firstMatch.slice(1) !== adrPath)
            ) {
                console.warn("Loading error, unclear ADR path: Found ", [...matchedPaths, adrPath]);
            }

            return matchedPaths.length > 0;
        });
        repoObject.adrPath = adrPath || "docs/decisions/";

        adrList.forEach((adr) => {
            const parsedId = Number(adr.path.split("/").pop()?.split("-")[0]);
            const id = Number.isNaN(parsedId) ? -1 : parsedId;
            const adrObject: AdrFile = { path: adr.path, id, originalMd: "", editedMd: "" };
            repoObject.adrs.push(adrObject);
            adrPromises.push(
                loadRawFile(repoFullName, branchName, adr.path).then((rawMd) => {
                    adrObject.originalMd = rawMd ?? "";
                    adrObject.editedMd = rawMd ?? "";
                })
            );
        });
        console.log("adrList", repoObject.adrs);
    }

    await Promise.all(adrPromises);
    return repoObject;
}
