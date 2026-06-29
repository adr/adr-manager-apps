import { effectScope, nextTick } from "vue";
import type { EffectScope } from "vue";
import { useAdrEditor } from "@/composables/useAdrEditor";
import { ArchitecturalDecisionRecord, Repository } from "@/plugins/classes";
import { adr2md, adr2md400, md2adr } from "@/plugins/parser";
import { store } from "@/plugins/store";
import { DEFAULT_FIELD_VISIBILITY, setMadrVersionInMd, setRelevantFilesInMd } from "@adr-manager/core";
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
    const adrFile: AdrFile = {
        path: "docs/decisions/0001-test.md",
        originalPath: "docs/decisions/0001-test.md",
        originalMd: editedMd,
        editedMd,
        id: 1
    };
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
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY };
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

test("opens relevant files from the metadata comment", async () => {
    const markdown = setRelevantFilesInMd(adr2md(sampleRecord()), ["src/main.ts", "docs/adr with spaces.md"]);
    const adrFile = openInStore(markdown);
    const editor = createEditor();
    await nextTick();

    expect(editor.requiresConversion.value).toBe(false);
    expect(editor.adr.value.relevantFiles).toStrictEqual(["src/main.ts", "docs/adr with spaces.md"]);
    expect(editor.markdown.value).toContain("<!-- adr-manager-relevant-files:");
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

test("raw edits can update relevant files without requiring conversion", async () => {
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();

    const replacement = setRelevantFilesInMd(adr2md(sampleRecord()), ["src/raw-edit.ts"]);
    editor.updateFromRaw(replacement);
    await nextTick();

    expect(editor.requiresConversion.value).toBe(false);
    expect(editor.adr.value.relevantFiles).toStrictEqual(["src/raw-edit.ts"]);
    expect(editor.markdown.value).toContain("<!-- adr-manager-relevant-files:");
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

    const v4File: AdrFile = {
        path: "docs/decisions/0001-v4.md",
        originalPath: "docs/decisions/0001-v4.md",
        originalMd: "",
        editedMd: adr2md400(v4Record),
        id: 1
    };
    const emptyFile: AdrFile = {
        path: "docs/decisions/0002-new.md",
        originalPath: "docs/decisions/0002-new.md",
        originalMd: "",
        editedMd: emptyMd,
        id: 2
    };
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

test("a basic ADR keeps a non-default version across reload via the persisted marker", async () => {
    // A basic ADR uses only sections both templates share, so its markdown alone is
    // indistinguishable between versions and opens at the default (4.0.0). Choosing the
    // other version must survive a reload, beating the default.
    const basic = new ArchitecturalDecisionRecord({
        title: "Use PostgreSQL",
        contextAndProblemStatement: "We need a durable system of record.",
        consideredOptions: [{ title: "PostgreSQL" }, { title: "DynamoDB" }],
        decisionOutcome: { chosenOption: "PostgreSQL", explanation: "it fits" }
    });
    const file = openInStore(adr2md(basic));
    const editor = createEditor();
    await nextTick();
    expect(editor.templateVersion.value).toBe("4.0.0");

    editor.setTemplateVersion("2.1.2");
    await nextTick();
    expect(editor.templateVersion.value).toBe("2.1.2");
    expect(file.editedMd).toContain('<!-- adr-manager-madr-version: "2.1.2" -->');

    // Reload: a fresh editor (version ref back at the default) must honor the marker.
    scope?.stop();
    const reloaded = createEditor();
    await nextTick();
    expect(reloaded.templateVersion.value).toBe("2.1.2");
    expect(reloaded.requiresConversion.value).toBe(false);
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
    expect(editor.markdown.value).toBe(setMadrVersionInMd(converted, "2.1.2"));
});

// ── Hidden-fields conversion dialog ─────────────────────────────────────────

test("opening an ADR whose data is in a hidden field sets hiddenFieldsCauseConversion", async () => {
    // The ADR on disk has a date, but date is toggled off.
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();

    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);
    expect(editor.requiresConversion.value).toBe(false);
    // The parsed ADR still holds the original value.
    expect(editor.adr.value.date).toBe("2026-06-10");
});

test("hiddenFieldsCauseConversion is false for a genuine parse error", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    openInStore(NON_CONFORMING_MD);
    const editor = createEditor();
    await nextTick();

    expect(editor.requiresConversion.value).toBe(true);
    expect(editor.hiddenFieldsCauseConversion.value).toBe(false);
});

test("hiddenFieldsCauseConversion is false when no hidden field has data", async () => {
    // date is hidden but the ADR has no date set
    const record = new ArchitecturalDecisionRecord({
        title: "No date ADR",
        contextAndProblemStatement: "Some context.",
        consideredOptions: [{ title: "Option A" }],
        decisionOutcome: { chosenOption: "Option A", explanation: "" }
    });
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    openInStore(adr2md(record));
    const editor = createEditor();
    await nextTick();

    expect(editor.hiddenFieldsCauseConversion.value).toBe(false);
    expect(editor.requiresConversion.value).toBe(false);
});

test("openWithFieldsVisible shows all fields temporarily without changing store toggles", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false, status: false };
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);

    editor.openWithFieldsVisible();
    await nextTick();

    expect(editor.hiddenFieldsCauseConversion.value).toBe(false);
    expect(editor.requiresConversion.value).toBe(false);
    // Store toggles must NOT be permanently changed.
    expect(store.fieldVisibility.date).toBe(false);
    expect(store.fieldVisibility.status).toBe(false);
    // But effectiveFieldVisibility reflects the temporary override.
    expect(editor.effectiveFieldVisibility.value.date).toBe(true);
    expect(editor.effectiveFieldVisibility.value.status).toBe(true);
    // The markdown now contains the field data.
    expect(editor.markdown.value).toContain("2026-06-10");
    expect(editor.markdown.value).toContain("accepted");
});

