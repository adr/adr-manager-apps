import { GITHUB_TAGGED_REPO_FULL_NAME, TEST_BASE_URL } from "../../support/e2e";

// ─── Setup helpers ─────────────────────────────────────────────────────────────

function addRepo(): void {
    cy.get("[data-cy=addRepo]").click();
    cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
    cy.get("[data-cy=addRepoDialog]").click();
    // The repo auto-expands when added (store.currentRepository watch fires).
    // Wait for at least one ADR item to confirm the repo is open and loaded.
    cy.get("[data-cy=adrList]", { timeout: 20000 }).should("have.length.greaterThan", 0);
}

/** Open the app and add the test repo, returning with the explorer visible. */
function openApp(): void {
    cy.visitAuthenticatedManager(TEST_BASE_URL);
    addRepo();
}

/**
 * Open the app and add the tagged fixture repo. Its single ADR already carries 12 tags in its
 * markdown, so availableTags is populated as soon as the repo loads, with no UI tag-creation
 * and no async tag-propagation race (which previously forced the 30s waits).
 */
function openTaggedRepo(): void {
    cy.visitAuthenticatedManager(TEST_BASE_URL);
    cy.get("[data-cy=addRepo]").click();
    cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=search-field-for-adding-repository]").type(GITHUB_TAGGED_REPO_FULL_NAME);
    cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=listRepo]").contains(GITHUB_TAGGED_REPO_FULL_NAME).click();
    cy.get("[data-cy=addRepoDialog]").click();
    cy.wait("@showRepos", { timeout: 15000 }).its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=adrList]", { timeout: 20000 }).should("have.length.greaterThan", 0);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

