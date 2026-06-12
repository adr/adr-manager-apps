import { InputStream, CommonTokenStream, ParseTreeWalker, ErrorListener } from "antlr4";
import MADRLexer from "./parser/MADRLexer.js";
import MADRParser from "./parser/MADRParser.js";
import MADRListener from "./parser/MADRListener.js";
import { ArchitecturalDecisionRecord } from "./classes";
import { createShortTitle, matchOptionTitleMoreRelaxed, naturalCase2titleCase } from "./utils";
import type { Option, ParseError } from "./types";

/** Options for {@link md2adr}. All default to the web app's behaviour. */
export interface Md2AdrOptions {
  /** Title-case the parsed ADR title (VS Code extension behaviour). */
  titleCase?: boolean;
  /** Strip backticks in short-title comparisons (VS Code extension behaviour). */
  stripBackticks?: boolean;
  /** Trim + drop empty list items in consequences/links (VS Code extension behaviour). */
  aggressiveCleanup?: boolean;
  /** Collect syntax errors and set `conforming`/`parseErrors` (VS Code extension behaviour). */
  trackErrors?: boolean;
}

/** Options for {@link adr2md}. All default to the web app's behaviour. */
export interface Adr2MdOptions {
  /** Emit the stored YAML front-matter before the title (VS Code extension behaviour). */
  emitYaml?: boolean;
  /** Title-case the emitted title (VS Code extension behaviour). */
  titleCase?: boolean;
  /** Run the chosen option through createShortTitle and swap " for ' (VS Code extension). */
  sanitizeChosenOption?: boolean;
  /** Strip backticks from option short-titles (VS Code extension behaviour). */
  stripBackticks?: boolean;
  /** Trim + drop empty list items before serializing (VS Code extension behaviour). */
  aggressiveCleanup?: boolean;
}

/**
 * Minimal structural view of the ANTLR parse-tree nodes this generator touches.
 * (The real antlr4 context objects provide these members at runtime.)
 */
interface MadrParseNode {
  getText(): string;
  ruleIndex: number;
  children: MadrParseNode[];
}

/**
 * Builds an ADR from a ParseTree via a ParseTreeWalker. The parsed ADR is in `adr`.
 * Behaviour flags (titleCase, stripBackticks) select the web vs. extension semantics.
 */
class MADRGenerator extends MADRListener {
  adr: ArchitecturalDecisionRecord;
  currentOption: Option | null;
  private readonly titleCase: boolean;
  private readonly stripBackticks: boolean;

  constructor(opts: { titleCase?: boolean; stripBackticks?: boolean } = {}) {
    super();
    this.adr = new ArchitecturalDecisionRecord();
    this.currentOption = null;
    this.titleCase = opts.titleCase ?? false;
    this.stripBackticks = opts.stripBackticks ?? false;
  }

  enterYaml(ctx: MadrParseNode): void {
    this.adr.yaml = ctx.getText();
  }

  enterTitle(ctx: MadrParseNode): void {
    const raw = ctx.getText();
    this.adr.title = this.titleCase ? naturalCase2titleCase(raw) : raw;
  }

  enterStatus(ctx: MadrParseNode): void {
    this.adr.status = ctx.getText();
  }

  enterDeciders(ctx: MadrParseNode): void {
    this.adr.deciders = ctx.getText();
  }

  enterDate(ctx: MadrParseNode): void {
    this.adr.date = ctx.getText();
  }

  enterTechnicalStory(ctx: MadrParseNode): void {
    this.adr.technicalStory = ctx.getText();
  }

  enterContextAndProblemStatement(ctx: MadrParseNode): void {
    this.adr.contextAndProblemStatement = ctx.getText();
  }

  enterDecisionDrivers(ctx: MadrParseNode): void {
    const list = ctx.children[0];
    if (list) {
      this.addListItemsFromListToList(list, this.adr.decisionDrivers);
    }
  }

  enterConsideredOptions(ctx: MadrParseNode): void {
    const list = ctx.children[0];
    if (!list) {
      return;
    }
    const tmpOptionList: string[] = [];
    this.addListItemsFromListToList(list, tmpOptionList);
    tmpOptionList.forEach((opt) => {
      if (opt.trim() !== "") {
        this.adr.addOption({ title: opt });
      }
    });
  }

  enterChosenOptionAndExplanation(ctx: MadrParseNode): void {
    const raw = ctx.getText();
    if (raw.startsWith("Chosen option: ")) {
      const parts = raw.split(/, because */);
      const head = (parts[0] ?? "").substring("Chosen option: ".length).trim();
      const delim = head.charAt(0);
      let chosenOption: string;
      if (delim === head.charAt(head.length - 1)) {
        chosenOption = head.substring(1, head.length - 1);
      } else {
        chosenOption = head;
      }
      const explanation = parts.slice(1).join();
      this.adr.decisionOutcome.chosenOption = chosenOption;
      this.adr.decisionOutcome.explanation = explanation.trim();
    } else {
      console.log("Couldn't find chosen option.");
    }
  }

