// Vue mixin which holds all the data used by the webview to save a new/edited ADR
import { defineComponent } from "vue";
import { naturalCase2titleCase } from "../../src/plugins/utils";
import vscodeApiMixin from "./vscode-api-mixin";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldVisibility, Tag } from "@adr-manager/core";

declare global {
  interface Window {
    __INITIAL_FIELD_VISIBILITY__?: FieldVisibility;
  }
}

export default defineComponent({
  mixins: [vscodeApiMixin],
  data() {
    return {
      validated: false,
      yaml: "",
      title: "",
      date: "",
      status: "",
      deciders: "",
      technicalStory: "",
      contextAndProblemStatement: "",
      decisionDrivers: [] as string[],
      consideredOptions: [] as {
        title: string;
        description: string;
        pros: string[];
        neutrals: string[];
        cons: string[];
      }[],
      decisionOutcome: {
        chosenOption: "",
        explanation: "",
        positiveConsequences: [] as string[],
        negativeConsequences: [] as string[]
      },
      links: [] as string[],
      relevantFiles: [] as string[],
      decisionMakers: "",
      consulted: "",
      informed: "",
      consequences: [] as { kind: string; text: string }[],
      confirmation: "",
      moreInformation: "",
      templateVersion: "2.1.2",
      fullPath: "",
      oldTitle: "",
      fieldVisibility: { ...DEFAULT_FIELD_VISIBILITY },
      tags: [] as Tag[],
      recentTags: [] as Tag[]
    };
  },
  computed: {
    /**
     * Returns true iff the current data has at least one non-required field which is not empty.
     */
    hasProfessionalFields() {
      return (
        this.status ||
        this.deciders ||
        this.decisionMakers ||
        this.consulted ||
        this.informed ||
        this.date ||
        this.technicalStory ||
        this.decisionDrivers.length ||
        this.consideredOptions.some((option) => {
          return option.description || option.pros.length || option.neutrals.length || option.cons.length;
        }) ||
        this.decisionOutcome.positiveConsequences.length ||
        this.decisionOutcome.negativeConsequences.length ||
        this.consequences.length ||
        this.confirmation ||
        this.links.length ||
        this.relevantFiles.length ||
        this.moreInformation
      );
    },
    /**
     * Returns a string listing all non-empty fields that are not shown in the Basic editor
     */
    missingFieldsNote() {
      const fields: string[] = [];
      if (this.status) {
        fields.push("'Status'");
      }
      if (this.deciders || this.decisionMakers) {
        fields.push(this.templateVersion === "4.0.0" ? "'Decision-makers'" : "'Deciders'");
      }
      if (this.consulted) {
        fields.push("'Consulted'");
      }
      if (this.informed) {
        fields.push("'Informed'");
      }
      if (this.date) {
        fields.push("'Date'");
      }
      if (this.technicalStory) {
        fields.push("'Technical Story'");
      }
      if (this.decisionDrivers.some((driver) => driver !== "")) {
        fields.push("'Decision Drivers'");
      }
      if (this.consideredOptions.some((option) => option.description)) {
        fields.push("'Option Descriptions'");
      }
      if (
        this.consideredOptions.some(
          (option) =>
            option.pros.some((pro) => pro !== "") ||
            option.neutrals.some((neutral) => neutral !== "") ||
            option.cons.some((con) => con !== "")
        )
      ) {
        fields.push("'Pros and Cons of the Options'");
      }
      if (
        this.decisionOutcome.positiveConsequences.some((positive) => positive !== "") ||
        this.decisionOutcome.negativeConsequences.some((negative) => negative !== "")
      ) {
        fields.push("'Positive and Negative Consequences'");
      }
      if (this.consequences.length) {
        fields.push("'Consequences'");
      }
      if (this.confirmation) {
        fields.push("'Confirmation'");
      }
      if (this.links.some((link) => link !== "")) {
        fields.push("'Links'");
      }
      if (this.relevantFiles.some((file) => file !== "")) {
        fields.push("'Relevant Files'");
      }
      if (this.moreInformation) {
        fields.push("'More Information'");
      }

      if (fields.length === 0) {
        return "";
      }
      return `The fields ${fields.join(", ")} of this ADR have values, but are not shown in the basic editor mode.`;
    }
  },
  mounted() {
    // Apply the field visibility baked into the webview HTML by the extension host.
    // Reading it synchronously here avoids a race where async message delivery could
    // arrive before window.addEventListener is registered below.
    if (window.__INITIAL_FIELD_VISIBILITY__) {
      this.fieldVisibility = window.__INITIAL_FIELD_VISIBILITY__;
    }

    // Request persisted field visibility from the extension host (updates fieldVisibility
    // when the round-trip completes, confirming the embedded value).
    this.sendMessage("getFieldVisibility");

    this.sendMessage("getRecentTags");

    window.addEventListener("message", this.handleSaveAdrMessage);
  },
  beforeUnmount() {
    window.removeEventListener("message", this.handleSaveAdrMessage);
  },
  methods: {
    /**
     * Saves the values of the MADR template in the view component's data variables.
     * @param fields The values of the ADR fields
     */
    getInput(fields: {
      yaml: string;
      title: string;
      date: string;
      status: string;
      deciders: string;
      technicalStory: string;
      contextAndProblemStatement: string;
      decisionDrivers: string[];
      consideredOptions: {
        title: string;
        description: string;
        pros: string[];
        neutrals?: string[];
        cons: string[];
      }[];
      decisionOutcome: {
        chosenOption: string;
        explanation: string;
        positiveConsequences: string[];
        negativeConsequences: string[];
      };
      links: string[];
      relevantFiles?: string[];
      decisionMakers?: string;
      consulted?: string;
      informed?: string;
      consequences?: { kind: string; text: string }[];
      confirmation?: string;
      moreInformation?: string;
      templateVersion?: string;
      tags?: Tag[];
      fullPath: string;
    }) {
      this.yaml = fields.yaml;
      this.title = fields.title;
      this.oldTitle = fields.title;
      this.date = fields.date;
      this.status = fields.status;
      this.deciders = fields.deciders;
      this.technicalStory = fields.technicalStory;
      this.contextAndProblemStatement = fields.contextAndProblemStatement;
      this.decisionDrivers = fields.decisionDrivers;
      this.consideredOptions = fields.consideredOptions.map((option) => ({ neutrals: [], ...option }));
      this.decisionOutcome = fields.decisionOutcome;
      this.links = fields.links;
      this.relevantFiles = fields.relevantFiles ?? [];
      this.decisionMakers = fields.decisionMakers ?? "";
      this.consulted = fields.consulted ?? "";
      this.informed = fields.informed ?? "";
      this.consequences = fields.consequences ?? [];
      this.confirmation = fields.confirmation ?? "";
      this.moreInformation = fields.moreInformation ?? "";
      if (fields.templateVersion) {
        this.templateVersion = fields.templateVersion;
      }
      if (fields.tags) {
        this.tags = fields.tags;
      }
      this.fullPath = fields.fullPath;
    },
    /**
     * Sets the validated flag to true if the template has been filled out properly, thus enabling the
     * "Create/Save ADR" button.
     */
    enableButton() {
      this.validated = true;
    },
    /**
     * Sets the validated flag to false if the template has not been filled out properly, thus disabling the
     * "Create/Save ADR" button.
     */
    disableButton() {
      this.validated = false;
    },
    /**
     * Toggles a single field's visibility, then persists the full map to globalState via the extension host.
     */
    setFieldVisibility(key: string, value: boolean) {
      (this.fieldVisibility as Record<string, boolean>)[key] = value;
      // Spread into a plain object — Vue 3's reactive proxy fails to serialize
      // when passed directly to vscode.postMessage (structured-clone can't handle it).
      this.sendMessage("updateFieldVisibility", { ...this.fieldVisibility });
    },
    /**
     * Builds a field payload with hidden fields cleared, mirroring applyFieldVisibilityFilter from core.
     * Operating inline here avoids importing ArchitecturalDecisionRecord into the webview bundle.
     */
    _filteredProfessionalPayload() {
      const fv = this.fieldVisibility;
      return {
        yaml: this.yaml,
        title: this.title,
        date: fv.date ? this.date : "",
        status: fv.status ? this.status : "",
        deciders: fv.deciders ? this.deciders : "",
        technicalStory: fv.technicalStory ? this.technicalStory : "",
        contextAndProblemStatement: this.contextAndProblemStatement,
        decisionDrivers: fv.decisionDrivers ? this.decisionDrivers : [],
        consideredOptions: this.consideredOptions.map((opt) => ({
          ...opt,
          description: fv.optionDescription ? opt.description : "",
          pros: fv.optionProsAndCons ? opt.pros : [],
          neutrals: fv.optionProsAndCons ? opt.neutrals : [],
          cons: fv.optionProsAndCons ? opt.cons : []
        })),
        decisionOutcome: {
          chosenOption: this.decisionOutcome.chosenOption,
          explanation: this.decisionOutcome.explanation,
          positiveConsequences: fv.positiveConsequences ? this.decisionOutcome.positiveConsequences : [],
          negativeConsequences: fv.negativeConsequences ? this.decisionOutcome.negativeConsequences : []
        },
        links: fv.links ? this.links.filter((link) => link) : [],
        relevantFiles: fv.relevantFiles ? this.relevantFiles.filter((file) => file) : [],
        decisionMakers: fv.deciders ? this.decisionMakers : "",
        consulted: fv.consulted ? this.consulted : "",
        informed: fv.informed ? this.informed : "",
        consequences: fv.consequences ? this.consequences : [],
        confirmation: fv.confirmation ? this.confirmation : "",
        moreInformation: fv.moreInformation ? this.moreInformation : "",
        templateVersion: this.templateVersion
      };
    },
    /**
     * Updates the MRU recent-tags list and persists it to the extension host's globalState.
     * Spread each tag to a plain object so Vue 3's Proxy does not break structured clone.
     */
    updateRecentTags(tags: Tag[]) {
      this.recentTags = tags;
      this.sendMessage(
        "updateRecentTags",
        tags.map((t) => ({ ...t }))
      );
    },
    /**
     * Sends a message to the extension to create and save the ADR as a Markdown file
     * in the ADR directory.
     */
    createAdr(type: string) {
      if (type === "createBasicAdr") {
        this.sendMessage(
          type,
          JSON.stringify({
            yaml: this.yaml,
            title: this.title,
            contextAndProblemStatement: this.contextAndProblemStatement,
            consideredOptions: this.consideredOptions,
            chosenOption: this.decisionOutcome.chosenOption,
            explanation: this.decisionOutcome.explanation,
            templateVersion: this.templateVersion,
            tags: this.tags.map((t: Tag) => ({ ...t }))
          })
        );
      } else {
        this.sendMessage(
          type,
          JSON.stringify({
            ...this._filteredProfessionalPayload(),
            tags: this.tags.map((t: Tag) => ({ ...t }))
          })
        );
      }
    },
    /**
     * Sends a message to the extension to save an existing ADR as a Markdown file.
     */
    saveAdr() {
      const payload = this._filteredProfessionalPayload();
      this.sendMessage(
        "saveAdr",
        JSON.stringify({
          adr: {
            ...payload,
            status: this.templateVersion === "4.0.0" ? payload.status : naturalCase2titleCase(payload.status),
            oldTitle: this.oldTitle,
            fullPath: this.fullPath,
            tags: this.tags.map((t: Tag) => ({ ...t }))
          }
        })
      );
    },
    /**
     * Sends a message to the extension to open the ADR in the text editor.
     */
    openEditor() {
      this.sendMessage("requestEdit", { fullPath: this.fullPath });
    },
    handleSaveAdrMessage(event: MessageEvent) {
      const message = event.data;
      switch (message.command) {
        case "fetchAdrValues": {
          this.getInput(JSON.parse(message.adr));
          break;
        }
        case "saveSuccessful": {
          this.fullPath = message.newPath;
          break;
        }
        case "updateFileStatus": {
          this.sendMessage("updateFileStatus", { fullPath: this.fullPath });
          break;
        }
        case "fieldVisibility": {
          this.fieldVisibility = message.fieldVisibility;
          break;
        }
        case "recentTags": {
          this.recentTags = message.recentTags ?? [];
          break;
        }
      }
    }
  }
});