context("ADR Search", () => {
    // ── 1. Search bar presence ──────────────────────────────────────────────────
    context("Search bar presence", () => {
        beforeEach(openApp);

        it("renders the search input in the explorer sidebar", () => {
            cy.get("[data-cy=adr-search-bar]").should("be.visible");
            cy.get("[data-cy=adr-search-input]").should("be.visible");
        });

        it("does not show the clear button when the input is empty", () => {
            cy.get("[data-cy=adr-search-clear]").should("not.exist");
        });

        it("shows the clear button after typing", () => {
            cy.get("[data-cy=adr-search-input]").type("anything");
            cy.get("[data-cy=adr-search-clear]").should("be.visible");
        });

        it("clears the input when the clear button is clicked", () => {
            cy.get("[data-cy=adr-search-input]").type("something");
            cy.get("[data-cy=adr-search-clear]").click();
            cy.get("[data-cy=adr-search-input]").should("have.value", "");
            cy.get("[data-cy=adr-search-clear]").should("not.exist");
        });

        it("clears the input on Escape key", () => {
            cy.get("[data-cy=adr-search-input]").type("something");
            cy.get("[data-cy=adr-search-input]").type("{esc}");
            cy.get("[data-cy=adr-search-input]").should("have.value", "");
        });
    });

    // ── 2. Text search ──────────────────────────────────────────────────────────
    context("Text search filters the ADR list", () => {
        beforeEach(openApp);

        it("shows all ADRs when the search input is empty", () => {
            cy.get("[data-cy=adrList]").should("have.length.greaterThan", 0);
        });

        it("hides the repository section when no ADR title matches the query", () => {
            cy.get("[data-cy=adr-search-input]").type("zzznomatchatall");
            // All repos should be hidden (no child repoHead visible)
            cy.get("[data-cy=repoNameList]").find("[data-cy=adrList]").should("not.exist");
        });

        it("restores the full list after clearing the search", () => {
            cy.get("[data-cy=adr-search-input]").type("zzznomatchatall");
            cy.get("[data-cy=adr-search-clear]").click();
            cy.get("[data-cy=adrList]").should("have.length.greaterThan", 0);
        });
    });

    // ── 3. Filter toggle ────────────────────────────────────────────────────────
    context("Filter toggle", () => {
        beforeEach(openTaggedRepo);

        it("shows the filter toggle button when there are statuses or tags in the loaded ADRs", () => {
            cy.get("[data-cy=adr-filter-toggle]").should("be.visible");
        });

        it("opens the filter panel when the toggle is clicked", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=adr-filter-panel]").should("be.visible");
        });

        it("closes the filter panel on a second click", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=adr-filter-panel]").should("be.visible");
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=adr-filter-panel]").should("not.exist");
        });

        it("shows a tag filter chip for a tag present in the loaded ADRs", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=tag-filter-SearchTag1]").should("be.visible");
        });

        it("marks a tag filter as pressed and shows the active-filter badge when activated", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=tag-filter-SearchTag1]").click();
            cy.get("[data-cy=tag-filter-SearchTag1]").should("have.attr", "aria-pressed", "true");
            cy.get(".filter-badge").should("be.visible");
        });
    });

    // ── 4. Status filter ────────────────────────────────────────────────────────
    context("Status filter chips", () => {
        beforeEach(openApp);

        it("shows status chips for statuses present in the loaded ADRs", () => {
            cy.get("[data-cy=adr-filter-toggle]").should("be.visible");
            cy.get("[data-cy=adr-filter-toggle]").click();
            // At least one status chip should exist
            cy.get("[data-cy=adr-filter-panel]").find(".status-chip").should("have.length.greaterThan", 0);
        });

        it("clicking a status chip marks it as pressed", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=adr-filter-panel]").find(".status-chip").first().as("chip");
            cy.get("@chip").click();
            cy.get("@chip").should("have.attr", "aria-pressed", "true");
        });

        it("clicking an active status chip deactivates it", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=adr-filter-panel]").find(".status-chip").first().as("chip");
            cy.get("@chip").click();
            cy.get("@chip").should("have.attr", "aria-pressed", "true");
            cy.get("@chip").click();
            cy.get("@chip").should("have.attr", "aria-pressed", "false");
        });

        it("clearing the search resets all active status filters", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=adr-filter-panel]").find(".status-chip").first().click();
            cy.get("[data-cy=adr-search-input]").type("triggerclear");
            cy.get("[data-cy=adr-search-clear]").click();
            // The filter panel stays open after clearing. Check chips directly.
            cy.get("[data-cy=adr-filter-panel]").find(".status-chip[aria-pressed='true']").should("not.exist");
        });
    });

    // ── 5. Tag filter pagination ────────────────────────────────────────────────
    // Exhaustive boundary coverage (7/10/11/20 tags) lives in the AdrSearchBar unit tests.
    // Here we confirm the wiring end-to-end with the 12-tag fixture repo: 10 shown, "+2 more".
    context("Tag filter pagination", () => {
        beforeEach(() => {
            openTaggedRepo();
            cy.get("[data-cy=adr-filter-toggle]").click();
        });

        it("shows only the first 10 tag chips with a '+2 more' button", () => {
            cy.get("[data-cy=adr-filter-panel]").find("[data-cy^=tag-filter-SearchTag]").should("have.length", 10);
            cy.get("[data-cy=tags-show-more]").should("be.visible").and("contain", "+2 more");
            cy.get("[data-cy=tags-show-less]").should("not.exist");
        });

        it("expands to all 12 chips and swaps the button for 'Show less'", () => {
            cy.get("[data-cy=tags-show-more]").click();
            cy.get("[data-cy=adr-filter-panel]").find("[data-cy^=tag-filter-SearchTag]").should("have.length", 12);
            cy.get("[data-cy=tags-show-more]").should("not.exist");
            cy.get("[data-cy=tags-show-less]").should("be.visible");
        });

        it("collapses back to 10 chips and restores the '+2 more' button", () => {
            cy.get("[data-cy=tags-show-more]").click();
            cy.get("[data-cy=tags-show-less]").click();
            cy.get("[data-cy=adr-filter-panel]").find("[data-cy^=tag-filter-SearchTag]").should("have.length", 10);
            cy.get("[data-cy=tags-show-more]").should("be.visible");
            cy.get("[data-cy=tags-show-less]").should("not.exist");
        });

        it("can select a tag beyond position 10 after expanding", () => {
            cy.get("[data-cy=tags-show-more]").click();
            cy.get("[data-cy=tag-filter-SearchTag12]").click();
            cy.get("[data-cy=tag-filter-SearchTag12]").should("have.attr", "aria-pressed", "true");
            cy.get(".filter-badge").should("be.visible");
        });
    });
});
