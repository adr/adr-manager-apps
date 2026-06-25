// Tests for the pure root-folder derivation used by the relevant-files feature.
// The vscode module is mocked away: getRootPathFromAdrPath is plain string logic.
import { describe, expect, test, vi } from "vitest";

// Just enough surface for the module-level statements in plugins/constants.ts.
vi.mock("vscode", () => ({
  extensions: { getExtension: () => ({ extensionPath: "/" }) },
  Uri: { parse: (value: string) => ({ path: value }) }
}));

import { getRootPathFromAdrPath } from "../extension-functions";

describe("getRootPathFromAdrPath", () => {
  test("strips the ADR directory and file name off a single-root path", () => {
    expect(getRootPathFromAdrPath("/ws/docs/decisions/0001-use-postgres.md", "docs/decisions")).toBe("/ws");
  });

  test("resolves child-root folders in treat-as-multi-root layouts", () => {
    expect(getRootPathFromAdrPath("/ws/service-a/docs/decisions/0001-x.md", "docs/decisions")).toBe("/ws/service-a");
  });

  test("normalizes leading and trailing slashes in the configured directory", () => {
    expect(getRootPathFromAdrPath("/ws/doc/adr/0001-x.md", "/doc/adr/")).toBe("/ws");
  });

  test("uses the last occurrence when the directory name repeats", () => {
    expect(getRootPathFromAdrPath("/ws/docs/decisions/nested/docs/decisions/0001-x.md", "docs/decisions")).toBe(
      "/ws/docs/decisions/nested"
    );
  });

  test("returns undefined for a file outside the ADR directory", () => {
    expect(getRootPathFromAdrPath("/ws/src/main.ts", "docs/decisions")).toBeUndefined();
  });

  test("returns undefined for a file nested below the ADR directory", () => {
    expect(getRootPathFromAdrPath("/ws/docs/decisions/sub/0001-x.md", "docs/decisions")).toBeUndefined();
  });

  test("returns undefined for the ADR directory itself", () => {
    expect(getRootPathFromAdrPath("/ws/docs/decisions/", "docs/decisions")).toBeUndefined();
  });

  test('treats ".", "./" and "/" as the root folder itself', () => {
    expect(getRootPathFromAdrPath("/ws/0001-x.md", ".")).toBe("/ws");
    expect(getRootPathFromAdrPath("/ws/0001-x.md", "./")).toBe("/ws");
    expect(getRootPathFromAdrPath("/ws/service-a/0001-x.md", "/")).toBe("/ws/service-a");
  });

  test("returns undefined for a root-directory path without a parent folder", () => {
    expect(getRootPathFromAdrPath("0001-x.md", ".")).toBeUndefined();
  });
});
