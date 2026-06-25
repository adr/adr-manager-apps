<template>
  <div id="main">
    <header class="toolbar">
      <div class="brand">
        <img src="../assets/logo-badge.png" alt="" />
        <span class="word">ADR<span> Manager</span></span>
      </div>
      <span class="spacer"></span>
      <span class="chip dir-chip" data-tour="adr-directory" :title="adrDirectory || 'docs/decisions'">
        <i class="codicon codicon-folder-opened"></i>
        <code>{{ adrDirectory || "docs/decisions" }}</code>
      </span>
      <button type="button" class="icon-btn" title="Show tour" data-tour="tour-replay" @click="startTour">
        <i class="codicon codicon-question"></i>
      </button>
      <button type="button" class="btn btn-primary" data-tour="add-adr" @click="sendMessage('add')">
        <i class="codicon codicon-add"></i>
        Add ADR
      </button>
    </header>

    <div class="search-bar" data-cy="adr-search-bar" data-tour="adr-search">
      <div class="search-input-wrap">
        <i class="codicon codicon-search search-icon" aria-hidden="true"></i>
        <input
          v-model="searchText"
          class="search-input"
          data-cy="adr-search-input"
          placeholder="Search ADRs…"
          aria-label="Search ADRs by title"
          @keydown.escape="clearSearch"
        />
        <button
          v-if="hasFilters"
          type="button"
          class="filter-toggle"
          :class="{ open: filtersOpen, 'has-active': hasActiveFilters }"
          data-cy="adr-filter-toggle"
          data-tour="adr-filter"
          :aria-expanded="filtersOpen"
          aria-label="Toggle ADR filters"
          title="Toggle filters"
          @click="filtersOpen = !filtersOpen"
        >
          <i class="codicon codicon-filter" aria-hidden="true"></i>
          <span v-if="hasActiveFilters" class="filter-badge"></span>
        </button>
        <button
          v-if="searchActive"
          type="button"
          class="clear-btn"
          data-cy="adr-search-clear"
          title="Clear search"
          @click="clearSearch"
        >
          <i class="codicon codicon-close" aria-hidden="true"></i>
        </button>
      </div>

      <div v-if="filtersOpen && hasFilters" class="filter-panel" data-cy="adr-filter-panel">
        <template v-if="availableStatuses.length > 0">
          <span class="filter-label">Status</span>
          <div class="filter-row">
            <button
              v-for="status in availableStatuses"
              :key="status"
              type="button"
              class="filter-chip status-chip"
              :class="{ active: filterStatuses.includes(status) }"
              :data-tone="status"
              :data-cy="`status-filter-${status}`"
              :aria-pressed="filterStatuses.includes(status)"
              @click="toggleStatus(status)"
            >
              {{ status }}
            </button>
          </div>
        </template>
        <template v-if="availableTags.length > 0">
          <span class="filter-label">Tags</span>
          <div class="filter-row">
            <button
              v-for="tag in visibleTags"
              :key="tag.id"
              type="button"
              class="filter-chip tag-chip"
              :class="{ active: filterTagIds.includes(tag.id) }"
              :style="{ '--tag-color': tag.color }"
              :data-cy="`tag-filter-${tag.label}`"
              :aria-pressed="filterTagIds.includes(tag.id)"
              @click="toggleTagId(tag.id)"
            >
              <span class="tag-dot" aria-hidden="true"></span>
              {{ tag.label }}
            </button>
            <button
              v-if="!tagsExpanded && hiddenTagCount > 0"
              type="button"
              class="filter-chip tags-more-btn"
              data-cy="tags-show-more"
              @click="tagsExpanded = true"
            >
              +{{ hiddenTagCount }} more
            </button>
            <button
              v-else-if="tagsExpanded && hiddenTagCount > 0"
              type="button"
              class="filter-chip tags-more-btn"
              data-cy="tags-show-less"
              @click="tagsExpanded = false"
            >
              Show less
            </button>
          </div>
        </template>
      </div>
    </div>

    <main class="content" data-tour="adr-list">
      <section v-for="folder in nonEmptySortedWorkspaceFolders" :key="folder" class="adr-folder">
        <h2 class="folder-name">
          <i class="codicon codicon-folder"></i>
          {{ folder }}
        </h2>
        <ADRContainer
          v-for="adr in adrsInFolder(folder)"
          :key="adr.fullPath"
          :adr="adr"
          @request-delete="requestDelete(adr)"
          @request-view="requestView(adr)"
          @request-edit="requestEdit(adr)"
        ></ADRContainer>
      </section>

      <div v-if="!adrsAvailable" class="empty">
        <i class="codicon codicon-files"></i>
        <h2>No ADRs detected in this workspace</h2>
        <p>
          ADRs are loaded from <code>{{ adrDirectory || "docs/decisions" }}</code> in each workspace folder.
        </p>
      </div>
      <div v-else-if="searchActive && filteredDisplayedAdrs.length === 0" class="empty">
        <i class="codicon codicon-search-stop"></i>
        <h2>No ADRs match your search</h2>
        <p>
          Try adjusting your filters or
          <button type="button" class="link-btn" @click="clearSearch">clear the search</button>.
        </p>
      </div>
    </main>

    <TourOverlay
      v-model:active="tourActive"
      :steps="tourSteps"
      :offer="tourOffer"
      :done-label="demoMode ? 'Open the editor' : 'Finish'"
      @offer-answered="onTourOfferAnswered"
      @closed="onTourClosed"
    ></TourOverlay>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ADRContainer from "../components/ADRContainer.vue";
