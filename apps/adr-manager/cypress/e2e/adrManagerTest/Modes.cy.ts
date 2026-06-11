import { TEST_BASE_URL, REST_LIST_REPO_URL } from "../../support/e2e";

context("Using editor modes", () => {
    it("Switch to professional mode and create a new ADR", () => {
        window.localStorage.clear();
        window.localStorage.setItem("authId", Cypress.env("OAUTH_E2E_AUTH_ID"));
        window.localStorage.setItem("tourSeen", "1");
        window.localStorage.setItem("user", Cypress.env("USER"));
        cy.visit(TEST_BASE_URL);
        cy.intercept("GET", REST_LIST_REPO_URL).as("getRepos");
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
        cy.get("[data-cy=addRepoDialog]").click();
        cy.get("[data-cy=newADR]").click({ force: true });
        cy.get("[data-cy=modeProfessional]").click();
        cy.get("[data-cy=statusPro]").click();
        cy.get("[data-cy=statusOption]").contains("rejected").click();
        cy.get("[data-cy=statusPro]").should("have.attr", "data-tone", "rejected");
        cy.get("[data-cy=statusPro]").click();
        cy.get("[data-cy=statusOption]").contains("proposed").click();
        cy.get("[data-cy=statusPro]").click();
        cy.get("[data-cy=statusOption]").contains("accepted").click();
        cy.get("[data-cy=statusPro]").should("have.attr", "data-tone", "accepted");
        cy.get("[data-cy=statusPro]").click();
        cy.get("[data-cy=statusOption]").contains("deprecated").click();
        cy.get("[data-cy=statusPro]").click();
        cy.get("[data-cy=statusOption]").contains("superseded").click();
        cy.get("[data-cy=authorPro]").click();
        cy.get("[data-cy=authorPro]").type("Max");
        cy.get("[data-cy=technicalStoryPro]").click();
        cy.get("[data-cy=technicalStoryPro]").type("Technical story here");
        // The first keystroke turns the add row into a real option and focus moves there.
        cy.get("[data-cy=considerOptTextAdr]").type("C");
        cy.focused().type("ons. opt.");

        cy.get("[data-cy=descriptionConsOpt]").type("Cons. opt. description");
        cy.get("[data-cy=goodConsOpt] [data-cy=listAddInput]").type("C");
        cy.focused().type("on. Opt 1 good");
        cy.get("[data-cy=goodConsOpt] [data-cy=listItemInput]").should("have.length", 1);
        cy.get("[data-cy=badConsOpt] [data-cy=listAddInput]").type("C");
        cy.focused().type("on. Opt 1 bad");
        cy.get("[data-cy=badConsOpt] [data-cy=listItemInput]").should("have.length", 1);
        cy.get("[data-cy=decOutChooseAdr]").click();
        cy.get("[data-cy=chosenOptionItem]").contains("Cons. opt.").click();
        cy.get("[data-cy=posConseqPro] [data-cy=listAddInput]").type("C");
        cy.focused().type("on. Opt 1 positive");
        cy.get("[data-cy=posConseqPro] [data-cy=listItemInput]").should("have.length", 1);
        cy.get("[data-cy=negConseqPro] [data-cy=listAddInput]").type("C");
        cy.focused().type("on. Opt 1 negative");
        cy.get("[data-cy=negConseqPro] [data-cy=listItemInput]").should("have.length", 1);
        cy.get("[data-cy=linkPro] [data-cy=listAddInput]").type("h");
        cy.focused().type("ttps://test.com");
        cy.get("[data-cy=linkPro] [data-cy=listItemInput]").should("have.length", 1);
    });
});
