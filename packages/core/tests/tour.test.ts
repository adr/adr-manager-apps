import { describe, expect, test } from "vitest";
import { buildDemoAdrFixtures, buildPrimaryDemoAdrFixture, parseMadr, serializeMadr } from "../src";

describe("tour demo fixtures", () => {
  test("use unique filenames", () => {
    const fixtures = buildDemoAdrFixtures();
    expect(new Set(fixtures.map((fixture) => fixture.fileName)).size).toBe(fixtures.length);
  });

  test("provide tags for filtering the demo list", () => {
    const fixtures = buildDemoAdrFixtures();
    expect(fixtures.every((fixture) => fixture.tags.length > 0)).toBe(true);
    expect(new Set(fixtures.flatMap((fixture) => fixture.tags.map((tag) => tag.id))).size).toBeGreaterThan(1);
  });

  test("the primary fixture round-trips with its declared template version", () => {
    const fixture = buildPrimaryDemoAdrFixture();
    const markdown = serializeMadr(fixture.record, fixture.templateVersion);
    const parsed = parseMadr(markdown, fixture.templateVersion);

    expect(fixture.templateVersion).toBe("2.1.2");
    expect(serializeMadr(parsed, fixture.templateVersion)).toBe(markdown);
  });

  test("the primary fixture preserves populated MADR 2.1.2 fields", () => {
    const fixture = buildPrimaryDemoAdrFixture();
    const parsed = parseMadr(serializeMadr(fixture.record, fixture.templateVersion), fixture.templateVersion);

    expect(parsed.deciders).toBe("Ada Lovelace, Grace Hopper");
    expect(parsed.decisionOutcome.positiveConsequences).toEqual(["Every decision is reviewable and traceable"]);
    expect(parsed.decisionOutcome.negativeConsequences).toEqual(["Writing a record takes a little time"]);
  });
});
