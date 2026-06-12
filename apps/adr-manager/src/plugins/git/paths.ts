/** Percent-encodes a repository file path per segment, keeping the `/` separators. */
export function encodeFilePath(filePath: string): string {
    return filePath.split("/").map(encodeURIComponent).join("/");
}
