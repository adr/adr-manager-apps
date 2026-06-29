import { TEST_BASE_URL } from "../../support/e2e";

context("Using editor modes", () => {
    it("Fills a professional-mode ADR and verifies the generated markdown", () => {
        cy.visitAuthenticatedManager(TEST_BASE_URL);
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=listRepo]").contains("ADR-Manager").click();
        cy.get("[data-cy=addRepoDialog]").click();
        cy.get("[data-cy=newADR]").click({ force: true });
        cy.get("[data-cy=modeProfessional]").click();
        cy.get("[data-cy=versionSelect]").click();
        cy.get("[data-cy=versionOption]").contains("MADR 2.1.2").click();

        // Move status to rejected then accepted, checking the tone attribute tracks each choice.
        cy.get("[data-cy=statusPro]").click();
        cy.get("[data-cy=statusOption]").contains("rejected").click();
        cy.get("[data-cy=statusPro]").should("have.attr", "data-tone", "rejected");
        cy.get("[data-cy=statusPro]").click();
        cy.get("[data-cy=statusOption]").contains("accepted").click();
        cy.get("[data-cy=statusPro]").should("have.attr", "data-tone", "accepted");

        cy.get("[data-cy=titleAdr]").click();
        cy.get("[data-cy=titleAdr]").type("Use Professional Mode");
        cy.get("[data-cy=authorPro]").click();
        cy.get("[data-cy=authorPro]").type("Max");
        cy.get("[data-cy=technicalStoryPro]").click();
        cy.get("[data-cy=technicalStoryPro]").type("Technical story here");
        cy.get("[data-cy=contextAdr]").click();
        cy.get("[data-cy=contextAdr]").type("We need a documented decision.");

        cy.addConsideredOption("Cons. opt.");
        cy.get("[data-cy=descriptionConsOpt]").type("Cons. opt. description");
        cy.addListItem("[data-cy=goodConsOpt] [data-cy=listAddInput]", "Con. Opt 1 good");
        cy.get("[data-cy=goodConsOpt] [data-cy=listItemInput]").should("have.length", 1);
        cy.addListItem("[data-cy=badConsOpt] [data-cy=listAddInput]", "Con. Opt 1 bad");
        cy.get("[data-cy=badConsOpt] [data-cy=listItemInput]").should("have.length", 1);

        cy.get("[data-cy=decOutChooseAdr]").click();
        cy.get("[data-cy=chosenOptionItem]").contains("Cons. opt.").click();

        cy.addListItem("[data-cy=posConseqPro] [data-cy=listAddInput]", "Con. Opt 1 positive");
        cy.get("[data-cy=posConseqPro] [data-cy=listItemInput]").should("have.length", 1);
        cy.addListItem("[data-cy=negConseqPro] [data-cy=listAddInput]", "Con. Opt 1 negative");
        cy.get("[data-cy=negConseqPro] [data-cy=listItemInput]").should("have.length", 1);
        cy.addListItem("[data-cy=linkPro] [data-cy=listAddInput]", "https://test.com");
        cy.get("[data-cy=linkPro] [data-cy=listItemInput]").should("have.length", 1);

        // Blur the last-edited row so its value commits to the record.
        cy.get("[data-cy=titleAdr]").click();

        // Every entered value must reach the ADR's persisted markdown. Reading localStorage
        // avoids the raw editor's virtualized DOM, which only holds the lines currently in view.
        cy.get("[data-cy=adrList]").should(() => {
            const stored = localStorage.getItem("addedRepositories") ?? "";
            expect(stored).to.contain("# Use Professional Mode");
            expect(stored).to.contain("Max");
            expect(stored).to.contain("Technical story here");
            expect(stored).to.contain("We need a documented decision.");
            expect(stored).to.contain("Cons. opt.");
            expect(stored).to.contain("Con. Opt 1 good");
            expect(stored).to.contain("Con. Opt 1 bad");
            expect(stored).to.contain("Con. Opt 1 positive");
            expect(stored).to.contain("Con. Opt 1 negative");
            expect(stored).to.contain("https://test.com");
        });
    });
});
