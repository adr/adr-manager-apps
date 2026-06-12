import axios from "axios";
import { gitlabProvider } from "@/plugins/git/providers/gitlab";

vi.mock("axios", async (importOriginal) => {
    const actual = await importOriginal<typeof import("axios")>();
    return {
        ...actual,
        default: {
            ...actual.default,
            create: vi.fn(),
            get: vi.fn(),
            post: vi.fn()
        }
    };
});

const http = {
    get: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
    interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
    }
};

function page<T>(data: T[], nextPage: string): { data: T[]; headers: Record<string, string> } {
    return { data, headers: { "x-next-page": nextPage } };
}

function axiosError(status: number, data?: unknown): Error {
    return Object.assign(new Error(`Request failed with status code ${status}`), {
        isAxiosError: true,
        response: { status, data }
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(axios.create).mockReturnValue(http as never);
});

test("listRepositories maps projects to neutral summaries", async () => {
    http.get.mockResolvedValueOnce({
        data: [
            {
                path_with_namespace: "group/subgroup/project",
                default_branch: "main",
                description: "An ADR repo",
                last_activity_at: "2026-06-01T00:00:00Z"
            },
            {
                path_with_namespace: "group/empty",
                default_branch: null,
                description: null,
                last_activity_at: "2026-05-01T00:00:00Z"
            }
        ],
        headers: { "x-total-pages": "5" }
    });

    const result = await gitlabProvider.listRepositories(2, 40);

    expect(http.get).toHaveBeenCalledWith("/projects", {
        params: {
            membership: true,
            order_by: "last_activity_at",
            sort: "desc",
            simple: true,
            page: 2,
            per_page: 40
        }
    });
    expect(result.repositories).toEqual([
        {
            fullName: "group/subgroup/project",
            defaultBranch: "main",
            description: "An ADR repo",
            updatedAt: "2026-06-01T00:00:00Z"
        },
        { fullName: "group/empty", defaultBranch: "main", description: null, updatedAt: "2026-05-01T00:00:00Z" }
    ]);
    expect(result.totalPages).toBe(5);
});

test("listRepositories omits the total page count when GitLab doesn't report one", async () => {
    http.get.mockResolvedValueOnce({ data: [], headers: {} });

    const result = await gitlabProvider.listRepositories(1, 40);

    expect(result.totalPages).toBeUndefined();
});

test("searchRepositories searches server-side and never throws", async () => {
    http.get.mockRejectedValueOnce(axiosError(500));
    await expect(gitlabProvider.searchRepositories("adr", 40)).resolves.toEqual([]);

    http.get.mockResolvedValueOnce({
        data: [
            {
                path_with_namespace: "group/adr-repo",
                default_branch: "main",
                description: null,
                last_activity_at: "2026-06-01T00:00:00Z"
            }
        ]
    });
    const repos = await gitlabProvider.searchRepositories("adr", 40);
    expect(http.get).toHaveBeenLastCalledWith("/projects", {
        params: expect.objectContaining({ search: "adr", search_namespaces: true, per_page: 40 })
    });
    expect(repos).toHaveLength(1);
});

test("listBranches URL-encodes the project path and follows x-next-page", async () => {
    http.get
        .mockResolvedValueOnce(page([{ name: "main", commit: { id: "sha-main" } }], "2"))
        .mockResolvedValueOnce(page([{ name: "feature/x", commit: { id: "sha-feature" } }], ""));

    const branches = await gitlabProvider.listBranches("group/subgroup/project");

    expect(http.get).toHaveBeenNthCalledWith(1, "/projects/group%2Fsubgroup%2Fproject/repository/branches", {
        params: { per_page: 100, page: "1" }
    });
    expect(http.get).toHaveBeenNthCalledWith(2, "/projects/group%2Fsubgroup%2Fproject/repository/branches", {
        params: { per_page: 100, page: "2" }
    });
    expect(branches).toEqual([
        { name: "main", commit: { sha: "sha-main" } },
        { name: "feature/x", commit: { sha: "sha-feature" } }
    ]);
});

test("listBranches stops when the next-page header is missing", async () => {
    http.get.mockResolvedValueOnce({ data: [{ name: "main", commit: { id: "sha" } }], headers: {} });

    const branches = await gitlabProvider.listBranches("group/project");

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(branches).toHaveLength(1);
});

test("listFiles returns recursive blob paths only", async () => {
    http.get.mockResolvedValueOnce(
        page(
            [
                { id: "1", name: "adr", type: "tree", path: "docs/adr", mode: "040000" },
                { id: "2", name: "0001-x.md", type: "blob", path: "docs/adr/0001-x.md", mode: "100644" }
            ],
            ""
        )
    );

    const files = await gitlabProvider.listFiles("group/project", "main");

    expect(http.get).toHaveBeenCalledWith("/projects/group%2Fproject/repository/tree", {
        params: { recursive: true, ref: "main", per_page: 100, page: "1" }
    });
    expect(files).toEqual(["docs/adr/0001-x.md"]);
});

test("listFiles treats a 404 as an empty repository", async () => {
    http.get.mockRejectedValueOnce(axiosError(404, { message: "404 Tree Not Found" }));
    await expect(gitlabProvider.listFiles("group/project", "main")).resolves.toEqual([]);
});

test("readFile requests the raw endpoint with text semantics", async () => {
    http.get.mockResolvedValueOnce({ data: '{"looks": "like json"}' });

    const content = await gitlabProvider.readFile("group/project", "feature/x", "docs/adr/0001 record.md");

    expect(http.get).toHaveBeenCalledWith(
        "/projects/group%2Fproject/repository/files/docs%2Fadr%2F0001%20record.md/raw",
        expect.objectContaining({
            params: { ref: "feature/x" },
            responseType: "text"
        })
    );
    expect(content).toBe('{"looks": "like json"}');
});

test("commitFiles posts one atomic commit with mapped actions", async () => {
    http.post.mockResolvedValueOnce({ data: { id: "commit-sha" } });

    await gitlabProvider.commitFiles({
        repoFullName: "group/subgroup/project",
        branch: "main",
        message: "Update ADRs",
        author: { name: "Jane", email: "jane@example.com" },
        changes: [
            { action: "update", path: "docs/adr/0001-changed.md", content: "changed markdown" },
            { action: "create", path: "docs/adr/0003-new.md", content: "new markdown" },
            { action: "delete", path: "docs/adr/0004-deleted.md", content: "" }
        ]
    });

    expect(http.post).toHaveBeenCalledWith("/projects/group%2Fsubgroup%2Fproject/repository/commits", {
        branch: "main",
        commit_message: "Update ADRs",
        author_name: "Jane",
        author_email: "jane@example.com",
        actions: [
            { action: "update", file_path: "docs/adr/0001-changed.md", content: "changed markdown" },
            { action: "create", file_path: "docs/adr/0003-new.md", content: "new markdown" },
            { action: "delete", file_path: "docs/adr/0004-deleted.md" }
        ]
    });
});

test("commitFiles surfaces the GitLab error message", async () => {
    http.post.mockRejectedValueOnce(axiosError(400, { message: "A file with this name already exists" }));

    await expect(
        gitlabProvider.commitFiles({
            repoFullName: "group/project",
            branch: "main",
            message: "Update",
            author: { name: "Jane", email: "jane@example.com" },
            changes: [{ action: "create", path: "docs/adr/0001-x.md", content: "x" }]
        })
    ).rejects.toThrow("Could not push the commit: A file with this name already exists");
});

test("getUser prefers commit_email and synthesizes a noreply fallback", async () => {
    http.get.mockResolvedValueOnce({
        data: {
            id: 7,
            username: "jane",
            name: "Jane Doe",
            email: "jane@example.com",
            commit_email: "7-jane@users.noreply.gitlab.com"
        }
    });
    await expect(gitlabProvider.getUser()).resolves.toEqual({
        username: "jane",
        displayName: "Jane Doe",
        email: "7-jane@users.noreply.gitlab.com"
    });

    http.get.mockResolvedValueOnce({ data: { id: 7, username: "jane", name: null, email: null, commit_email: null } });
    await expect(gitlabProvider.getUser()).resolves.toEqual({
        username: "jane",
        displayName: "jane",
        email: "7-jane@users.noreply.gitlab.com"
    });
});
