<template>
  <div id="main">
    <header class="toolbar">
      <div class="brand">
        <img src="../assets/logo-badge.png" alt="" />
        <span class="word">ADR<span> Manager</span></span>
      </div>
      <span class="spacer"></span>
      <button type="button" class="btn btn-primary" @click="sendMessage('add')">
        <i class="codicon codicon-add"></i>
        Add ADR
      </button>
    </header>

    <main class="content">
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ADRContainer from "../components/ADRContainer.vue";
import vscode from "../mixins/vscode-api-mixin";
import { ArchitecturalDecisionRecord } from "../../src/plugins/classes";
import { cleanPathString } from "../../src/plugins/utils";

export default defineComponent({
  components: {
    ADRContainer
  },
  mixins: [vscode],
  data() {
    return {
      allAdrs: [] as {
        adr: ArchitecturalDecisionRecord;
        fullPath: string;
        relativePath: string;
        fileName: string;
      }[],
      workspaceFolders: [] as string[],
      adrDirectory: ""
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
     * Returns an array of all workspace folders which contain at least one ADR.
     */
    nonEmptySortedWorkspaceFolders() {
      return this.workspaceFolders
        .filter((folder) => {
          return this.adrsInFolder(folder).length > 0;
        })
        .sort((a, b) => {
          return a.localeCompare(b);
        });
    },
    /**
     * Returns true iff the extension has detected at least one ADR.
     */
    adrsAvailable() {
      return this.allAdrs.length > 0;
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
      return this.sortedAdrs.filter((adr) => {
        return adr.relativePath.includes(cleanPathString(folder + "/" + this.adrDirectory));
      });
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
