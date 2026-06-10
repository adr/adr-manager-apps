import { effectScope, nextTick } from "vue";
import type { EffectScope } from "vue";
import { useAdrEditor } from "@/composables/useAdrEditor";
import { ArchitecturalDecisionRecord, Repository } from "@/plugins/classes";
import { adr2md, adr2md400, md2adr } from "@/plugins/parser";
import { store } from "@/plugins/store";
import type { AdrFile } from "@/types/adr";

let scope: EffectScope | undefined;

function createEditor(): ReturnType<typeof useAdrEditor> {
    scope = effectScope();
    const editor = scope.run(() => useAdrEditor());
    if (!editor) {
        throw new Error("Could not create the editor composable.");
    }
    return editor;
}

function openInStore(editedMd: string): AdrFile {
    const adrFile: AdrFile = { path: "docs/decisions/0001-test.md", originalMd: editedMd, editedMd, id: 1 };
    const repo = new Repository({
        fullName: "acme/decisions",
        activeBranch: "main",
        branches: [],
        adrs: [adrFile],
        adrPath: "docs/decisions/"
    });
    store.addedRepositories = [repo];
    store.currentRepository = repo;
    store.currentlyEditedAdr = adrFile;
    return adrFile;
}

function sampleRecord(): ArchitecturalDecisionRecord {
    return new ArchitecturalDecisionRecord({
        title: "Use PostgreSQL",
        status: "accepted",
        date: "2026-06-10",
        deciders: "Jane Doe, John Doe",
        technicalStory: "ARCH-1",
        contextAndProblemStatement: "We need a durable system of record.",
        decisionDrivers: ["strong consistency"],
        consideredOptions: [
            { title: "PostgreSQL", description: "Relational database.", pros: ["mature"], cons: ["sharding"] },
            { title: "DynamoDB" }
        ],
        decisionOutcome: {
            chosenOption: "PostgreSQL",
            explanation: "it fits our access patterns",
            positiveConsequences: ["reuses existing tooling"],
            negativeConsequences: ["managed failover needed"]
        },
        links: ["Refines ADR-0001"]
    });
}

const NON_CONFORMING_MD =
    "# ADR-Manager Test\n" +
    "> All artefacts related to a research project\n" +
    "## Developer Instructions\n\n" +
    "Some free-form text the MADR parser cannot represent.\n";

afterEach(() => {
    scope?.stop();
    scope = undefined;
    store.currentlyEditedAdr = undefined;
    store.currentRepository = undefined;
    store.addedRepositories = [];
    localStorage.clear();
});

test("opens a conforming ADR into the form editor and normalizes the markdown", async () => {
    const markdown = adr2md(sampleRecord());
    const adrFile = openInStore(markdown);
    const editor = createEditor();
    await nextTick();

    expect(editor.requiresConversion.value).toBe(false);
    expect(editor.adr.value.title).toBe("Use PostgreSQL");
    expect(editor.adr.value.deciders).toBe("Jane Doe, John Doe");
    expect(editor.markdown.value).toBe(adr2md(md2adr(markdown)));
    expect(adrFile.editedMd).toBe(editor.markdown.value);
});

test("opens a non-conforming file in convert mode", async () => {
    openInStore(NON_CONFORMING_MD);
    const editor = createEditor();
    await nextTick();

    expect(editor.requiresConversion.value).toBe(true);
    expect(editor.markdown.value).toBe(NON_CONFORMING_MD);
});

test("form edits regenerate the markdown and persist it to the open file", async () => {
    const adrFile = openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();

    editor.adr.value.title = "Use SQLite";
    await nextTick();

    expect(editor.markdown.value).toContain("# Use SQLite");
    expect(adrFile.editedMd).toBe(editor.markdown.value);
});

test("raw edits that round-trip exactly update the form record", async () => {
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();

    const replacement = sampleRecord();
    replacement.title = "Use MariaDB";
    editor.updateFromRaw(adr2md(replacement));
    await nextTick();

    expect(editor.requiresConversion.value).toBe(false);
    expect(editor.adr.value.title).toBe("Use MariaDB");
});

