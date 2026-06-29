import { TOUR_COPY } from "@adr-manager/core";
import type { TourStep } from "./types";

export interface MainTourContext {
  /** Whether this run shows injected example entries (decided at tour start). */
  demoMode: boolean;
  /** Whether the displayed ADRs provide status or tag filters. */
  hasFilters: boolean;
  /** Reveals or hides the hover-only edit/delete icons on the first ADR card. */
  revealCardActions(on: boolean): void;
  /** Opens or closes the filter panel for the filter step. */
  setFiltersOpen(open: boolean): void;
  /** Applies or removes one temporary filter without disturbing existing filters. */
  setExampleFilterActive(active: boolean): void;
}

/** Built at tour start so the copy can reflect whether demo entries are shown. */
export function buildMainTourSteps(context: MainTourContext): TourStep[] {
  const steps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to ADR Manager",
      body:
        TOUR_COPY.adrDefinition +
        " ADR Manager lets you create and edit ADRs in the MADR format and keeps them as Markdown files " +
        "next to your code. This short tour shows you around."
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
      id: "adr-search",
      target: "[data-tour='adr-search']",
      placement: "bottom",
      title: "Search ADRs",
      body: TOUR_COPY.search
    }
  ];

  if (context.hasFilters) {
    steps.push(
      {
        id: "adr-filter",
        target: "[data-tour='adr-filter']",
        placement: "bottom",
        title: "Filter ADRs",
        body: TOUR_COPY.filter,
        onEnter: () => context.setFiltersOpen(true),
        onExit: () => context.setFiltersOpen(false)
      },
      {
        id: "adr-filter-example",
        target: ".filter-panel .filter-chip:not(.tags-more-btn)",
        placement: "bottom",
        title: "Apply a filter",
        body: "Selecting a status or tag immediately narrows the ADR list. Select it again to remove the filter.",
        onEnter: () => {
          context.setFiltersOpen(true);
          context.setExampleFilterActive(true);
        },
        onExit: () => {
          context.setExampleFilterActive(false);
          context.setFiltersOpen(false);
        }
      }
    );
  }

  steps.push(
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
    context.demoMode
      ? {
          id: "open-editor",
          title: "Open a decision",
          body: "That's the overview. Let's open this example decision in the editor to see how editing works."
        }
      : {
          id: "finish",
          target: "[data-tour='tour-replay']",
          placement: "bottom",
          title: "You're all set",
          body:
            'Replay this tour any time with this button or the "ADR Manager: Show Tour" command. ' +
            "Now go document your first decision!"
        }
  );

  return steps;
}
