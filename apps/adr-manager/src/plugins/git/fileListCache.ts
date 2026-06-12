import { getActiveProvider } from "./factory";

/**
 * In-memory cache of the full file listing per repository branch, used by the
 * relevant-files picker and the linked-file existence checks. Deliberately not
 * persisted: after a reload the listing is unknown until it is fetched again,
 * and callers must treat a missing entry as "unknown" rather than "missing".
 */
const fileLists = new Map<string, string[]>();
const pendingFetches = new Map<string, Promise<string[]>>();

function cacheKey(repoFullName: string, branch: string): string {
    return `${getActiveProvider().id}:${repoFullName}@${branch}`;
}

/** Stores an already-fetched listing, e.g. the one loaded with the repository content. */
export function primeFileList(repoFullName: string, branch: string, files: string[]): void {
    fileLists.set(cacheKey(repoFullName, branch), files);
}

/** The cached listing, or undefined when it has not been fetched this session. */
export function getCachedFileList(repoFullName: string, branch: string): string[] | undefined {
    return fileLists.get(cacheKey(repoFullName, branch));
}

/** The cached listing, fetching it from the provider once when absent. */
export async function fetchFileList(repoFullName: string, branch: string): Promise<string[]> {
    const key = cacheKey(repoFullName, branch);
    const cached = fileLists.get(key);
    if (cached) {
        return cached;
    }
    let pending = pendingFetches.get(key);
    if (!pending) {
        pending = getActiveProvider()
            .listFiles(repoFullName, branch)
            .then((files) => {
                fileLists.set(key, files);
                return files;
            })
            .finally(() => {
                pendingFetches.delete(key);
            });
        pendingFetches.set(key, pending);
    }
    return pending;
}

/** Drops the cached listing so the next fetch hits the provider again. */
export function invalidateFileList(repoFullName: string, branch: string): void {
    fileLists.delete(cacheKey(repoFullName, branch));
}
