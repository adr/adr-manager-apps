export type FileStatus = "new" | "changed" | "deleted";

export interface CommitFile {
    title: string;
    value: string;
    path: string;
    /** Committed path. When it differs from `path`, the rename deletes it on commit. */
    originalPath?: string;
    fileSelected: boolean;
    fileStatus: FileStatus;
}

export interface PushedFile {
    path: string;
    type: FileStatus;
}