import TourOverlay from "../components/TourOverlay.vue";
import vscode from "../mixins/vscode-api-mixin";
import createTourMixin from "../mixins/tour";
import { buildDemoAdrEntries, DEMO_FOLDER_NAME, type AdrListEntry } from "../tour/demo-adrs";
import { buildMainTourSteps } from "../tour/main-steps";
import type { TourStep } from "../tour/types";
import { ArchitecturalDecisionRecord } from "../../src/plugins/classes";
import type { TourCloseReason } from "../../src/tour";
import { cleanPathString } from "../../src/plugins/utils";
import { matchesAdrSearch, isEmptyQuery } from "@adr-manager/core";
import type { Tag } from "@adr-manager/core";

export default defineComponent({
  components: {
    ADRContainer,
    TourOverlay
  },
  mixins: [vscode, createTourMixin("main")],
  data() {
    return {
      allAdrs: [] as {
        adr: ArchitecturalDecisionRecord;
        tags: Tag[];
        fullPath: string;
        relativePath: string;
        fileName: string;
      }[],
      workspaceFolders: [] as string[],
      adrDirectory: "",
      searchText: "",
      filterStatuses: [] as string[],
      filterTagIds: [] as string[],
      tourExampleFilter: null as { kind: "status" | "tag"; value: string } | null,
      filtersOpen: false,
      tagsExpanded: false,
      // Display-only example entries while the tour runs over an empty workspace.
      // Kept out of allAdrs so file-watcher refreshes can never persist or duplicate them.
      demoMode: false,
      demoFolder: DEMO_FOLDER_NAME,
      demoAdrs: [] as AdrListEntry[],
      tourSteps: [] as TourStep[],
      // The getTourState reply beats the async fetchAdrs reply, so a tour start
      // waits for the first list before deciding on demo entries.
      initialFetchDone: false,
      initialFetchResolvers: [] as (() => void)[]
    };
  },
  computed: {
    /**
     * Sorts the fetched ADRs by their filename such that the lowest-numbered ADR
     * from all workspace folders is displayed at the top.
     */
    sortedAdrs() {
      return [...this.allAdrs].sort((a, b) => {
        return (
          a.relativePath.localeCompare(b.relativePath) ||
          a.fileName.localeCompare(b.fileName, undefined, { numeric: true })
        );
      });
    },
    /**
     * Real ADRs arriving mid-tour win over the example entries.
     */
    showingDemoEntries() {
      return this.demoMode && this.allAdrs.length === 0;
    },
    displayedAdrs() {
      if (this.showingDemoEntries) {
        return this.demoAdrs;
      }
      return this.sortedAdrs;
    },
    displayedWorkspaceFolders() {
      // Only the demo folder's section renders while the demo entries are shown,
      // so the section header always matches the entries underneath it.
      if (this.showingDemoEntries) {
        return [this.demoFolder];
      }
      return this.workspaceFolders;
    },
    /**
     * Returns an array of all workspace folders which contain at least one ADR.
     */
    nonEmptySortedWorkspaceFolders() {
      return this.displayedWorkspaceFolders
        .filter((folder) => {
          return this.adrsInFolder(folder).length > 0;
        })
        .sort((a, b) => {
          return a.localeCompare(b);
        });
    },
    /**
     * Returns true iff at least one ADR (or tour example entry) is displayed.
     */
    adrsAvailable() {
      return this.displayedAdrs.length > 0;
    },
    searchQuery() {
      return {
        text: this.searchText,
        statuses: this.filterStatuses,
        tagIds: this.filterTagIds
      };
    },
    searchActive() {
      return !isEmptyQuery(this.searchQuery);
    },
    availableStatuses() {
      const seen = new Set<string>();
      for (const entry of this.displayedAdrs) {
        const s = (entry.adr.status ?? "").toLowerCase().trim();
        if (s) seen.add(s);
      }
      return [...seen];
    },
    availableTags(): Tag[] {
      const seen = new Map<string, Tag>();
      for (const entry of this.displayedAdrs) {
        for (const tag of entry.tags ?? []) {
          if (!seen.has(tag.id)) seen.set(tag.id, tag);
        }
      }
      return [...seen.values()];
    },
    hasFilters() {
      return this.availableStatuses.length > 0 || this.availableTags.length > 0;
    },
    hasActiveFilters() {
      return this.filterStatuses.length > 0 || this.filterTagIds.length > 0;
    },
    visibleTags(): Tag[] {
      return this.tagsExpanded ? this.availableTags : this.availableTags.slice(0, 10);
    },
    hiddenTagCount(): number {
      return Math.max(0, this.availableTags.length - 10);
    },
    filteredDisplayedAdrs() {
      if (!this.searchActive) return this.displayedAdrs;
      return this.displayedAdrs.filter((entry) =>
        matchesAdrSearch(
          {
            title: entry.adr.title ?? "",
            status: (entry.adr.status ?? "").toLowerCase(),
            tags: entry.tags ?? []
          },
          this.searchQuery
        )
      );
    }
  },
  /**
   * Sets up event listeners to receive messages and data from the extension, and fetch ADRs
   * upon rendering the view.
   */
  mounted() {
    window.addEventListener("message", this.handleExtensionMessage);
    this.sendMessage("fetchAdrs");
    this.sendMessage("getWorkspaceFolders");
    this.sendMessage("getAdrDirectory");
  },
  beforeUnmount() {
    window.removeEventListener("message", this.handleExtensionMessage);
  },
  methods: {
    handleExtensionMessage(event: MessageEvent) {
      const message = event.data;
      switch (message.command) {
        case "fetchAdrs": {
          this.allAdrs = JSON.parse(message.adrs);
          this.initialFetchDone = true;
          this.initialFetchResolvers.splice(0).forEach((resolve) => resolve());
          break;
        }
        case "getWorkspaceFolders": {
          this.workspaceFolders = JSON.parse(message.workspaceFolders);
          break;
        }
        case "getAdrDirectory": {
          this.adrDirectory = message.adrDirectory;
          break;
        }
      }
    },
    /**
     * Returns an array of ADRs that are located inside of the specified folder.
     * @param folder The folder the ADRs should be located in
     */
    adrsInFolder(folder: string) {
      return this.filteredDisplayedAdrs.filter((adr) => {
        return adr.relativePath.includes(cleanPathString(folder + "/" + this.adrDirectory));
      });
    },
    toggleStatus(status: string) {
      if (this.filterStatuses.includes(status)) {
        this.filterStatuses = this.filterStatuses.filter((s) => s !== status);
      } else {
        this.filterStatuses = [...this.filterStatuses, status];
      }
    },
    toggleTagId(id: string) {
      if (this.filterTagIds.includes(id)) {
        this.filterTagIds = this.filterTagIds.filter((t) => t !== id);
      } else {
        this.filterTagIds = [...this.filterTagIds, id];
      }
    },
    clearSearch() {
      this.searchText = "";
      this.filterStatuses = [];
      this.filterTagIds = [];
    },
    /**
     * Tour hook (called by the tour mixin): decide on demo entries before the
     * overlay measures its anchors, and build the step copy to match.
     */
    async beforeTourStart() {
      await this.initialListSettled();
      this.demoMode = this.allAdrs.length === 0;
      if (this.demoMode) {
        this.demoFolder = this.workspaceFolders[0] ?? DEMO_FOLDER_NAME;
        this.demoAdrs = buildDemoAdrEntries(this.demoFolder, this.adrDirectory);
      }
      this.tourSteps = buildMainTourSteps({
        demoMode: this.demoMode,
        hasFilters: this.hasFilters,
        revealCardActions: this.revealCardActions,
        setFiltersOpen: (open) => {
          this.filtersOpen = open;
        },
        setExampleFilterActive: this.setExampleFilterActive
      });
    },
    setExampleFilterActive(active: boolean) {
      if (!active) {
        if (this.tourExampleFilter?.kind === "status") {
          this.filterStatuses = this.filterStatuses.filter((status) => status !== this.tourExampleFilter?.value);
        } else if (this.tourExampleFilter?.kind === "tag") {
          this.filterTagIds = this.filterTagIds.filter((id) => id !== this.tourExampleFilter?.value);
        }
        this.tourExampleFilter = null;
        return;
      }

      const status = this.availableStatuses.find((candidate) => !this.filterStatuses.includes(candidate));
      if (status) {
        this.filterStatuses = [...this.filterStatuses, status];
        this.tourExampleFilter = { kind: "status", value: status };
        return;
      }

      const tag = this.availableTags.find((candidate) => !this.filterTagIds.includes(candidate.id));
      if (tag) {
        this.filterTagIds = [...this.filterTagIds, tag.id];
        this.tourExampleFilter = { kind: "tag", value: tag.id };
      }
    },
    initialListSettled(): Promise<void> {
      if (this.initialFetchDone) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        this.initialFetchResolvers.push(resolve);
        // Fallback in case the host never answers.
        setTimeout(resolve, 1500);
      });
    },
    afterTourClosed(reason: TourCloseReason) {
      const openDemoEditor = reason === "finished" && this.demoMode;
      this.demoMode = false;
      this.demoAdrs = [];
      document.querySelectorAll(".adr-card.tour-reveal").forEach((card) => {
        card.classList.remove("tour-reveal");
      });
      if (openDemoEditor) {
        this.sendMessage("viewDemo");
      }
    },
    /**
     * The edit/delete icons only show on hover, so the tour reveals them on the
     * first card while it points at them.
     */
    revealCardActions(on: boolean) {
      const card = document.querySelector("[data-tour='adr-edit']")?.closest(".adr-card");
      card?.classList.toggle("tour-reveal", on);
    },
    /**
     * Sends a message to the extension to open a text editor for the specified ADR file.
     * @param adr The ADR for which a text editor will be opened
     */
    requestEdit(adr: { adr: ArchitecturalDecisionRecord; fullPath: string; relativePath: string; fileName: string }) {
      this.sendMessage("requestEdit", { fullPath: adr.fullPath });
    },
    /**
     * Sends a message to the extension to initialize the deletion of the specified ADR file.
     * @param adr The ADR to be deleted
     */
    requestDelete(adr: { adr: ArchitecturalDecisionRecord; fullPath: string; relativePath: string; fileName: string }) {
      this.sendMessage("requestDelete", { title: adr.adr.title, fullPath: adr.fullPath });
    },
    /**
     * Sends a message to the extension to load the viewing webview with the content of the specified ADR file.
     * @param adr The ADR to be openend in the ADR Manager webview
     */
    requestView(adr: { adr: ArchitecturalDecisionRecord; fullPath: string; relativePath: string; fileName: string }) {
      this.sendMessage("view", { fullPath: adr.fullPath });
    }
  }
});
</script>

