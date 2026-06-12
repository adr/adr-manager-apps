import { mount } from "@vue/test-utils";
import MadrEditor from "@/components/MadrEditor.vue";
import { ArchitecturalDecisionRecord } from "@/plugins/classes";
import { store } from "@/plugins/store";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { MadrTemplateVersion } from "@adr-manager/core";
import type { Mode } from "@/types/store";

function mountEditor(adr: ArchitecturalDecisionRecord, mode: Mode, templateVersion: MadrTemplateVersion = "2.1.2") {
    return mount(MadrEditor, { props: { adr, mode, templateVersion, fileName: "0001-test.md" } });
}

afterEach(() => {
    store.setMode("basic");
    localStorage.clear();
});

const MADR_V2_PROFESSIONAL_FIELDS = [
    "titleAdr",
    "dateAdr",
    "statusPro",
    "authorPro",
    "technicalStoryPro",
    "contextAdr",
    "decisionDriversPro",
    "consOptPro",
    "considerOptTextAdr",
    "decOutChooseAdr",
    "decOutBecAdr",
    "posConseqPro",
    "negConseqPro",
    "linkPro"
];

const MADR_V4_PROFESSIONAL_FIELDS = [
    "titleAdr",
    "dateAdr",
    "statusPro",
    "decisionMakersPro",
    "consultedPro",
    "informedPro",
    "contextAdr",
    "decisionDriversPro",
    "consOptPro",
    "considerOptTextAdr",
    "decOutChooseAdr",
    "decOutBecAdr",
    "consequencesPro",
    "confirmationPro",
    "moreInformationPro"
];

test("professional mode shows every MADR v2 template field", () => {
    const wrapper = mountEditor(new ArchitecturalDecisionRecord(), "professional");
    for (const field of MADR_V2_PROFESSIONAL_FIELDS) {
        expect(wrapper.find(`[data-cy=${field}]`).exists(), `expected field ${field} to be rendered`).toBe(true);
    }
});

test("the 4.0.0 template shows its own professional fields and hides the 2.1.2-only ones", () => {
    const wrapper = mountEditor(new ArchitecturalDecisionRecord(), "professional", "4.0.0");
    for (const field of MADR_V4_PROFESSIONAL_FIELDS) {
        expect(wrapper.find(`[data-cy=${field}]`).exists(), `expected field ${field} to be rendered`).toBe(true);
    }
    for (const field of ["authorPro", "technicalStoryPro", "linkPro", "posConseqPro", "negConseqPro"]) {
        expect(wrapper.find(`[data-cy=${field}]`).exists(), `expected field ${field} to be hidden`).toBe(false);
    }
});

test("basic mode only shows the required fields", () => {
    const wrapper = mountEditor(new ArchitecturalDecisionRecord(), "basic");
    for (const field of ["titleAdr", "contextAdr", "considerOptTextAdr", "decOutChooseAdr", "decOutBecAdr"]) {
        expect(wrapper.find(`[data-cy=${field}]`).exists(), `expected field ${field} to be rendered`).toBe(true);
    }
    for (const field of [
        "dateAdr",
        "statusPro",
        "authorPro",
        "technicalStoryPro",
        "decisionDriversPro",
        "posConseqPro",
        "negConseqPro",
        "linkPro"
    ]) {
        expect(wrapper.find(`[data-cy=${field}]`).exists(), `expected field ${field} to be hidden`).toBe(false);
    }
});

test("the title input is bound to the record and shows the file name hint", async () => {
    const adr = new ArchitecturalDecisionRecord({ title: "Old title" });
    const wrapper = mountEditor(adr, "basic");

    const title = wrapper.find("[data-cy=titleAdr]");
    expect((title.element as HTMLInputElement).value).toBe("Old title");
    await title.setValue("New title");
    expect(adr.title).toBe("New title");
    expect(wrapper.text()).toContain("0001-test.md");
});

test("basic mode warns when professional-only fields hold data and can switch the mode", async () => {
    const adr = new ArchitecturalDecisionRecord({ decisionDrivers: ["a driver"] });
    const wrapper = mountEditor(adr, "basic");

    expect(wrapper.text()).toContain("Some fields of this ADR are not displayed in the current mode.");
    await wrapper.find(".alert button").trigger("click");
    expect(store.mode).toBe("professional");
});

test("basic mode shows no warning for a plain record", () => {
    const wrapper = mountEditor(new ArchitecturalDecisionRecord(), "basic");
    expect(wrapper.find(".alert").exists()).toBe(false);
});

test("the relevant files section renders in professional mode for both template versions", () => {
    for (const version of ["2.1.2", "4.0.0"] as const) {
        const wrapper = mountEditor(new ArchitecturalDecisionRecord(), "professional", version);
        expect(wrapper.find("[data-cy=relevantFilesSection]").exists()).toBe(true);
        expect(wrapper.find("[data-cy=relevantFilesPick]").exists()).toBe(true);
    }
});

test("the relevant files section is hidden in basic mode", () => {
    const wrapper = mountEditor(new ArchitecturalDecisionRecord(), "basic");
    expect(wrapper.find("[data-cy=relevantFilesSection]").exists()).toBe(false);
});

test("the relevant files section is hidden when the field is toggled off", () => {
    const wrapper = mount(MadrEditor, {
        props: {
            adr: new ArchitecturalDecisionRecord(),
            mode: "professional" as Mode,
            templateVersion: "2.1.2" as MadrTemplateVersion,
            fieldVisibility: { ...DEFAULT_FIELD_VISIBILITY, relevantFiles: false }
        }
    });
    expect(wrapper.find("[data-cy=relevantFilesSection]").exists()).toBe(false);
});

test("linked files render with a missing warning only when the listing knows them to be gone", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: ["src/main.ts"] });
    const wrapper = mountEditor(adr, "professional");
    // No repository context in this test, so existence is unknown and no warning may render.
    expect(wrapper.find("[data-cy=relevantFileLink]").text()).toBe("src/main.ts");
    expect(wrapper.find("[data-cy=relevantFileMissing]").exists()).toBe(false);
});

test("removing a linked file mutates the record in place", async () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: ["src/a.ts", "src/b.ts"] });
    const wrapper = mountEditor(adr, "professional");
    await wrapper.find("[data-cy=relevantFileRemove]").trigger("click");
    expect(adr.relevantFiles).toStrictEqual(["src/b.ts"]);
});

test("basic mode warns when relevant files hold data", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: ["src/main.ts"] });
    const wrapper = mountEditor(adr, "basic");
    expect(wrapper.text()).toContain("Some fields of this ADR are not displayed in the current mode.");
});
