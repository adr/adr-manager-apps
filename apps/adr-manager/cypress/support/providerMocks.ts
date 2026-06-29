export type MockProviderId = "github" | "gitlab";

export const GITHUB_ADR_REPO_FULL_NAME = "adr/adr-manager";
export const GITHUB_EMPTY_REPO_FULL_NAME = "adr/adr-test-repository-empty";
export const GITHUB_EMPTY_REPO_BRANCH = "testing-branch";
export const GITLAB_ADR_REPO_FULL_NAME = "gitlab/adr-manager";
export const GITHUB_TAGGED_REPO_FULL_NAME = "adr/adr-tagged";

// A loaded ADR carrying this many tags lets the search/filter specs exercise tag
// pagination without driving the tag picker through the UI (which is racy). Exhaustive
// pagination boundaries (7/10/11/20) are covered by the AdrSearchBar unit tests.
export const SEARCH_TAG_LABELS = Array.from({ length: 12 }, (_, index) => `SearchTag${index + 1}`);

interface MockRepo {
    fullName: string;
    defaultBranch: string;
    description: string | null;
    updatedAt: string;
    branches: string[];
    filesByBranch: Record<string, Record<string, string>>;
    branchCommits: Record<string, string>;
}

interface MockState {
    githubRepos: MockRepo[];
    gitlabRepos: MockRepo[];
    blobs: Map<string, string>;
    trees: Map<string, GitHubTreeMutation[]>;
    commits: Map<string, string>;
    nextSha: number;
}

interface MockRequest {
    method: string;
    url: string;
    body: unknown;
    alias?: string;
    reply(response: { statusCode: number; headers?: Record<string, string>; body?: unknown }): void;
}

interface GitHubTreeMutation {
    path: string;
    sha: string | null;
}

interface GitLabCommitAction {
    action: "create" | "update" | "delete";
    file_path: string;
    content?: string;
}

interface GitLabCommitRequest {
    branch?: string;
    actions?: GitLabCommitAction[];
}

export function installProviderMocks(): void {
    const state = createMockState();
    installProviderCatchAlls();
    installGitHubMocks(state);
    installGitLabMocks(state);
}

function installProviderCatchAlls(): void {
    cy.intercept("https://api.github.com/**", (req) => {
        req.reply({
            statusCode: 500,
            body: { message: `Unmocked GitHub API request: ${req.method} ${req.url}` }
        });
    });
    cy.intercept("https://gitlab.com/api/v4/**", (req) => {
        req.reply({
            statusCode: 500,
            body: { message: `Unmocked GitLab API request: ${req.method} ${req.url}` }
        });
    });
    cy.intercept("https://gitlab.com/oauth/**", (req) => {
        req.reply({
            statusCode: 500,
            body: { message: `Unexpected GitLab OAuth request in hermetic E2E: ${req.method} ${req.url}` }
        });
    });
}

