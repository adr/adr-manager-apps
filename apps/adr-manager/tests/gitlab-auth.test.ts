import axios from "axios";
import type { AxiosInstance } from "axios";
import {
    attachAuthInterceptors,
    completeOAuthCallback,
    createCodeChallenge,
    createCodeVerifier,
    loadTokens,
    refreshTokens
} from "@/plugins/git/providers/gitlab/auth";

vi.mock("axios", async (importOriginal) => {
    const actual = await importOriginal<typeof import("axios")>();
    return {
        ...actual,
        default: {
            ...actual.default,
            create: vi.fn(),
            get: vi.fn(),
            post: vi.fn()
        }
    };
});

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    history.replaceState(null, "", "/");
});

function storeTokens(expiresAt: number): void {
    localStorage.setItem("gitlabTokens", JSON.stringify({ accessToken: "at-old", refreshToken: "rt-old", expiresAt }));
}

function tokenResponse(suffix: string): { data: Record<string, unknown> } {
    return {
        data: {
            access_token: `at-${suffix}`,
            token_type: "Bearer",
            expires_in: 7200,
            refresh_token: `rt-${suffix}`,
            created_at: 1700000000
        }
    };
}

// --- PKCE helpers ---

test("createCodeVerifier uses the RFC 7636 charset and requested length", () => {
    const verifier = createCodeVerifier();
    expect(verifier).toHaveLength(64);
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    expect(createCodeVerifier(32)).toHaveLength(32);
});

test("createCodeChallenge matches the RFC 7636 appendix B vector", async () => {
    const { challenge, method } = await createCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");
    expect(method).toBe("S256");
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});

// --- redirect callback ---

test("completeOAuthCallback is a no-op without a pending sign-in", async () => {
    history.replaceState(null, "", "/?code=abc&state=xyz");
    await expect(completeOAuthCallback()).resolves.toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
});

test("completeOAuthCallback exchanges the code and establishes the session", async () => {
    sessionStorage.setItem("gitlab_oauth_state", "xyz");
    sessionStorage.setItem("gitlab_oauth_code_verifier", "verifier-123");
    history.replaceState(null, "", "/?code=abc&state=xyz");
    vi.mocked(axios.post).mockResolvedValueOnce(tokenResponse("new"));

    await expect(completeOAuthCallback()).resolves.toBe(true);

    expect(axios.post).toHaveBeenCalledWith("https://gitlab.com/oauth/token", expect.any(URLSearchParams));
    const body = vi.mocked(axios.post).mock.calls[0]?.[1] as URLSearchParams;
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("abc");
    expect(body.get("code_verifier")).toBe("verifier-123");

    expect(loadTokens()?.accessToken).toBe("at-new");
    expect(localStorage.getItem("gitProvider")).toBe("gitlab");
    expect(window.location.search).toBe("");
    expect(sessionStorage.getItem("gitlab_oauth_state")).toBeNull();
    expect(sessionStorage.getItem("gitlab_oauth_code_verifier")).toBeNull();
});

test("completeOAuthCallback rejects a state mismatch without exchanging the code", async () => {
    sessionStorage.setItem("gitlab_oauth_state", "expected");
    sessionStorage.setItem("gitlab_oauth_code_verifier", "verifier-123");
    history.replaceState(null, "", "/?code=abc&state=tampered");

    await expect(completeOAuthCallback()).resolves.toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
    expect(loadTokens()).toBeNull();
    expect(window.location.search).toBe("");
});

test("completeOAuthCallback handles a denied authorization", async () => {
    sessionStorage.setItem("gitlab_oauth_state", "xyz");
    history.replaceState(null, "", "/?error=access_denied&error_description=The+user+denied+the+request");

    await expect(completeOAuthCallback()).resolves.toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
});

// --- token refresh ---

test("refreshTokens rotates both tokens atomically", async () => {
    storeTokens(Date.now() + 7200_000);
    vi.mocked(axios.post).mockResolvedValueOnce(tokenResponse("rotated"));

    await expect(refreshTokens()).resolves.toBe(true);

    const tokens = loadTokens();
    expect(tokens?.accessToken).toBe("at-rotated");
    expect(tokens?.refreshToken).toBe("rt-rotated");
    const body = vi.mocked(axios.post).mock.calls[0]?.[1] as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("rt-old");
});

test("concurrent refreshes share a single request", async () => {
    storeTokens(Date.now() + 7200_000);
    vi.mocked(axios.post).mockResolvedValue(tokenResponse("rotated"));

    await Promise.all([refreshTokens(), refreshTokens(), refreshTokens()]);

    expect(axios.post).toHaveBeenCalledTimes(1);
});

test("a failed refresh clears the session", async () => {
    storeTokens(Date.now() + 7200_000);
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("invalid_grant"));

    await expect(refreshTokens()).resolves.toBe(false);
    expect(loadTokens()).toBeNull();
});

// --- interceptors ---

interface CapturedHandlers {
    request: Array<(config: { headers: Record<string, string> }) => Promise<{ headers: Record<string, string> }>>;
    responseRejected: Array<(error: unknown) => Promise<unknown>>;
}

function fakeInstance(): { instance: AxiosInstance; handlers: CapturedHandlers } {
    const handlers: CapturedHandlers = { request: [], responseRejected: [] };
    const instance = {
        request: vi.fn().mockResolvedValue({ data: "retried" }),
        interceptors: {
            request: { use: (fn: never) => handlers.request.push(fn) },
            response: { use: (_ok: never, rejected: never) => handlers.responseRejected.push(rejected) }
        }
    };
    return { instance: instance as unknown as AxiosInstance, handlers };
}

function unauthorizedError(config: Record<string, unknown>): Error {
    return Object.assign(new Error("Request failed with status code 401"), {
        isAxiosError: true,
        response: { status: 401 },
        config
    });
}

test("the request interceptor injects a fresh bearer token", async () => {
    storeTokens(Date.now() + 7200_000);
    const { instance, handlers } = fakeInstance();
    attachAuthInterceptors(instance);

    const config = await handlers.request[0]?.({ headers: {} });
    expect(config?.headers["Authorization"]).toBe("Bearer at-old");
    expect(axios.post).not.toHaveBeenCalled();
});

test("the request interceptor refreshes a token that is about to expire", async () => {
    storeTokens(Date.now() + 10_000);
    vi.mocked(axios.post).mockResolvedValueOnce(tokenResponse("rotated"));
    const { instance, handlers } = fakeInstance();
    attachAuthInterceptors(instance);

    const config = await handlers.request[0]?.({ headers: {} });
    expect(config?.headers["Authorization"]).toBe("Bearer at-rotated");
});

test("a 401 response is retried exactly once after a refresh", async () => {
    storeTokens(Date.now() + 7200_000);
    vi.mocked(axios.post).mockResolvedValue(tokenResponse("rotated"));
    const { instance, handlers } = fakeInstance();
    attachAuthInterceptors(instance);
    const rejected = handlers.responseRejected[0];

    const config: Record<string, unknown> = { headers: {} };
    await expect(rejected?.(unauthorizedError(config))).resolves.toEqual({ data: "retried" });
    expect(config["_retried"]).toBe(true);
    expect(instance.request).toHaveBeenCalledTimes(1);

    await expect(rejected?.(unauthorizedError(config))).rejects.toThrow("401");
    expect(instance.request).toHaveBeenCalledTimes(1);
});
