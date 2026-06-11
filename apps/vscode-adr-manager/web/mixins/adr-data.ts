// Vue mixin which holds all the data used by a MADR template component
import { defineComponent } from "vue";
import { createShortTitle } from "../../src/plugins/utils";
import vscodeApiMixin from "./vscode-api-mixin";

// Typed by hand because the .vue imports only yield generic component types (see shims-vue.d.ts).
type FieldValidation = { $error: boolean };
type SectionRefs = {
  title: { v$: { title: FieldValidation } };
  contextAndProblemStatement: { v$: { contextAndProblemStatement: FieldValidation } };
  consideredOptions: { v$: { consideredOptions: FieldValidation } };
  decisionOutcome: { v$: { decisionOutcome: { chosenOption: FieldValidation; explanation: FieldValidation } } };
};

export default defineComponent({
  mixins: [vscodeApiMixin],
  props: {
    templateVersion: {
      type: String,
      default: "2.1.2"
    }
  },
  data() {
    return {
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
      fullPath: "",
      selectedIndex: -1,
      valid: {
        title: false,
        contextAndProblemStatement: false,
        consideredOptions: false,
        chosenOption: false,
        explanation: false
      },
      // key to re-render components upon receiving values of an existing ADR
      dataFetched: false
    };
  },
  computed: {
    /**
     * The file name of the ADR being edited, empty when adding a new ADR.
     */
    fileName(): string {
      return this.fullPath.split("/").pop() ?? "";
    }
  },
  watch: {
    /**
     * Deciders and decision-makers name the same people, so switching the template
     * version carries the populated one over to the other template's field.
     */
    templateVersion(version: string) {
      if (version === "4.0.0" && this.decisionMakers === "" && this.deciders !== "") {
        this.decisionMakers = this.deciders;
      }
      if (version === "2.1.2" && this.deciders === "" && this.decisionMakers !== "") {
        this.deciders = this.decisionMakers;
      }
      this.sendInput();
    }
  },
  mounted() {
    window.addEventListener("message", (event) => {
      const message = event.data;
      switch (message.command) {
        case "addOption": {
          this.consideredOptions.push({ title: message.option, description: "", pros: [], neutrals: [], cons: [] });
          if (this.consideredOptions.length === 1) {
            this.selectOption(0);
          }
          this.validate("consideredOptions");
          this.validate("chosenOption");
          break;
        }
        case "fetchAdrValues": {
          this.fillFields(JSON.parse(message.adr));
          break;
        }
        case "saveSuccessful": {
          this.fullPath = message.newPath;
          break;
        }
      }
    });
  },
  methods: {
    /**
     * Fills the fields with the existing values of the ADR.
     */
    fillFields(adr: {
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
      fullPath: string;
    }) {
      this.yaml = adr.yaml;
      this.title = adr.title;
      this.date = adr.date;
      this.status = adr.status;
      this.deciders = adr.deciders;
      this.technicalStory = adr.technicalStory;
      this.contextAndProblemStatement = adr.contextAndProblemStatement;
      this.decisionDrivers = adr.decisionDrivers.filter((driver) => driver !== "");
      this.consideredOptions = adr.consideredOptions.map((option) => {
        return {
          title: option.title,
          description: option.description,
          pros: option.pros.filter((pro) => pro !== ""),
          neutrals: (option.neutrals ?? []).filter((neutral) => neutral !== ""),
          cons: option.cons.filter((con) => con !== "")
        };
      });
      this.decisionOutcome = {
        chosenOption: adr.decisionOutcome.chosenOption,
        explanation: adr.decisionOutcome.explanation,
        positiveConsequences: adr.decisionOutcome.positiveConsequences.filter((positive) => positive !== ""),
        negativeConsequences: adr.decisionOutcome.negativeConsequences.filter((negative) => negative !== "")
      };
      this.links = adr.links.filter((link) => link !== "");
      this.decisionMakers = adr.decisionMakers ?? "";
      this.consulted = adr.consulted ?? "";
      this.informed = adr.informed ?? "";
      this.consequences = (adr.consequences ?? []).filter((consequence) => consequence.text !== "");
      this.confirmation = adr.confirmation ?? "";
      this.moreInformation = adr.moreInformation ?? "";
      this.fullPath = adr.fullPath;
      this.selectOption(
        this.consideredOptions.findIndex((option) => {
          return createShortTitle(option.title) === createShortTitle(this.decisionOutcome.chosenOption);
        })
      );
      this.dataFetched = true;
      this.validateAll();
    },
    /**
     * Handles the selection of options using clicks and validates that an option has been chosen.
     * @param index The index of the clicked option
     */
    selectOption(index: number) {
      this.selectedIndex = index;
      this.decisionOutcome.chosenOption = this.consideredOptions[index]?.title ?? "";
      this.validate("consideredOptions");
      this.validate("chosenOption");
    },
    /**
     * Updates the selected option after an option has been deleted from the list of considered
     * options.
     * @param originalIndex The original index of the deleted option (before deletion)
     */
    selectOptionAfterDeletion(originalIndex: number) {
      // check if selected option has been deleted
      if (originalIndex === this.selectedIndex) {
        // unselect any option such that the user has to actively select a new option
        this.selectOption(-1);
      } else if (originalIndex < this.selectedIndex) {
        // shift selected index by -1 if the deleted option came before the selected option
        this.selectOption(this.selectedIndex - 1);
      }
    },
    /**
     * Re-selects the correct option after dragging to prevent inconsistencies.
     * @param evt The event object
     */
    checkSelection(evt: { newIndex: number }) {
      // check if the dragged option is the chosen option
      if (this.decisionOutcome.chosenOption === this.consideredOptions[evt.newIndex]?.title) {
        this.selectOption(evt.newIndex);
      } else {
        const correctIndex = this.consideredOptions.findIndex(
          (option) => option.title === this.decisionOutcome.chosenOption
        );
        this.selectOption(correctIndex);
      }
    },
    /**
     * Removes the considered option with the specified index from the list of considered options
     * and selects another option in the list of considered options.
     * @param index The index of the option to be deleted
     */
    deleteOption(index: number) {
      this.consideredOptions.splice(index, 1);
      this.selectOptionAfterDeletion(index);
    },
    /**
     * Sends a message to the extension to ask the user for a title when adding a new option.
     */
    addOption() {
      this.sendMessage("addOption");
    },
    /**
     * Sends a message to the extension to prompt the user to enter a new name for the option.
     * @param option The option to edit
     */
    editOption(option: { title: string; index: number }) {
      this.sendMessage("requestBasicOptionEdit", { currentTitle: option.title, index: option.index });
    },
    /**
     * Validates every required field of the ADR.
     */
    validateAll() {
      this.validate("title");
      this.validate("contextAndProblemStatement");
      this.validate("consideredOptions");
      this.validate("chosenOption");
      this.validate("explanation");
    },
    /**
     * Validates a specified field of the ADR and sets a flag for each field.
     * The user can click on the "Create ADR" button iff all fields are valid,
     * i.e. iff all properties of this.valid have the value true.
     * @param field The ADR field to be validated
     */
    validate(field: string) {
      const refs = this.$refs as SectionRefs;
      switch (field) {
        case "title":
          this.valid.title = !refs.title.v$.title.$error && this.title !== "";
          break;
        case "contextAndProblemStatement":
          this.valid.contextAndProblemStatement =
            !refs.contextAndProblemStatement.v$.contextAndProblemStatement.$error &&
            this.contextAndProblemStatement !== "";
          break;
        case "consideredOptions":
          this.valid.consideredOptions =
            !refs.consideredOptions.v$.consideredOptions.$error && this.consideredOptions.length > 0;
          break;
        case "chosenOption":
          this.valid.chosenOption =
            !refs.decisionOutcome.v$.decisionOutcome.chosenOption.$error &&
            this.consideredOptions[this.selectedIndex]?.title === this.decisionOutcome.chosenOption &&
            this.decisionOutcome.chosenOption !== "";
          break;
        case "explanation":
          this.valid.explanation =
            !refs.decisionOutcome.v$.decisionOutcome.explanation.$error && this.decisionOutcome.explanation !== "";
          break;
      }
      this.sendInput();
    },
    /**
     * Sends the ADR data from the template component to the view component.
     * If all required fields of the template have been filled out, the "Create/Edit ADR" button
     * will be enabled.
     */
    sendInput() {
      this.$emit("sendInput", {
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
        links: this.links,
        decisionMakers: this.decisionMakers,
        consulted: this.consulted,
        informed: this.informed,
        consequences: this.consequences,
        confirmation: this.confirmation,
        moreInformation: this.moreInformation,
        fullPath: this.fullPath
      });
      if (Object.values(this.valid).every((value) => value)) {
        this.$emit("validated");
      } else {
        this.$emit("invalidated");
      }
    }
  }
});
