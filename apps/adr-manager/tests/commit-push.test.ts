import { pushSelectedFiles } from "@/composables/useCommitPush";
import { getActiveProvider } from "@/plugins/git";
import type { GitProvider } from "@/plugins/git";
import type { CommitFile } from "@/types/commit";

vi.mock("@/plugins/git", () => ({
    getActiveProvider: vi.fn()
}));

const commitFilesMock = vi.fn();

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
    vi.mocked(getActiveProvider).mockReturnValue({ commitFiles: commitFilesMock } as unknown as GitProvider);
});

test("pushSelectedFiles commits selected changed, new, and deleted files", async () => {
    const changedFile = commitFile("docs/adr/0001-changed.md", "changed");
    const unselectedChangedFile = commitFile("docs/adr/0002-unselected.md", "changed", false);
    const newFile = commitFile("docs/adr/0003-new.md", "new");
    const deletedFile = commitFile("docs/adr/0004-deleted.md", "deleted");

    commitFilesMock.mockResolvedValue(undefined);

    const pushedFiles = await pushSelectedFiles({
        repoFullName: "adr/adr-manager",
        branch: "main",
        changedFiles: [changedFile, unselectedChangedFile],
        newFiles: [newFile],
        deletedFiles: [deletedFile],
        commitMessage: "Update ADRs",
        author: { name: "Jane", email: "jane@example.com" }
    });

    expect(commitFilesMock).toHaveBeenCalledTimes(1);
    expect(commitFilesMock).toHaveBeenCalledWith({
        repoFullName: "adr/adr-manager",
        branch: "main",
        message: "Update ADRs",
        author: { name: "Jane", email: "jane@example.com" },
        changes: [
            { action: "update", path: changedFile.path, content: changedFile.value },
            { action: "create", path: newFile.path, content: newFile.value },
            { action: "delete", path: deletedFile.path, content: "" }
        ]
    });
    expect(pushedFiles).toEqual([
        { path: changedFile.path, type: "changed" },
        { path: newFile.path, type: "new" },
        { path: deletedFile.path, type: "deleted" }
    ]);
});

test("pushSelectedFiles rejects when the provider cannot push", async () => {
    commitFilesMock.mockRejectedValue(new Error("Could not push the commit."));

    await expect(
        pushSelectedFiles({
            repoFullName: "adr/adr-manager",
            branch: "main",
            changedFiles: [],
            newFiles: [],
            deletedFiles: [],
            commitMessage: "No file tree changes",
            author: { name: "Jane", email: "jane@example.com" }
        })
    ).rejects.toThrow("Could not push the commit.");
});