test("raw edits that would lose content switch to convert mode", async () => {
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();

    editor.updateFromRaw(NON_CONFORMING_MD);
    await nextTick();

    expect(editor.requiresConversion.value).toBe(true);
    expect(editor.markdown.value).toBe(NON_CONFORMING_MD);
});

test("opening a 4.0.0 document is detected and parsed with the 4.0.0 reader", async () => {
    const record = sampleRecord();
    record.decisionMakers = "Jane Doe";
    record.consulted = "Data Guild";
    const markdown = adr2md400(record);
    openInStore(markdown);
    const editor = createEditor();
    await nextTick();

    expect(editor.templateVersion.value).toBe("4.0.0");
    expect(editor.requiresConversion.value).toBe(false);
    expect(editor.adr.value.decisionMakers).toBe("Jane Doe");
    expect(editor.adr.value.consulted).toBe("Data Guild");
});

test("switching the template version rewrites the markdown and carries the people over", async () => {
    const adrFile = openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    expect(editor.templateVersion.value).toBe("2.1.2");

    editor.setTemplateVersion("4.0.0");
    await nextTick();

    expect(editor.templateVersion.value).toBe("4.0.0");
    expect(editor.markdown.value).toContain("decision-makers: Jane Doe, John Doe");
    expect(editor.markdown.value.startsWith("---\n")).toBe(true);
    expect(adrFile.editedMd).toBe(editor.markdown.value);

    editor.setTemplateVersion("2.1.2");
    await nextTick();
    expect(editor.markdown.value).toContain("* Deciders: Jane Doe, John Doe");
    expect(editor.markdown.value.startsWith("# ")).toBe(true);
});

test("a template-agnostic document keeps the selected version", async () => {
    const emptyMd = adr2md(new ArchitecturalDecisionRecord());
    const v4Record = sampleRecord();
    v4Record.decisionMakers = "Jane Doe";

    const v4File: AdrFile = { path: "docs/decisions/0001-v4.md", originalMd: "", editedMd: adr2md400(v4Record), id: 1 };
    const emptyFile: AdrFile = { path: "docs/decisions/0002-new.md", originalMd: "", editedMd: emptyMd, id: 2 };
    const repo = new Repository({
        fullName: "acme/decisions",
        activeBranch: "main",
        branches: [],
        adrs: [v4File, emptyFile],
        adrPath: "docs/decisions/"
    });
    store.addedRepositories = [repo];
    store.currentRepository = repo;
    store.currentlyEditedAdr = v4File;

    const editor = createEditor();
    await nextTick();
    expect(editor.templateVersion.value).toBe("4.0.0");

    // A freshly created ADR fits both templates, so the 4.0.0 selection sticks.
    store.currentlyEditedAdr = emptyFile;
    await nextTick();
    expect(editor.templateVersion.value).toBe("4.0.0");
    expect(editor.requiresConversion.value).toBe(false);
});

test("pasting a 4.0.0 document into the raw editor switches the template version", async () => {
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();

    const replacement = sampleRecord();
    replacement.confirmation = "Verified by an architecture review.";
    editor.updateFromRaw(adr2md400(replacement));
    await nextTick();

    expect(editor.templateVersion.value).toBe("4.0.0");
    expect(editor.requiresConversion.value).toBe(false);
    expect(editor.adr.value.confirmation).toBe("Verified by an architecture review.");
});

test("accepting a conversion adopts the converted markdown and returns to the form", async () => {
    openInStore(NON_CONFORMING_MD);
    const editor = createEditor();
    await nextTick();
    expect(editor.requiresConversion.value).toBe(true);

    const converted = adr2md(md2adr(NON_CONFORMING_MD));
    editor.acceptConversion(converted);
    await nextTick();

    expect(editor.requiresConversion.value).toBe(false);
    expect(editor.adr.value.title).toBe("ADR-Manager Test");
    expect(editor.markdown.value).toBe(converted);
});
