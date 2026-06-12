/**
 * Domain types for an Architectural Decision Record (the parsed/structured form).
 * The persisted "ADR file" object (raw markdown + bookkeeping) stays app-specific.
 */

/** The MADR template versions the tooling can read and write. */
export type MadrTemplateVersion = "2.1.2" | "4.0.0";

export interface Option {
  title: string;
  description: string;
  pros: string[];
  /** Arguments that are neither for nor against the option (MADR 4.0.0). */
  neutrals: string[];
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

export type ConsequenceKind = "good" | "neutral" | "bad";

/** One entry of the combined Consequences list (MADR 4.0.0). */
export interface Consequence {
  kind: ConsequenceKind;
  text: string;
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
  relevantFiles?: string[];
  decisionMakers?: string;
  consulted?: string;
  informed?: string;
  confirmation?: string;
  consequences?: Consequence[];
  moreInformation?: string;
}
