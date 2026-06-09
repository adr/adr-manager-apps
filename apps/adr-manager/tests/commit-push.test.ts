import { pushSelectedFilesToGitHub } from "@/composables/useCommitPush";
import { createBlobs, createCommit, createFileTree, getCommitSha, pushToGitHub } from "@/plugins/api";
import type { CommitFile } from "@/types/commit";

vi.mock("@/plugins/api", () => ({
    getCommitSha: vi.fn(),
    createBlobs: vi.fn(),
    createFileTree: vi.fn(),
    createCommit: vi.fn(),
    pushToGitHub: vi.fn()
}));

function commitFile(path: string, fileStatus: CommitFile["fileStatus"], fileSelected = true): CommitFile {
    return {
        title: path.split("/").pop() ?? "",
        value: `${fileStatus} markdown`,
        path,
        fileSelected,
        fileStatus
    };
}

beforeEach(() => {
    vi.resetAllMocks();
});

test("pushSelectedFilesToGitHub pushes selected changed, new, and deleted files", async () => {
    const changedFile = commitFile("docs/adr/0001-changed.md", "changed");
    const unselectedChangedFile = commitFile("docs/adr/0002-unselected.md", "changed", false);
    const newFile = commitFile("docs/adr/0003-new.md", "new");
    const deletedFile = commitFile("docs/adr/0004-deleted.md", "deleted");

    vi.mocked(getCommitSha).mockResolvedValue({ name: "main", commit: { sha: "base-sha" } });
    vi.mocked(createBlobs).mockResolvedValueOnce({ sha: "changed-blob" }).mockResolvedValueOnce({ sha: "new-blob" });
    vi.mocked(createFileTree).mockResolvedValue({ sha: "tree-sha" });
    vi.mocked(createCommit).mockResolvedValue({ sha: "commit-sha" });
    vi.mocked(pushToGitHub).mockResolvedValue({ ref: "refs/heads/main", object: { sha: "commit-sha" } });

    const pushedFiles = await pushSelectedFilesToGitHub({
        changedFiles: [changedFile, unselectedChangedFile],
        newFiles: [newFile],
        deletedFiles: [deletedFile],
        commitMessage: "Update ADRs",
        author: { name: "Jane", email: "jane@example.com" }
    });

    expect(createBlobs).toHaveBeenCalledTimes(2);
    expect(createBlobs).toHaveBeenNthCalledWith(1, changedFile.value);
    expect(createBlobs).toHaveBeenNthCalledWith(2, newFile.value);
    expect(createFileTree).toHaveBeenCalledWith("base-sha", [
        { path: changedFile.path, mode: "100644", type: "blob", sha: "changed-blob" },
        { path: newFile.path, mode: "100644", type: "blob", sha: "new-blob" },
        { path: deletedFile.path, mode: "100644", type: "blob", sha: null }
    ]);
    expect(createCommit).toHaveBeenCalledWith(
        "Update ADRs",
        { name: "Jane", email: "jane@example.com" },
        "base-sha",
        "tree-sha"
    );
    expect(pushToGitHub).toHaveBeenCalledWith("commit-sha");
    expect(pushedFiles).toEqual([
        { path: changedFile.path, type: "changed" },
        { path: newFile.path, type: "new" },
        { path: deletedFile.path, type: "deleted" }
    ]);
});

test("pushSelectedFilesToGitHub rejects when GitHub does not return a push response", async () => {
    vi.mocked(getCommitSha).mockResolvedValue({ name: "main", commit: { sha: "base-sha" } });
    vi.mocked(createFileTree).mockResolvedValue({ sha: "tree-sha" });
    vi.mocked(createCommit).mockResolvedValue({ sha: "commit-sha" });
    vi.mocked(pushToGitHub).mockResolvedValue(undefined);

    await expect(
        pushSelectedFilesToGitHub({
            changedFiles: [],
            newFiles: [],
            deletedFiles: [],
            commitMessage: "No file tree changes",
            author: { name: "Jane", email: "jane@example.com" }
        })
    ).rejects.toThrow("Could not push the commit.");
});