<style scoped>
/* ── Search bar ── */
.search-bar {
  max-width: 860px;
  margin: 0 auto;
  padding: 10px 40px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 6px;
  border-radius: 5px;
  border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.35));
  background: var(--vscode-input-background);
  transition: border-color 0.14s;
}

.search-input-wrap:focus-within {
  border-color: var(--vscode-focusBorder);
}

.search-icon {
  font-size: 14px;
  color: var(--vscode-foreground);
  opacity: 0.6;
  flex: 0 0 auto;
}

.search-input {
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  font-family: var(--vscode-font-family);
  font-size: 13px;
  color: var(--vscode-input-foreground);
  min-width: 0;
}

.search-input::placeholder {
  color: var(--vscode-input-placeholderForeground);
}

.filter-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
  transition:
    background 0.12s,
    opacity 0.12s;
}

.filter-toggle:hover,
.filter-toggle.open {
  background: var(--vscode-toolbar-hoverBackground);
  opacity: 1;
}

.filter-toggle.has-active {
  color: var(--vscode-textLink-foreground);
  opacity: 1;
}

.filter-toggle .codicon {
  font-size: 14px;
}

.filter-badge {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--vscode-textLink-foreground);
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 50%;
  background: var(--vscode-toolbar-hoverBackground);
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}

