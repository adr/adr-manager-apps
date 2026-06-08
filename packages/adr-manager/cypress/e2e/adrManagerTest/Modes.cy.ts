import { TEST_BASE_URL, REST_LIST_REPO_URL } from "../../support/e2e";

context("Using editor modes", () => {
    it("Switch to professional mode and create a new ADR", () => {
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
        cy.get("[data-cy=repoNameList]").click();
        cy.get("[data-cy=newADR]").click();
        cy.contains(" professional ").click();
        cy.get("[data-cy=statusPro]").click();
        cy.get(".v-list-item__title").contains("rejected").click();
        cy.get("[data-cy=statusPro]").should("have.class", "red red--text");
        cy.get("[data-cy=statusPro]").click();
        cy.get(".v-list-item__title").contains("proposed").click();
        cy.get("[data-cy=statusPro]").click();
        cy.get(".v-list-item__title").contains("accepted").click();
        cy.get("[data-cy=statusPro]").should("have.class", "success success--text");
        cy.get("[data-cy=statusPro]").click();
        cy.get(".v-list-item__title").contains("deprecated").click();
        cy.get("[data-cy=statusPro]").click();
        cy.get(".v-list-item__title").contains("superseded").click();
        cy.get("[data-cy=authorPro]").click();
        cy.get("[data-cy=authorPro]").type("Max");
        cy.get("[data-cy=technicalStoryPro]").click();
        cy.get("[data-cy=technicalStoryPro]").type("Technical story here");
        cy.get("[data-cy=consOptPro]").type("Cons. opt.");

        cy.get("[data-cy=descriptionConsOpt]").type("Cons. opt. description");
        cy.get("[data-cy=goodConsOpt]").type("Con. Opt 1 good").should("have.length", 1);
        cy.get("[data-cy=badConsOpt]").type("Con. Opt 1 bad").should("have.length", 1);
        cy.get("[data-cy=decOutChooseAdr]").click();
        cy.get(".v-list-item__title").contains("Cons. opt.").click();
        cy.get("[data-cy=posConseqPro]").type("Con. Opt 1 positive").should("have.length", 1);
        cy.get("[data-cy=negConseqPro]").type("Con. Opt 1 negative").should("have.length", 1);
        cy.get("[data-cy=linkPro]").type("https://test.com").should("have.length", 1);
    });
});