test("openWithFieldsHidden keeps the original markdown intact so toggling the field back on restores data", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);

    editor.openWithFieldsHidden();
    await nextTick();

    expect(editor.hiddenFieldsCauseConversion.value).toBe(false);
    expect(editor.requiresConversion.value).toBe(false);
    // adr.value still has the original date.
    expect(editor.adr.value.date).toBe("2026-06-10");
    // The original markdown is preserved (not overwritten with a filtered version)
    // so editedMd in the store still contains the raw date field data.
    expect(editor.markdown.value).toContain("2026-06-10");
    // But the field is still considered hidden in effectiveFieldVisibility.
    expect(editor.effectiveFieldVisibility.value.date).toBe(false);

    // Toggling the field back on regenerates the markdown and the date stays visible.
    store.setFieldVisibility("date", true);
    await nextTick();

    expect(editor.markdown.value).toContain("2026-06-10");
    expect(editor.effectiveFieldVisibility.value.date).toBe(true);
});

test("openWithFieldsHidden preserves editedMd so navigating away and back re-prompts the user", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    const file = openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);

    editor.openWithFieldsHidden();
    await nextTick();
    expect(editor.hiddenFieldsCauseConversion.value).toBe(false);

    // Navigate away and come back — the store's editedMd still has the original
    // markdown (with the hidden date), so the prompt should appear again.
    store.currentlyEditedAdr = undefined;
    await nextTick();
    store.currentlyEditedAdr = file;
    await nextTick();

    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);
    expect(editor.adr.value.date).toBe("2026-06-10");
});

test("updateFromRaw detects hidden-field mismatch and sets hiddenFieldsCauseConversion", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, deciders: false };
    openInStore(adr2md(new ArchitecturalDecisionRecord()));
    const editor = createEditor();
    await nextTick();

    // Paste in markdown that has deciders while that field is hidden.
    editor.updateFromRaw(adr2md(sampleRecord()));
    await nextTick();

    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);
    expect(editor.requiresConversion.value).toBe(false);
});

test("hiddenFieldsCauseConversion clears when a new ADR without hidden data is opened", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);

    // Open an ADR that has no date.
    const record = new ArchitecturalDecisionRecord({ title: "No date" });
    const adrFile = openInStore(adr2md(record));
    store.currentlyEditedAdr = adrFile;
    await nextTick();

    expect(editor.hiddenFieldsCauseConversion.value).toBe(false);
});

test("temporary visibility resets and prompts again when the ADR is re-opened", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    const file = openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);

    editor.openWithFieldsVisible();
    await nextTick();
    expect(editor.hiddenFieldsCauseConversion.value).toBe(false);
    expect(editor.effectiveFieldVisibility.value.date).toBe(true);

    // Simulate navigating away and back by re-triggering openAdrFile.
    store.currentlyEditedAdr = undefined;
    await nextTick();
    store.currentlyEditedAdr = file;
    await nextTick();

    // Should be prompted again.
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);
    expect(editor.effectiveFieldVisibility.value.date).toBe(false);
});

