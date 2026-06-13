import { TEST_BASE_URL } from "../../support/e2e";

context("Listing and adding repositories", () => {
    beforeEach(() => {
        cy.visitAuthenticatedManager(TEST_BASE_URL);
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
            cy.wait("@showRepos", { timeout: 15000 });
            cy.get("[data-cy=repoNameList]").children().should("have.length", numberOfAddedRepositories);
        });
    });
});
