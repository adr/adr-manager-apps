import { vi } from "vitest";
import type { AxiosInstance } from "axios";

// The interceptor handlers attachXxxInterceptors() registers, captured for the test to
// drive directly. The request handler is sync in the GitHub provider and async in the GitLab
// one (it may refresh the token), so the return type allows both and callers await it either way.
export interface CapturedInterceptors {
    request: Array<
        (config: {
            headers: Record<string, string>;
        }) => { headers: Record<string, string> } | Promise<{ headers: Record<string, string> }>
    >;
    responseRejected: Array<(error: unknown) => Promise<unknown>>;
}

/** A minimal axios instance double that captures the interceptors a provider attaches. */
export function fakeAxiosInstance(): { instance: AxiosInstance; handlers: CapturedInterceptors } {
    const handlers: CapturedInterceptors = { request: [], responseRejected: [] };
    const instance = {
        request: vi.fn().mockResolvedValue({ data: "retried" }),
        interceptors: {
            request: { use: (fn: never) => handlers.request.push(fn) },
            response: { use: (_ok: never, rejected: never) => handlers.responseRejected.push(rejected) }
        }
    };
    return { instance: instance as unknown as AxiosInstance, handlers };
}

/** Build an axios-style 401 error carrying the given request config. */
export function unauthorizedError(config: Record<string, unknown>): Error {
    return Object.assign(new Error("Request failed with status code 401"), {
        isAxiosError: true,
        response: { status: 401 },
        config
    });
}
