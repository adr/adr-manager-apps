import { TEST_BASE_URL } from "../../support/e2e";

function replaceRawMarkdown(markdown: string): void {
    cy.get("[data-cy=markdownText] .cm-content").click({ force: true }).type("{selectall}{del}", { force: true });
    cy.get("[data-cy=markdownText] .cm-content").type(markdown, { force: true, delay: 0 });
}

context("Using Markdown modes", () => {
    it("Convert raw Markdown", () => {
        cy.visitAuthenticatedManager(TEST_BASE_URL);
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
        cy.get("[data-cy=addRepoDialog]").click();
        cy.get("[data-cy=newADR]").click({ force: true });
        cy.get("[data-cy=previewTabRaw]").click();
        replaceRawMarkdown(
            "# ADR-Manager Test\n> All artefacts related to a research project to propose a tool-supported approach for the efficient creation and management of [architectural decision records (ADRs)](https://adr.github.io) via a graphical user interface (GUI)\n## Developer Instructions"
        );
        // Markdown that cannot be parsed without loss replaces the form with the convert view.
        cy.get("[data-cy=convertEditor]").should(($editor) => {
            expect($editor).to.contain("https://github.com/adr/madr/blob/master/template/template.md");
            expect($editor).to.contain("Your ADR");
            expect($editor).to.contain("Result");
        });
        cy.get("[data-cy=acceptDiv]").click();
        cy.get("[data-cy=titleAdr]").should("have.value", "ADR-Manager Test");
        cy.get("[data-cy=previewTabRendered]").click();
        cy.get("[data-cy=markdownPreview]").should("contain", "ADR-Manager Test");
    });
});
