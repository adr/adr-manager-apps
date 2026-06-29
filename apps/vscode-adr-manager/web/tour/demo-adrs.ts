import { ArchitecturalDecisionRecord } from "../../src/plugins/classes";
import { getDemoAdrPath } from "../../src/tour";
import { cleanPathString, splitAdrDirectory } from "../../src/plugins/utils";
import { buildDemoAdrFixtures } from "@adr-manager/core";
import type { Tag } from "@adr-manager/core";

/** Folder name shown when the tour runs with no workspace folder open. */
export const DEMO_FOLDER_NAME = "example-project";

export interface AdrListEntry {
  adr: ArchitecturalDecisionRecord;
  tags: Tag[];
  fullPath: string;
  relativePath: string;
  fileName: string;
}

/**
 * Display-only example entries injected while the tour runs over an empty workspace.
 * They are never merged into the real list or sent to the extension host. The ADR
 * objects are the same shared records the web app uses (and that the host opens in the
 * editor), so the two apps stay in sync. The relativePath must satisfy the same
 * `cleanPathString(folder + "/" + adrDirectory)` filter that MainView.adrsInFolder applies.
 */
export function buildDemoAdrEntries(folder: string, adrDirectory: string): AdrListEntry[] {
  const directory = cleanPathString([folder, ...splitAdrDirectory(adrDirectory || "docs/decisions")].join("/"));
  return buildDemoAdrFixtures().map(({ fileName, record, tags }) => {
    return {
      adr: record,
      tags,
      fullPath: getDemoAdrPath(fileName),
      relativePath: cleanPathString(directory + "/" + fileName),
      fileName
    };
  });
}
