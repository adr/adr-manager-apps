import { TEST_BASE_URL } from "../../support/e2e";

// The tour runs entirely on injected demo state, so a dummy authId is enough
// (the auth guard only checks that the key exists).
function visitFreshManager(): void {
    window.localStorage.clear();
    window.localStorage.setItem("authId", "tour-e2e-dummy");
    cy.visit(TEST_BASE_URL);
}

context("First-time tour", () => {
    it("offers the tour once and remembers a decline", () => {
        visitFreshManager();
        cy.get("[data-cy=tourDecline]").click();
        cy.get("[data-cy=tourPopover]").should("not.exist");
        cy.reload();
        cy.get("[data-cy=tourDecline]").should("not.exist");
        cy.get("[data-cy=tourAccept]").should("not.exist");
    });

    it("walks through every step on demo state without persisting it", () => {
        visitFreshManager();
        cy.get("[data-cy=tourAccept]").click();

        cy.get("[data-cy=tourPopover]").should("be.visible");
        cy.get("[data-cy=tourStepTitle]").should("contain", "Architectural Decision Records");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Your repositories");
        cy.get("[data-cy=repoHead]").should("contain", "tour-sample");
        cy.should(() => {
            expect(localStorage.getItem("addedRepositories") ?? "").to.not.contain("demo/tour-sample");
        });

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Search ADRs");
        cy.get("[data-cy=adr-filter-toggle]").should("be.visible");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Filter ADRs");
        cy.get("[data-cy=adr-filter-panel]").should("be.visible");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Apply a filter");
        cy.get("[data-cy=adr-filter-panel] .filter-chip.active").should("have.length", 1);

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=adr-filter-panel]").should("not.exist");
        cy.get("[data-cy=tourStepTitle]").should("contain", "Switch repositories");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Delete an ADR");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Create a new ADR");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Choose the MADR version");
        cy.get("[data-cy=versionSelect]").should("contain", "MADR 2.1.2");
        cy.get("[data-cy=versionOption]").should("have.length.greaterThan", 1);

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=versionOption]").should("not.exist");
        cy.get("[data-cy=tourStepTitle]").should("contain", "Edit with structured fields");
        cy.get("[data-cy=titleAdr]").should("exist");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Toggle optional fields");
        cy.get("[data-cy=decisionDriversPro]").should("exist");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Customize visible fields");
        cy.get("[data-cy=fieldsBtn]").should("be.visible");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Live Markdown preview");
        cy.get("[data-cy=decisionDriversPro]").should("not.exist");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "Commit your changes");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourStepTitle]").should("contain", "That's the tour");
        cy.get("[data-cy=tourNext]").should("contain", "Done");

        cy.get("[data-cy=tourNext]").click();
        cy.get("[data-cy=tourPopover]").should("not.exist");
        cy.get("[data-cy=repoHead]").should("not.exist");
        cy.get("[data-cy=addRepo]").should("exist");
        cy.should(() => {
            expect(localStorage.getItem("addedRepositories") ?? "").to.not.contain("demo/tour-sample");
        });
        cy.url().should("match", /#\/manager$/);
    });

    it("can be replayed from the topbar help button and dismissed with Escape", () => {
        visitFreshManager();
        cy.get("[data-cy=tourDecline]").click();
        cy.get("[data-cy=tourDecline]").should("not.exist");

        cy.get("[data-cy=startTour]").click();
        cy.get("[data-cy=tourPopover]").should("be.visible");

        cy.get("body").type("{esc}");
        cy.get("[data-cy=tourPopover]").should("not.exist");
        cy.get("[data-cy=repoHead]").should("not.exist");
    });
});
