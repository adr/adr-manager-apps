<template>
  <div id="view">
    <header class="toolbar">
      <button type="button" class="icon-btn" title="Back to ADR overview" @click="sendMessage('main')">
        <i class="codicon codicon-arrow-left"></i>
      </button>
      <div class="brand">
        <img src="../assets/logo-badge.png" alt="" />
        <span class="word">Convert<span> ADR</span></span>
      </div>
      <span class="spacer"></span>
      <button type="button" class="btn btn-ghost" title="Open the Markdown file in the text editor" @click="openEditor">
        <i class="codicon codicon-go-to-file"></i>
        Open file
      </button>
    </header>

    <EditorConvert :raw="raw" :template-version="templateVersion" @accept="acceptConversion" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import vscode from "../mixins/vscode-api-mixin";
import EditorConvert from "../components/EditorConvert.vue";
import { DEFAULT_MADR_VERSION } from "@adr-manager/core";
import type { MadrTemplateVersion } from "@adr-manager/core";

export default defineComponent({
  components: { EditorConvert },
  mixins: [vscode],
  data() {
    return {
      raw: "",
      templateVersion: DEFAULT_MADR_VERSION as MadrTemplateVersion,
      fullPath: ""
    };
  },
  mounted() {
    window.addEventListener("message", this.handleConvertMessage);
    // Request the source on mount so a slow page load never misses the host's push.
    this.sendMessage("getConvertSource");
  },
  beforeUnmount() {
    window.removeEventListener("message", this.handleConvertMessage);
  },
  methods: {
    handleConvertMessage(event: MessageEvent) {
      const message = event.data;
      if (message.command === "fetchConvertSource") {
        const source = JSON.parse(message.data);
        this.raw = source.markdown;
        this.templateVersion = source.templateVersion;
        this.fullPath = source.fullPath;
      }
    },
    /**
     * Hands the converted Markdown back to the host, which re-opens it in the structured editor.
     * Nothing is written to disk until the user saves from there.
     */
    acceptConversion(markdown: string) {
      this.sendMessage("acceptConversion", { markdown, fullPath: this.fullPath });
    },
    openEditor() {
      this.sendMessage("requestEdit", { fullPath: this.fullPath });
    }
  }
});
</script>
