import { ArchitecturalDecisionRecord } from "../../src/plugins/classes";
import { cleanPathString } from "../../src/plugins/utils";

/** Folder name shown when the tour runs with no workspace folder open. */
export const DEMO_FOLDER_NAME = "example-project";

/** Sentinel path: demo cards are never clickable (the tour blocker covers the page). */
export const DEMO_FULL_PATH = "__tour-demo__";

export interface AdrListEntry {
  adr: ArchitecturalDecisionRecord;
  fullPath: string;
  relativePath: string;
  fileName: string;
}

/**
 * Display-only example entries injected while the tour runs over an empty workspace.
 * They are never merged into the real list or sent to the extension host.
 * The relativePath must satisfy the same `cleanPathString(folder + "/" + adrDirectory)`
 * filter that MainView.adrsInFolder applies.
 */
export function buildDemoAdrEntries(folder: string, adrDirectory: string): AdrListEntry[] {
  const directory = cleanPathString(folder + "/" + (adrDirectory || "docs/decisions"));
  return [
    {
      adr: new ArchitecturalDecisionRecord({
        title: "Use Markdown Architectural Decision Records",
        status: "accepted"
      }),
      fullPath: DEMO_FULL_PATH,
      relativePath: cleanPathString(directory + "/0001-use-markdown-architectural-decision-records.md"),
      fileName: "0001-use-markdown-architectural-decision-records.md"
    },
    {
      adr: new ArchitecturalDecisionRecord({
        title: "Choose Database for User Data",
        status: "proposed"
      }),
      fullPath: DEMO_FULL_PATH,
      relativePath: cleanPathString(directory + "/0002-choose-database-for-user-data.md"),
      fileName: "0002-choose-database-for-user-data.md"
    }
  ];
}
