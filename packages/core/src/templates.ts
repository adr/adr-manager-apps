import { ArchitecturalDecisionRecord } from "./classes";
import { adr2md, md2adr } from "./parser";
import { adr2md400, md2adr400 } from "./madr400";
import type { Adr2MdOptions, Md2AdrOptions } from "./parser";
import type { FieldKey } from "./fields";
import type { ConsequenceKind, MadrTemplateVersion } from "./types";

export interface MadrTemplateField {
  key: FieldKey;
  label: string;
}

export type MadrTemplatePeopleFields = "deciders" | "decisionMakersConsultedInformed";

export interface MadrTemplateAdapter {
  version: MadrTemplateVersion;
  label: string;
  subLabel: string;
  description: string;
  fields: readonly MadrTemplateField[];
  peopleFields: MadrTemplatePeopleFields;
  optionArgumentKinds: readonly ConsequenceKind[];
  detect(markdown: string): boolean;
  parse(markdown: string, options?: Md2AdrOptions): ArchitecturalDecisionRecord;
  serialize(adr: ArchitecturalDecisionRecord, options?: Adr2MdOptions): string;
  carryOverOnSwitch(record: ArchitecturalDecisionRecord, from: MadrTemplateVersion): void;
}

export interface MadrRoundTripOptions {
  parse?: Md2AdrOptions;
  serialize?: Adr2MdOptions;
  compare?: (original: string, serialized: string) => boolean;
}

const FIELDS_212: readonly MadrTemplateField[] = [
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "deciders", label: "Deciders" },
  { key: "technicalStory", label: "Technical Story" },
  { key: "decisionDrivers", label: "Decision Drivers" },
  { key: "optionDescription", label: "Option Description" },
  { key: "optionProsAndCons", label: "Option Pros & Cons" },
  { key: "positiveConsequences", label: "Positive Consequences" },
  { key: "negativeConsequences", label: "Negative Consequences" },
  { key: "links", label: "Links" },
  { key: "relevantFiles", label: "Relevant Files" }
];

const FIELDS_400: readonly MadrTemplateField[] = [
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "deciders", label: "Decision-makers" },
  { key: "consulted", label: "Consulted" },
  { key: "informed", label: "Informed" },
  { key: "decisionDrivers", label: "Decision Drivers" },
  { key: "optionDescription", label: "Option Description" },
  { key: "optionProsAndCons", label: "Option Pros & Cons" },
  { key: "consequences", label: "Consequences" },
  { key: "confirmation", label: "Confirmation" },
  { key: "moreInformation", label: "More Information" },
  { key: "relevantFiles", label: "Relevant Files" }
];

function detectsMadr400(markdown: string): boolean {
  const normalized = markdown.replace(/\r\n/g, "\n");
  return (
    normalized.startsWith("---\n") ||
    /^### Consequences$/m.test(normalized) ||
    /^### Confirmation$/m.test(normalized) ||
    /^## More Information$/m.test(normalized) ||
    /^\* Neutral, because /m.test(normalized)
  );
}

const MADR_400_ADAPTER: MadrTemplateAdapter = {
  version: "4.0.0",
  label: "MADR 4.0.0",
  subLabel: "latest",
  description:
    "Decision-makers / consulted / informed, combined Consequences, Confirmation, neutral arguments and a More Information section.",
  fields: FIELDS_400,
  peopleFields: "decisionMakersConsultedInformed",
  optionArgumentKinds: ["good", "neutral", "bad"],
  detect: detectsMadr400,
  parse: (markdown) => md2adr400(markdown),
  serialize: (adr) => adr2md400(adr),
  carryOverOnSwitch: (record, from) => {
    if (from === MADR_212_ADAPTER.version && record.decisionMakers === "" && record.deciders !== "") {
      record.decisionMakers = record.deciders;
    }
  }
};

const MADR_212_ADAPTER: MadrTemplateAdapter = {
  version: "2.1.2",
  label: "MADR 2.1.2",
  subLabel: "classic",
  description: "The classic template: deciders, Technical Story, separate Positive / Negative Consequences and Links.",
  fields: FIELDS_212,
  peopleFields: "deciders",
  optionArgumentKinds: ["good", "bad"],
  detect: () => true,
  parse: (markdown, options) => md2adr(markdown, options),
  serialize: (adr, options) => adr2md(adr, options),
  carryOverOnSwitch: (record, from) => {
    if (from !== MADR_212_ADAPTER.version && record.deciders === "" && record.decisionMakers !== "") {
      record.deciders = record.decisionMakers;
    }
  }
};

export const MADR_TEMPLATE_ADAPTERS = [MADR_400_ADAPTER, MADR_212_ADAPTER] as const;

/** The version new ADRs and undetectable documents default to (the newest template). */
export const DEFAULT_MADR_VERSION: MadrTemplateVersion = MADR_400_ADAPTER.version;

export function getMadrTemplateAdapter(version: MadrTemplateVersion): MadrTemplateAdapter {
  const adapter = MADR_TEMPLATE_ADAPTERS.find((candidate) => candidate.version === version);
  if (!adapter) {
    throw new Error(`Unsupported MADR template version: ${version}`);
  }
  return adapter;
}

export function hasMadrTemplateField(adapter: MadrTemplateAdapter, key: FieldKey): boolean {
  return adapter.fields.some((field) => field.key === key);
}

export function detectMadrVersion(markdown: string): MadrTemplateVersion {
  return MADR_TEMPLATE_ADAPTERS.find((adapter) => adapter.detect(markdown))?.version ?? DEFAULT_MADR_VERSION;
}

export function parseMadr(
  markdown: string,
  version: MadrTemplateVersion = detectMadrVersion(markdown),
  options?: Md2AdrOptions
): ArchitecturalDecisionRecord {
  return getMadrTemplateAdapter(version).parse(markdown, options);
}

export function serializeMadr(
  adr: ArchitecturalDecisionRecord,
  version: MadrTemplateVersion,
  options?: Adr2MdOptions
): string {
  return getMadrTemplateAdapter(version).serialize(adr, options);
}

export function roundTripsMadr(
  markdown: string,
  version: MadrTemplateVersion = detectMadrVersion(markdown),
  options: MadrRoundTripOptions = {}
): boolean {
  const serialized = serializeMadr(parseMadr(markdown, version, options.parse), version, options.serialize);
  return (options.compare ?? ((original, next) => original === next))(markdown, serialized);
}
