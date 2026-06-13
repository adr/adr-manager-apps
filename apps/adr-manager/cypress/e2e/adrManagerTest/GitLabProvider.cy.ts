import { GITLAB_ADR_REPO_FULL_NAME, TEST_BASE_URL } from "../../support/e2e";

context("GitLab provider mocks", () => {
    it("loads a GitLab repository and commits a new ADR through the atomic commit API", () => {
        cy.visitAuthenticatedManager(TEST_BASE_URL, { provider: "gitlab" });

        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=listRepo]").contains(GITLAB_ADR_REPO_FULL_NAME).click();
        cy.get("[data-cy=addRepoDialog]").click();
        cy.wait("@showRepos", { timeout: 15000 }).its("response.statusCode").should("eq", 200);

        cy.get("[data-cy=newADR]", { timeout: 20000 }).click({ force: true });
        cy.get("[data-cy=titleAdr]").type("Use GitLab provider mocks");
        cy.get("[data-cy=contextAdr]").type("GitLab E2E should not require live provider credentials.");

        cy.get("[data-cy=pushIcon]").click({ force: true });
        cy.get("[data-cy=newFilesCommitMessage]").click();
        cy.get("[data-cy=newFileCheckBoxOuter]").contains("0005-use-gitlab-provider-mocks.md");
        cy.get("[data-cy=newFileCheckBox]").check({ force: true });
        cy.get("[data-cy=textFieldCommitMessage]").type("[E2ETest] Add GitLab ADR");
        cy.get("[data-cy=btnOfDialogCommitForPush]").click();
        cy.contains("OK").click();

        cy.wait("@gitlabCommitRequest", { timeout: 20000 }).then((interception) => {
            expect(interception.response?.statusCode).to.eq(201);
            expect(interception.request.body).to.include({
                branch: "main",
                commit_message: "[E2ETest] Add GitLab ADR"
            });
            const actions = interception.request.body.actions as Array<Record<string, string>>;
            expect(actions).to.have.length(1);
            expect(actions[0]).to.include({
                action: "create",
                file_path: "docs/adr/0005-use-gitlab-provider-mocks.md"
            });
            expect(actions[0]?.["content"]).to.contain("# Use GitLab provider mocks");
        });
    });
});
