import { lsGet } from "@/plugins/storage";

export const DEFAULT_GITLAB_BASE_URL = "https://gitlab.com";

/** OAuth application id registered on gitlab.com for the hosted deployment. */
const GITLAB_COM_CLIENT_ID: string = import.meta.env["VITE_GITLAB_CLIENT_ID"] ?? "";

/** Base URL of the GitLab instance, without a trailing slash (self-hosted instances are configurable). */
export function gitlabBaseUrl(): string {
    return lsGet("gitlabBaseUrl") ?? DEFAULT_GITLAB_BASE_URL;
}

export function gitlabClientId(): string {
    return lsGet("gitlabClientId") ?? GITLAB_COM_CLIENT_ID;
}

/**
 * Computed at runtime so the same build works wherever it is hosted. Must exactly
 * match the redirect URI registered in the GitLab OAuth application.
 */
export function oauthRedirectUri(): string {
    return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}
