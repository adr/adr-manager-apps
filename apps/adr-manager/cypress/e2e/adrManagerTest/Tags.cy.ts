import { TEST_BASE_URL } from "../../support/e2e";

// Inline shape so the test file has no dependency on app source types.
interface TagFixture {
    id: string;
    label: string;
    color: string;
}

const LABEL_A = "TagTestFrontend";
const LABEL_B = "TagTestBackend";

// ─── Setup helpers ────────────────────────────────────────────────────────────

function addRepoAndCreateAdr(): void {
    cy.get("[data-cy=addRepo]").click();
    cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
    cy.get("[data-cy=addRepoDialog]").click();
    cy.get("[data-cy=newADR]").click({ force: true });
}

/** Start from a completely empty localStorage, then open a fresh ADR. */
function openFreshAdr(): void {
    cy.visitAuthenticatedManager(TEST_BASE_URL);
    addRepoAndCreateAdr();
}

/**
 * Like openFreshAdr but also seeds extra localStorage keys before the visit,
 * e.g. to pre-populate recentTags for suggestion tests.
 */
function openFreshAdrWith(extras: Record<string, string>): void {
    cy.visitAuthenticatedManager(TEST_BASE_URL, { extraLocalStorage: extras });
    addRepoAndCreateAdr();
}

/** Open the picker, type a label and click Create. */
function createTagViaUI(label: string): void {
    cy.get("[data-cy=tag-add-btn]").click();
    cy.get("[data-cy=tag-new-label]").type(label);
    cy.get("[data-cy=tag-create-btn]").click();
}

/** Seed localStorage with four fixture tags so suggestion tests start with a full list. */
const FOUR_TAGS: TagFixture[] = [
    { id: "fix-1", label: "alpha", color: "#6366f1" },
    { id: "fix-2", label: "beta", color: "#22c55e" },
    { id: "fix-3", label: "gamma", color: "#f59e0b" },
    { id: "fix-4", label: "delta", color: "#ef4444" }
];

// ─── Tests ────────────────────────────────────────────────────────────────────