  enterPositiveConsequences(ctx: MadrParseNode): void {
    const list = ctx.children[0];
    if (list) {
      this.addListItemsFromListToList(list, this.adr.decisionOutcome.positiveConsequences);
    }
  }

  enterNegativeConsequences(ctx: MadrParseNode): void {
    const list = ctx.children[0];
    if (list) {
      this.addListItemsFromListToList(list, this.adr.decisionOutcome.negativeConsequences);
    }
  }

  enterOptionTitle(ctx: MadrParseNode): void {
    const title = ctx.getText();
    this.currentOption = this.getMostSimilarOptionTo(title);
    if (!this.currentOption) {
      // No matching option found? Create a new one (otherwise the pro/con list content is lost).
      this.currentOption = this.adr.addOption({ title });
    }
  }

  enterOptionDescription(ctx: MadrParseNode): void {
    if (this.currentOption) {
      this.currentOption.description = ctx.getText();
    }
  }

  enterProlist(ctx: MadrParseNode): void {
    if (this.currentOption) {
      this.addListItemsFromListToList(ctx, this.currentOption.pros);
    }
  }

  enterConlist(ctx: MadrParseNode): void {
    if (this.currentOption) {
      this.addListItemsFromListToList(ctx, this.currentOption.cons);
    }
  }

  enterLinks(ctx: MadrParseNode): void {
    const list = ctx.children[0];
    if (list) {
      this.addListItemsFromListToList(list, this.adr.links);
    }
  }

  enterRelevantFiles(ctx: MadrParseNode): void {
    const list = ctx.children[0];
    if (list) {
      this.addListItemsFromListToList(list, this.adr.relevantFiles);
    }
  }

  getMostSimilarOptionTo(optTitle: string): Option | null {
    let opt = this.adr.consideredOptions.find((o) => this.matchOptionTitleAlmostExactly(o.title, optTitle));
    if (opt) {
      return opt;
    }
    opt = this.adr.consideredOptions.find((o) =>
      matchOptionTitleMoreRelaxed(o.title, optTitle, { stripBackticks: this.stripBackticks })
    );
    if (opt) {
      return opt;
    }
    return null;
  }

  /**
   * Option titles are similar iff they are equal after removing whitespace + lower-casing.
   */
  matchOptionTitleAlmostExactly(optTitle1: string, optTitle2: string): boolean {
    const trimmed1 = optTitle1.replace(/ /g, "").toLowerCase();
    const trimmed2 = optTitle2.replace(/ /g, "").toLowerCase();
    return trimmed1 === trimmed2;
  }

  addListItemsFromListToList(parseTreeList: MadrParseNode, targetList: string[]): void {
    for (let i = 0; i < parseTreeList.children.length; i++) {
      const child = parseTreeList.children[i];
      if (!child) {
        continue;
      }
      if (child.ruleIndex === MADRParser.ruleNames.indexOf("textLine") && child.getText().trim() !== "") {
        targetList.push(child.getText());
      }
    }
  }
}

class MADRErrorListener extends ErrorListener<unknown> {
  syntaxErrors: ParseError[] = [];

  override syntaxError(
    _recognizer: unknown,
    _offendingSymbol: unknown,
    line: number,
    column: number,
    msg: string
  ): void {
    this.syntaxErrors.push({ message: msg, line, charPosition: column });
  }
}

/**
 * Parses Markdown into an {@link ArchitecturalDecisionRecord}.
 * Defaults match the web app; the extension passes titleCase/stripBackticks/aggressiveCleanup/trackErrors.
 */
export function md2adr(md: string, opts: Md2AdrOptions = {}): ArchitecturalDecisionRecord {
  const chars = new InputStream(md);
  const lexer = new MADRLexer(chars);
  const tokens = new CommonTokenStream(lexer);
  const parser = new MADRParser(tokens);
  parser.buildParseTrees = true;
  parser.removeErrorListeners();

  let errorListener: MADRErrorListener | undefined;
  if (opts.trackErrors) {
    errorListener = new MADRErrorListener();
    parser.addErrorListener(errorListener);
  }

  const tree = parser.start();
  const printer = new MADRGenerator({
    titleCase: opts.titleCase ?? false,
    stripBackticks: opts.stripBackticks ?? false
  });
  ParseTreeWalker.DEFAULT.walk(printer, tree);
  printer.adr.cleanUp({ aggressive: opts.aggressiveCleanup ?? false });

  if (errorListener) {
    if (errorListener.syntaxErrors.length > 0) {
      printer.adr.conforming = false;
    }
    printer.adr.parseErrors = errorListener.syntaxErrors;
  }

  return printer.adr;
}

