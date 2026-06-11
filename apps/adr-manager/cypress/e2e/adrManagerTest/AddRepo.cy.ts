import { REST_LIST_REPO_URL, TEST_BASE_URL, REST_REPO_URL } from "../../support/e2e";

context("Listing and adding repositories", () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.localStorage.setItem("authId", Cypress.env("OAUTH_E2E_AUTH_ID"));
        window.localStorage.setItem("tourSeen", "1");
        window.localStorage.setItem("user", Cypress.env("USER"));
        cy.visit(TEST_BASE_URL);
        cy.intercept("GET", REST_LIST_REPO_URL).as("getRepos");
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
    });
    it("Check if at least 1 repository is displayed", () => {
        cy.get("[data-cy=listRepo]").should("have.length.greaterThan", 0);
    });
    it("Add all repositories", () => {
        cy.get("[data-cy=listRepo]").then(() => {
            const numberOfAddedRepositories = 3;
            let counter = 0;
            cy.get("[data-cy=listRepo]").each(() => {
                counter++;
                if (counter > numberOfAddedRepositories) {
                    return;
                }
                cy.get("[data-cy=listRepo]").eq(0).click();
            });
            cy.get("[data-cy=addRepoDialog]").click();
            cy.intercept("GET", REST_REPO_URL).as("showRepos");
            cy.wait("@showRepos", { timeout: 15000 });
            cy.get("[data-cy=repoNameList]").children().should("have.length", numberOfAddedRepositories);
        });
    });
});
