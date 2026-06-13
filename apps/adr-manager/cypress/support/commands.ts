import { installProviderMocks, type MockProviderId } from "./providerMocks";

interface AuthenticatedManagerOptions {
    clearStorage?: boolean;
    extraLocalStorage?: Record<string, string>;
    provider?: MockProviderId;
}

function seedAuthenticatedStorage(win: Window, options: AuthenticatedManagerOptions = {}): void {
    const provider = options.provider ?? "github";
    if (options.clearStorage !== false) {
        win.localStorage.clear();
    }

    win.localStorage.setItem("tourSeen", "1");

    if (provider === "github") {
        win.localStorage.setItem("gitProvider", "github");
        win.localStorage.setItem("authId", "mock-github-token");
        win.localStorage.setItem("user", "e2e-github-user");
        win.localStorage.removeItem("gitlabTokens");
    } else {
        win.localStorage.setItem("gitProvider", "gitlab");
        win.localStorage.setItem("gitlabBaseUrl", "https://gitlab.com");
        win.localStorage.setItem(
            "gitlabTokens",
            JSON.stringify({
                accessToken: "mock-gitlab-token",
                refreshToken: "mock-gitlab-refresh-token",
                expiresAt: Date.now() + 60 * 60 * 1000
            })
        );
        win.localStorage.removeItem("authId");
        win.localStorage.removeItem("user");
    }

    for (const [key, value] of Object.entries(options.extraLocalStorage ?? {})) {
        win.localStorage.setItem(key, value);
    }
}

Cypress.Commands.add("visitAuthenticatedManager", (url: string, options: AuthenticatedManagerOptions = {}) => {
    installProviderMocks();
    return cy.visit(url, {
        onBeforeLoad(win) {
            seedAuthenticatedStorage(win, options);
        }
    });
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            visitAuthenticatedManager(url: string, options?: AuthenticatedManagerOptions): Chainable<AUTWindow>;
        }
    }
}

export {};
