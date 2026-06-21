import axios from "axios";
import type { AxiosResponse } from "axios";
import { githubProvider } from "@/plugins/git/providers/github";
import type { CommitInput } from "@/types/git";

vi.mock("axios", async (importOriginal) => {
    const actual = await importOriginal<typeof import("axios")>();
    const get = vi.fn();
    const post = vi.fn();
    const instance = {
        get,
        post,
        request: vi.fn(),
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    };
    return { ...actual, default: { ...actual.default, get, post, create: () => instance } };
});

const REPO = "adr/adr-manager";
const BASE = `https://api.github.com/repos/${REPO}`;

function commitInput(): CommitInput {
    return {
        repoFullName: REPO,
        branch: "main",
        message: "Update ADRs",
        author: { name: "Jane", email: "jane@example.com" },
        changes: [
            { action: "update", path: "docs/adr/0001-changed.md", content: "changed markdown" },
            { action: "create", path: "docs/adr/0003-new.md", content: "new markdown" },
            { action: "delete", path: "docs/adr/0004-deleted.md", content: "" }
        ]
    };
}

function response<T>(data: T): AxiosResponse {
    return { data } as AxiosResponse;
}

beforeEach(() => {
    vi.resetAllMocks();
});

test("commitFiles runs the blob, tree, commit, and ref sequence", async () => {
    vi.mocked(axios.get).mockResolvedValue(response({ name: "main", commit: { sha: "base-sha" } }));
    vi.mocked(axios.post)
        .mockResolvedValueOnce(response({ sha: "changed-blob" }))
        .mockResolvedValueOnce(response({ sha: "new-blob" }))
        .mockResolvedValueOnce(response({ sha: "tree-sha" }))
        .mockResolvedValueOnce(response({ sha: "commit-sha" }))
        .mockResolvedValueOnce(response({ ref: "refs/heads/main", object: { sha: "commit-sha" } }));

    await githubProvider.commitFiles(commitInput());

    expect(axios.get).toHaveBeenCalledWith(`${BASE}/branches/main`);
    expect(axios.post).toHaveBeenNthCalledWith(1, `${BASE}/git/blobs`, {
        content: "changed markdown",
        encoding: "utf-8"
    });
    expect(axios.post).toHaveBeenNthCalledWith(2, `${BASE}/git/blobs`, {
        content: "new markdown",
        encoding: "utf-8"
    });
    expect(axios.post).toHaveBeenNthCalledWith(3, `${BASE}/git/trees`, {
        base_tree: "base-sha",
        tree: [
            { path: "docs/adr/0001-changed.md", mode: "100644", type: "blob", sha: "changed-blob" },
            { path: "docs/adr/0003-new.md", mode: "100644", type: "blob", sha: "new-blob" },
            { path: "docs/adr/0004-deleted.md", mode: "100644", type: "blob", sha: null }
        ]
    });
    expect(axios.post).toHaveBeenNthCalledWith(4, `${BASE}/git/commits`, {
        message: "Update ADRs",
        author: { name: "Jane", email: "jane@example.com" },
        parents: ["base-sha"],
        tree: "tree-sha"
    });
    expect(axios.post).toHaveBeenNthCalledWith(5, `${BASE}/git/refs/heads/main`, {
        ref: "refs/heads/main",
        sha: "commit-sha"
    });
});

test("commitFiles throws when the latest commit cannot be loaded", async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error("HTTP 404"));

    await expect(githubProvider.commitFiles(commitInput())).rejects.toThrow("Could not load the latest commit.");
    expect(axios.post).not.toHaveBeenCalled();
});

test("commitFiles throws when a blob cannot be created", async () => {
    vi.mocked(axios.get).mockResolvedValue(response({ name: "main", commit: { sha: "base-sha" } }));
    vi.mocked(axios.post).mockRejectedValue(new Error("HTTP 502"));

    await expect(githubProvider.commitFiles(commitInput())).rejects.toThrow(
        "Could not create blob for docs/adr/0001-changed.md."
    );
});

test("commitFiles throws when the file tree cannot be created", async () => {
    vi.mocked(axios.get).mockResolvedValue(response({ name: "main", commit: { sha: "base-sha" } }));
    vi.mocked(axios.post)
        .mockResolvedValueOnce(response({ sha: "changed-blob" }))
        .mockResolvedValueOnce(response({ sha: "new-blob" }))
        .mockRejectedValueOnce(new Error("HTTP 502"));

    await expect(githubProvider.commitFiles(commitInput())).rejects.toThrow("Could not create the file tree.");
});

test("commitFiles throws when the commit cannot be created", async () => {
    vi.mocked(axios.get).mockResolvedValue(response({ name: "main", commit: { sha: "base-sha" } }));
    vi.mocked(axios.post)
        .mockResolvedValueOnce(response({ sha: "changed-blob" }))
        .mockResolvedValueOnce(response({ sha: "new-blob" }))
        .mockResolvedValueOnce(response({ sha: "tree-sha" }))
        .mockRejectedValueOnce(new Error("HTTP 502"));

    await expect(githubProvider.commitFiles(commitInput())).rejects.toThrow("Could not create the commit.");
});

test("commitFiles throws when the branch ref cannot be updated", async () => {
    vi.mocked(axios.get).mockResolvedValue(response({ name: "main", commit: { sha: "base-sha" } }));
    vi.mocked(axios.post)
        .mockResolvedValueOnce(response({ sha: "changed-blob" }))
        .mockResolvedValueOnce(response({ sha: "new-blob" }))
        .mockResolvedValueOnce(response({ sha: "tree-sha" }))
        .mockResolvedValueOnce(response({ sha: "commit-sha" }))
        .mockRejectedValueOnce(new Error("HTTP 502"));

    await expect(githubProvider.commitFiles(commitInput())).rejects.toThrow("Could not push the commit.");
});
