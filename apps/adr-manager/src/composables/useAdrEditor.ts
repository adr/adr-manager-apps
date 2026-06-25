import { computed, readonly, ref, watch } from "vue";
import { ArchitecturalDecisionRecord } from "@/plugins/classes";
import { getMadrTemplateAdapter, parseMadr, serializeMadr, DEFAULT_MADR_VERSION } from "@/plugins/parser";
import { store } from "@/plugins/store";
import {
    matchesIgnoringFormatting,
    applyFieldVisibilityFilter,
    DEFAULT_FIELD_VISIBILITY,
    getHiddenFieldsWithData,
    parseRelevantFilesFromMd,
    parseTagsFromMd,
    setRelevantFilesInMd,
    setTagsInMd,
    setMadrVersionInMd,
    resolveAdrTemplateVersion,
    stripAdrManagerMetadata
} from "@adr-manager/core";
import type { FieldKey, FieldVisibility, MadrTemplateVersion } from "@adr-manager/core";
import type { AdrFile, Tag } from "@/types/adr";

function parse(markdown: string, version: MadrTemplateVersion): ArchitecturalDecisionRecord {
    const record = parseMadr(stripAdrManagerMetadata(markdown), version);
    record.relevantFiles = parseRelevantFilesFromMd(markdown);
    return record;
}

/**
 * Owns the bidirectional sync between the structured ADR (form editor) and its
 * markdown source (raw editor), including which MADR template version the open
 * document follows. When the markdown cannot be parsed without loss,
 * `requiresConversion` becomes true and the form is replaced by the convert view.
 */