function installGitHubMocks(state: MockState): void {
    cy.intercept("GET", "https://api.github.com/user/repos**", (req) => {
        req.alias = "getRepos";
        const url = new URL(req.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        const perPage = Number(url.searchParams.get("per_page") ?? "20");
        const repos = paginate(state.githubRepos, page, perPage);
        req.reply({
            statusCode: 200,
            headers: linkHeader(page, perPage, state.githubRepos.length),
            body: repos.map(toGitHubRepo)
        });
    });

    cy.intercept("GET", "https://api.github.com/user", {
        statusCode: 200,
        body: { login: "e2e-github-user", name: "E2E GitHub User" }
    });

    cy.intercept("GET", "https://api.github.com/user/public_emails", {
        statusCode: 200,
        body: [{ email: "e2e-github@example.com", primary: true, verified: true, visibility: "public" }]
    });

    cy.intercept("GET", "https://api.github.com/repos/**", (req) => {
        const parsed = parseGitHubRepoRequest(req.url, state.githubRepos);
        if (!parsed) {
            replyNotFound(req, "GitHub repository not found");
            return;
        }
        const { repo, rest, url } = parsed;
        if (rest[0] === "branches" && rest.length === 1) {
            req.reply({ statusCode: 200, body: repo.branches.map((branch) => githubBranch(repo, branch)) });
            return;
        }
        if (rest[0] === "branches" && rest[1]) {
            req.alias = "getCommitSha";
            req.reply({ statusCode: 200, body: githubBranch(repo, rest.slice(1).join("/")) });
            return;
        }
        if (rest[0] === "git" && rest[1] === "trees" && rest[2]) {
            req.alias = "showRepos";
            const branch = rest.slice(2).join("/");
            req.reply({ statusCode: 200, body: { tree: gitHubTree(repo, branch) } });
            return;
        }
        if (rest[0] === "contents" && rest[1]) {
            const branch = url.searchParams.get("ref") ?? repo.defaultBranch;
            const filePath = rest.slice(1).join("/");
            const content = filesFor(repo, branch)[filePath];
            if (content === undefined) {
                replyNotFound(req, `GitHub file not found: ${filePath}`);
                return;
            }
            req.reply({
                statusCode: 200,
                body: { content: Cypress.Buffer.from(content, "utf8").toString("base64"), encoding: "base64" }
            });
            return;
        }
        replyNotFound(req, `Unmocked GitHub repo route: ${req.method} ${req.url}`);
    });

    cy.intercept("POST", "https://api.github.com/repos/**", (req) => {
        const parsed = parseGitHubRepoRequest(req.url, state.githubRepos);
        if (!parsed) {
            replyNotFound(req, "GitHub repository not found");
            return;
        }
        const { repo, rest } = parsed;
        if (rest[0] === "git" && rest[1] === "blobs") {
            const body = asRecord(req.body);
            const content = typeof body["content"] === "string" ? body["content"] : "";
            const sha = nextSha(state, "blob");
            state.blobs.set(sha, content);
            req.reply({ statusCode: 201, body: { sha } });
            return;
        }
        if (rest[0] === "git" && rest[1] === "trees") {
            req.alias = "createTreeRequest";
            const sha = nextSha(state, "tree");
            state.trees.set(sha, gitHubTreeMutations(asRecord(req.body)["tree"]));
            req.reply({ statusCode: 201, body: { sha } });
            return;
        }
        if (rest[0] === "git" && rest[1] === "commits") {
            req.alias = "commitRequest";
            const body = asRecord(req.body);
            const treeSha = typeof body["tree"] === "string" ? body["tree"] : "";
            const sha = nextSha(state, "commit");
            state.commits.set(sha, treeSha);
            req.reply({ statusCode: 201, body: { sha } });
            return;
        }
        if (rest[0] === "git" && rest[1] === "refs" && rest[2] === "heads" && rest[3]) {
            req.alias = "updateRefRequest";
            const body = asRecord(req.body);
            const branch = rest.slice(3).join("/");
            const commitSha = typeof body["sha"] === "string" ? body["sha"] : "";
            applyGitHubCommit(state, repo, branch, commitSha);
            req.reply({ statusCode: 200, body: { ref: `refs/heads/${branch}`, object: { sha: commitSha } } });
            return;
        }
        replyNotFound(req, `Unmocked GitHub repo write: ${req.method} ${req.url}`);
    });
}

function installGitLabMocks(state: MockState): void {
    cy.intercept("GET", "https://gitlab.com/api/v4/projects**", (req) => {
        const url = new URL(req.url);
        if (url.pathname !== "/api/v4/projects") {
            handleGitLabProjectGet(req, state);
            return;
        }
        req.alias = "getRepos";
        const query = url.searchParams.get("search") ?? "";
        const page = Number(url.searchParams.get("page") ?? "1");
        const perPage = Number(url.searchParams.get("per_page") ?? "20");
        const matchingRepos = query
            ? state.gitlabRepos.filter((repo) => repo.fullName.includes(query))
            : state.gitlabRepos;
        req.reply({
            statusCode: 200,
            headers: {
                "x-total-pages": String(Math.max(1, Math.ceil(matchingRepos.length / perPage))),
                "x-next-page": ""
            },
            body: paginate(matchingRepos, page, perPage).map(toGitLabProject)
        });
    });

    cy.intercept("GET", "https://gitlab.com/api/v4/projects/*/repository/**", (req) => {
        handleGitLabProjectGet(req, state);
    });

    cy.intercept("GET", "https://gitlab.com/api/v4/user", {
        statusCode: 200,
        body: {
            id: 7,
            username: "e2e-gitlab-user",
            name: "E2E GitLab User",
            email: "e2e-gitlab@example.com",
            commit_email: "e2e-gitlab@example.com"
        }
    });

    cy.intercept("POST", "https://gitlab.com/api/v4/projects/*/repository/commits", (req) => {
        req.alias = "gitlabCommitRequest";
        const repo = repoFromGitLabUrl(req.url, state.gitlabRepos);
        if (!repo) {
            replyNotFound(req, "GitLab repository not found");
            return;
        }
        applyGitLabCommit(repo, asRecord(req.body));
        req.reply({ statusCode: 201, body: { id: nextSha(state, "gitlab-commit") } });
    });
}

function handleGitLabProjectGet(req: MockRequest, state: MockState): void {
    const url = new URL(req.url);
    const repo = repoFromGitLabUrl(req.url, state.gitlabRepos);
    if (!repo) {
        replyNotFound(req, "GitLab repository not found");
        return;
    }
    if (url.pathname.endsWith("/repository/branches")) {
        req.reply({
            statusCode: 200,
            headers: { "x-next-page": "" },
            body: repo.branches.map((branch) => ({ name: branch, commit: { id: branchCommit(repo, branch) } }))
        });
        return;
    }
    if (url.pathname.endsWith("/repository/tree")) {
        req.alias = "showRepos";
        const branch = url.searchParams.get("ref") ?? repo.defaultBranch;
        req.reply({
            statusCode: 200,
            headers: { "x-next-page": "" },
            body: Object.keys(filesFor(repo, branch)).map((path) => ({
                id: shaForPath(path),
                name: path.split("/").pop() ?? path,
                type: "blob",
                path,
                mode: "100644"
            }))
        });
        return;
    }
    if (url.pathname.includes("/repository/files/") && url.pathname.endsWith("/raw")) {
        const branch = url.searchParams.get("ref") ?? repo.defaultBranch;
        const filePath = gitLabRawFilePath(url);
        const content = filePath ? filesFor(repo, branch)[filePath] : undefined;
        if (content === undefined) {
            replyNotFound(req, `GitLab file not found: ${filePath ?? ""}`);
            return;
        }
        req.reply({ statusCode: 200, body: content });
        return;
    }
    replyNotFound(req, `Unmocked GitLab project route: ${req.method} ${req.url}`);
}

function createMockState(): MockState {
    return {
        githubRepos: createGitHubRepos(),
        gitlabRepos: createGitLabRepos(),
        blobs: new Map(),
        trees: new Map(),
        commits: new Map(),
        nextSha: 1
    };
}

function createGitHubRepos(): MockRepo[] {
    return [
        repo({
            fullName: GITHUB_ADR_REPO_FULL_NAME,
            defaultBranch: "main",
            description: "ADR-Manager",
            updatedAt: "2023-12-03T18:23:48Z",
            branches: ["main", "develop"],
            filesByBranch: {
                main: adrRichFiles("docs/adr/"),
                develop: adrRichFiles("docs/adr/")
            }
        }),
        repo({
            fullName: "tasbihaasim/foodapp",
            defaultBranch: "master",
            description: null,
            updatedAt: "2023-05-31T15:26:12Z",
            branches: ["master"],
            filesByBranch: { master: smallRepoFiles("docs/decisions/") }
        }),
        repo({
            fullName: "Moneexa/Chatapplication",
            defaultBranch: "master",
            description: null,
            updatedAt: "2021-05-17T11:25:46Z",
            branches: ["master"],
            filesByBranch: { master: smallRepoFiles("docs/decisions/") }
        }),
        repo({
            fullName: GITHUB_EMPTY_REPO_FULL_NAME,
            defaultBranch: GITHUB_EMPTY_REPO_BRANCH,
            description: "Empty repository used for commit E2E",
            updatedAt: "2024-01-11T12:00:00Z",
            branches: ["main", GITHUB_EMPTY_REPO_BRANCH],
            filesByBranch: {
                main: { "README.md": "# Empty ADR repository\n" },
                [GITHUB_EMPTY_REPO_BRANCH]: { "README.md": "# Empty ADR repository\n" }
            }
        }),
        repo({
            fullName: GITHUB_TAGGED_REPO_FULL_NAME,
            defaultBranch: "main",
            description: "Repository whose ADR carries many tags for search/filter E2E",
            updatedAt: "2024-02-15T10:00:00Z",
            branches: ["main"],
            filesByBranch: {
                main: {
                    "README.md": "# Tagged fixture repository\n",
                    "docs/adr/0001-tagged-decision.md": adrMarkdown(
                        "Tagged Decision",
                        "accepted",
                        "MADR",
                        "README.md",
                        SEARCH_TAG_LABELS
                    )
                }
            }
        })
    ];
}

function createGitLabRepos(): MockRepo[] {
    return [
        repo({
            fullName: GITLAB_ADR_REPO_FULL_NAME,
            defaultBranch: "main",
            description: "GitLab ADR Manager",
            updatedAt: "2024-03-01T10:00:00Z",
            branches: ["main", "review"],
            filesByBranch: { main: adrRichFiles("docs/adr/"), review: adrRichFiles("docs/adr/") }
        }),
        repo({
            fullName: "gitlab/platform-decisions",
            defaultBranch: "main",
            description: "Platform decisions",
            updatedAt: "2024-02-01T10:00:00Z",
            branches: ["main"],
            filesByBranch: { main: smallRepoFiles("docs/decisions/") }
        }),
        repo({
            fullName: "gitlab/design-system",
            defaultBranch: "main",
            description: "Design system",
            updatedAt: "2024-01-01T10:00:00Z",
            branches: ["main"],
            filesByBranch: { main: smallRepoFiles("docs/decisions/") }
        })
    ];
}

function repo(input: Omit<MockRepo, "branchCommits">): MockRepo {
    return {
        ...input,
        branchCommits: {}
    };
}

function adrRichFiles(adrPath: string): Record<string, string> {
    return {
        "README.md": "# Fixture repository\n",
        "src/main.ts": "export const app = 'adr-manager';\n",
        "src/components/Editor.vue": "export const editor = true;\n",
        [`${adrPath}0000-use-markdown-architectural-decision-records.md`]: adrMarkdown(
            "Use Markdown Architectural Decision Records",
            "accepted",
            "MADR"
        ),
        [`${adrPath}0001-record-architecture-decisions.md`]: adrMarkdown(
            "Record Architecture Decisions",
            "proposed",
            "MADR"
        ),
        [`${adrPath}0002-keep-decisions-near-code.md`]: adrMarkdown("Keep Decisions Near Code", "deprecated", "MADR"),
        [`${adrPath}0003-use-git-provider-api.md`]: adrMarkdown("Use Git Provider API", "rejected", "Git provider API"),
        [`${adrPath}0004-add-search-filters.md`]: adrMarkdown(
            "Add Search Filters",
            "superseded",
            "Search filters",
            "does/not/exist.ts"
        )
    };
}

function smallRepoFiles(adrPath: string): Record<string, string> {
    return {
        "README.md": "# Small fixture repository\n",
        [`${adrPath}0001-small-fixture.md`]: adrMarkdown("Small Fixture", "accepted", "MADR")
    };
}

function adrMarkdown(
    title: string,
    status: string,
    chosenOption: string,
    relevantFile = "README.md",
    tagLabels: string[] = []
): string {
    const tagComment = tagLabels.length
        ? `<!-- adr-manager-tags: ${JSON.stringify(
              tagLabels.map((label, index) => ({ id: `tag-${index}`, label, color: "#6366f1" }))
          )} -->\n`
        : "";
    return `# ${title}

* Status: ${status}
* Deciders: E2E Team
* Date: 2024-01-01

## Context and Problem Statement

The team needs a stable fixture ADR for browser tests.

## Decision Drivers

* Keep E2E tests deterministic
* Avoid external provider state

## Considered Options

* ${chosenOption}
* Wiki

## Decision Outcome

Chosen option: "${chosenOption}", because it keeps the decision history versioned with the code.

### Positive Consequences

* The test can inspect real ADR fields.

### Negative Consequences

* Fixture data must stay representative.

## Pros and Cons of the Options

### ${chosenOption}

Plain Markdown ADRs.

* Good, because they are easy to review.
* Bad, because they require discipline.

<!-- adr-manager-relevant-files: ${JSON.stringify([relevantFile])} -->
${tagComment}`;
}

function parseGitHubRepoRequest(
    urlText: string,
    repos: MockRepo[]
): { repo: MockRepo; rest: string[]; url: URL } | undefined {
    const url = new URL(urlText);
    const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const owner = segments[1];
    const name = segments[2];
    if (!owner || !name) {
        return undefined;
    }
    const repo = repos.find((candidate) => candidate.fullName === `${owner}/${name}`);
    if (!repo) {
        return undefined;
    }
    return { repo, rest: segments.slice(3), url };
}

function repoFromGitLabUrl(urlText: string, repos: MockRepo[]): MockRepo | undefined {
    const pathname = new URL(urlText).pathname;
    const marker = "/api/v4/projects/";
    const start = pathname.indexOf(marker);
    if (start < 0) {
        return undefined;
    }
    const remainder = pathname.slice(start + marker.length);
    const encodedProject = remainder.split("/")[0];
    if (!encodedProject) {
        return undefined;
    }
    const fullName = decodeURIComponent(encodedProject);
    return repos.find((repo) => repo.fullName === fullName);
}

function gitLabRawFilePath(url: URL): string | undefined {
    const marker = "/repository/files/";
    const start = url.pathname.indexOf(marker);
    if (start < 0) {
        return undefined;
    }
    const remainder = url.pathname.slice(start + marker.length);
    const encodedPath = remainder.replace(/\/raw$/, "");
    return decodeURIComponent(encodedPath);
}

function filesFor(repo: MockRepo, branch: string): Record<string, string> {
    repo.filesByBranch[branch] ??= {};
    return repo.filesByBranch[branch];
}

function branchCommit(repo: MockRepo, branch: string): string {
    repo.branchCommits[branch] ??= shaForPath(`${repo.fullName}:${branch}`);
    return repo.branchCommits[branch];
}

function githubBranch(repo: MockRepo, branch: string): { name: string; commit: { sha: string } } {
    return { name: branch, commit: { sha: branchCommit(repo, branch) } };
}

function gitHubTree(repo: MockRepo, branch: string): Array<{ path: string; mode: string; type: "blob"; sha: string }> {
    return Object.keys(filesFor(repo, branch)).map((path) => ({
        path,
        mode: "100644",
        type: "blob",
        sha: shaForPath(path)
    }));
}

function gitHubTreeMutations(value: unknown): GitHubTreeMutation[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.flatMap((entry) => {
        const record = asRecord(entry);
        const path = typeof record["path"] === "string" ? record["path"] : "";
        const sha = typeof record["sha"] === "string" ? record["sha"] : null;
        return path ? [{ path, sha }] : [];
    });
}

function applyGitHubCommit(state: MockState, repo: MockRepo, branch: string, commitSha: string): void {
    const treeSha = state.commits.get(commitSha);
    const mutations = treeSha ? state.trees.get(treeSha) : undefined;
    if (!mutations) {
        return;
    }
    const files = filesFor(repo, branch);
    for (const mutation of mutations) {
        if (mutation.sha === null) {
            delete files[mutation.path];
        } else {
            files[mutation.path] = state.blobs.get(mutation.sha) ?? "";
        }
    }
    repo.branchCommits[branch] = commitSha;
}

function applyGitLabCommit(repo: MockRepo, request: Record<string, unknown>): void {
    const body = request as GitLabCommitRequest;
    const branch = typeof body.branch === "string" ? body.branch : repo.defaultBranch;
    const files = filesFor(repo, branch);
    for (const action of body.actions ?? []) {
        if (action.action === "delete") {
            delete files[action.file_path];
        } else {
            files[action.file_path] = action.content ?? "";
        }
    }
}

function paginate<T>(items: T[], page: number, perPage: number): T[] {
    const start = Math.max(page - 1, 0) * perPage;
    return items.slice(start, start + perPage);
}

function linkHeader(page: number, perPage: number, total: number): Record<string, string> {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page >= totalPages) {
        return {};
    }
    return {
        link: `<https://api.github.com/user/repos?page=${totalPages}&per_page=${perPage}>; rel="last"`
    };
}

function toGitHubRepo(repo: MockRepo): {
    full_name: string;
    default_branch: string;
    description: string | null;
    updated_at: string;
} {
    return {
        full_name: repo.fullName,
        default_branch: repo.defaultBranch,
        description: repo.description,
        updated_at: repo.updatedAt
    };
}

function toGitLabProject(repo: MockRepo): {
    path_with_namespace: string;
    default_branch: string;
    description: string | null;
    last_activity_at: string;
} {
    return {
        path_with_namespace: repo.fullName,
        default_branch: repo.defaultBranch,
        description: repo.description,
        last_activity_at: repo.updatedAt
    };
}

function nextSha(state: MockState, prefix: string): string {
    const sha = `${prefix}-${state.nextSha}`;
    state.nextSha += 1;
    return sha;
}

function shaForPath(path: string): string {
    return `sha-${path.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}`;
}

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

function replyNotFound(req: MockRequest, message: string): void {
    req.reply({ statusCode: 404, body: { message } });
}
