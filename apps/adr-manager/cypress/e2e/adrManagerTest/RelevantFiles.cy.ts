import { TEST_BASE_URL, REST_LIST_REPO_URL } from "../../support/e2e";

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

context("Relevant Files", () => {
    beforeEach(openNewProfessionalAdr);

    it("is shown in professional mode and hidden in basic mode", () => {
        cy.get("[data-cy=relevantFilesSection]").should("exist");
        cy.get("[data-cy=modeBasic]").click();
        cy.get("[data-cy=relevantFilesSection]").should("not.exist");
    });

    it("can be toggled off and back on via the Fields panel", () => {
        cy.get("[data-cy=relevantFilesSection]").should("exist");

        cy.get("[data-cy=fieldsBtn]").click();
        cy.get("[data-cy=fvp-toggle-relevantFiles]").click();
        cy.get("body").click(0, 0);
        cy.get("[data-cy=relevantFilesSection]").should("not.exist");

        cy.get("[data-cy=fieldsBtn]").click();
        cy.get("[data-cy=fvp-toggle-relevantFiles]").click();
        cy.get("body").click(0, 0);
        cy.get("[data-cy=relevantFilesSection]").should("exist");
    });

    it("links a file via the picker and serializes it to the markdown", () => {
        cy.get("[data-cy=relevantFilesPick]").click();
        cy.get("[data-cy=relevantFilesSearch]").type("README");
        cy.get("[data-cy=relevantFilesResults] input[type=checkbox]").first().check();
        cy.get("[data-cy=relevantFilesApply]").click();

        cy.get("[data-cy=relevantFileLink]").should("contain", "README.md");
        cy.get("[data-cy=relevantFileLink]")
            .should("have.attr", "href")
            .and("include", "/blob/")
            .and("include", "README.md");
        cy.get("[data-cy=relevantFileMissing]").should("not.exist");

        cy.get("[data-cy=previewTabRaw]").click();
        cy.get("[data-cy=markdownText]").should("contain", "## Relevant Files");
        cy.get("[data-cy=markdownText]").should("contain", "README.md");
    });

    it("removes a linked file again", () => {
        cy.get("[data-cy=relevantFilesPick]").click();
        cy.get("[data-cy=relevantFilesSearch]").type("README");
        cy.get("[data-cy=relevantFilesResults] input[type=checkbox]").first().check();
        cy.get("[data-cy=relevantFilesApply]").click();
        cy.get("[data-cy=relevantFileLink]").should("exist");

        cy.get("[data-cy=relevantFileRemove]").click({ force: true });
        cy.get("[data-cy=relevantFileLink]").should("not.exist");
        cy.get("[data-cy=previewTabRaw]").click();
        cy.get("[data-cy=markdownText]").should("not.contain", "## Relevant Files");
    });

    it("warns for a linked file that does not exist in the repository", () => {
        cy.get("[data-cy=previewTabRaw]").click();
        cy.get("[data-cy=markdownText]").click().type("{ctrl+a}{del}");
        cy.get("[data-cy=markdownText]")
            .click()
            .type(
                '# Test ADR\n## Context and Problem Statement\nContext.\n## Considered Options\n* A\n## Decision Outcome\nChosen option: "A", because best.\n## Relevant Files\n* does/not/exist.ts'
            );
        // The typed markdown is parseable but not byte-canonical, so the convert view appears.
        cy.get("[data-cy=acceptDiv]").click();

        cy.get("[data-cy=relevantFileLink]").should("contain", "does/not/exist.ts");
        cy.get("[data-cy=relevantFileMissing]").should("exist");
    });

    it("hidden relevant files are excluded from the raw markdown", () => {
        cy.get("[data-cy=relevantFilesPick]").click();
        cy.get("[data-cy=relevantFilesSearch]").type("README");
        cy.get("[data-cy=relevantFilesResults] input[type=checkbox]").first().check();
        cy.get("[data-cy=relevantFilesApply]").click();

        cy.get("[data-cy=fieldsBtn]").click();
        cy.get("[data-cy=fvp-toggle-relevantFiles]").click();
        cy.get("body").click(0, 0);

        cy.get("[data-cy=previewTabRaw]").click();
        cy.get("[data-cy=markdownText]").should("not.contain", "## Relevant Files");
    });
});
