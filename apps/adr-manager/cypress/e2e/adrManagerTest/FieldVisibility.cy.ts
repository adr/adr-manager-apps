import { TEST_BASE_URL, REST_LIST_REPO_URL } from "../../support/e2e";

// Helper: navigate to a new professional-mode ADR.
function openNewProfessionalAdr() {
    window.localStorage.clear();
    window.localStorage.setItem("authId", Cypress.env("OAUTH_E2E_AUTH_ID"));
    window.localStorage.setItem("user", Cypress.env("USER"));
    window.localStorage.setItem("tourSeen", "1");
    cy.visit(TEST_BASE_URL);
    cy.intercept("GET", REST_LIST_REPO_URL).as("getRepos");
    cy.get("[data-cy=addRepo]").click();
    cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
    cy.get("[data-cy=addRepoDialog]").click();
    cy.get("[data-cy=newADR]").click({ force: true });
    cy.get("[data-cy=modeProfessional]").click();
}

/**
 * Navigate to a new professional ADR without touching the fieldVisibility key in
 * localStorage.  Auth credentials are (re-)set so the app can start, but any
 * previously-stored field-visibility settings are preserved exactly as they were.
 */
function openNewProfessionalAdrKeepFieldVisibility() {
    window.localStorage.setItem("authId", Cypress.env("OAUTH_E2E_AUTH_ID"));
    window.localStorage.setItem("user", Cypress.env("USER"));
    window.localStorage.setItem("tourSeen", "1");
    // The repo was already added by the preceding openNewProfessionalAdr() call,
    // so addedRepositories is still in localStorage. Reload the app and use the
    // existing repo directly — no need to go through the Add Repositories dialog.
    cy.visit(TEST_BASE_URL);
    cy.get("[data-cy=newADR]").click({ force: true });
    cy.get("[data-cy=modeProfessional]").click();
}

