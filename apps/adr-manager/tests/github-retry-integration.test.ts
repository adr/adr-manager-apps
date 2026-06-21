import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { attachGitHubInterceptors } from "@/plugins/git/providers/github/api";
import { reconnectVisible, settleReauth } from "@/plugins/git/providers/github/reauth";

beforeEach(() => {
    localStorage.clear();
    settleReauth(false);
});

function unauthorized(config: InternalAxiosRequestConfig): AxiosError {
    const response = { data: { message: "Bad credentials" }, status: 401, statusText: "Unauthorized", headers: {}, config };
    return new AxiosError("Request failed with status code 401", "ERR_BAD_REQUEST", config, null, response as never);
}

test("a retried request carries the token minted during reconnect", async () => {
    localStorage.setItem("authId", "old-token");
    const seen: Array<string | undefined> = [];
    let calls = 0;
    const http = axios.create({
        adapter: async (config) => {
            seen.push(config.headers?.Authorization as string | undefined);
            if (++calls === 1) {
                throw unauthorized(config);
            }
            return { data: {}, status: 200, statusText: "OK", headers: {}, config };
        }
    });
    attachGitHubInterceptors(http);

    const pending = http.get("https://api.github.com/user");

    await vi.waitFor(() => expect(reconnectVisible.value).toBe(true));
    localStorage.setItem("authId", "new-token");
    settleReauth(true);

    const response = await pending;
    expect(response.status).toBe(200);
    expect(seen).toEqual(["Bearer old-token", "Bearer new-token"]);
});

test("a request still failing after reconnect is not retried a second time", async () => {
    localStorage.setItem("authId", "old-token");
    let calls = 0;
    const http = axios.create({
        adapter: async (config) => {
            calls++;
            throw unauthorized(config);
        }
    });
    attachGitHubInterceptors(http);

    const pending = http.get("https://api.github.com/user");

    await vi.waitFor(() => expect(reconnectVisible.value).toBe(true));
    settleReauth(true);

    await expect(pending).rejects.toMatchObject({ response: { status: 401 } });
    expect(calls).toBe(2);
});
