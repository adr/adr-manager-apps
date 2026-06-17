import { ArchitecturalDecisionRecord } from "./classes";
import { createShortTitle, matchOptionTitleMoreRelaxed } from "./utils";
import type { Consequence, ConsequenceKind, Option } from "./types";

/**
 * Reader and writer for the MADR 4.0.0 template. Unlike the 2.1.2 template, 4.0.0
 * stores its metadata as YAML front matter (status, date, decision-makers, consulted,
 * informed) and adds combined Consequences, Confirmation, neutral arguments, and a
 * More Information section. The writer and reader are exact inverses for documents
 * the writer can produce, so conformance can be checked by round-tripping.
 */

const ARGUMENT_PATTERN = /^\* (Good|Neutral|Bad), because (.*)$/;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function optionHasDetails(option: Option): boolean {
  return option.description !== "" || option.pros.length > 0 || option.neutrals.length > 0 || option.cons.length > 0;
}

export function adr2md400(adrToParse: ArchitecturalDecisionRecord): string {
  // Reconstruct via the constructor to deep-copy + clean without mutating the input.
  const adr = new ArchitecturalDecisionRecord(adrToParse);

  const frontMatter: string[] = [];
  if (adr.status !== "" && adr.status !== "null") {
    frontMatter.push(`status: "${adr.status}"`);
  }
  if (adr.date !== "") {
    frontMatter.push(`date: ${adr.date}`);
  }
  if (adr.decisionMakers !== "") {
    frontMatter.push(`decision-makers: ${adr.decisionMakers}`);
  }
  if (adr.consulted !== "") {
    frontMatter.push(`consulted: ${adr.consulted}`);
  }
  if (adr.informed !== "") {
    frontMatter.push(`informed: ${adr.informed}`);
  }

  let md = frontMatter.length > 0 ? "---\n" + frontMatter.join("\n") + "\n---\n\n" : "";
  md += "# " + adr.title + "\n";

  if (adr.contextAndProblemStatement !== "") {
    md += "\n## Context and Problem Statement\n\n" + adr.contextAndProblemStatement + "\n";
  }

  if (adr.decisionDrivers.length > 0) {
    md += "\n## Decision Drivers\n\n";
    md = adr.decisionDrivers.reduce((total, driver) => total + "* " + driver + "\n", md);
  }

  if (adr.consideredOptions.length > 0) {
    md += "\n## Considered Options\n\n";
    md = adr.consideredOptions.reduce((total, opt) => total + "* " + opt.title + "\n", md);
  }

  md += '\n## Decision Outcome\n\nChosen option: "' + adr.decisionOutcome.chosenOption;
  if (adr.decisionOutcome.explanation.trim() !== "") {
    const isList = adr.decisionOutcome.explanation.trim().match(/^[*-+]/);
    if (isList) {
      md += '", because\n\n' + adr.decisionOutcome.explanation + "\n";
    } else {
      md += '", because ' + adr.decisionOutcome.explanation + "\n";
    }
  } else {
    md += '"\n';
  }

  if (adr.consequences.length > 0) {
    md += "\n### Consequences\n\n";
    md = adr.consequences.reduce(
      (total, consequence) => total + "* " + capitalize(consequence.kind) + ", because " + consequence.text + "\n",
      md
    );
  }

  if (adr.confirmation !== "") {
    md += "\n### Confirmation\n\n" + adr.confirmation + "\n";
  }

  if (adr.consideredOptions.some(optionHasDetails)) {
    md += "\n## Pros and Cons of the Options\n";
    md = adr.consideredOptions.reduce((total, opt) => {
      if (!optionHasDetails(opt)) {
        return total;
      }
      let res = total + "\n### " + createShortTitle(opt.title) + "\n";
      if (opt.description !== "") {
        res += "\n" + opt.description + "\n";
      }
      res = opt.pros.reduce((acc, arg) => acc + "\n* Good, because " + arg, res);
      res = opt.neutrals.reduce((acc, arg) => acc + "\n* Neutral, because " + arg, res);
      res = opt.cons.reduce((acc, arg) => acc + "\n* Bad, because " + arg, res);
      if (opt.pros.length > 0 || opt.neutrals.length > 0 || opt.cons.length > 0) {
        res += "\n";
      }
      return res;
    }, md);
  }

  if (adr.moreInformation !== "") {
    md += "\n## More Information\n\n" + adr.moreInformation + "\n";
  }

  return md;
}

interface Subsection {
  heading: string;
  lines: string[];
}

interface Section {
  heading: string;
  lines: string[];
  subsections: Subsection[];
}

function joinedText(lines: string[]): string {
  return lines.join("\n").trim();
}

function bulletItems(lines: string[]): string[] {
  return lines.filter((line) => line.startsWith("* ")).map((line) => line.slice(2).trim());
}

