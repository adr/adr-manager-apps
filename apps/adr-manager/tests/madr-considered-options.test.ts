import { mount } from "@vue/test-utils";
import MadrConsideredOptions from "@/components/MadrConsideredOptions.vue";
import { ArchitecturalDecisionRecord, createShortTitle } from "@/plugins/classes";
import { store } from "@/plugins/store";
import type { MadrTemplateVersion } from "@adr-manager/core";
import type { Mode } from "@/types/store";

function mountOptions(
    adr: ArchitecturalDecisionRecord,
    mode: Mode = "professional",
    templateVersion: MadrTemplateVersion = "2.1.2"
) {
    return mount(MadrConsideredOptions, { props: { adr, mode, templateVersion } });
}

afterEach(() => {
    store.setMode("basic");
    localStorage.clear();
});

test("typing in the add row creates an option and expands its details", async () => {
    const adr = new ArchitecturalDecisionRecord();
    const wrapper = mountOptions(adr);

    await wrapper.find("[data-cy=considerOptTextAdr]").setValue("PostgreSQL");

    expect(adr.consideredOptions).toHaveLength(1);
    expect(adr.consideredOptions[0]?.title).toBe("PostgreSQL");
    expect(wrapper.find("[data-cy=descriptionConsOpt]").exists()).toBe(true);
    expect(wrapper.find("[data-cy=goodConsOpt]").exists()).toBe(true);
    expect(wrapper.find("[data-cy=badConsOpt]").exists()).toBe(true);
});

test("basic mode creates options without the detail editor", async () => {
    const adr = new ArchitecturalDecisionRecord();
    const wrapper = mountOptions(adr, "basic");

    await wrapper.find("[data-cy=considerOptTextAdr]").setValue("PostgreSQL");

    expect(adr.consideredOptions).toHaveLength(1);
    expect(wrapper.find("[data-cy=descriptionConsOpt]").exists()).toBe(false);
});

test("marking an option as chosen stores its short title in the decision outcome", async () => {
    const adr = new ArchitecturalDecisionRecord({
        consideredOptions: [{ title: "PostgreSQL" }, { title: "DynamoDB" }]
    });
    const wrapper = mountOptions(adr);

    await wrapper.findAll("[data-cy=chooseConsOptAdr]")[0]?.trigger("click");

    expect(adr.decisionOutcome.chosenOption).toBe(createShortTitle("PostgreSQL"));
    expect(wrapper.find("[data-cy=checkConsOptAdr]").exists()).toBe(true);
    expect(wrapper.text()).toContain("chosen");
});

test("the remove button deletes the option", async () => {
    const adr = new ArchitecturalDecisionRecord({
        consideredOptions: [{ title: "PostgreSQL" }, { title: "DynamoDB" }]
    });
    const wrapper = mountOptions(adr);

    await wrapper.findAll("[data-cy=removeConsOptAdr]")[0]?.trigger("click");

    expect(adr.consideredOptions).toHaveLength(1);
    expect(adr.consideredOptions[0]?.title).toBe("DynamoDB");
});

test("neutral arguments are only editable in the 4.0.0 template", async () => {
    const adr = new ArchitecturalDecisionRecord();
    const v2 = mountOptions(adr, "professional", "2.1.2");
    await v2.find("[data-cy=considerOptTextAdr]").setValue("PostgreSQL");
    expect(v2.find("[data-cy=neutralConsOpt]").exists()).toBe(false);

    const v4 = mountOptions(new ArchitecturalDecisionRecord(), "professional", "4.0.0");
    await v4.find("[data-cy=considerOptTextAdr]").setValue("PostgreSQL");
    expect(v4.find("[data-cy=neutralConsOpt]").exists()).toBe(true);
});

test("basic mode warns when options carry details that are hidden", () => {
    const adr = new ArchitecturalDecisionRecord({
        consideredOptions: [{ title: "PostgreSQL", description: "Relational database." }]
    });
    const wrapper = mountOptions(adr, "basic");

    expect(wrapper.text()).toContain("Some options have a more detailed description that is not displayed");
});
