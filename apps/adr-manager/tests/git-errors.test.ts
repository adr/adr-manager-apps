import { describeGitError } from "@/plugins/git";

function axiosError(status?: number, headers: Record<string, string> = {}): Error {
    return Object.assign(new Error(`Request failed with status code ${status ?? "?"}`), {
        isAxiosError: true,
        ...(status !== undefined && { response: { status, headers } })
    });
}

test("a network failure without response suggests checking the connection", () => {
    expect(describeGitError(axiosError())).toBe("Could not reach the Git provider. Check your internet connection.");
});

test("a 401 reads as an expired session", () => {
    expect(describeGitError(axiosError(401))).toBe(
        "Your session has expired. Reconnect when prompted, or sign out and sign in again."
    );
});

test("a 403 with exhausted rate limit reads as rate limiting", () => {
    expect(describeGitError(axiosError(403, { "x-ratelimit-remaining": "0" }))).toBe(
        "API rate limit reached. Please try again later."
    );
});

test("a plain 403 reads as missing permission", () => {
    expect(describeGitError(axiosError(403))).toBe("You don't have permission to access this resource.");
});

test("a 403 from organization SSO explains the authorization step", () => {
    expect(describeGitError(axiosError(403, { "x-github-sso": "required; organizations=12345" }))).toBe(
        "This organization requires SSO authorization for your GitHub token. Authorize it in your GitHub account settings, then retry."
    );
});

test("a 404 mentions a deleted or renamed repository or branch", () => {
    expect(describeGitError(axiosError(404))).toBe(
        "Not found. The repository or branch may have been deleted or renamed."
    );
});

test("a server error names the status and suggests retrying", () => {
    expect(describeGitError(axiosError(502))).toBe(
        "The Git provider is having problems (HTTP 502). Please try again later."
    );
});

test("other HTTP statuses fall back to a generic request failure", () => {
    expect(describeGitError(axiosError(418))).toBe("Request failed (HTTP 418).");
});

test("a plain Error keeps its own user-facing message", () => {
    expect(describeGitError(new Error("Could not push the commit."))).toBe("Could not push the commit.");
});

test("unknown values fall back to a generic message", () => {
    expect(describeGitError("boom")).toBe("Something went wrong. Please try again.");
});
