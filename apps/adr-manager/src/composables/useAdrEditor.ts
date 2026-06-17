import { readonly, ref, watch } from "vue";
import { ArchitecturalDecisionRecord } from "@/plugins/classes";
import { detectMadrVersion, getMadrTemplateAdapter, parseMadr, serializeMadr } from "@/plugins/parser";
import { store } from "@/plugins/store";
import {
    matchesIgnoringFormatting,
    applyFieldVisibilityFilter,
    parseTagsFromMd,
    stripTagComment,
    setTagsInMd
} from "@adr-manager/core";
import type { MadrTemplateVersion } from "@adr-manager/core";
import type { AdrFile, Tag } from "@/types/adr";

function serializeAdr(adr: ArchitecturalDecisionRecord, version: MadrTemplateVersion): string {
    const filtered = applyFieldVisibilityFilter(adr, store.fieldVisibility);
    return serializeMadr(filtered, version);
}

function serialize(adr: ArchitecturalDecisionRecord, version: MadrTemplateVersion, tags: Tag[]): string {
    return setTagsInMd(serializeAdr(adr, version), tags);
}

function parse(markdown: string, version: MadrTemplateVersion): ArchitecturalDecisionRecord {
    return parseMadr(markdown, version);
}

// Strip the tag comment before comparing so tags never break the round-trip check.
function roundTripsExactly(markdown: string, version: MadrTemplateVersion): boolean {
    const stripped = stripTagComment(markdown);
    return serializeAdr(parse(stripped, version), version) === stripped;
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
    const templateVersion = ref<MadrTemplateVersion>("2.1.2");

    /**
     * A document that only uses the sections both templates share (e.g. a freshly
     * created ADR) fits either version. In that case the selected version sticks
     * instead of falling back to the detector's default.
     */
    function resolveVersion(md: string): MadrTemplateVersion {
        const detected = detectMadrVersion(md);
        if (detected === templateVersion.value) {
            return detected;
        }
        const current = templateVersion.value;
        const stripped = stripTagComment(md);
        if (matchesIgnoringFormatting(stripped, serializeAdr(parse(stripped, current), current))) {
            return current;
        }
        return detected;
    }

    function openAdrFile(adrFile: AdrFile | undefined): void {
        if (!adrFile) {
            adr.value = new ArchitecturalDecisionRecord();
            tags.value = [];
            markdown.value = serialize(adr.value, templateVersion.value, []);
            requiresConversion.value = false;
            return;
        }
        tags.value = parseTagsFromMd(adrFile.editedMd);
        const stripped = stripTagComment(adrFile.editedMd);
        markdown.value = adrFile.editedMd;
        templateVersion.value = resolveVersion(stripped);
        const parsed = parse(stripped, templateVersion.value);
        if (matchesIgnoringFormatting(stripped, serializeAdr(parsed, templateVersion.value))) {
            adr.value = parsed;
            requiresConversion.value = false;
        } else {
            requiresConversion.value = true;
        }
    }

    function updateFromRaw(newMarkdown: string): void {
        if (newMarkdown === markdown.value) {
            return;
        }
        tags.value = parseTagsFromMd(newMarkdown);
        markdown.value = newMarkdown;
        templateVersion.value = resolveVersion(newMarkdown);
        if (roundTripsExactly(newMarkdown, templateVersion.value)) {
            adr.value = parse(stripTagComment(newMarkdown), templateVersion.value);
            requiresConversion.value = false;
        } else {
            requiresConversion.value = true;
        }
    }

    function acceptConversion(convertedMarkdown: string): void {
        tags.value = parseTagsFromMd(convertedMarkdown);
        adr.value = parse(stripTagComment(convertedMarkdown), templateVersion.value);
        markdown.value = convertedMarkdown;
        requiresConversion.value = false;
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
            if (!requiresConversion.value) {
                markdown.value = serialize(updated, templateVersion.value, tags.value);
            }
        },
        { deep: true }
    );

    watch(markdown, (newMarkdown) => {
        store.updateMdOfCurrentAdr(newMarkdown);
    });

    watch(
        () => store.fieldVisibility,
        () => {
            if (!requiresConversion.value) {
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
        templateVersion: readonly(templateVersion),
        setTags,
        setTemplateVersion,
        updateFromRaw,
        acceptConversion
    };
}
