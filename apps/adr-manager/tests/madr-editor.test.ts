import { mount } from "@vue/test-utils";
import MadrEditor from "@/components/MadrEditor.vue";
import { ArchitecturalDecisionRecord } from "@/plugins/classes";
import { store } from "@/plugins/store";
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