/**
 * Serializes an {@link ArchitecturalDecisionRecord} to Markdown.
 * Defaults match the web app; the extension passes emitYaml/titleCase/sanitizeChosenOption/stripBackticks/aggressiveCleanup.
 */
export function adr2md(adrToParse: ArchitecturalDecisionRecord, opts: Adr2MdOptions = {}): string {
  // Reconstruct via the constructor to deep-copy + clean without mutating the input.
  const adr = new ArchitecturalDecisionRecord(adrToParse);
  if (opts.aggressiveCleanup) {
    adr.cleanUp({ aggressive: true });
  }

  const title = opts.titleCase ? naturalCase2titleCase(adr.title) : adr.title;
  let md = opts.emitYaml && adr.yaml ? adr.yaml + "\n# " + title + "\n" : "# " + title + "\n";

  if ((adr.status !== "" && adr.status !== "null") || adr.deciders !== "" || adr.date !== "") {
    if (adr.status !== "" && adr.status !== "null") {
      md = md.concat("\n* Status: " + adr.status.trim());
    }
    if (adr.deciders !== "") {
      md = md.concat("\n* Deciders: " + adr.deciders);
    }
    if (adr.date !== "") {
      md = md.concat("\n* Date: " + adr.date);
    }
    md = md.concat("\n");
  }

  if (adr.technicalStory !== "") {
    md = md.concat("\nTechnical Story: " + adr.technicalStory + "\n");
  }

  if (adr.contextAndProblemStatement !== "") {
    md = md.concat("\n## Context and Problem Statement\n\n" + adr.contextAndProblemStatement + "\n");
  }

  if (adr.decisionDrivers.length > 0) {
    md = md.concat("\n## Decision Drivers\n\n");
    for (const driver of adr.decisionDrivers) {
      md = md.concat("* " + driver + "\n");
    }
  }

  if (adr.consideredOptions.length > 0) {
    md = md.concat("\n## Considered Options\n\n");
    md = adr.consideredOptions.reduce((total, opt) => total + "* " + opt.title + "\n", md);
  }

  const chosen = opts.sanitizeChosenOption
    ? createShortTitle(adr.decisionOutcome.chosenOption.replace(/"/g, "'"), {
        stripBackticks: opts.stripBackticks ?? false
      })
    : adr.decisionOutcome.chosenOption;
  md = md.concat('\n## Decision Outcome\n\nChosen option: "' + chosen);

  if (adr.decisionOutcome.explanation.trim() !== "") {
    const isList = adr.decisionOutcome.explanation.trim().match(/^[*-+]/);
    if (isList) {
      md = md.concat('", because\n\n' + adr.decisionOutcome.explanation + "\n");
    } else {
      md = md.concat('", because ' + adr.decisionOutcome.explanation + "\n");
    }
  } else {
    md = md.concat('"\n');
  }

  if (adr.decisionOutcome.positiveConsequences.length > 0) {
    md = md.concat("\n### Positive Consequences\n\n");
    md = adr.decisionOutcome.positiveConsequences.reduce((total, con) => total + "* " + con + "\n", md);
  }
  if (adr.decisionOutcome.negativeConsequences.length > 0) {
    md = md.concat("\n### Negative Consequences\n\n");
    md = adr.decisionOutcome.negativeConsequences.reduce((total, con) => total + "* " + con + "\n", md);
  }

  if (adr.consideredOptions.some((opt) => opt.description !== "" || opt.pros.length > 0 || opt.cons.length > 0)) {
    md = md.concat("\n## Pros and Cons of the Options\n");
    md = adr.consideredOptions.reduce((total, opt) => {
      if (opt.description !== "" || opt.pros.length > 0 || opt.cons.length > 0) {
        let res = total.concat(
          "\n### " + createShortTitle(opt.title, { stripBackticks: opts.stripBackticks ?? false }) + "\n"
        );
        if (opt.description !== "") {
          res = res.concat("\n" + opt.description + "\n");
        }
        res = opt.pros.reduce((acc, arg) => acc.concat("\n* Good, because " + arg), res);
        res = opt.cons.reduce((acc, arg) => acc.concat("\n* Bad, because " + arg), res);
        if (opt.pros.length > 0 || opt.cons.length > 0) {
          res = res + "\n";
        }
        return res;
      }
      return total;
    }, md);
  }
  if (adr.links.length > 0) {
    md = md.concat("\n## Links\n\n");
    md = adr.links.reduce((total, link) => total + "* " + link + "\n", md);
  }
  if (adr.relevantFiles.length > 0) {
    md = md.concat("\n## Relevant Files\n\n");
    md = adr.relevantFiles.reduce((total, file) => total + "* " + file + "\n", md);
  }
  return md;
}
