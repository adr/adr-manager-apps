/**
 * Domain types for an Architectural Decision Record (the parsed/structured form)
 * and for the persisted ADR file objects.
 */

export interface Option {
    title: string;
    description: string;
    pros: string[];
    cons: string[];
    /** Stable key used for v-for / drag-and-drop / referencing an option. */
    id: number;
}

export interface DecisionOutcome {
    chosenOption: string;
    explanation: string;
    positiveConsequences: string[];
    negativeConsequences: string[];
}

/**
 * Constructor input for {@link ArchitecturalDecisionRecord}. All fields are optional;
 * the class fills in defaults, so the fields are never read back as `undefined`.
 */
export interface AdrInit {
    title?: string;
    status?: string;
    deciders?: string;
    date?: string;
    technicalStory?: string;
    contextAndProblemStatement?: string;
    decisionDrivers?: string[];
    consideredOptions?: ReadonlyArray<Partial<Option>>;
    decisionOutcome?: Partial<DecisionOutcome>;
    links?: string[];
}

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
