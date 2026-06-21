import { ArchitecturalDecisionRecord } from "./classes";

export const FIELD_KEYS = [
  "date",
  "status",
  "deciders",
  "consulted",
  "informed",
  "technicalStory",
  "decisionDrivers",
  "optionDescription",
  "optionProsAndCons",
  "positiveConsequences",
  "negativeConsequences",
  "consequences",
  "confirmation",
  "links",
  "moreInformation",
  "relevantFiles"
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];

export type FieldVisibility = Record<FieldKey, boolean>;

export const DEFAULT_FIELD_VISIBILITY: FieldVisibility = {
  date: true,
  status: true,
  deciders: true,
  consulted: true,
  informed: true,
  technicalStory: true,
  decisionDrivers: true,
  optionDescription: true,
  optionProsAndCons: true,
  positiveConsequences: true,
  negativeConsequences: true,
  consequences: true,
  confirmation: true,
  links: true,
  moreInformation: true,
  relevantFiles: true
};

/**
 * Returns the FieldKeys that are currently hidden (false in visibility) but have
 * non-empty data in the given ADR.  Used to detect when a round-trip failure is
 * caused purely by toggled-off fields rather than a genuine parse error.
 */
export function getHiddenFieldsWithData(adr: ArchitecturalDecisionRecord, visibility: FieldVisibility): FieldKey[] {
  const result: FieldKey[] = [];

  if (!visibility.date && adr.date) result.push("date");
  if (!visibility.status && adr.status) result.push("status");
  if (!visibility.deciders && (adr.deciders || adr.decisionMakers)) result.push("deciders");
  if (!visibility.consulted && adr.consulted) result.push("consulted");
  if (!visibility.informed && adr.informed) result.push("informed");
  if (!visibility.technicalStory && adr.technicalStory) result.push("technicalStory");
  if (!visibility.decisionDrivers && adr.decisionDrivers.length > 0) result.push("decisionDrivers");
  if (!visibility.optionDescription && adr.consideredOptions.some((o) => o.description))
    result.push("optionDescription");
  if (
    !visibility.optionProsAndCons &&
    adr.consideredOptions.some((o) => o.pros.length > 0 || o.cons.length > 0 || o.neutrals.length > 0)
  )
    result.push("optionProsAndCons");
  if (!visibility.positiveConsequences && adr.decisionOutcome.positiveConsequences.length > 0)
    result.push("positiveConsequences");
  if (!visibility.negativeConsequences && adr.decisionOutcome.negativeConsequences.length > 0)
    result.push("negativeConsequences");
  if (!visibility.consequences && adr.consequences.length > 0) result.push("consequences");
  if (!visibility.confirmation && adr.confirmation) result.push("confirmation");
  if (!visibility.links && adr.links.length > 0) result.push("links");
  if (!visibility.moreInformation && adr.moreInformation) result.push("moreInformation");
  if (!visibility.relevantFiles && adr.relevantFiles.length > 0) result.push("relevantFiles");

  return result;
}

/**
 * Returns a new ArchitecturalDecisionRecord with every hidden field reset to its
 * empty default. The original is never mutated.
 *
 * Pass the result to adr2md / adr2md400 so hidden fields are absent from the
 * saved markdown while the in-memory form still holds the user's values.
 */
export function applyFieldVisibilityFilter(
  adr: ArchitecturalDecisionRecord,
  visibility: FieldVisibility
): ArchitecturalDecisionRecord {
  return new ArchitecturalDecisionRecord({
    yaml: adr.yaml,
    title: adr.title,
    contextAndProblemStatement: adr.contextAndProblemStatement,
    decisionOutcome: {
      chosenOption: adr.decisionOutcome.chosenOption,
      explanation: adr.decisionOutcome.explanation,
      positiveConsequences: visibility.positiveConsequences ? adr.decisionOutcome.positiveConsequences : [],
      negativeConsequences: visibility.negativeConsequences ? adr.decisionOutcome.negativeConsequences : []
    },

    date: visibility.date ? adr.date : "",
    status: visibility.status ? adr.status : "",

    // deciders and decisionMakers represent the same people across versions
    deciders: visibility.deciders ? adr.deciders : "",
    decisionMakers: visibility.deciders ? adr.decisionMakers : "",
    consulted: visibility.consulted ? adr.consulted : "",
    informed: visibility.informed ? adr.informed : "",

    technicalStory: visibility.technicalStory ? adr.technicalStory : "",

    decisionDrivers: visibility.decisionDrivers ? adr.decisionDrivers : [],
    consideredOptions: adr.consideredOptions.map((opt) => ({
      //consideredOptions is an array so we need to check visibility for
      // each field separately, since setting array to [],
      // would lose all options
      ...opt,
      description: visibility.optionDescription ? opt.description : "",
      pros: visibility.optionProsAndCons ? opt.pros : [],
      neutrals: visibility.optionProsAndCons ? opt.neutrals : [],
      cons: visibility.optionProsAndCons ? opt.cons : []
    })),

    consequences: visibility.consequences ? adr.consequences : [],
    confirmation: visibility.confirmation ? adr.confirmation : "",

    links: visibility.links ? adr.links : [],
    relevantFiles: visibility.relevantFiles ? adr.relevantFiles : [],
    moreInformation: visibility.moreInformation ? adr.moreInformation : ""
  });
}