test("manually toggling a field exits the temporary full-visibility override", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    editor.openWithFieldsVisible();
    await nextTick();
    expect(editor.effectiveFieldVisibility.value.date).toBe(true);

    // User explicitly toggles a field → temporary override ends.
    store.setFieldVisibility("status", false);
    await nextTick();

    expect(editor.effectiveFieldVisibility.value.date).toBe(false);
    expect(editor.effectiveFieldVisibility.value.status).toBe(false);
});

// ── Field-visibility is non-destructive ─────────────────────────────────────

test("toggling a field off keeps its data in editedMd so re-enabling it restores the data after navigation", async () => {
    // ADR has a date. Date field starts visible.
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY };
    const file = openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    expect(editor.adr.value.date).toBe("2026-06-10");

    // User hides the date field.
    store.setFieldVisibility("date", false);
    await nextTick();

    // The editor no longer shows the date in its form/markdown view …
    expect(editor.effectiveFieldVisibility.value.date).toBe(false);
    // … but the file still has the date (editedMd preserves it).
    expect(file.editedMd).toContain("2026-06-10");

    // Navigate away and back.
    store.currentlyEditedAdr = undefined;
    await nextTick();
    store.currentlyEditedAdr = file;
    await nextTick();

    // The dialog appears (file has date, date is hidden).
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);
    expect(editor.adr.value.date).toBe("2026-06-10");

    // User re-enables the date field via the toggle (not the dialog).
    editor.openWithFieldsHidden();
    store.setFieldVisibility("date", true);
    await nextTick();

    // Data is intact.
    expect(editor.adr.value.date).toBe("2026-06-10");
    expect(editor.markdown.value).toContain("2026-06-10");
});

test("open-without-hidden-data → turn on → turn off → navigate → come back does not lose data", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    const file = openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);

    // User dismisses the dialog (open without hidden data).
    editor.openWithFieldsHidden();
    await nextTick();

    // User manually enables date.
    store.setFieldVisibility("date", true);
    await nextTick();
    expect(editor.markdown.value).toContain("2026-06-10");

    // User turns date off again.
    store.setFieldVisibility("date", false);
    await nextTick();

    // editedMd still holds the date even though the display markdown doesn't show it.
    expect(file.editedMd).toContain("2026-06-10");

    // Navigate away and back.
    store.currentlyEditedAdr = undefined;
    await nextTick();
    store.currentlyEditedAdr = file;
    await nextTick();

    // The dialog reappears — data was NOT silently deleted.
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);
    expect(editor.adr.value.date).toBe("2026-06-10");
});

// ── Highlighted-fields tracking ──────────────────────────────────────────────

test("openWithFieldsVisible populates highlightedFields with the fields that had hidden data", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false, status: false };
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    expect(editor.hiddenFieldsCauseConversion.value).toBe(true);

    editor.openWithFieldsVisible();
    await nextTick();

    expect(editor.highlightedFields.value.has("date")).toBe(true);
    expect(editor.highlightedFields.value.has("status")).toBe(true);
    // Fields that were visible are not highlighted.
    expect(editor.highlightedFields.value.has("decisionDrivers")).toBe(false);
});

test("highlightedFields does not include hidden fields that have no data", async () => {
    // status is hidden but this ADR has no status value
    const record = new ArchitecturalDecisionRecord({ title: "No status ADR", date: "2026-06-10" });
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false, status: false };
    openInStore(adr2md(record));
    const editor = createEditor();
    await nextTick();

    editor.openWithFieldsVisible();
    await nextTick();

    expect(editor.highlightedFields.value.has("date")).toBe(true);
    expect(editor.highlightedFields.value.has("status")).toBe(false);
});

test("highlightedFields clears when navigating to a different ADR", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    editor.openWithFieldsVisible();
    await nextTick();
    expect(editor.highlightedFields.value.size).toBeGreaterThan(0);

    const otherFile = openInStore(adr2md(new ArchitecturalDecisionRecord({ title: "Other" })));
    store.currentlyEditedAdr = otherFile;
    await nextTick();

    expect(editor.highlightedFields.value.size).toBe(0);
});

test("highlightedFields clears when the user manually toggles a field", async () => {
    store.fieldVisibility = { ...DEFAULT_FIELD_VISIBILITY, date: false };
    openInStore(adr2md(sampleRecord()));
    const editor = createEditor();
    await nextTick();
    editor.openWithFieldsVisible();
    await nextTick();
    expect(editor.highlightedFields.value.has("date")).toBe(true);

    store.setFieldVisibility("status", false);
    await nextTick();

    expect(editor.highlightedFields.value.size).toBe(0);
});
