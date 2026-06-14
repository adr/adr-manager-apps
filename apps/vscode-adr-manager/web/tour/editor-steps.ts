import type { TourStep } from "./types";

export interface EditorTourContext {
  /** Called with `true` when the field-visibility step enters and `false` when it exits.
   *  Professional views can pass a no-op; basic views use this to temporarily show the panel. */
  revealFieldVisibilityPanel(on: boolean): void;
}

const noopContext: EditorTourContext = {
  revealFieldVisibilityPanel: () => {}
};

/**
 * The mini-tour shown on first open of any editor page
 * (add-basic, add-professional, view-basic, view-professional).
 * The copy is neutral between creating and saving.
 *
 * Pass an EditorTourContext to control the field-visibility step's visibility.
 * Basic views should reveal the FieldVisibilityPanel on enter and hide it on exit.
 * Professional views can omit the context (the panel is always visible there).
 */
export function buildEditorTourSteps(context: EditorTourContext = noopContext): TourStep[] {
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
      id: "field-visibility",
      target: "[data-tour='field-visibility']",
      placement: "bottom",
      title: "Customize visible fields",
      body:
        "The Fields button is a Professional mode feature that lets you toggle individual Professional mode sections on or off to match your personal preferences.",
      onEnter: () => context.revealFieldVisibilityPanel(true),
      onExit: () => context.revealFieldVisibilityPanel(false)
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
