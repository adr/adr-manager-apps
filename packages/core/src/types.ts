/**
 * Domain types for an Architectural Decision Record (the parsed/structured form).
 * The persisted "ADR file" object (raw markdown + bookkeeping) stays app-specific.
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

/** A single syntax error collected while parsing an ADR. */
export interface ParseError {
  message: string;
  line: number;
  charPosition: number;
}

/**
 * Constructor input for {@link ArchitecturalDecisionRecord}. All fields are optional;
 * the class fills in defaults, so the fields are never read back as `undefined`.
 */
export interface AdrInit {
  yaml?: string;
  title?: string;
  status?: string;
  conforming?: boolean;
  parseErrors?: ParseError[];
  deciders?: string;
  date?: string;
  technicalStory?: string;
  contextAndProblemStatement?: string;
  decisionDrivers?: string[];
  consideredOptions?: ReadonlyArray<Partial<Option>>;
  decisionOutcome?: Partial<DecisionOutcome>;
  links?: string[];
}
