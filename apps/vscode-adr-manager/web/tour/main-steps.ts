import type { TourStep } from "./types";

export interface MainTourContext {
  /** Whether this run shows injected example entries (decided at tour start). */
  demoMode: boolean;
  /** Reveals or hides the hover-only edit/delete icons on the first ADR card. */
  revealCardActions(on: boolean): void;
}

/** Built at tour start so the copy can reflect whether demo entries are shown. */
export function buildMainTourSteps(context: MainTourContext): TourStep[] {
  return [
    {
      id: "welcome",
      title: "Welcome to ADR Manager",
      body:
        "An Architectural Decision Record (ADR) captures an important design decision together with its context " +
        "and consequences. Keeping ADRs as Markdown files next to your code helps your team remember why the " +
        "system is built the way it is. This short tour shows you around."
    },
    {
      id: "list",
      target: "[data-tour='adr-list']",
      placement: "top",
      title: "All decisions in one place",
      body:
        "ADR Manager scans each workspace folder for ADRs and lists them here, grouped by folder. " +
        "Click a card to open a decision." +
        (context.demoMode
          ? " The entries you see now are examples for this tour, they disappear when it ends and are never saved."
          : "")
    },
    {
      id: "adr-search",
      target: "[data-tour='adr-search']",
      placement: "bottom",
      title: "Search and filter ADRs",
      body:
        "Type in the search bar to find ADRs by title. Use the filter button to narrow down decisions " +
        "by status, tags, or other criteria."
    },
    {
      id: "directory",
      target: "[data-tour='adr-directory']",
      placement: "bottom",
      title: "The ADR directory",
      body:
        "ADRs are read from this folder inside each workspace folder. To change it, run " +
        '"ADR Manager: Change ADR Directory" from the Command Palette and the list updates automatically.'
    },
    {
      id: "create",
      target: "[data-tour='add-adr']",
      placement: "bottom",
      title: "Create an ADR",
      body:
        "This opens the MADR editor with a guided template. Fill in the required fields and ADR Manager saves " +
        "the decision as a numbered Markdown file in your ADR directory."
    },
    {
      id: "modes",
      target: "[data-tour='add-adr']",
      placement: "bottom",
      title: "Basic and professional mode",
      body:
        "The editor starts with only the required MADR fields. Switch to Professional mode for every optional " +
        "field, your input is kept when switching. A short in-editor tour appears the first time you open it."
    },
    {
      id: "edit",
      target: "[data-tour='adr-edit']",
      placement: "left",
      title: "Edit a decision",
      body:
        "Click anywhere on a card to edit the ADR in the visual editor, or use this button to open the raw " +
        "Markdown file in the VS Code text editor.",
      onEnter: () => context.revealCardActions(true)
    },
    {
      id: "delete",
      target: "[data-tour='adr-delete']",
      placement: "left",
      title: "Delete a decision",
      body:
        "This deletes the ADR's Markdown file after a confirmation. Deleted files go to your system trash, " +
        "so mistakes can be undone.",
      onExit: () => context.revealCardActions(false)
    },
    {
      id: "finish",
      target: "[data-tour='tour-replay']",
      placement: "bottom",
      title: "You're all set",
      body:
        'Replay this tour any time with this button or the "ADR Manager: Show Tour" command. ' +
        "Now go document your first decision!"
    }
  ];
}
