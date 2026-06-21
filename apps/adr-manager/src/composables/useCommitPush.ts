import { getActiveProvider } from "@/plugins/git";
import type { CommitAuthor, FileChange } from "@/types/git";
import type { CommitFile, PushedFile } from "@/types/commit";

interface CommitPushInput {
    repoFullName: string;
    branch: string;
    changedFiles: CommitFile[];
    newFiles: CommitFile[];
    deletedFiles: CommitFile[];
    commitMessage: string;
    author: CommitAuthor;
}

function selectedFiles(files: CommitFile[]): CommitFile[] {
    return files.filter((file) => file.fileSelected);
}

function pushedFile(file: CommitFile): PushedFile {
    return { path: file.path, type: file.fileStatus };
}

// Git has no rename op, so a rename commits as a create at the new path plus a delete of the old
// path this returns.
function renamedFrom(file: CommitFile): string | undefined {
    return file.fileStatus === "changed" && file.originalPath !== file.path ? file.originalPath : undefined;
}

export async function pushSelectedFiles({
    repoFullName,
    branch,
    changedFiles,
    newFiles,
    deletedFiles,
    commitMessage,
    author
}: CommitPushInput): Promise<PushedFile[]> {
    const writes = [...selectedFiles(changedFiles), ...selectedFiles(newFiles)].map((file) => ({
        file,
        oldPath: renamedFrom(file)
    }));
    const selectedDeletedFiles = selectedFiles(deletedFiles);

    const pushedFiles: PushedFile[] = [
        ...writes.flatMap(({ file, oldPath }): PushedFile[] =>
            oldPath === undefined ? [pushedFile(file)] : [pushedFile(file), { path: oldPath, type: "deleted" }]
        ),
        ...selectedDeletedFiles.map(pushedFile)
    ];

    const changes: FileChange[] = [
        ...writes.flatMap(({ file, oldPath }): FileChange[] => {
            // A new path does not exist upstream yet, so a rename writes with "create", not "update".
            const write: FileChange = {
                action: file.fileStatus === "new" || oldPath !== undefined ? "create" : "update",
                path: file.path,
                content: file.value
            };
            return oldPath === undefined ? [write] : [write, { action: "delete", path: oldPath, content: "" }];
        }),
        ...selectedDeletedFiles.map((file): FileChange => ({ action: "delete", path: file.path, content: "" }))
    ];

    await getActiveProvider().commitFiles({
        repoFullName,
        branch,
        message: commitMessage,
        author,
        changes
    });

    return pushedFiles;
}
