import type { AdrInit, DecisionOutcome, Option, ParseError } from "./types";
import { cleanUpString } from "./utils";

/**
 * The structured form of a single MADR (parsed from / serialized to Markdown).
 *
 * Unifies the web app's strict model with the VS Code extension's extra fields
 * (`yaml`, `conforming`, `parseErrors`) and `update()` method. These extra fields are
 * always present (defaulted in the constructor) so both apps' `toStrictEqual` fixtures hold.
 */
export class ArchitecturalDecisionRecord {
  yaml: string;
  title: string;
  status: string;
  conforming: boolean;
  parseErrors: ParseError[];
  deciders: string;
  date: string;
  technicalStory: string;
  contextAndProblemStatement: string;
  decisionDrivers: string[];
  highestOptionId: number;
  consideredOptions: Option[];
  decisionOutcome: DecisionOutcome;
  links: string[];

  constructor(init: AdrInit = {}) {
    this.yaml = init.yaml ?? "";
    this.title = init.title ?? "";
    this.status = init.status ?? "";
    this.conforming = init.conforming ?? true;
    this.parseErrors = init.parseErrors ?? [];
    this.deciders = init.deciders ?? "";
    this.date = init.date ?? "";
    this.technicalStory = init.technicalStory ?? "";
    this.contextAndProblemStatement = init.contextAndProblemStatement ?? "";
    this.decisionDrivers = init.decisionDrivers ?? [];
    this.highestOptionId = 0;
    this.consideredOptions = [];
    if (init.consideredOptions) {
      for (const opt of init.consideredOptions) {
        this.addOption(opt);
      }
    }
    const outcome = init.decisionOutcome;
    this.decisionOutcome = {
      chosenOption: outcome?.chosenOption ?? "",
      explanation: outcome?.explanation ?? "",
      positiveConsequences: outcome?.positiveConsequences ?? [],
      negativeConsequences: outcome?.negativeConsequences ?? []
    };
    this.links = init.links ?? [];

    this.cleanUp();
  }

  addOption({ title, description, pros, cons }: Partial<Option> = {}): Option {
    const id = this.highestOptionId;
    this.highestOptionId += 1;
    const newOpt: Option = {
      title: title ?? "",
      description: description ?? "",
      pros: pros ?? [],
      cons: cons ?? [],
      id
    };
    this.consideredOptions.push(newOpt);
    return newOpt;
  }

  getOptionByTitle(title: string): Option | undefined {
    return this.consideredOptions.find((el) => el.title.startsWith(title));
  }

  /**
   * Cleans up the ADR: asserts string fields are strings and trims them.
   *
   * Default (lenient) mode preserves the web app's historical round-trip behaviour:
   * `positiveConsequences` and `links` are trimmed but not filtered, and
   * `negativeConsequences` is left untouched. Aggressive mode (the VS Code extension)
   * additionally trims and filters `positiveConsequences`, `negativeConsequences`, and `links`.
   */
  cleanUp(opts: { aggressive?: boolean } = {}): void {
    const aggressive = opts.aggressive ?? false;

    this.yaml = cleanUpString(this.yaml);
    this.title = cleanUpString(this.title);
    this.status = cleanUpString(this.status);
    this.date = cleanUpString(this.date);
    this.deciders = cleanUpString(this.deciders);
    this.technicalStory = cleanUpString(this.technicalStory);
    this.contextAndProblemStatement = cleanUpString(this.contextAndProblemStatement);

    this.decisionDrivers = this.decisionDrivers.map(cleanUpString).filter((el) => el !== "");

    this.consideredOptions.forEach((opt) => {
      opt.title = cleanUpString(opt.title);
      opt.description = cleanUpString(opt.description);
      opt.pros = opt.pros.map(cleanUpString).filter((el) => el !== "");
      opt.cons = opt.cons.map(cleanUpString).filter((el) => el !== "");
    });

    this.decisionOutcome.chosenOption = cleanUpString(this.decisionOutcome.chosenOption);
    this.decisionOutcome.explanation = cleanUpString(this.decisionOutcome.explanation);

    if (aggressive) {
      this.decisionOutcome.positiveConsequences = this.decisionOutcome.positiveConsequences
        .map(cleanUpString)
        .filter((el) => el !== "");
      this.decisionOutcome.negativeConsequences = this.decisionOutcome.negativeConsequences
        .map(cleanUpString)
        .filter((el) => el !== "");
      this.links = this.links.map(cleanUpString).filter((el) => el !== "");
    } else {
      this.decisionOutcome.positiveConsequences = this.decisionOutcome.positiveConsequences.map(cleanUpString);
      // negativeConsequences intentionally left untouched (web round-trip fixtures depend on it).
      this.links = this.links.map(cleanUpString);
    }
  }

  /**
   * Updates the given fields if passed (truthy / defined). Used by the VS Code extension
   * when editing an existing ADR.
   */
  update(fields: {
    yaml?: string;
    title?: string;
    status?: string;
    deciders?: string;
    date?: string;
    technicalStory?: string;
    contextAndProblemStatement?: string;
    decisionDrivers?: string[];
    consideredOptions?: ReadonlyArray<Partial<Option>>;
    decisionOutcome?: DecisionOutcome;
    links?: string[];
  }): void {
    this.yaml = fields.yaml ?? this.yaml;
    this.title = fields.title ?? this.title;
    this.status = fields.status ?? this.status;
    this.deciders = fields.deciders ?? this.deciders;
    this.date = fields.date ?? this.date;
    this.technicalStory = fields.technicalStory ?? this.technicalStory;
    this.contextAndProblemStatement = fields.contextAndProblemStatement ?? this.contextAndProblemStatement;
    this.decisionDrivers = fields.decisionDrivers ?? this.decisionDrivers;
    this.decisionOutcome = fields.decisionOutcome ?? this.decisionOutcome;
    this.links = fields.links ?? this.links;
    if (fields.consideredOptions && fields.consideredOptions.length) {
      this.highestOptionId = 0;
      this.consideredOptions = [];
      for (const option of fields.consideredOptions) {
        this.addOption(option);
      }
    }
  }

  static createNewAdr(): ArchitecturalDecisionRecord {
    return new ArchitecturalDecisionRecord({
      status: "proposed",
      date: new Date().toISOString().slice(0, 10),
      decisionOutcome: {
        explanation: "comes out best."
      }
    });
  }
}