export function useAdrEditor() {
    const adr = ref(new ArchitecturalDecisionRecord());
    const markdown = ref("");
    const tags = ref<Tag[]>([]);
    const requiresConversion = ref(false);
    const hiddenFieldsCauseConversion = ref(false);
    /**
     * Set to true by openWithFieldsVisible() so the editor shows and serializes
     * all fields without permanently flipping the store toggles. Cleared whenever
     * the user opens a different ADR or manually changes a field-visibility toggle.
     */
    const temporarilyShowAllFields = ref(false);
    /**
     * Snapshot of which fields were revealed by openWithFieldsVisible(). Cleared
     * when temporary mode ends so highlights disappear with it.
     */
    const highlightedFields = ref(new Set<FieldKey>());
    const templateVersion = ref<MadrTemplateVersion>(DEFAULT_MADR_VERSION);

    function effectiveVisibility(): FieldVisibility {
        return temporarilyShowAllFields.value ? { ...DEFAULT_FIELD_VISIBILITY } : store.fieldVisibility;
    }

    /** Reactive snapshot of effectiveVisibility() for component props. */
    const effectiveFieldVisibility = computed<FieldVisibility>(() =>
        temporarilyShowAllFields.value ? { ...DEFAULT_FIELD_VISIBILITY } : store.fieldVisibility
    );

    function serializeAdr(adrRecord: ArchitecturalDecisionRecord, version: MadrTemplateVersion): string {
        const filtered = applyFieldVisibilityFilter(adrRecord, effectiveVisibility());
        return serializeMadr(filtered, version);
    }

    function serialize(adrRecord: ArchitecturalDecisionRecord, version: MadrTemplateVersion, t: Tag[]): string {
        const filtered = applyFieldVisibilityFilter(adrRecord, effectiveVisibility());
        const md = serializeMadr(filtered, version);
        return setMadrVersionInMd(setTagsInMd(setRelevantFilesInMd(md, filtered.relevantFiles), t), version);
    }

    // Serializes ALL field data regardless of visibility. Used when persisting to
    // editedMd so that hiding a field never silently deletes its content from the file.
    function serializeFull(adrRecord: ArchitecturalDecisionRecord, version: MadrTemplateVersion, t: Tag[]): string {
        const md = serializeMadr(adrRecord, version);
        return setMadrVersionInMd(setTagsInMd(setRelevantFilesInMd(md, adrRecord.relevantFiles), t), version);
    }

    // Strip metadata comments before comparing so app-level fields never break round-trip checks.
    function roundTripsExactly(md: string, version: MadrTemplateVersion): boolean {
        const stripped = stripAdrManagerMetadata(md);
        return serializeAdr(parse(stripped, version), version) === stripped;
    }

    function clearTemporaryState(): void {
        temporarilyShowAllFields.value = false;
        highlightedFields.value = new Set();
    }

    function openAdrFile(adrFile: AdrFile | undefined): void {
        // Always reset the temporary full-visibility override when switching files so
        // the user is prompted again if the new (or re-opened) file has hidden data.
        clearTemporaryState();

        if (!adrFile) {
            adr.value = new ArchitecturalDecisionRecord();
            tags.value = [];
            markdown.value = serialize(adr.value, templateVersion.value, []);
            requiresConversion.value = false;
            hiddenFieldsCauseConversion.value = false;
            return;
        }
        tags.value = parseTagsFromMd(adrFile.editedMd);
        const stripped = stripAdrManagerMetadata(adrFile.editedMd);
        markdown.value = adrFile.editedMd;
        templateVersion.value = resolveAdrTemplateVersion(adrFile.editedMd, { preferredVersion: templateVersion.value });
        const parsed = parse(adrFile.editedMd, templateVersion.value);
        if (matchesIgnoringFormatting(stripped, serializeAdr(parsed, templateVersion.value))) {
            adr.value = parsed;
            requiresConversion.value = false;
            hiddenFieldsCauseConversion.value = false;
        } else if (matchesIgnoringFormatting(stripped, serializeMadr(parsed, templateVersion.value))) {
            // Round-trips fine with all fields visible → the mismatch is caused by hidden fields with data.
            adr.value = parsed;
            requiresConversion.value = false;
            hiddenFieldsCauseConversion.value = true;
        } else {
            requiresConversion.value = true;
            hiddenFieldsCauseConversion.value = false;
        }
    }

    function updateFromRaw(newMarkdown: string): void {
        if (newMarkdown === markdown.value) {
            return;
        }
        tags.value = parseTagsFromMd(newMarkdown);
        markdown.value = newMarkdown;
        templateVersion.value = resolveAdrTemplateVersion(newMarkdown, { preferredVersion: templateVersion.value });
        if (roundTripsExactly(newMarkdown, templateVersion.value)) {
            adr.value = parse(newMarkdown, templateVersion.value);
            requiresConversion.value = false;
            hiddenFieldsCauseConversion.value = false;
        } else {
            const stripped = stripAdrManagerMetadata(newMarkdown);
            const parsed = parse(newMarkdown, templateVersion.value);
            if (matchesIgnoringFormatting(stripped, serializeMadr(parsed, templateVersion.value))) {
                adr.value = parsed;
                requiresConversion.value = false;
                hiddenFieldsCauseConversion.value = true;
            } else {
                requiresConversion.value = true;
                hiddenFieldsCauseConversion.value = false;
            }
        }
    }

    function acceptConversion(convertedMarkdown: string): void {
        tags.value = parseTagsFromMd(convertedMarkdown);
        adr.value = parse(convertedMarkdown, templateVersion.value);
        markdown.value = convertedMarkdown;
        requiresConversion.value = false;
        hiddenFieldsCauseConversion.value = false;
    }

    /**
     * Reveal all fields for this one viewing session without permanently changing
     * the store's field-visibility toggles. Navigating to a different ADR or
     * manually toggling a field resets this override.
     */
    function openWithFieldsVisible(): void {
        highlightedFields.value = new Set(getHiddenFieldsWithData(adr.value, store.fieldVisibility));
        temporarilyShowAllFields.value = true;
        hiddenFieldsCauseConversion.value = false;
        markdown.value = serialize(adr.value, templateVersion.value, tags.value);
    }

    /**
     * Dismiss the hidden-fields prompt and open the ADR with the current field-
     * visibility settings (fields remain hidden). The original markdown is NOT
     * overwritten — the hidden-field data survives navigation so the user can
     * recover it by toggling the field back on in the same or a future session.
     */
    function openWithFieldsHidden(): void {
        hiddenFieldsCauseConversion.value = false;
        // Do NOT change markdown.value here. Leaving it as the original preserves
        // editedMd in the store, which means:
        //   • toggling the field back on immediately restores the data, and
        //   • re-opening the ADR will prompt the user again if the toggle is still off.
    }

    function setTags(newTags: Tag[]): void {
        tags.value = newTags;
        if (!requiresConversion.value) {
            markdown.value = serialize(adr.value, templateVersion.value, newTags);
        }
    }

    /**
     * Rewrites the open document in the other template. Deciders and decision-makers
     * describe the same people, so the populated one is carried over.
     */
    function setTemplateVersion(version: MadrTemplateVersion): void {
        if (version === templateVersion.value) {
            return;
        }
        const previousVersion = templateVersion.value;
        templateVersion.value = version;
        if (requiresConversion.value) {
            return;
        }
        const record = adr.value;
        getMadrTemplateAdapter(version).carryOverOnSwitch(record, previousVersion);
        markdown.value = serialize(record, version, tags.value);
    }

    watch(() => store.currentlyEditedAdr, openAdrFile, { immediate: true });

    // Form edits mutate the record in place, so a deep watch regenerates the markdown.
    watch(
        adr,
        (updated) => {
            if (!requiresConversion.value && !hiddenFieldsCauseConversion.value) {
                markdown.value = serialize(updated, templateVersion.value, tags.value);
            }
        },
        { deep: true }
    );

    watch(markdown, () => {
        if (!requiresConversion.value && !hiddenFieldsCauseConversion.value) {
            // Persist the full ADR data so field visibility is non-destructive:
            // hidden fields are preserved in the file and can be re-enabled at any time.
            store.updateMdOfCurrentAdr(serializeFull(adr.value, templateVersion.value, tags.value));
        } else {
            // In convert or hidden-fields-prompt mode, markdown.value is the raw source
            // of truth (we don't have a fully parsed adr.value to re-serialize from).
            store.updateMdOfCurrentAdr(markdown.value);
        }
    });

    watch(
        () => store.fieldVisibility,
        () => {
            // A manual toggle exits the temporary full-visibility override so the
            // user's new setting takes effect immediately.
            clearTemporaryState();
            if (!requiresConversion.value && !hiddenFieldsCauseConversion.value) {
                markdown.value = serialize(adr.value, templateVersion.value, tags.value);
            }
        },
        { deep: true }
    );

    return {
        adr,
        tags: readonly(tags),
        markdown: readonly(markdown),
        requiresConversion: readonly(requiresConversion),
        hiddenFieldsCauseConversion: readonly(hiddenFieldsCauseConversion),
        effectiveFieldVisibility,
        highlightedFields: readonly(highlightedFields),
        templateVersion: readonly(templateVersion),
        setTags,
        setTemplateVersion,
        updateFromRaw,
        acceptConversion,
        openWithFieldsVisible,
        openWithFieldsHidden
    };
}
