// Vue mixin which holds all the data used by the webview to save a new/edited ADR
import { defineComponent } from "vue";
import { naturalCase2titleCase } from "../../src/plugins/utils";
import vscodeApiMixin from "./vscode-api-mixin";

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
      decisionMakers: "",
      consulted: "",
      informed: "",
      consequences: [] as { kind: string; text: string }[],
      confirmation: "",
      moreInformation: "",
      templateVersion: "2.1.2",
      fullPath: ""
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
    window.addEventListener("message", (event) => {
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
      }
    });
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
      decisionMakers?: string;
      consulted?: string;
      informed?: string;
      consequences?: { kind: string; text: string }[];
      confirmation?: string;
      moreInformation?: string;
      templateVersion?: string;
      fullPath: string;
    }) {
      this.yaml = fields.yaml;
      this.title = fields.title;
      this.date = fields.date;
      this.status = fields.status;
      this.deciders = fields.deciders;
      this.technicalStory = fields.technicalStory;
      this.contextAndProblemStatement = fields.contextAndProblemStatement;
      this.decisionDrivers = fields.decisionDrivers;
      this.consideredOptions = fields.consideredOptions.map((option) => ({ neutrals: [], ...option }));
      this.decisionOutcome = fields.decisionOutcome;
      this.links = fields.links;
      this.decisionMakers = fields.decisionMakers ?? "";
      this.consulted = fields.consulted ?? "";
      this.informed = fields.informed ?? "";
      this.consequences = fields.consequences ?? [];
      this.confirmation = fields.confirmation ?? "";
      this.moreInformation = fields.moreInformation ?? "";
      if (fields.templateVersion) {
        this.templateVersion = fields.templateVersion;
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
            templateVersion: this.templateVersion
          })
        );
      } else {
        this.sendMessage(
          type,
          JSON.stringify({
            yaml: this.yaml,
            title: this.title,
            date: this.date,
            status: this.status,
            deciders: this.deciders,
            technicalStory: this.technicalStory,
            contextAndProblemStatement: this.contextAndProblemStatement,
            decisionDrivers: this.decisionDrivers,
            consideredOptions: this.consideredOptions,
            decisionOutcome: this.decisionOutcome,
            links: this.links.filter((link) => link),
            decisionMakers: this.decisionMakers,
            consulted: this.consulted,
            informed: this.informed,
            consequences: this.consequences,
            confirmation: this.confirmation,
            moreInformation: this.moreInformation,
            templateVersion: this.templateVersion
          })
        );
      }
    },
    /**
     * Sends a message to the extension to save the changes made to an existing ADR
     * in its Markdown file.
     */
    saveAdr() {
      this.sendMessage(
        "saveAdr",
        JSON.stringify({
          adr: {
            yaml: this.yaml,
            title: this.title,
            date: this.date,
            status: this.templateVersion === "4.0.0" ? this.status : naturalCase2titleCase(this.status),
            deciders: this.deciders,
            technicalStory: this.technicalStory,
            contextAndProblemStatement: this.contextAndProblemStatement,
            decisionDrivers: this.decisionDrivers,
            consideredOptions: this.consideredOptions,
            decisionOutcome: this.decisionOutcome,
            links: this.links,
            decisionMakers: this.decisionMakers,
            consulted: this.consulted,
            informed: this.informed,
            consequences: this.consequences,
            confirmation: this.confirmation,
            moreInformation: this.moreInformation,
            templateVersion: this.templateVersion,
            fullPath: this.fullPath
          }
        })
      );
    },
    /**
     * Sends a message to the extension to open the ADR in the text editor.
     */
    openEditor() {
      this.sendMessage("requestEdit", { fullPath: this.fullPath });
    }
  }
});
