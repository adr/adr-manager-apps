import type { AdrFile } from "./adr";
import type { Repository } from "@/plugins/classes";

export type FileType = "repo" | "adr" | "md" | "folder" | "html" | "js" | "json" | "pdf" | "png" | "txt" | "xls";

export interface FileNode {
    name: string;
    fullName?: string;
    fileType: FileType;
    path: string;
    children: FileNode[];
    adr?: AdrFile;
    repository?: Repository;
    tooltip?: string;
}
