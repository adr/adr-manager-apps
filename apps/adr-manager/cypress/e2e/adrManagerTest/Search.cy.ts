import { TEST_BASE_URL } from "../../support/e2e";

// ─── Setup helpers ─────────────────────────────────────────────────────────────

function addRepo(): void {
    cy.get("[data-cy=addRepo]").click();
    cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
    cy.get("[data-cy=addRepoDialog]").click();
    // The repo auto-expands when added (store.currentRepository watch fires).
    // Do NOT click repoHead — that would toggle it closed again.
    // Wait for at least one ADR item to confirm the repo is open and loaded.
    cy.get("[data-cy=adrList]", { timeout: 20000 }).should("have.length.greaterThan", 0);
}

/** Open the app and add the test repo, returning with the explorer visible. */
function openApp(): void {
    cy.visitAuthenticatedManager(TEST_BASE_URL);
    addRepo();
}

/** Open the app, open a new ADR editor, and add N unique tags via the tag picker. */
function openAdrWithTags(count: number): void {
    openApp();
    cy.get("[data-cy=newADR]").click({ force: true });
    for (let i = 1; i <= count; i++) {
        cy.get("[data-cy=tag-add-btn]").click();
        cy.get("[data-cy=tag-new-label]").clear().type(`SearchTag${i}`);
        cy.get("[data-cy=tag-create-btn]").click();
    }
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
        beforeEach(() => {
            // Create an ADR with a tag so the filter toggle is visible
            openAdrWithTags(1);
        });

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

        it("shows a tag filter chip for the tag that was added", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=tag-filter-SearchTag1]").should("be.visible");
        });

        it("adds 'has-active' class to the toggle when a tag filter is active", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=tag-filter-SearchTag1]").click();
            cy.get("[data-cy=adr-filter-toggle]").should("have.class", "has-active");
        });

        it("shows a filter-badge dot when a filter is active", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=tag-filter-SearchTag1]").click();
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

        it("clicking a status chip marks it as active", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=adr-filter-panel]").find(".status-chip").first().as("chip");
            cy.get("@chip").click();
            cy.get("@chip").should("have.class", "active");
        });

        it("clicking an active status chip deactivates it", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=adr-filter-panel]").find(".status-chip").first().as("chip");
            cy.get("@chip").click();
            cy.get("@chip").should("have.class", "active");
            cy.get("@chip").click();
            cy.get("@chip").should("not.have.class", "active");
        });

        it("clearing the search resets all active status filters", () => {
            cy.get("[data-cy=adr-filter-toggle]").click();
            cy.get("[data-cy=adr-filter-panel]").find(".status-chip").first().click();
            cy.get("[data-cy=adr-search-input]").type("triggerclear");
            cy.get("[data-cy=adr-search-clear]").click();
            // The filter panel stays open after clearing — check chips directly.
            // (Clicking the toggle here would close the panel, making the assertion fail.)
            cy.get("[data-cy=adr-filter-panel]").find(".status-chip.active").should("not.exist");
        });
    });

    // ── 5. Tag filter pagination ────────────────────────────────────────────────
    context("Tag filter pagination", () => {
        context("with fewer than 10 tags", () => {
            beforeEach(() => openAdrWithTags(5));

            it("shows all tag chips without a '+N more' button", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                cy.get("[data-cy=adr-filter-panel]").find(".tag-chip").should("have.length", 5);
                cy.get("[data-cy=tags-show-more]").should("not.exist");
            });
        });

        context("with exactly 10 tags", () => {
            beforeEach(() => openAdrWithTags(10));

            it("shows all 10 tag chips and no '+N more' button", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                cy.get("[data-cy=adr-filter-panel]").find(".tag-chip:not(.tags-more-btn)").should("have.length", 10);
                cy.get("[data-cy=tags-show-more]").should("not.exist");
            });
        });

        context("with 11 tags", () => {
            // Tags from the new (unsaved) ADR propagate into the store asynchronously,
            // so the 11th tag may arrive after the filter panel first renders.
            // All steps that wait on tag count use an extended timeout.
            beforeEach(() => openAdrWithTags(11));

            it("shows only 10 tag chips initially", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                // Wait for the 11th tag to register (so hiddenCount = 1), then verify
                // the visible slice is still capped at 10.
                cy.get("[data-cy=tags-show-more]", { timeout: 30000 }).should("exist");
                cy.get("[data-cy=adr-filter-panel]")
                    .find("[data-cy^=tag-filter-SearchTag]")
                    .should("have.length", 10);
            });

            it("shows the '+1 more' button", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                cy.get("[data-cy=tags-show-more]", { timeout: 30000 }).should("be.visible").and("contain", "+1 more");
            });

            it("does not show 'Show less' before expanding", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                cy.get("[data-cy=tags-show-more]", { timeout: 30000 }).should("exist");
                cy.get("[data-cy=tags-show-less]").should("not.exist");
            });

            it("clicking '+N more' shows all 11 tags and hides the button", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                cy.get("[data-cy=tags-show-more]", { timeout: 30000 }).click();
                cy.get("[data-cy=adr-filter-panel]")
                    .find("[data-cy^=tag-filter-SearchTag]", { timeout: 30000 })
                    .should("have.length", 11);
                cy.get("[data-cy=tags-show-more]").should("not.exist");
            });

            it("after expanding, the 'Show less' button appears", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                cy.get("[data-cy=tags-show-more]", { timeout: 30000 }).click();
                cy.get("[data-cy=tags-show-less]", { timeout: 30000 }).should("be.visible");
            });

            it("clicking 'Show less' collapses back to 10 chips", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                cy.get("[data-cy=tags-show-more]", { timeout: 30000 }).click();
                cy.get("[data-cy=tags-show-less]", { timeout: 30000 }).click();
                cy.get("[data-cy=adr-filter-panel]")
                    .find("[data-cy^=tag-filter-SearchTag]")
                    .should("have.length", 10);
            });

            it("clicking 'Show less' restores the '+1 more' button", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                cy.get("[data-cy=tags-show-more]", { timeout: 30000 }).click();
                cy.get("[data-cy=tags-show-less]", { timeout: 30000 }).click();
                cy.get("[data-cy=tags-show-more]", { timeout: 30000 }).should("be.visible");
                cy.get("[data-cy=tags-show-less]").should("not.exist");
            });

            it("a tag beyond position 10 can still be selected after expanding", () => {
                cy.get("[data-cy=adr-filter-toggle]").click();
                cy.get("[data-cy=tags-show-more]", { timeout: 30000 }).click();
                cy.get("[data-cy=tag-filter-SearchTag11]", { timeout: 30000 }).click();
                cy.get("[data-cy=tag-filter-SearchTag11]").should("have.class", "active");
                cy.get("[data-cy=adr-filter-toggle]").should("have.class", "has-active");
            });
        });
    });
});
