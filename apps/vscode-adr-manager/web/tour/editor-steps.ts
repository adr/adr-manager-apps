import type { TourStep } from "./types";

/**
 * The mini-tour shown on first open of any editor page
 * (add-basic, add-professional, view-basic, view-professional).
 * The copy is neutral between creating and saving.
 */
export function buildEditorTourSteps(): TourStep[] {
  return [
    {
      id: "template",
      title: "The MADR editor",
      body:
        "This editor walks you through the MADR template. Required fields are validated as you type, " +
        "and the question mark icons explain what belongs in each field."
    },
    {
      id: "mode-toggle",
      target: "[data-tour='mode-toggle']",
      placement: "bottom",
      title: "Switch editor modes",
      body:
        "Basic shows only the required fields. Professional reveals every optional MADR field such as " +
        "deciders, decision drivers, pros and cons, and links. Switching keeps everything you have typed."
    },
    {
      id: "primary",
      target: "[data-tour='editor-primary']",
      placement: "bottom",
      title: "Save your decision",
      body:
        "Once the required fields are valid this button becomes active and writes the ADR as a numbered " +
        "Markdown file into your ADR directory."
    }
  ];
}
