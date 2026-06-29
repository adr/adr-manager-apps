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

// "Type to add" rows promote the add-row into a real entry on the first keystroke and move
// focus to it, so the rest of the text must be typed into the now-focused field.
Cypress.Commands.add("addListItem", (addInputSelector: string, text: string) => {
    cy.get(addInputSelector).type(text.charAt(0));
    const rest = text.slice(1);
    if (rest) {
        cy.focused().type(rest);
    }
});

// Adds a considered option via its add row (see addListItem for the focus behaviour).
Cypress.Commands.add("addConsideredOption", (text: string) => {
    cy.addListItem("[data-cy=considerOptTextAdr]", text);
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            visitAuthenticatedManager(url: string, options?: AuthenticatedManagerOptions): Chainable<AUTWindow>;
            /** Type into a "type to add" row's input, handling the first-keystroke focus shift. */
            addListItem(addInputSelector: string, text: string): Chainable<void>;
            /** Add a considered option by its title via the considered-options add row. */
            addConsideredOption(text: string): Chainable<void>;
        }
    }
}

export {};
