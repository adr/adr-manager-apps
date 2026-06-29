import { TOUR_COPY } from "@adr-manager/core";
import type { TourStep } from "./types";

export interface EditorTourContext {
  /** Called with `true` when the field-visibility step enters and `false` when it exits.
   *  Professional views can pass a no-op; basic views use this to temporarily show the panel. */
  revealFieldVisibilityPanel(on: boolean): void;
}

const noopContext: EditorTourContext = {
  revealFieldVisibilityPanel: () => {}
};

function setTemplateVersionMenuOpen(open: boolean): void {
  const wrap = document.querySelector<HTMLElement>("[data-tour='template-version']");
  wrap?.dispatchEvent(new CustomEvent<boolean>("tour-version-menu", { detail: open }));
}

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
      title: "Edit with structured fields",
      body: TOUR_COPY.editorIntro
    },
    {
      id: "template-version",
      target: "[data-tour='template-version']",
      placement: "bottom",
      title: "Choose the MADR version",
      body: TOUR_COPY.templateVersion,
      onEnter: () => setTemplateVersionMenuOpen(true),
      onExit: () => setTemplateVersionMenuOpen(false)
    },
    {
      id: "mode-toggle",
      target: "[data-tour='mode-toggle']",
      placement: "bottom",
      title: "Toggle optional fields",
      body: TOUR_COPY.modeToggle
    },
    {
      id: "field-visibility",
      target: "[data-tour='field-visibility']",
      placement: "bottom",
      title: "Customize visible fields",
      body: TOUR_COPY.fieldVisibility,
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
