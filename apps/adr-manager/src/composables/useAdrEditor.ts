import { readonly, ref, watch } from "vue";
import { ArchitecturalDecisionRecord } from "@/plugins/classes";
import { adr2md, adr2md400, detectMadrVersion, md2adr, md2adr400 } from "@/plugins/parser";
import { store } from "@/plugins/store";
import type { MadrTemplateVersion } from "@adr-manager/core";
import type { AdrFile } from "@/types/adr";

/**
 * Ignores whitespace and bullet style, so files written by hand still count as conforming.
 */
function matchesIgnoringFormatting(left: string, right: string): boolean {
    const normalize = (md: string): string => md.replace(/[ \r\n]/g, "").replace(/- /g, "* ");
    return normalize(left) === normalize(right);
}

function serialize(adr: ArchitecturalDecisionRecord, version: MadrTemplateVersion): string {
    return version === "4.0.0" ? adr2md400(adr) : adr2md(adr);
}

function parse(markdown: string, version: MadrTemplateVersion): ArchitecturalDecisionRecord {
    return version === "4.0.0" ? md2adr400(markdown) : md2adr(markdown);
}

function roundTripsExactly(markdown: string, version: MadrTemplateVersion): boolean {
    return serialize(parse(markdown, version), version) === markdown;
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
        if (matchesIgnoringFormatting(md, serialize(parse(md, current), current))) {
            return current;
        }
        return detected;
    }

    function openAdrFile(adrFile: AdrFile | undefined): void {
        if (!adrFile) {
            adr.value = new ArchitecturalDecisionRecord();
            markdown.value = serialize(adr.value, templateVersion.value);
            requiresConversion.value = false;
            return;
        }
        markdown.value = adrFile.editedMd;
        templateVersion.value = resolveVersion(adrFile.editedMd);
        const parsed = parse(adrFile.editedMd, templateVersion.value);
        if (matchesIgnoringFormatting(adrFile.editedMd, serialize(parsed, templateVersion.value))) {
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
        markdown.value = newMarkdown;
        templateVersion.value = resolveVersion(newMarkdown);
        if (roundTripsExactly(newMarkdown, templateVersion.value)) {
            adr.value = parse(newMarkdown, templateVersion.value);
            requiresConversion.value = false;
        } else {
            requiresConversion.value = true;
        }
    }

    function acceptConversion(convertedMarkdown: string): void {
        adr.value = parse(convertedMarkdown, templateVersion.value);
        markdown.value = convertedMarkdown;
        requiresConversion.value = false;
    }

    /**
     * Rewrites the open document in the other template. Deciders and decision-makers
     * describe the same people, so the populated one is carried over.
     */
    function setTemplateVersion(version: MadrTemplateVersion): void {
        if (version === templateVersion.value) {
            return;
        }
        templateVersion.value = version;
        if (requiresConversion.value) {
            return;
        }
        const record = adr.value;
        if (version === "4.0.0" && record.decisionMakers === "" && record.deciders !== "") {
            record.decisionMakers = record.deciders;
        }
        if (version === "2.1.2" && record.deciders === "" && record.decisionMakers !== "") {
            record.deciders = record.decisionMakers;
        }
        markdown.value = serialize(record, version);
    }

    watch(() => store.currentlyEditedAdr, openAdrFile, { immediate: true });

    // Form edits mutate the record in place, so a deep watch regenerates the markdown.
    watch(
        adr,
        (updated) => {
            if (!requiresConversion.value) {
                markdown.value = serialize(updated, templateVersion.value);
            }
        },
        { deep: true }
    );

    watch(markdown, (newMarkdown) => {
        store.updateMdOfCurrentAdr(newMarkdown);
    });

    return {
        adr,
        markdown: readonly(markdown),
        requiresConversion: readonly(requiresConversion),
        templateVersion: readonly(templateVersion),
        setTemplateVersion,
        updateFromRaw,
        acceptConversion
    };
}
