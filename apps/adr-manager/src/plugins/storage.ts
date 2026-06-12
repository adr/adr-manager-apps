/**
 * Typed wrapper around the handful of localStorage keys the app uses.
 */
export type StorageKey =
    | "addedRepositories"
    | "mode"
    | "authId"
    | "user"
    | "explorerWidth"
    | "previewWidth"
    | "gitProvider"
    | "gitlabBaseUrl"
    | "gitlabClientId"
    | "gitlabTokens"
    | "tourSeen"
    | "fieldVisibility"
    | "recentTags";

export function lsGet(key: StorageKey): string | null {
    return localStorage.getItem(key);
}

export function lsSet(key: StorageKey, value: string): void {
    localStorage.setItem(key, value);
}

export function lsRemove(key: StorageKey): void {
    localStorage.removeItem(key);
}
