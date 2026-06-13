import { TEST_BASE_URL } from "../../support/e2e";

context("Switching the MADR template version", () => {
    it("Switch a new ADR to MADR 4.0.0 and fill the 4.0 fields", () => {
        cy.visitAuthenticatedManager(TEST_BASE_URL);
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
        cy.get("[data-cy=addRepoDialog]").click();
        cy.get("[data-cy=newADR]").click({ force: true });
        cy.get("[data-cy=modeProfessional]").click();

        cy.get("[data-cy=versionSelect]").click();
        cy.get("[data-cy=versionOption]").contains("MADR 4.0.0").click();
        cy.get("[data-cy=versionSelect]").should("contain", "MADR 4.0.0");

        cy.get("[data-cy=decisionMakersPro]").type("Max");
        cy.get("[data-cy=consultedPro]").type("Data Guild");
        cy.get("[data-cy=informedPro]").type("Backend Chapter");
        cy.get("[data-cy=confirmationPro]").type("Verified in review");
        cy.get("[data-cy=moreInformationPro]").type("Revisit next year");
        cy.get("[data-cy=consequenceAddInput]").type("S");
        cy.focused().type("trong consistency");
        cy.get("[data-cy=consequenceInput]").should("have.length", 1);

        // The raw markdown now follows the 4.0.0 template with YAML front matter.
        cy.get("[data-cy=previewTabRaw]").click();
        cy.get("[data-cy=markdownText]").should("contain", "decision-makers: Max");
        cy.get("[data-cy=markdownText]").should("contain", "### Confirmation");
        cy.get("[data-cy=markdownText]").should("contain", "## More Information");

        cy.get("[data-cy=versionSelect]").click();
        cy.get("[data-cy=versionOption]").contains("MADR 2.1.2").click();
        cy.get("[data-cy=markdownText]").should("contain", "* Deciders: Max");
    });
});
