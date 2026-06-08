import { TEST_BASE_URL, REST_LIST_REPO_URL } from "../../support/e2e";

context("Adding a new ADR to a repo", () => {
    it("Create a new ADR", () => {
        window.localStorage.clear();
        window.localStorage.setItem("authId", Cypress.env("OAUTH_E2E_AUTH_ID"));
        window.localStorage.setItem("user", Cypress.env("USER"));
        cy.visit(TEST_BASE_URL);
        cy.intercept("GET", REST_LIST_REPO_URL).as("getRepos");
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();

        cy.get("[data-cy=addRepoDialog]").click();
        cy.get("[data-cy=repoNameList]").click();
        cy.get("[data-cy=adrList]").then((adrList) => {
            const adrCount = Cypress.$(adrList).length;
            cy.get("[data-cy=newADR]").click({ force: true });
            cy.get("[data-cy=adrList]").should("have.length", adrCount + 1);
            cy.get("[data-cy=adrList]").should(() => {
                expect(localStorage.getItem("addedRepositories")).to.not.eq("[]");
            });
            cy.get("[data-cy=titleAdr]").click();
            cy.get("[data-cy=titleAdr]").type("TestTitle");
            cy.get("[data-cy=contextAdr]").click();
            cy.get("[data-cy=contextAdr] textarea").eq(1).type("ContextAdr", {
                force: true
            });
            cy.get("[data-cy=considerOptTextAdr]").children().eq(1).type("Con. Opt 1)").should("have.length", 1);
            cy.get("[data-cy=considerOptTextAdr]").children().should("have.length", 2);
            cy.get("[data-cy=decOutChooseAdr]").click();
            cy.get(".v-list-item__title").contains("Con. Opt 1)").click();
            cy.get("[data-cy=checkConsOptAdr]").should("be.visible");
            cy.get("[data-cy=decOutBecAdr]").click();
            cy.get("[data-cy=decOutBecAdr]").type("it has to be");
        });
    });
});
