import { createBlobs, createCommit, createFileTree, getCommitSha, pushToGitHub } from "@/plugins/api";
import type { CommitFile, PushedFile } from "@/types/commit";
import type { GitHubCommitAuthor, GitHubTreeInput } from "@/types/github";

interface CommitPushInput {
    changedFiles: CommitFile[];
    newFiles: CommitFile[];
    deletedFiles: CommitFile[];
    commitMessage: string;
    author: GitHubCommitAuthor;
}

function selectedFiles(files: CommitFile[]): CommitFile[] {
    return files.filter((file) => file.fileSelected);
}

function pushedFile(file: CommitFile): PushedFile {
    return { path: file.path, type: file.fileStatus };
}

export async function pushSelectedFilesToGitHub({
    changedFiles,
    newFiles,
    deletedFiles,
    commitMessage,
    author
}: CommitPushInput): Promise<PushedFile[]> {
    const selectedChangedAndNewFiles = [...selectedFiles(changedFiles), ...selectedFiles(newFiles)];
    const selectedDeletedFiles = selectedFiles(deletedFiles);
    const pushedFiles = [...selectedChangedAndNewFiles, ...selectedDeletedFiles].map(pushedFile);

    const lastCommit = await getCommitSha();
    if (!lastCommit) {
        throw new Error("Could not load the latest commit.");
    }

    const fileTree: GitHubTreeInput[] = await Promise.all(
        selectedChangedAndNewFiles.map(async (file) => {
            const blob = await createBlobs(file.value);
            if (!blob) {
                throw new Error(`Could not create blob for ${file.path}.`);
            }
            return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
        })
    );

    selectedDeletedFiles.forEach((file) => {
        fileTree.push({ path: file.path, mode: "100644", type: "blob", sha: null });
    });

    const tree = await createFileTree(lastCommit.commit.sha, fileTree);
    if (!tree) {
        throw new Error("Could not create the file tree.");
    }

    const commit = await createCommit(commitMessage, author, lastCommit.commit.sha, tree.sha);
    if (!commit) {
        throw new Error("Could not create the commit.");
    }

    const pushedRef = await pushToGitHub(commit.sha);
    if (!pushedRef) {
        throw new Error("Could not push the commit.");
    }

    return pushedFiles;
}
