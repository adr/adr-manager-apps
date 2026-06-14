/**
 * Domain types for an Architectural Decision Record. The parsed/structured types come from
 * the shared @adr-manager/core package; `AdrFile` (the persisted file object) is web-specific.
 */

export type { Option, DecisionOutcome, AdrInit, Tag } from "@adr-manager/core";

/**
 * The persisted "ADR file" object stored per-repository and round-tripped through
 * localStorage. This is distinct from {@link ArchitecturalDecisionRecord} (the parsed
 * structure): an `AdrFile` holds the raw markdown plus bookkeeping fields.
 */
export interface AdrFile {
    path: string;
    originalMd: string;
    editedMd: string;
    id: number;
    /** Present only on freshly-created, not-yet-committed files. */
    newAdr?: boolean;
}
