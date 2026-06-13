import {
    GITHUB_ADR_REPO_FULL_NAME,
    GITHUB_EMPTY_REPO_BRANCH,
    GITHUB_EMPTY_REPO_FULL_NAME,
    TEST_BASE_URL
} from "../../support/e2e";

const NEW_ADR_SLUG = "use-x-to-accomplish-y";
const NEW_ADR_FILE = `${NEW_ADR_SLUG}.md`;

function treeEntries(interception: { request: { body: { tree?: unknown } } }): Array<Record<string, string | null>> {
    return Array.isArray(interception.request.body.tree)
        ? (interception.request.body.tree as Array<Record<string, string | null>>)
        : [];
}

function addRepository(repoFullName: string): void {
    cy.get("[data-cy=addRepo]").click();
    cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=search-field-for-adding-repository]").type(repoFullName);
    cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=listRepo]").contains(repoFullName).click();
    cy.get("[data-cy=addRepoDialog]").click();
    cy.wait("@showRepos", { timeout: 15000 }).its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=newADR]", { timeout: 20000 }).should("be.visible");
}

function addEmptyRepositoryOnPushBranch(): void {
    addRepository(GITHUB_EMPTY_REPO_FULL_NAME);
    cy.get("[data-cy=branchSelect]").trigger("click");
    cy.get("[data-cy=branchSelect]").select(GITHUB_EMPTY_REPO_BRANCH);
    cy.get("[data-cy=branchSelect]").should("have.value", GITHUB_EMPTY_REPO_BRANCH);
}

context("Committing and pushing ADR changes", () => {
    it("commits and pushes a new ADR through the GitHub API sequence", () => {
        cy.visitAuthenticatedManager(TEST_BASE_URL);
        addEmptyRepositoryOnPushBranch();

        cy.get("[data-cy=newADR]").click({ force: true });
        cy.get("[data-cy=titleAdr]").invoke("val", NEW_ADR_SLUG).trigger("input");
        cy.should(() => {
            expect(localStorage.getItem("addedRepositories") ?? "").to.contain(NEW_ADR_FILE);
        });

        cy.get("[data-cy=pushIcon]").click({ force: true });
        cy.get("[data-cy=btnOfDialogCommitForPush]").should("be.disabled");
        cy.get("[data-cy=mdiAlertNotSelected]").should("be.visible");
        cy.get("[data-cy=mdiAlertCommitMessage]").should("be.visible");
        cy.get("[data-cy=newFilesCommitMessage]").click();
        cy.get("[data-cy=newFileCheckBoxOuter]").should("contain", NEW_ADR_FILE);
        cy.get("[data-cy=newFileCheckBox]").check({ force: true });
        cy.get("[data-cy=mdiCheckSelected]").should("be.visible");
        cy.get("[data-cy=textFieldCommitMessage]").type("[E2ETest] Add a new ADR");
        cy.get("[data-cy=mdiCheckCommitMessage]").should("be.visible");
        cy.get("[data-cy=btnOfDialogCommitForPush]").click();

        cy.contains("OK").click();
        cy.wait("@createTreeRequest", { timeout: 20000 }).then((interception) => {
            const createdEntry = treeEntries(interception).find((entry) => String(entry["path"]).endsWith(NEW_ADR_FILE));
            expect(createdEntry?.["sha"]).to.be.a("string");
        });
        cy.wait("@commitRequest", { timeout: 20000 }).then((interception) => {
            expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
            expect(interception.request.body).to.include({
                message: "[E2ETest] Add a new ADR"
            });
        });
        cy.wait("@updateRefRequest", { timeout: 20000 }).its("response.statusCode").should("eq", 200);
    });

    it("commits and pushes a deleted ADR through the GitHub API sequence", () => {
        let deletedPath = "";

        cy.visitAuthenticatedManager(TEST_BASE_URL);
        addRepository(GITHUB_ADR_REPO_FULL_NAME);

        cy.get("[data-cy=adrList]")
            .first()
            .invoke("attr", "title")
            .then((title) => {
                deletedPath = title ?? "";
                expect(deletedPath).to.match(/\.md$/);
            });
        cy.get("[data-cy=adrList]").first().find("[data-cy=deleteAdrBtn]").click({ force: true });
        cy.get("[data-cy=dialogDeleteAdrBtn]:visible").first().click();
        cy.get("[data-cy=pushIcon]").click({ force: true });
        cy.get("[data-cy=deletedFilesAdr]").click();
        cy.get("[data-cy=deletedFileCheckBox]").check({ force: true });
        cy.get("[data-cy=textFieldCommitMessage]").type("[E2ETest] Delete the ADR");
        cy.get("[data-cy=btnOfDialogCommitForPush]").click();
        cy.contains("OK").click();

        cy.wait("@createTreeRequest", { timeout: 20000 }).then((interception) => {
            const deletedEntry = treeEntries(interception).find((entry) => entry["path"] === deletedPath);
            expect(deletedEntry?.["sha"]).to.equal(null);
        });
        cy.wait("@commitRequest", { timeout: 20000 }).then((interception) => {
            expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
            expect(interception.request.body).to.include({
                message: "[E2ETest] Delete the ADR"
            });
        });
        cy.wait("@updateRefRequest", { timeout: 20000 }).its("response.statusCode").should("eq", 200);
    });
});
