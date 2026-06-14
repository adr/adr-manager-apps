import { store } from "@/plugins/store";
import type { Mode } from "@/types/store";

export interface TourStep {
    id: string;
    /** Undefined renders a centered card over a full-screen dim. */
    target?: string | (() => Element | null);
    title: string;
    body: string;
    placement?: "top" | "bottom" | "left" | "right" | "over";
    onEnter?: () => void;
    onExit?: () => void;
}

let modeBeforeToggleStep: Mode | undefined;
let modeBeforeFieldVisibilityStep: Mode | undefined;

export const tourSteps: TourStep[] = [
    {
        id: "intro",
        title: "Architectural Decision Records",
        body:
            "An ADR is a short Markdown document that captures one architectural decision, the context behind it, " +
            "the options that were considered and the outcome. ADR Manager lets you create, edit and commit ADRs " +
            "in the MADR format directly in your Git repositories."
    },
    {
        id: "explorer",
        target: '[data-tour="explorer"]',
        placement: "right",
        title: "Your repositories",
        body:
            "Every repository you add is listed here together with the ADRs found inside it. " +
            "Use the Add repository button at the bottom to connect more repositories from your account."
    },
    {
        id: "adr-search",
        target: '[data-tour="adr-search"]',
        placement: "right",
        title: "Search and filter ADRs",
        body:
            "Type in the search bar to find ADRs by title across all your repositories. Use the filter button " +
            "to narrow down decisions by status, tags, or other criteria."
    },
    {
        id: "switch-repository",
        target: () =>
            document.querySelector('.repo.open [data-cy="repoHead"]') ?? document.querySelector('[data-cy="repoHead"]'),
        placement: "right",
        title: "Switch repositories",
        body:
            "Click a repository to expand it and make it active. You can keep several repositories open " +
            "and switch between them at any time."
    },
    {
        id: "create-adr",
        target: '[data-cy="newADR"]',
        placement: "right",
        title: "Create a new ADR",
        body:
            "New ADR adds a numbered Markdown file based on the MADR template to the repository's " +
            "ADR directory and opens it in the editor."
    },
    {
        id: "edit-adr",
        target: '[data-tour="editor"]',
        placement: "over",
        title: "Edit with structured fields",
        body:
            "The editor turns the MADR template into a form with fields like title, context, considered options " +
            "and decision outcome. Everything you type is converted to Markdown as you go, and the title also " +
            "becomes the file name."
    },
    {
        id: "preview",
        target: '[data-tour="preview"]',
        placement: "left",
        title: "Live Markdown preview",
        body:
            "This pane shows the generated Markdown in real time. You can also edit the raw Markdown here, " +
            "the form and the source stay in sync."
    },
    {
        id: "toggle-fields",
        target: '[data-tour="mode-toggle"]',
        placement: "bottom",
        title: "Toggle optional fields",
        body:
            "This switch toggles the optional MADR fields. Professional mode reveals decision drivers, pros and " +
            "cons per option and detailed consequences, while Basic keeps only the essentials. Hidden fields are " +
            "kept in the file.",
        onEnter: () => {
            modeBeforeToggleStep = store.mode;
            // Direct assignment so the demonstration does not persist a mode change.
            store.mode = "professional";
        },
        onExit: () => {
            if (modeBeforeToggleStep !== undefined) {
                store.mode = modeBeforeToggleStep;
                modeBeforeToggleStep = undefined;
            }
        }
    },
    {
        id: "field-visibility",
        target: '[data-tour="field-visibility"]',
        placement: "bottom",
        title: "Customize visible fields",
        body: "The Fields button is a Professional mode feature that lets you toggle individual Professional mode sections on or off to match your personal preferences.",
        onEnter: () => {
            modeBeforeFieldVisibilityStep = store.mode;
            store.mode = "professional";
        },
        onExit: () => {
            if (modeBeforeFieldVisibilityStep !== undefined) {
                store.mode = modeBeforeFieldVisibilityStep;
                modeBeforeFieldVisibilityStep = undefined;
            }
        }
    },
    {
        id: "delete-adr",
        target: '[data-cy="deleteAdrBtn"]',
        placement: "right",
        title: "Delete an ADR",
        body:
            "Hover an ADR in the explorer and click the trash icon to delete it. The deletion is staged " +
            "locally and only applied to the repository when you commit."
    },
    {
        id: "adr-directory",
        target: '[data-tour="adr-path"]',
        placement: "top",
        title: "The ADR directory",
        body:
            "Each repository keeps its ADRs in one directory, which ADR Manager detects automatically " +
            "(new setups default to docs/decisions). The status bar shows the full path of the open ADR " +
            "and the branch you are working on."
    },
    {
        id: "commit",
        target: '[data-cy="commitTopbar"]',
        placement: "bottom",
        title: "Commit your changes",
        body:
            "Edits, new ADRs and deletions stay in your browser until you commit. This button opens a dialog " +
            "where you select the changed files, write a commit message and push everything to the active branch."
    },
    {
        id: "replay",
        target: '[data-cy="startTour"]',
        placement: "bottom",
        title: "That's the tour",
        body:
            "You can replay this tour at any time with this help button. The small question mark icons across " +
            "the editor give field-level hints. Enjoy documenting your decisions!"
    }
];
