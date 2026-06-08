import { InputStream, CommonTokenStream, ParseTreeWalker } from "antlr4";
import MADRLexer from "./parser/MADRLexer.js";
import MADRParser from "./parser/MADRParser.js";
import MADRListener from "./parser/MADRListener.js";
import { ArchitecturalDecisionRecord, createShortTitle } from "@/plugins/classes";
import type { Option } from "@/types/adr";

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
 * Creates an ADR from a ParseTree by listening to a ParseTreeWalker.
 *
 * Use with `ParseTreeWalker.DEFAULT.walk(generator, parseTree)`.
 * The parsed ADR is saved in the attribute `adr`.
 *
 * - currentOption: the current option, either the considered one or the current one
 *   handled at "Pros and Cons of the Options".
 */
class MADRGenerator extends MADRListener {
    adr: ArchitecturalDecisionRecord;
    currentOption: Option | null;

    constructor() {
        super();
        this.adr = new ArchitecturalDecisionRecord();
        this.currentOption = null;
    }

    enterTitle(ctx: MadrParseNode): void {
        this.adr.title = ctx.getText();
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

    getMostSimilarOptionTo(optTitle: string): Option | null {
        let opt = this.adr.consideredOptions.find((o) => this.matchOptionTitleAlmostExactly(o.title, optTitle));
        if (opt) {
            return opt;
        }
        opt = this.adr.consideredOptions.find((o) => matchOptionTitleMoreRelaxed(o.title, optTitle));
        if (opt) {
            return opt;
        }
        return null;
    }

    /**
     * Option titles are similar, iff they are equal after
     *  (1) removing all white spaces
     *  (2) lower-casing them.
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
            if (
                child.ruleIndex === MADRParser.ruleNames.indexOf("textLine") &&
                child.getText().trim() !== ""
            ) {
                targetList.push(child.getText());
            }
        }
    }
}

export function md2adr(md: string): ArchitecturalDecisionRecord {
    const chars = new InputStream(md);
    const lexer = new MADRLexer(chars);
    const tokens = new CommonTokenStream(lexer);
    const parser = new MADRParser(tokens);
    parser.buildParseTrees = true;
    parser.removeErrorListeners();

    const tree = parser.start();
    const printer = new MADRGenerator();
    ParseTreeWalker.DEFAULT.walk(printer, tree);
    printer.adr.cleanUp();
    return printer.adr;
}

export function adr2md(adrToParse: ArchitecturalDecisionRecord): string {
    // Reconstructing via the constructor deep-copies + cleans without mutating the input
    // (replaces the former lodash.cloneDeep + cleanUp).
    const adr = new ArchitecturalDecisionRecord(adrToParse);
    let md = "# " + adr.title + "\n";

    if ((adr.status !== "" && adr.status !== "null") || adr.deciders.length > 0 || adr.date !== "") {
        if (adr.status !== "" && adr.status !== "null") {
            md = md.concat("\n* Status: " + adr.status.trim());
        }
        if (adr.deciders.length > 0) {
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

    md = md.concat('\n## Decision Outcome\n\nChosen option: "' + adr.decisionOutcome.chosenOption);

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
                let res = total.concat("\n### " + createShortTitle(opt.title) + "\n");
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
    return md;
}

export function snakeCase2naturalCase(snake: string): string {
    return snake.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace("-", " ").replace("_", " "));
}

export function naturalCase2snakeCase(natural: string): string {
    return natural.toLowerCase().split(" ").join("-");
}

/**
 * Option titles are similar, iff
 *  a) they are equal after (1) removing all white spaces (2) lower-casing them, or
 *  b) one normalized title is a prefix of the other, or
 *  c) the chosen option is a sub-title of the given option.
 */
export function matchOptionTitleMoreRelaxed(titleFromOptionList: string, titleFromChosenOption: string): boolean {
    const trimmedTitleFromOptionList = titleFromOptionList.replace(/ /g, "").toLowerCase();
    const trimmedTitleFromChosenOption = titleFromChosenOption.replace(/ /g, "").toLowerCase();
    return (
        trimmedTitleFromOptionList === trimmedTitleFromChosenOption ||
        trimmedTitleFromOptionList.startsWith(trimmedTitleFromChosenOption) ||
        trimmedTitleFromChosenOption.startsWith(trimmedTitleFromOptionList) ||
        titleFromChosenOption === createShortTitle(titleFromOptionList) ||
        createShortTitle(titleFromOptionList).startsWith(titleFromChosenOption)
    );
}