function parseFrontMatter(lines: string[], record: ArchitecturalDecisionRecord): number {
  if (lines[0] !== "---") {
    return 0;
  }
  let end = 1;
  while (end < lines.length && lines[end] !== "---") {
    end++;
  }
  if (end >= lines.length) {
    return 0;
  }
  for (const line of lines.slice(1, end)) {
    const entry = line.match(/^([\w-]+):\s*(.*)$/);
    if (!entry) {
      continue;
    }
    const value = (entry[2] ?? "").trim();
    switch (entry[1]) {
      case "status":
        record.status = value.replace(/^"|"$/g, "");
        break;
      case "date":
        record.date = value;
        break;
      case "decision-makers":
        record.decisionMakers = value;
        break;
      case "consulted":
        record.consulted = value;
        break;
      case "informed":
        record.informed = value;
        break;
    }
  }
  return end + 1;
}

function splitIntoSections(lines: string[]): Section[] {
  const sections: Section[] = [];
  let section: Section | undefined;
  let subsection: Subsection | undefined;
  for (const line of lines) {
    const h2 = line.match(/^## (.*)$/);
    const h3 = line.match(/^### (.*)$/);
    if (h2) {
      section = { heading: (h2[1] ?? "").trim(), lines: [], subsections: [] };
      subsection = undefined;
      sections.push(section);
    } else if (h3 && section) {
      subsection = { heading: (h3[1] ?? "").trim(), lines: [] };
      section.subsections.push(subsection);
    } else if (subsection) {
      subsection.lines.push(line);
    } else if (section) {
      section.lines.push(line);
    }
  }
  return sections;
}

function parseOutcome(section: Section, record: ArchitecturalDecisionRecord): void {
  const chosenIndex = section.lines.findIndex((line) => line.startsWith("Chosen option:"));
  if (chosenIndex >= 0) {
    const chosenLine = section.lines[chosenIndex] ?? "";
    const match = chosenLine.match(/^Chosen option:\s*"([^"]*)"(?:,?\s*because\s?(.*))?$/);
    if (match) {
      record.decisionOutcome.chosenOption = match[1] ?? "";
      const continuation = section.lines.slice(chosenIndex + 1);
      record.decisionOutcome.explanation = [match[2] ?? "", ...continuation].join("\n").trim();
    }
  }
  for (const subsection of section.subsections) {
    if (subsection.heading === "Consequences") {
      record.consequences = subsection.lines
        .filter((line) => line.startsWith("* "))
        .map((line): Consequence => {
          const match = line.match(ARGUMENT_PATTERN);
          if (match) {
            return { kind: (match[1] ?? "good").toLowerCase() as ConsequenceKind, text: (match[2] ?? "").trim() };
          }
          return { kind: "good", text: line.slice(2).trim() };
        });
    } else if (subsection.heading === "Confirmation") {
      record.confirmation = joinedText(subsection.lines);
    }
  }
}

function applyOptionDetails(subsection: Subsection, record: ArchitecturalDecisionRecord): void {
  const option =
    record.consideredOptions.find((opt) => createShortTitle(opt.title) === subsection.heading) ??
    record.consideredOptions.find((opt) => matchOptionTitleMoreRelaxed(opt.title, subsection.heading)) ??
    record.addOption({ title: subsection.heading });

  const descriptionLines: string[] = [];
  for (const line of subsection.lines) {
    const argument = line.match(ARGUMENT_PATTERN);
    if (argument) {
      const text = (argument[2] ?? "").trim();
      if (argument[1] === "Good") {
        option.pros.push(text);
      } else if (argument[1] === "Neutral") {
        option.neutrals.push(text);
      } else {
        option.cons.push(text);
      }
    } else if (!line.startsWith("* ")) {
      descriptionLines.push(line);
    }
  }
  option.description = joinedText(descriptionLines);
}

export function md2adr400(md: string): ArchitecturalDecisionRecord {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const record = new ArchitecturalDecisionRecord();

  let index = parseFrontMatter(lines, record);
  for (; index < lines.length; index++) {
    const line = lines[index] ?? "";
    const title = line.match(/^# (.*)$/);
    if (title) {
      record.title = (title[1] ?? "").trim();
      index++;
      break;
    }
    if (line.trim() !== "") {
      break;
    }
  }

  for (const section of splitIntoSections(lines.slice(index))) {
    switch (section.heading) {
      case "Context and Problem Statement":
        record.contextAndProblemStatement = joinedText(section.lines);
        break;
      case "Decision Drivers":
        record.decisionDrivers = bulletItems(section.lines);
        break;
      case "Considered Options":
        bulletItems(section.lines).forEach((title) => record.addOption({ title }));
        break;
      case "Decision Outcome":
        parseOutcome(section, record);
        break;
      case "Pros and Cons of the Options":
        section.subsections.forEach((subsection) => applyOptionDetails(subsection, record));
        break;
      case "More Information":
        record.moreInformation = joinedText(section.lines);
        break;
    }
  }

  record.cleanUp();
  return record;
}
