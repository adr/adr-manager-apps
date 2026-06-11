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
    </main>

    <TourOverlay
      v-model:active="tourActive"
      :steps="tourSteps"
      :offer="tourOffer"
      done-label="Finish"
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
import { cleanPathString } from "../../src/plugins/utils";

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
        fullPath: string;
        relativePath: string;
        fileName: string;
      }[],
      workspaceFolders: [] as string[],
      adrDirectory: "",
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
      return this.allAdrs.sort((a, b) => {
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
    }
  },
  /**
   * Sets up event listeners to receive messages and data from the extension, and fetch ADRs
   * upon rendering the view.
   */
  mounted() {
    window.addEventListener("message", (event) => {
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
    });
    this.sendMessage("fetchAdrs");
    this.sendMessage("getWorkspaceFolders");
    this.sendMessage("getAdrDirectory");
  },
  methods: {
    /**
     * Returns an array of ADRs that are located inside of the specified folder.
     * @param folder The folder the ADRs should be located in
     */
    adrsInFolder(folder: string) {
      return this.displayedAdrs.filter((adr) => {
        return adr.relativePath.includes(cleanPathString(folder + "/" + this.adrDirectory));
      });
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
        revealCardActions: this.revealCardActions
      });
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
    /**
     * Tour hook (called by the tour mixin): drop the example entries again.
     */
    afterTourClosed() {
      this.demoMode = false;
      this.demoAdrs = [];
      document.querySelectorAll(".adr-card.tour-reveal").forEach((card) => {
        card.classList.remove("tour-reveal");
      });
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
