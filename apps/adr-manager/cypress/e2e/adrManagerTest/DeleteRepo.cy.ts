import { TEST_BASE_URL } from "../../support/e2e";

context("Deleting repositories", () => {
    it("Remove a repo", () => {
        cy.visitAuthenticatedManager(TEST_BASE_URL);
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
        cy.get("[data-cy=addRepoDialog]").click();
        cy.get("[data-cy=removeRepo]").click({ force: true });
        cy.get("[data-cy=removeRepoBtn]").click();
        cy.get("[data-cy=listRepo]").should("have.length", 0);
        cy.get("[data-cy=addRepo]").should(() => {
            expect(localStorage.getItem("addedRepositories")).to.eq("[]");
        });
    });
});
