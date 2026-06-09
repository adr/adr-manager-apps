export type FileStatus = "new" | "changed" | "deleted";

export interface CommitFile {
    title: string;
    value: string;
    path: string;
    fileSelected: boolean;
    fileStatus: FileStatus;
}

export interface PushedFile {
    path: string;
    type: FileStatus;
}
