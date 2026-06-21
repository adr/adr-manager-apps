import axios from "axios";

/**
 * Maps any error thrown by the provider layer to a human-readable message,
 * applied at the UI boundary right before the text is shown to the user.
 */
export function describeGitError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return "Could not reach the Git provider. Check your internet connection.";
        }
        const status = error.response.status;
        if (status === 401) {
            return "Your session has expired. Reconnect when prompted, or sign out and sign in again.";
        }
        if (status === 403) {
            if (error.response.headers["x-github-sso"]) {
                return "This organization requires SSO authorization for your GitHub token. Authorize it in your GitHub account settings, then retry.";
            }
            return error.response.headers["x-ratelimit-remaining"] === "0"
                ? "API rate limit reached. Please try again later."
                : "You don't have permission to access this resource.";
        }
        if (status === 404) {
            return "Not found. The repository or branch may have been deleted or renamed.";
        }
        if (status >= 500) {
            return `The Git provider is having problems (HTTP ${status}). Please try again later.`;
        }
        return `Request failed (HTTP ${status}).`;
    }
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return "Something went wrong. Please try again.";
}
