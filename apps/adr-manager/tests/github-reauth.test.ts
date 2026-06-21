import type { AxiosInstance } from "axios";
import { attachGitHubInterceptors } from "@/plugins/git/providers/github/api";
import { reconnectVisible, requestReauth, settleReauth } from "@/plugins/git/providers/github/reauth";

beforeEach(() => {
    localStorage.clear();
    settleReauth(false);
});

interface CapturedHandlers {
    request: Array<(config: { headers: Record<string, string> }) => { headers: Record<string, string> }>;
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

// --- reconnect coordinator ---

test("concurrent reauth requests share one pending prompt", () => {
    const a = requestReauth();
    const b = requestReauth();
    expect(a).toBe(b);
    expect(reconnectVisible.value).toBe(true);
});

test("settleReauth resolves the shared promise and hides the dialog", async () => {
    const pending = requestReauth();
    settleReauth(true);
    await expect(pending).resolves.toBe(true);
    expect(reconnectVisible.value).toBe(false);
});

test("a fresh request after settling opens a new prompt", () => {
    settleReauth(true);
    expect(reconnectVisible.value).toBe(false);
    requestReauth();
    expect(reconnectVisible.value).toBe(true);
});

// --- interceptors ---

test("the request interceptor injects the stored bearer token", () => {
    localStorage.setItem("authId", "tok-123");
    const { instance, handlers } = fakeInstance();
    attachGitHubInterceptors(instance);

    const config = handlers.request[0]?.({ headers: {} });
    expect(config?.headers["Authorization"]).toBe("Bearer tok-123");
});

test("a 401 is retried once after a successful reconnect", async () => {
    const { instance, handlers } = fakeInstance();
    attachGitHubInterceptors(instance);
    const rejected = handlers.responseRejected[0];

    const config: Record<string, unknown> = { headers: {} };
    const result = rejected?.(unauthorizedError(config));
    expect(reconnectVisible.value).toBe(true);
    settleReauth(true);

    await expect(result).resolves.toEqual({ data: "retried" });
    expect(config["_retried"]).toBe(true);
    expect(instance.request).toHaveBeenCalledTimes(1);
});

test("a 401 rethrows when the user cancels the reconnect", async () => {
    const { instance, handlers } = fakeInstance();
    attachGitHubInterceptors(instance);
    const rejected = handlers.responseRejected[0];

    const result = rejected?.(unauthorizedError({ headers: {} }));
    settleReauth(false);

    await expect(result).rejects.toThrow("401");
    expect(instance.request).not.toHaveBeenCalled();
});

test("an already-retried 401 rethrows without prompting again", async () => {
    const { instance, handlers } = fakeInstance();
    attachGitHubInterceptors(instance);
    const rejected = handlers.responseRejected[0];

    await expect(rejected?.(unauthorizedError({ headers: {}, _retried: true }))).rejects.toThrow("401");
    expect(reconnectVisible.value).toBe(false);
    expect(instance.request).not.toHaveBeenCalled();
});
