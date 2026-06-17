import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { lsGet, lsRemove, lsSet } from "@/plugins/storage";
import { gitlabBaseUrl, gitlabClientId, oauthRedirectUri } from "./config";
import type { GitLabTokenResponse } from "./types";

const STATE_KEY = "gitlab_oauth_state";
const VERIFIER_KEY = "gitlab_oauth_code_verifier";

export interface GitLabTokens {
    accessToken: string;
    refreshToken: string;
    /** Epoch milliseconds. */
    expiresAt: number;
}

// --- token persistence (one JSON blob so refresh rotation is written atomically) ---

export function loadTokens(): GitLabTokens | null {
    const raw = lsGet("gitlabTokens");
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw) as GitLabTokens;
        return typeof parsed.accessToken === "string" ? parsed : null;
    } catch {
        return null;
    }
}

function saveTokens(tokens: GitLabTokens): void {
    lsSet("gitlabTokens", JSON.stringify(tokens));
}

function clearTokens(): void {
    lsRemove("gitlabTokens");
}

function tokensFromResponse(data: GitLabTokenResponse): GitLabTokens {
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000
    };
}

// --- PKCE helpers (RFC 7636) ---

const VERIFIER_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

export function createCodeVerifier(length = 64): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => VERIFIER_CHARSET[byte % VERIFIER_CHARSET.length]).join("");
}

export async function createCodeChallenge(verifier: string): Promise<{ challenge: string; method: "S256" | "plain" }> {
    // SubtleCrypto only exists in secure contexts; plain-http intranet hosting falls back.
    if (!crypto.subtle) {
        return { challenge: verifier, method: "plain" };
    }
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    return { challenge: base64UrlEncode(digest), method: "S256" };
}

function base64UrlEncode(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

// --- authorization code flow ---

/** Navigates to the GitLab authorize page; the promise never resolves into a session. */
export async function beginAuthorizeRedirect(): Promise<void> {
    const clientId = gitlabClientId();
    if (!clientId) {
        throw new Error("No GitLab application ID is configured.");
    }
    const verifier = createCodeVerifier();
    const state = createCodeVerifier(32);
    const { challenge, method } = await createCodeChallenge(verifier);
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: oauthRedirectUri(),
        response_type: "code",
        state,
        scope: "api",
        code_challenge: challenge,
        code_challenge_method: method
    });
    window.location.assign(`${gitlabBaseUrl()}/oauth/authorize?${params.toString()}`);
}

/**
 * Completes the redirect flow on app boot. GitLab puts ?code=&state= in the search
 * part of the URL (before the hash), so the router never sees them.
 */
export async function completeOAuthCallback(): Promise<boolean> {
    const expectedState = sessionStorage.getItem(STATE_KEY);
    if (!expectedState) {
        return false;
    }
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    const error = query.get("error");
    if (!code && !error) {
        return false;
    }

    sessionStorage.removeItem(STATE_KEY);
    const verifier = sessionStorage.getItem(VERIFIER_KEY) ?? "";
    sessionStorage.removeItem(VERIFIER_KEY);
    // Strip the query so the single-use code is never re-sent or bookmarked.
    history.replaceState(null, "", window.location.pathname + window.location.hash);

    if (error || !code) {
        console.error("GitLab sign-in failed:", query.get("error_description") ?? error);
        return false;
    }
    if (query.get("state") !== expectedState) {
        console.error("GitLab sign-in rejected: state mismatch.");
        return false;
    }

    const tokens = await exchangeCodeForTokens(code, verifier);
    if (!tokens) {
        return false;
    }
    saveTokens(tokens);
    lsSet("gitProvider", "gitlab");
    return true;
}

async function exchangeCodeForTokens(code: string, verifier: string): Promise<GitLabTokens | null> {
    const body = new URLSearchParams({
        client_id: gitlabClientId(),
        code,
        grant_type: "authorization_code",
        redirect_uri: oauthRedirectUri(),
        code_verifier: verifier
    });
    try {
        const response = await axios.post<GitLabTokenResponse>(`${gitlabBaseUrl()}/oauth/token`, body);
        return tokensFromResponse(response.data);
    } catch (err) {
        console.error("GitLab token exchange failed", err);
        return null;
    }
}

let refreshPromise: Promise<boolean> | null = null;

/** Single-flight: concurrent requests share one refresh. */
export function refreshTokens(): Promise<boolean> {
    refreshPromise ??= doRefresh().finally(() => {
        refreshPromise = null;
    });
    return refreshPromise;
}

async function doRefresh(): Promise<boolean> {
    const tokens = loadTokens();
    if (!tokens) {
        return false;
    }
    const body = new URLSearchParams({
        client_id: gitlabClientId(),
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        redirect_uri: oauthRedirectUri()
    });
    try {
        const response = await axios.post<GitLabTokenResponse>(`${gitlabBaseUrl()}/oauth/token`, body);
        saveTokens(tokensFromResponse(response.data));
        return true;
    } catch (err) {
        console.error("GitLab token refresh failed", err);
        clearTokens();
        return false;
    }
}

async function ensureFreshAccessToken(): Promise<string | null> {
    const tokens = loadTokens();
    if (!tokens) {
        return null;
    }
    if (tokens.expiresAt - Date.now() < 60_000) {
        if (!(await refreshTokens())) {
            return null;
        }
        return loadTokens()?.accessToken ?? null;
    }
    return tokens.accessToken;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
    _retried?: boolean;
}

/** Injects a fresh Bearer token per request and retries exactly once after a 401. */
export function attachAuthInterceptors(http: AxiosInstance): void {
    http.interceptors.request.use(async (config) => {
        const token = await ensureFreshAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    http.interceptors.response.use(undefined, async (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
            const config = error.config as RetriableConfig;
            if (!config._retried && (await refreshTokens())) {
                config._retried = true;
                return http.request(config);
            }
        }
        throw error;
    });
}

export function signOutGitLab(): void {
    const tokens = loadTokens();
    if (tokens) {
        const body = new URLSearchParams({ client_id: gitlabClientId(), token: tokens.accessToken });
        void axios.post(`${gitlabBaseUrl()}/oauth/revoke`, body).catch(() => undefined);
    }
    clearTokens();
}
