import { describe, expect, test } from "vitest";
import {
  analyzeAdrDocument,
  convertAdrDocument,
  parseMadrVersionFromMd,
  parseRelevantFilesFromMd,
  parseTagsFromMd,
  resolveAdrTemplateVersion,
  setMadrVersionInMd,
  setRelevantFilesInMd,
  setTagsInMd,
  stripAdrManagerMetadata,
  stripMadrVersionComment,
  stripRelevantFilesComment,
  stripTagComment
} from "../src/index";
import type { Adr2MdOptions, Md2AdrOptions, Tag } from "../src/index";

// Mirrors the VS Code extension's option profile so the trustClassicTemplate /
// emitYaml paths are exercised the way the real consumer drives them.
const VS_PARSE: Md2AdrOptions = { titleCase: true, stripBackticks: true, aggressiveCleanup: true, trackErrors: true };
const VS_SERIALIZE: Adr2MdOptions = {
  emitYaml: true,
  titleCase: true,
  sanitizeChosenOption: true,
  stripBackticks: true,
  aggressiveCleanup: true
};

const TAG_A: Tag = { id: "tag-a", label: "Frontend", color: "#6366f1" };

const MADR_212 = `# Use PostgreSQL

* Status: accepted
* Deciders: Jane Doe
* Date: 2026-06-10

## Context and Problem Statement

We need a durable system of record.

## Considered Options

* PostgreSQL
* DynamoDB

## Decision Outcome

Chosen option: "PostgreSQL", because it fits.
`;

const MADR_400 = `---
status: "accepted"
date: 2026-06-10
decision-makers: Jane Doe
consulted: Data Guild
informed: Backend Chapter
---

# Use PostgreSQL

## Context and Problem Statement

We need a durable system of record.

## Considered Options

* PostgreSQL
* DynamoDB

## Decision Outcome

Chosen option: "PostgreSQL", because it fits.

### Consequences

* Good, because the data model is familiar
* Bad, because failover needs care

### Confirmation

Reviewed by the architecture group.

## More Information

Revisit after the first scaling incident.
`;

// A document that uses only the sections both templates share, so detection alone
// cannot classify it.
const BASIC = `# Use MADR

## Context and Problem Statement

We need to record decisions.

## Considered Options

* MADR
* Formless

## Decision Outcome

Chosen option: "MADR", because it is lean.
`;

describe("stripAdrManagerMetadata", () => {
  test("removes all three metadata comments", () => {
    const md = setMadrVersionInMd(setTagsInMd(setRelevantFilesInMd(MADR_212, ["src/a.ts"]), [TAG_A]), "2.1.2");
    expect(md).toContain("adr-manager-tags");
    const stripped = stripAdrManagerMetadata(md);
    expect(stripped).toBe(MADR_212);
    expect(stripped).not.toContain("adr-manager");
  });

  test("matches the composition of the individual strippers", () => {
    const md = setMadrVersionInMd(setTagsInMd(setRelevantFilesInMd(MADR_400, ["x.ts"]), [TAG_A]), "4.0.0");
    expect(stripAdrManagerMetadata(md)).toBe(
      stripMadrVersionComment(stripRelevantFilesComment(stripTagComment(md)))
    );
  });
});

describe("resolveAdrTemplateVersion", () => {
  test("an explicit marker always wins", () => {
    expect(resolveAdrTemplateVersion(setMadrVersionInMd(BASIC, "2.1.2"))).toBe("2.1.2");
    expect(resolveAdrTemplateVersion(setMadrVersionInMd(MADR_400, "2.1.2"))).toBe("2.1.2");
  });

  test("an unclassifiable basic ADR adopts the preferred version", () => {
    expect(resolveAdrTemplateVersion(BASIC)).toBe("4.0.0");
    expect(resolveAdrTemplateVersion(BASIC, { preferredVersion: "2.1.2" })).toBe("2.1.2");
  });

  test("a genuinely classifiable document keeps its real version", () => {
    expect(resolveAdrTemplateVersion(MADR_212)).toBe("2.1.2");
    expect(resolveAdrTemplateVersion(MADR_400)).toBe("4.0.0");
    // Even when 2.1.2 is preferred, a real 4.0.0 document is not forced down to it.
    expect(resolveAdrTemplateVersion(MADR_400, { preferredVersion: "2.1.2" })).toBe("4.0.0");
  });
});

describe("analyzeAdrDocument", () => {
  test("reports a conforming 4.0.0 document losslessly", () => {
    const result = analyzeAdrDocument(MADR_400, { parse: VS_PARSE, serialize: VS_SERIALIZE });
    expect(result.templateVersion).toBe("4.0.0");
    expect(result.conforming).toBe(true);
    expect(result.record.conforming).toBe(true);
    expect(result.record.title).toBe("Use PostgreSQL");
    expect(result.record.decisionMakers).toBe("Jane Doe");
    expect(result.record.consequences.length).toBe(2);
  });

  test("trusts the classic 2.1.2 template as conforming without a round-trip", () => {
    const result = analyzeAdrDocument(MADR_212, {
      version: "2.1.2",
      parse: VS_PARSE,
      serialize: VS_SERIALIZE,
      trustClassicTemplate: true
    });
    expect(result.templateVersion).toBe("2.1.2");
    expect(result.conforming).toBe(true);
  });

  test("marks a non-round-tripping document as not conforming", () => {
    const broken = MADR_400 + "\n## Unknown Section\n\nUnparsed content.\n";
    const result = analyzeAdrDocument(broken, { version: "4.0.0", parse: VS_PARSE, serialize: VS_SERIALIZE });
    expect(result.conforming).toBe(false);
    expect(result.record.conforming).toBe(false);
  });

  test("hydrates relevant files and tags from metadata comments", () => {
    const md = setTagsInMd(setRelevantFilesInMd(MADR_212, ["src/main.ts"]), [TAG_A]);
    const result = analyzeAdrDocument(md, { version: "2.1.2" });
    expect(result.record.relevantFiles).toStrictEqual(["src/main.ts"]);
    expect(result.tags).toStrictEqual([TAG_A]);
  });

  test("leaves parseErrors empty when trackErrors is not requested", () => {
    const result = analyzeAdrDocument(MADR_212, { version: "2.1.2" });
    expect(result.record.parseErrors).toStrictEqual([]);
  });
});

describe("convertAdrDocument", () => {
  test("preserves tags, relevant files and the version marker", () => {
    const source = setMadrVersionInMd(
      setTagsInMd(setRelevantFilesInMd(MADR_212, ["src/a.ts"]), [TAG_A]),
      "2.1.2"
    );

    const converted = convertAdrDocument(source, "4.0.0", {
      tags: parseTagsFromMd(source),
      relevantFiles: parseRelevantFilesFromMd(source)
    });

    expect(parseTagsFromMd(converted)).toStrictEqual([TAG_A]);
    expect(parseRelevantFilesFromMd(converted)).toStrictEqual(["src/a.ts"]);
    expect(parseMadrVersionFromMd(converted)).toBe("4.0.0");
  });
});