.clear-btn:hover {
  opacity: 1;
}

.clear-btn .codicon {
  font-size: 10px;
}

.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px 2px 4px;
  border-top: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.2));
}

.filter-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--vscode-foreground);
  opacity: 0.6;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 7px;
  border-radius: 999px;
  border: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
  background: transparent;
  color: var(--vscode-foreground);
  font-family: var(--vscode-font-family);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  text-transform: capitalize;
  opacity: 0.8;
  transition:
    background 0.12s,
    border-color 0.12s,
    opacity 0.12s;
}

.filter-chip:hover {
  background: var(--vscode-toolbar-hoverBackground);
  opacity: 1;
}

/* Status chip colors. Mirrors .chip.status[data-tone] palette from adr-design.css */
.status-chip[data-tone="accepted"] {
  color: var(--adr-success);
  border-color: var(--adr-success);
  opacity: 1;
}
.status-chip[data-tone="proposed"] {
  color: var(--adr-info);
  border-color: var(--adr-info);
  opacity: 1;
}
.status-chip[data-tone="rejected"] {
  color: var(--adr-error);
  border-color: var(--adr-error);
  opacity: 1;
}
.status-chip[data-tone="deprecated"] {
  color: var(--adr-warning);
  border-color: var(--adr-warning);
  opacity: 1;
}
.status-chip[data-tone="superseded"] {
  color: var(--adr-superseded);
  border-color: var(--adr-superseded);
  opacity: 1;
}

