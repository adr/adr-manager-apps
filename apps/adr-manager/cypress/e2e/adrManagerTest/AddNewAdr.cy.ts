import { TEST_BASE_URL } from "../../support/e2e";

context("Adding a new ADR to a repo", () => {
    it("Create a new ADR", () => {
        cy.visitAuthenticatedManager(TEST_BASE_URL);
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
        cy.get("[data-cy=addRepoDialog]").click();

        // Creating an ADR appends one entry to the list and persists the repository.
        cy.get("[data-cy=adrList]")
            .its("length")
            .then((adrCount) => {
                cy.get("[data-cy=newADR]").click({ force: true });
                cy.get("[data-cy=adrList]").should("have.length", adrCount + 1);
            });
        cy.get("[data-cy=adrList]").should(() => {
            expect(localStorage.getItem("addedRepositories")).to.not.eq("[]");
        });

        cy.get("[data-cy=titleAdr]").click();
        cy.get("[data-cy=titleAdr]").type("TestTitle");
        cy.get("[data-cy=contextAdr]").click();
        cy.get("[data-cy=contextAdr]").type("ContextAdr");
        cy.addConsideredOption("Con. Opt 1)");
        cy.get(".opt-card").should("have.length", 2);
        cy.get("[data-cy=decOutChooseAdr]").click();
        cy.get("[data-cy=chosenOptionItem]").contains("Con. Opt 1)").click();
        cy.get("[data-cy=checkConsOptAdr]").should("exist");
        cy.get("[data-cy=decOutBecAdr]").click();
        cy.get("[data-cy=decOutBecAdr]").type("it has to be");

        // The entered values must reach the ADR's persisted markdown in localStorage.
        cy.get("[data-cy=adrList]").should(() => {
            const stored = localStorage.getItem("addedRepositories") ?? "";
            expect(stored).to.contain("# TestTitle");
            expect(stored).to.contain("ContextAdr");
            expect(stored).to.contain("Con. Opt 1)");
            expect(stored).to.contain("it has to be");
        });
    });
});
