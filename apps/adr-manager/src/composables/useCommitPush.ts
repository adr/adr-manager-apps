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

export async function pushSelectedFiles({
    repoFullName,
    branch,
    changedFiles,
    newFiles,
    deletedFiles,
    commitMessage,
    author
}: CommitPushInput): Promise<PushedFile[]> {
    const selectedChangedAndNewFiles = [...selectedFiles(changedFiles), ...selectedFiles(newFiles)];
    const selectedDeletedFiles = selectedFiles(deletedFiles);
    const pushedFiles = [...selectedChangedAndNewFiles, ...selectedDeletedFiles].map(pushedFile);

    const changes: FileChange[] = [
        ...selectedChangedAndNewFiles.map(
            (file): FileChange => ({
                action: file.fileStatus === "new" ? "create" : "update",
                path: file.path,
                content: file.value
            })
        ),
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