context("ADR Tags", () => {
    // ── 1. Visibility ──────────────────────────────────────────────────────────
    context("Tag bar visibility", () => {
        it("is visible in basic mode without any tags yet", () => {
            openFreshAdr();
            cy.get("[data-cy=tag-picker]").should("be.visible");
            cy.get("[data-cy=tag-add-btn]").should("be.visible");
        });

        it("is visible in professional mode without any tags yet", () => {
            openFreshAdr();
            cy.get("[data-cy=modeProfessional]").click();
            cy.get("[data-cy=tag-picker]").should("be.visible");
            cy.get("[data-cy=tag-add-btn]").should("be.visible");
        });
    });

    // ── 2. Dropdown open / close ───────────────────────────────────────────────
    context("Dropdown open and close", () => {
        beforeEach(openFreshAdr);

        it("opens the picker dropdown when 'Add tag' is clicked", () => {
            cy.get("[data-cy=tag-menu]").should("not.exist");
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-menu]").should("be.visible");
        });

        it("closes the dropdown when 'Add tag' is clicked a second time", () => {
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-menu]").should("be.visible");
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-menu]").should("not.exist");
        });

        it("closes the dropdown when clicking outside", () => {
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-menu]").should("be.visible");
            cy.get("body").click(0, 0);
            cy.get("[data-cy=tag-menu]").should("not.exist");
        });
    });

    // ── 3. Creating a tag ──────────────────────────────────────────────────────
    context("Creating a tag", () => {
        beforeEach(openFreshAdr);

        it("Create button is disabled when the label input is empty", () => {
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-create-btn]").should("be.disabled");
        });

        it("Create button becomes enabled after typing a label", () => {
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-new-label]").type(LABEL_A);
            cy.get("[data-cy=tag-create-btn]").should("not.be.disabled");
        });

        it("creates a tag with the first palette color by default", () => {
            cy.get("[data-cy=tag-add-btn]").click();
            // First swatch should be selected by default
            cy.get("[data-cy=tag-swatch]").first().should("have.class", "selected");
            cy.get("[data-cy=tag-new-label]").type(LABEL_A);
            cy.get("[data-cy=tag-create-btn]").click();
            cy.get("[data-cy=tag-chip]").should("have.length", 1);
        });

        it("creates a tag with a custom color selected from the palette", () => {
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-swatch]").eq(2).click();
            cy.get("[data-cy=tag-swatch]").eq(2).should("have.class", "selected");
            cy.get("[data-cy=tag-new-label]").type(LABEL_A);
            cy.get("[data-cy=tag-create-btn]").click();
            cy.get("[data-cy=tag-chip]").should("have.length", 1);
        });

        it("pressing Enter in the label field creates the tag", () => {
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-new-label]").type(`${LABEL_A}{enter}`);
            cy.get("[data-cy=tag-chip]").should("have.length", 1);
            cy.get("[data-cy=tag-chip]").contains(LABEL_A);
        });

        it("closes the dropdown automatically after creating a tag", () => {
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-new-label]").type(LABEL_A);
            cy.get("[data-cy=tag-create-btn]").click();
            cy.get("[data-cy=tag-menu]").should("not.exist");
        });

        it("resets the label input to empty after creating a tag", () => {
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-new-label]").type(LABEL_A);
            cy.get("[data-cy=tag-create-btn]").click();
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-new-label]").should("have.value", "");
        });

        it("multiple tags can be added to the same ADR", () => {
            createTagViaUI(LABEL_A);
            createTagViaUI(LABEL_B);
            cy.get("[data-cy=tag-chip]").should("have.length", 2);
            cy.get("[data-cy=tag-chip]").contains(LABEL_A);
            cy.get("[data-cy=tag-chip]").contains(LABEL_B);
        });
    });

    // ── 4. Tag chip display and removal ───────────────────────────────────────
    context("Tag chip", () => {
        beforeEach(() => {
            openFreshAdr();
            createTagViaUI(LABEL_A);
        });

        it("displays the tag label inside the chip", () => {
            cy.get("[data-cy=tag-chip]").contains(LABEL_A);
        });

        it("chip contains the colored dot element", () => {
            cy.get("[data-cy=tag-chip] .tag-dot").should("exist");
        });

        it("shows a remove button on the chip", () => {
            cy.get("[data-cy=tag-remove]").should("exist");
        });

        it("removes the chip when the × button is clicked", () => {
            cy.get("[data-cy=tag-chip]").should("have.length", 1);
            cy.get("[data-cy=tag-remove]").click();
            cy.get("[data-cy=tag-chip]").should("not.exist");
        });

        it("removing one tag leaves the other tags intact", () => {
            createTagViaUI(LABEL_B);
            cy.get("[data-cy=tag-chip]").should("have.length", 2);
            // Remove only the first chip
            cy.get("[data-cy=tag-chip]").first().find("[data-cy=tag-remove]").click();
            cy.get("[data-cy=tag-chip]").should("have.length", 1);
            cy.get("[data-cy=tag-chip]").contains(LABEL_B);
        });
    });

    // ── 5. Markdown embedding ──────────────────────────────────────────────────
    context("Markdown embedding", () => {
        beforeEach(openFreshAdr);

        it("writes an HTML comment into the raw markdown when a tag is added", () => {
            createTagViaUI(LABEL_A);
            cy.get("[data-cy=previewTabRaw]").click();
            cy.get("[data-cy=markdownText]").should("contain", "<!-- adr-manager-tags:");
            cy.get("[data-cy=markdownText]").should("contain", `"label":"${LABEL_A}"`);
        });

        it("includes the tag color in the markdown comment", () => {
            // Pick the second palette color before creating
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-swatch]").eq(1).click();
            cy.get("[data-cy=tag-new-label]").type(LABEL_A);
            cy.get("[data-cy=tag-create-btn]").click();

            cy.get("[data-cy=previewTabRaw]").click();
            cy.get("[data-cy=markdownText]").should("contain", '"color":');
        });

        it("tag comment survives a title edit without being removed", () => {
            createTagViaUI(LABEL_A);
            cy.get("[data-cy=titleAdr]").clear().type("Edited Title");
            cy.get("[data-cy=previewTabRaw]").click();
            cy.get("[data-cy=markdownText]").should("contain", "<!-- adr-manager-tags:");
            cy.get("[data-cy=markdownText]").should("contain", `"label":"${LABEL_A}"`);
        });

        it("multiple tags are serialised together in exactly one comment", () => {
            createTagViaUI(LABEL_A);
            createTagViaUI(LABEL_B);
            cy.get("[data-cy=previewTabRaw]").click();
            cy.get("[data-cy=markdownText]").should("contain", `"label":"${LABEL_A}"`);
            cy.get("[data-cy=markdownText]").should("contain", `"label":"${LABEL_B}"`);
            cy.get("[data-cy=markdownText]")
                .invoke("text")
                .then((text) => {
                    const count = (text.match(/<!-- adr-manager-tags:/g) ?? []).length;
                    expect(count).to.equal(1);
                });
        });

        it("removing a tag removes it from the markdown comment", () => {
            createTagViaUI(LABEL_A);
            cy.get("[data-cy=tag-remove]").click();
            cy.get("[data-cy=previewTabRaw]").click();
            cy.get("[data-cy=markdownText]").should("not.contain", `"label":"${LABEL_A}"`);
        });

        it("removing all tags removes the entire comment from the markdown", () => {
            createTagViaUI(LABEL_A);
            cy.get("[data-cy=tag-remove]").click();
            cy.get("[data-cy=previewTabRaw]").click();
            cy.get("[data-cy=markdownText]").should("not.contain", "<!-- adr-manager-tags:");
        });

        it("no tag comment appears in the markdown when no tags are set", () => {
            cy.get("[data-cy=previewTabRaw]").click();
            cy.get("[data-cy=markdownText]").should("not.contain", "<!-- adr-manager-tags:");
        });
    });

    // ── 6. Suggestions recently used tags ───────────────────────────────────
    context("Suggestions (recently used tags)", () => {
        it("shows no suggestions on a completely fresh session", () => {
            openFreshAdr();
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").should("not.exist");
        });

        it("shows a 'Recently used' section only when there are suggestions", () => {
            openFreshAdr();
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-menu]").should("not.contain", "Recently used");

            cy.get("[data-cy=tag-new-label]").type(LABEL_A);
            cy.get("[data-cy=tag-create-btn]").click();

            cy.get("[data-cy=newADR]").click({ force: true });
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-menu]").should("contain", "Recently used");
        });

        it("a created tag appears as a suggestion on the next ADR", () => {
            openFreshAdr();
            createTagViaUI(LABEL_A);

            cy.get("[data-cy=newADR]").click({ force: true });
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").should("have.length", 1);
            cy.get("[data-cy=tag-suggestion]").contains(LABEL_A);
        });

        it("clicking a suggestion assigns it to the current ADR", () => {
            openFreshAdr();
            createTagViaUI(LABEL_A);

            cy.get("[data-cy=newADR]").click({ force: true });
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").contains(LABEL_A).click();
            cy.get("[data-cy=tag-chip]").should("have.length", 1);
            cy.get("[data-cy=tag-chip]").contains(LABEL_A);
        });

        it("clicking a suggestion closes the dropdown", () => {
            openFreshAdr();
            createTagViaUI(LABEL_A);

            cy.get("[data-cy=newADR]").click({ force: true });
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").first().click();
            cy.get("[data-cy=tag-menu]").should("not.exist");
        });

        it("already-assigned tags do not appear in the suggestions list", () => {
            openFreshAdrWith({ recentTags: JSON.stringify(FOUR_TAGS) });
            cy.get("[data-cy=tag-add-btn]").click();
            // Assign the first suggestion
            cy.get("[data-cy=tag-suggestion]").first().click();
            // Reopen picker assigned tag must not appear
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").should("have.length", 3);
        });

        it("suggestions list is capped at 4 even with more tags in localStorage", () => {
            // Pre-populate 4; creating a 5th via UI must evict the oldest.
            openFreshAdrWith({ recentTags: JSON.stringify(FOUR_TAGS) });
            createTagViaUI("epsilon");

            cy.get("[data-cy=newADR]").click({ force: true });
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").should("have.length", 4);
        });

        it("the most recently created tag is the first suggestion on the next ADR", () => {
            openFreshAdrWith({
                recentTags: JSON.stringify([
                    { id: "r1", label: "alpha", color: "#6366f1" },
                    { id: "r2", label: "beta", color: "#22c55e" },
                    { id: "r3", label: "gamma", color: "#f59e0b" }
                ])
            });
            createTagViaUI("newFirst");

            cy.get("[data-cy=newADR]").click({ force: true });
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").first().contains("newFirst");
        });

        it("using a suggestion promotes it to the front of the recent list on the next ADR", () => {
            openFreshAdrWith({ recentTags: JSON.stringify(FOUR_TAGS) });

            // Use "delta" (last in the fixture list) from suggestions
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").contains("delta").click();

            cy.get("[data-cy=newADR]").click({ force: true });
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").first().contains("delta");
        });

        it("persists the recent tags list to localStorage after tag creation", () => {
            openFreshAdr();
            createTagViaUI(LABEL_A);
            cy.window()
                .its("localStorage")
                .invoke("getItem", "recentTags")
                .then((raw) => {
                    const saved = JSON.parse(raw!) as TagFixture[];
                    expect(saved.length).to.be.at.least(1);
                    expect(saved[0]!.label).to.equal(LABEL_A);
                });
        });

        it("persists the recent tags list to localStorage after using a suggestion", () => {
            openFreshAdrWith({ recentTags: JSON.stringify(FOUR_TAGS) });
            cy.get("[data-cy=tag-add-btn]").click();
            cy.get("[data-cy=tag-suggestion]").contains("beta").click();

            cy.window()
                .its("localStorage")
                .invoke("getItem", "recentTags")
                .then((raw) => {
                    const saved = JSON.parse(raw!) as TagFixture[];
                    // "beta" must now be at the front
                    expect(saved[0]!.label).to.equal("beta");
                });
        });
    });
});
