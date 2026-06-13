import { TEST_BASE_URL } from "../../support/e2e";
context("Routing and correct URLs", () => {
    beforeEach(() => {
        cy.visitAuthenticatedManager(TEST_BASE_URL);
    });
    it("URL corresponds to opened repo and ADR", () => {
        cy.url().should("equal", TEST_BASE_URL);
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
        cy.get("[data-cy=addRepoDialog]").click();
        cy.url().should(
            "equal",
            `${TEST_BASE_URL}/adr/adr-manager/main/0000-use-markdown-architectural-decision-records.md`
        );
        cy.get("[data-cy=adrList]").then((adrList) => {
            const adrCount = Cypress.$(adrList).length;
            expect(adrCount).to.be.greaterThan(3);
            cy.get("[data-cy=newADR]").click({ force: true });
            cy.url().should("equal", `${TEST_BASE_URL}/adr/adr-manager/main/${String(adrCount).padStart(4, "0")}-.md`);
            cy.get("[data-cy=deleteAdrBtn]").each(($el) => {
                cy.wrap($el).click({ force: true });
                cy.get("[data-cy=dialogDeleteAdrBtn]").click();
            });
            cy.url().should("equal", `${TEST_BASE_URL}/adr/adr-manager/main`);
        });
    });

    it("Redirect to /login if localStorage does not contain the authId", () => {
        cy.url().should("contain", TEST_BASE_URL);
        cy.clearLocalStorage();
        cy.reload();
        cy.url().should("contain", "#/login");
    });
});