context("Field Visibility", () => {
    context("Fields panel", () => {
        beforeEach(openNewProfessionalAdr);

        it("is not shown in basic mode", () => {
            cy.get("[data-cy=modeBasic]").click();
            cy.get("[data-cy=fieldsBtn]").should("not.exist");
        });

        it("opens and closes via the Fields button", () => {
            cy.get("[data-cy=fvp-panel]").should("not.exist");
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-panel]").should("be.visible");
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-panel]").should("not.exist");
        });

        it("closes when clicking outside the panel", () => {
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-panel]").should("be.visible");
            cy.get("body").click(0, 0);
            cy.get("[data-cy=fvp-panel]").should("not.exist");
        });
    });

    context("MADR 2.1.2 — field toggles", () => {
        beforeEach(openNewProfessionalAdr);

        it("shows all 2.1.2 fields by default and never shows 4.0.0-only fields", () => {
            cy.get("[data-cy=dateAdr]").should("exist");
            cy.get("[data-cy=authorPro]").should("exist");
            cy.get("[data-cy=consultedPro]").should("not.exist");
            cy.get("[data-cy=informedPro]").should("not.exist");
            cy.get("[data-cy=decisionMakersPro]").should("not.exist");
        });

        it("regression: toggling Deciders off does not reveal Consulted or Informed", () => {
            cy.get("[data-cy=authorPro]").should("exist");
            cy.get("[data-cy=consultedPro]").should("not.exist");
            cy.get("[data-cy=informedPro]").should("not.exist");

            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-deciders]").click();
            cy.get("body").click(0, 0);

            cy.get("[data-cy=authorPro]").should("not.exist");
            cy.get("[data-cy=consultedPro]").should("not.exist");
            cy.get("[data-cy=informedPro]").should("not.exist");
        });

        it("toggling Deciders off then back on restores the field", () => {
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-deciders]").click();
            cy.get("body").click(0, 0);
            cy.get("[data-cy=authorPro]").should("not.exist");

            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-deciders]").click();
            cy.get("body").click(0, 0);
            cy.get("[data-cy=authorPro]").should("exist");
        });

        it("toggling Date off hides the date field", () => {
            cy.get("[data-cy=dateAdr]").should("exist");
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-date]").click();
            cy.get("body").click(0, 0);
            cy.get("[data-cy=dateAdr]").should("not.exist");
        });

        it("toggling multiple fields off hides all of them independently", () => {
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-date]").click();
            cy.get("[data-cy=fvp-toggle-deciders]").click();
            cy.get("body").click(0, 0);
            cy.get("[data-cy=dateAdr]").should("not.exist");
            cy.get("[data-cy=authorPro]").should("not.exist");
        });

        it("hidden Deciders field is excluded from the raw markdown", () => {
            cy.get("[data-cy=authorPro]").type("Alice");

            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-deciders]").click();
            cy.get("body").click(0, 0);

            cy.get("[data-cy=previewTabRaw]").click();
            cy.get("[data-cy=markdownText]").should("not.contain", "Alice");
            cy.get("[data-cy=markdownText]").should("not.contain", "Deciders");
        });
    });

    context("MADR 4.0.0 — field toggles", () => {
        beforeEach(() => {
            openNewProfessionalAdr();
            cy.get("[data-cy=versionSelect]").click();
            cy.get("[data-cy=versionOption]").contains("MADR 4.0.0").click();
        });

        it("shows Consulted and Informed by default and not the 2.1.2 Deciders field", () => {
            cy.get("[data-cy=consultedPro]").should("exist");
            cy.get("[data-cy=informedPro]").should("exist");
            cy.get("[data-cy=decisionMakersPro]").should("exist");
            cy.get("[data-cy=authorPro]").should("not.exist");
        });

        it("toggling Consulted off hides only Consulted, leaving Informed visible", () => {
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-consulted]").click();
            cy.get("body").click(0, 0);
            cy.get("[data-cy=consultedPro]").should("not.exist");
            cy.get("[data-cy=informedPro]").should("exist");
        });

        it("toggling Informed off hides only Informed, leaving Consulted visible", () => {
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-informed]").click();
            cy.get("body").click(0, 0);
            cy.get("[data-cy=informedPro]").should("not.exist");
            cy.get("[data-cy=consultedPro]").should("exist");
        });

        it("toggling Decision-makers (deciders key) off hides Decision-makers but not Consulted or Informed", () => {
            cy.get("[data-cy=decisionMakersPro]").should("exist");
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-deciders]").click();
            cy.get("body").click(0, 0);
            cy.get("[data-cy=decisionMakersPro]").should("not.exist");
            cy.get("[data-cy=consultedPro]").should("exist");
            cy.get("[data-cy=informedPro]").should("exist");
        });

        it("hidden Consulted field is excluded from the raw markdown (MADR 4.0.0)", () => {
            cy.get("[data-cy=consultedPro]").type("Data Guild");

            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-consulted]").click();
            cy.get("body").click(0, 0);

            cy.get("[data-cy=previewTabRaw]").click();
            cy.get("[data-cy=markdownText]").should("not.contain", "Data Guild");
            cy.get("[data-cy=markdownText]").should("not.contain", "consulted:");
        });
    });

    context("Field visibility persistence", () => {
        it("persists a toggle to localStorage immediately after the change", () => {
            openNewProfessionalAdr();

            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-date]").click();
            cy.get("body").click(0, 0);

            // The store should have written to localStorage right away
            cy.window().its("localStorage").invoke("getItem", "fieldVisibility").then((raw) => {
                const saved = JSON.parse(raw!);
                expect(saved.date).to.equal(false);
            });
        });

        it("loads persisted field-visibility from localStorage when a new ADR is opened", () => {
            // Pre-populate localStorage with a non-default visibility (date hidden)
            window.localStorage.setItem("authId", Cypress.env("OAUTH_E2E_AUTH_ID"));
            window.localStorage.setItem("user", Cypress.env("USER"));
            window.localStorage.setItem("tourSeen", "1");
            window.localStorage.setItem(
                "fieldVisibility",
                JSON.stringify({
                    date: false,
                    status: true,
                    deciders: true,
                    technicalStory: true,
                    decisionDrivers: true,
                    optionDescription: true,
                    optionProsAndCons: true,
                    positiveConsequences: true,
                    negativeConsequences: true,
                    consequences: true,
                    confirmation: true,
                    links: true,
                    moreInformation: true,
                    consulted: true,
                    informed: true
                })
            );

            cy.visit(TEST_BASE_URL);
            cy.intercept("GET", REST_LIST_REPO_URL).as("getRepos");
            cy.get("[data-cy=addRepo]").click();
            cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
            cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
            cy.get("[data-cy=addRepoDialog]").click();
            cy.get("[data-cy=newADR]").click({ force: true });
            cy.get("[data-cy=modeProfessional]").click();

            // Date field should be hidden because the store loaded date=false from localStorage
            cy.get("[data-cy=dateAdr]").should("not.exist");
            // Other fields remain visible
            cy.get("[data-cy=authorPro]").should("exist");
        });

        it("field visibility persists when opening a second professional ADR in the same session", () => {
            openNewProfessionalAdr();

            // Toggle Date off in the first ADR
            cy.get("[data-cy=fieldsBtn]").click();
            cy.get("[data-cy=fvp-toggle-date]").click();
            cy.get("body").click(0, 0);
            cy.get("[data-cy=dateAdr]").should("not.exist");

            // Open another new professional ADR without clearing localStorage
            openNewProfessionalAdrKeepFieldVisibility();

            // The store is global so Date must still be hidden
            cy.get("[data-cy=dateAdr]").should("not.exist");
        });
    });
});
