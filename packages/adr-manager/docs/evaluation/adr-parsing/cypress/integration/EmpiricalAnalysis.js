/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

var REPO_NAMES = [
    "adr-manager-anonymous/adr-j",
    "adr-manager-anonymous/adr-log",
    "adr-manager-anonymous/adr-tools",
    "adr-manager-anonymous/architectural-decision-records",
    "adr-manager-anonymous/blueprint",
    "adr-manager-anonymous/cloud-on-k8s",
    "adr-manager-anonymous/complaitkubernetes",
    "adr-manager-anonymous/core",
    "adr-manager-anonymous/digital-paper-edit-client",
    "adr-manager-anonymous/digital-paper-edit-firebase",
    "adr-manager-anonymous/docker-texlive",
    "adr-manager-anonymous/docs",
    "adr-manager-anonymous/e-adr",
    "adr-manager-anonymous/ecar-charge-pricing",
    "adr-manager-anonymous/experimenter",
    "adr-manager-anonymous/fxa",
    "adr-manager-anonymous/gadr",
    "adr-manager-anonymous/island.is",
    "adr-manager-anonymous/jabref",
    "adr-manager-anonymous/log4brains",
    "adr-manager-anonymous/madr",
    "adr-manager-anonymous/monocle",
    "adr-manager-anonymous/nodejs.dev",
    "adr-manager-anonymous/odh-manifests",
    "adr-manager-anonymous/python-tuf",
    "adr-manager-anonymous/raiden",
    "adr-manager-anonymous/raiden-services",
    "adr-manager-anonymous/Sylius",
    "adr-manager-anonymous/tuleap",
    "adr-manager-anonymous/winery"
]

context("Empirically test if ADRs can be opened by the ADR-Manager and count how many are accepted by the parser without the 'Diff' screen.", () => {

    beforeEach(() => {
        cy.visit("http://localhost:8080/#/manager");
        window.localStorage.clear();
        window.localStorage.setItem(
            "authId",
            Cypress.env("OAUTH_E2E_AUTH_ID")
        );

        cy.intercept("GET", "**/user/repos**").as("getRepos");
        cy.get("[data-cy=addRepo]").click();
        cy.wait("@getRepos")
            .its("response.statusCode")
            .should("eq", 200);

    });

    for (var j = 0; j < REPO_NAMES.length; j++) {
        let i = j
        function testDiff() {
            if (i == 0) {
                cy.writeFile("cypress/fixtures/CounterDiffAllRepos.json", {
                    counter: 0
                });
                cy.writeFile("cypress/fixtures/CounterAdrsAllRepos.json", {
                    counter: 0
                });
                cy.writeFile("cypress/fixtures/CounterDiffPerRepo.json", {
                    [REPO_NAMES[i]]: 0
                });
                cy.writeFile("cypress/fixtures/CounterAdrsPerRepo.json", {
                    [REPO_NAMES[i]]: 0
                });
            } else {
                cy.readFile(
                    "cypress/fixtures/CounterAdrsPerRepo.json"
                ).then(counter => {
                    counter[REPO_NAMES[i]] = 0;
                    cy.writeFile("cypress/fixtures/CounterAdrsPerRepo.json", counter);
                });
                cy.readFile(
                    "cypress/fixtures/CounterDiffPerRepo.json"
                ).then(counter => {
                    counter[REPO_NAMES[i]] = 0;
                    cy.writeFile("cypress/fixtures/CounterDiffPerRepo.json", counter);
                });
            }
            cy.log(REPO_NAMES[i]);
            cy.get("[data-cy=search-field-for-adding-repository]")
                .type("https://github.com/" + REPO_NAMES[i]);
            cy.contains(REPO_NAMES[i])
                .click();
            cy.get("[data-cy=addRepoDialog]").click({ force: true });
            cy.intercept("GET", "**/repos**").as("showRepos");
            cy.wait("@showRepos", { timeout: 10000 });

            cy.get("[data-cy=adrList]")
                .each(($adr, index, $adrs) => {
                    cy.get($adr).click();
                    cy.get("header").then($a => {
                        cy.log("text", $a.text());
                        if ($a.text().includes("Convert")) {
                            cy.log("Convert Tab opened");
                            cy.readFile(
                                "cypress/fixtures/CounterDiffPerRepo.json"
                            ).then(counter => {
                                counter[REPO_NAMES[i]] = counter[REPO_NAMES[i]] + 1;
                                cy.writeFile(
                                    "cypress/fixtures/CounterDiffPerRepo.json",
                                    counter
                                );
                            });
                            cy.readFile(
                                "cypress/fixtures/CounterDiffAllRepos.json"
                            ).then(counter => {
                                counter.counter = counter.counter + 1;
                                cy.writeFile(
                                    "cypress/fixtures/CounterDiffAllRepos.json",
                                    counter
                                );
                            });
                        } else cy.log(i + " not visible");

                        cy.readFile(
                            "cypress/fixtures/CounterAdrsPerRepo.json"
                        ).then(counter => {
                            counter[REPO_NAMES[i]] = counter[REPO_NAMES[i]] + 1;
                            cy.writeFile(
                                "cypress/fixtures/CounterAdrsPerRepo.json",
                                counter
                            );
                        });
                        cy.readFile(
                            "cypress/fixtures/CounterAdrsAllRepos.json"
                        ).then(counter => {
                            counter.counter = counter.counter + 1;
                            cy.writeFile(
                                "cypress/fixtures/CounterAdrsAllRepos.json",
                                counter
                            );
                        });
                    });
                });
            cy.get("[data-cy=removeRepo]").click();
            cy.get("[data-cy=removeRepoBtn]").click();

            cy.readFile("cypress/fixtures/CounterDiffPerRepo.json").then(
                counter => {
                    cy.log("diff", counter.counter);
                }
            );
            cy.readFile("cypress/fixtures/CounterAdrsPerRepo.json").then(
                counter => {
                    cy.log("adr", counter.counter);
                }
            );
        }

        it("Test ADRs of the repository " + REPO_NAMES[i], testDiff);
    }
});