.status-chip.active[data-tone="accepted"] {
  background: color-mix(in srgb, var(--adr-success) 15%, transparent);
}
.status-chip.active[data-tone="proposed"] {
  background: color-mix(in srgb, var(--adr-info) 15%, transparent);
}
.status-chip.active[data-tone="rejected"] {
  background: color-mix(in srgb, var(--adr-error) 15%, transparent);
}
.status-chip.active[data-tone="deprecated"] {
  background: color-mix(in srgb, var(--adr-warning) 15%, transparent);
}
.status-chip.active[data-tone="superseded"] {
  background: color-mix(in srgb, var(--adr-superseded) 15%, transparent);
}

.tag-chip {
  border-color: color-mix(in srgb, var(--tag-color) 40%, transparent);
}

.tag-chip.active {
  background: color-mix(in srgb, var(--tag-color) 15%, transparent);
  border-color: var(--tag-color);
  color: var(--tag-color);
  opacity: 1;
}

.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tag-color);
  flex: 0 0 auto;
}

.tags-more-btn {
  border-style: dashed;
  color: var(--vscode-foreground);
  opacity: 0.5;
  font-weight: 500;
}

.tags-more-btn:hover {
  background: var(--vscode-toolbar-hoverBackground);
  opacity: 0.8;
  border-style: solid;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--vscode-textLink-foreground);
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
  text-decoration: underline;
}

/* ── Content ── */
.content {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 40px 80px;
}

.dir-chip {
  min-width: 0;
  max-width: 260px;
  flex: 0 1 auto;
  cursor: default;
}

.dir-chip code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--adr-font-mono);
  font-size: var(--adr-text-xs);
}

.adr-folder {
  margin-bottom: 28px;
}

.folder-name {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: var(--adr-text-xs);
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--adr-ink-2);
  margin-bottom: 10px;
}

.folder-name .codicon {
  font-size: 14px;
  color: var(--adr-ink-3);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  padding: 80px 0;
  color: var(--adr-ink-2);
}

.empty .codicon {
  font-size: 44px;
  color: var(--adr-ink-3);
}

.empty h2 {
  font-size: var(--adr-text-h3);
  font-weight: 600;
  color: var(--adr-ink);
}

.empty p {
  font-size: var(--adr-text-sm);
}
</style>
