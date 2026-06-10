import { mount } from "@vue/test-utils";
import MadrDecisionOutcome from "@/components/MadrDecisionOutcome.vue";
import { ArchitecturalDecisionRecord, createShortTitle } from "@/plugins/classes";
import type { MadrTemplateVersion } from "@adr-manager/core";
import type { Mode } from "@/types/store";

function mountOutcome(
    adr: ArchitecturalDecisionRecord,
    mode: Mode = "professional",
    templateVersion: MadrTemplateVersion = "2.1.2"
) {
    return mount(MadrDecisionOutcome, { props: { adr, mode, templateVersion } });
}

function recordWithOptions(): ArchitecturalDecisionRecord {
    return new ArchitecturalDecisionRecord({ consideredOptions: [{ title: "PostgreSQL" }, { title: "DynamoDB" }] });
}

test("focusing the chosen-option input suggests the short titles of all options", async () => {
    const adr = recordWithOptions();
    const wrapper = mountOutcome(adr);

    await wrapper.find("[data-cy=decOutChooseAdr]").trigger("focus");

    const suggestions = wrapper.findAll("[data-cy=chosenOptionItem]");
    expect(suggestions.map((item) => item.text())).toEqual([
        createShortTitle("PostgreSQL"),
        createShortTitle("DynamoDB")
    ]);
});

test("clicking a suggestion selects it as the chosen option", async () => {
    const adr = recordWithOptions();
    const wrapper = mountOutcome(adr);

    await wrapper.find("[data-cy=decOutChooseAdr]").trigger("focus");
    await wrapper.findAll("[data-cy=chosenOptionItem]")[1]?.trigger("click");

    expect(adr.decisionOutcome.chosenOption).toBe(createShortTitle("DynamoDB"));
});

test("the explanation is bound to the decision outcome", async () => {
    const adr = recordWithOptions();
    const wrapper = mountOutcome(adr);

    await wrapper.find("[data-cy=decOutBecAdr]").setValue("it fits our needs");

    expect(adr.decisionOutcome.explanation).toBe("it fits our needs");
});

test("consequence lists are only available in professional mode", () => {
    const adr = recordWithOptions();
    expect(mountOutcome(adr, "basic").find("[data-cy=posConseqPro]").exists()).toBe(false);
    expect(mountOutcome(adr, "basic").find("[data-cy=negConseqPro]").exists()).toBe(false);
    expect(mountOutcome(adr, "professional").find("[data-cy=posConseqPro]").exists()).toBe(true);
    expect(mountOutcome(adr, "professional").find("[data-cy=negConseqPro]").exists()).toBe(true);
});

test("the 4.0.0 template replaces the consequence columns with the combined editor and confirmation", () => {
    const adr = recordWithOptions();
    const wrapper = mountOutcome(adr, "professional", "4.0.0");
    expect(wrapper.find("[data-cy=posConseqPro]").exists()).toBe(false);
    expect(wrapper.find("[data-cy=negConseqPro]").exists()).toBe(false);
    expect(wrapper.find("[data-cy=consequencesPro]").exists()).toBe(true);
    expect(wrapper.find("[data-cy=confirmationPro]").exists()).toBe(true);
});

test("the combined consequence editor adds entries and cycles their tone", async () => {
    const adr = recordWithOptions();
    const wrapper = mountOutcome(adr, "professional", "4.0.0");

    await wrapper.find("[data-cy=consequenceAddInput]").setValue("Strong consistency");
    expect(adr.consequences).toStrictEqual([{ kind: "good", text: "Strong consistency" }]);

    await wrapper.find("[data-cy=consequencesPro] .tone-label").trigger("click");
    expect(adr.consequences[0]?.kind).toBe("neutral");
});
