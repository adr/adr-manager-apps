import { store } from "@/plugins/store";
import type { Mode } from "@/types/store";
import { TOUR_COPY } from "@adr-manager/core";

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
let demonstratedFilter: HTMLButtonElement | undefined;

function setFilterPanelOpen(open: boolean): void {
    const button = document.querySelector<HTMLButtonElement>('[data-cy="adr-filter-toggle"]');
    if (button && (button.getAttribute("aria-expanded") === "true") !== open) {
        button.click();
    }
}

function setExampleFilterActive(active: boolean): void {
    if (active) {
        setFilterPanelOpen(true);
        demonstratedFilter =
            document.querySelector<HTMLButtonElement>(".filter-panel .filter-chip:not(.tags-more-btn):not(.active)") ??
            undefined;
        demonstratedFilter?.click();
        return;
    }
    if (demonstratedFilter?.getAttribute("aria-pressed") === "true") {
        demonstratedFilter.click();
    }
    demonstratedFilter = undefined;
    setFilterPanelOpen(false);
}

function setTemplateVersionMenuOpen(open: boolean): void {
    const wrap = document.querySelector<HTMLElement>('[data-tour="template-version"]');
    wrap?.dispatchEvent(new CustomEvent<boolean>("tour-version-menu", { detail: open }));
}

export function resetTourFilterDemonstration(): void {
    setExampleFilterActive(false);
    setFilterPanelOpen(false);
    setTemplateVersionMenuOpen(false);
}

export const tourSteps: TourStep[] = [
    {
        id: "intro",
        title: "Architectural Decision Records",
        body:
            TOUR_COPY.adrDefinition +
            " ADR Manager lets you create, edit and commit ADRs in the MADR format directly in your Git repositories."
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
        title: "Search ADRs",
        body: TOUR_COPY.search
    },
    {
        id: "adr-filter",
        target: '[data-cy="adr-filter-toggle"]',
        placement: "right",
        title: "Filter ADRs",
        body: TOUR_COPY.filter,
        onEnter: () => setFilterPanelOpen(true)
    },
    {
        id: "adr-filter-example",
        target: () => document.querySelector(".filter-panel .filter-chip:not(.tags-more-btn)"),
        placement: "right",
        title: "Apply a filter",
        body: "Selecting a status or tag immediately narrows the ADR list. Select it again to remove the filter.",
        onEnter: () => setExampleFilterActive(true),
        onExit: () => setExampleFilterActive(false)
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
        id: "delete-adr",
        target: '[data-cy="deleteAdrBtn"]',
        placement: "right",
        title: "Delete an ADR",
        body:
            "Hover an ADR in the explorer and click the trash icon to delete it. The deletion is staged " +
            "locally and only applied to the repository when you commit."
    },
    {
        id: "create-adr",
        target: '[data-cy="newADR"]',
        placement: "right",
        title: "Create a new ADR",
        body:
            "New ADR adds a numbered Markdown file based on the MADR template to the repository's " +
            "ADR directory and opens it in the editor. New setups default to docs/decisions; the status bar " +
            "shows the full path and active branch."
    },
    {
        id: "template-version",
        target: '[data-tour="template-version"]',
        placement: "bottom",
        title: "Choose the MADR version",
        body: TOUR_COPY.templateVersion,
        onEnter: () => setTemplateVersionMenuOpen(true),
        onExit: () => setTemplateVersionMenuOpen(false)
    },
    {
        id: "edit-adr",
        target: '[data-tour="editor"]',
        placement: "over",
        title: "Edit with structured fields",
        body: TOUR_COPY.editorIntro
    },
    {
        id: "toggle-fields",
        target: '[data-tour="mode-toggle"]',
        placement: "bottom",
        title: "Toggle optional fields",
        body: TOUR_COPY.modeToggle,
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
        body: TOUR_COPY.fieldVisibility,
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
        id: "preview",
        target: '[data-tour="preview"]',
        placement: "left",
        title: "Live Markdown preview",
        body:
            "This pane shows the generated Markdown in real time. You can also edit the raw Markdown here, " +
            "the form and the source stay in sync."
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
