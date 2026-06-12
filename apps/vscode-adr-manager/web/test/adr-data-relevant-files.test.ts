// @vitest-environment jsdom
/**
 * Tests for the relevant-files message round trip in the adr-data mixin:
 * picker request, picked response, existence checks, and removal.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import adrDataMixin from "../mixins/adr-data";
import vscodeApiMixin from "../mixins/vscode-api-mixin";

const postMessage = vi.fn();
vi.stubGlobal("vscode", { postMessage });

// validate() reads section refs that only exist in the real template, so the host
// renders one stub per section ref exposing the validation shape it dereferences.
const SectionStub = defineComponent({
  template: "<div></div>",
  data() {
    return {
      v$: {
        title: { $error: false },
        contextAndProblemStatement: { $error: false },
        consideredOptions: { $error: false },
        decisionOutcome: { chosenOption: { $error: false }, explanation: { $error: false } }
      }
    };
  }
});

const TestComponent = defineComponent({
  components: { SectionStub },
  mixins: [vscodeApiMixin, adrDataMixin],
  template: `<div>
    <SectionStub ref="title" />
    <SectionStub ref="contextAndProblemStatement" />
    <SectionStub ref="consideredOptions" />
    <SectionStub ref="decisionOutcome" />
  </div>`
});

/** Dispatch a message that looks like it came from the extension host */
function dispatchExtensionMessage(data: Record<string, unknown>) {
  window.dispatchEvent(new MessageEvent("message", { data }));
}

const adrPayload = JSON.stringify({
  yaml: "",
  title: "Sample ADR",
  date: "",
  status: "",
  deciders: "",
  technicalStory: "",
  contextAndProblemStatement: "",
  decisionDrivers: [],
  consideredOptions: [],
  decisionOutcome: { chosenOption: "", explanation: "", positiveConsequences: [], negativeConsequences: [] },
  links: [],
  relevantFiles: ["src/a.ts", ""],
  decisionMakers: "",
  consulted: "",
  informed: "",
  consequences: [],
  confirmation: "",
  moreInformation: "",
  fullPath: "/ws/docs/decisions/0001-sample.md"
});

describe("adr-data mixin – relevant files", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    postMessage.mockClear();
    wrapper = mount(TestComponent);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it("pickRelevantFiles asks the host for the picker with the current selection", () => {
    const vm = wrapper.vm as any;
    vm.relevantFiles = ["src/a.ts"];
    vm.fullPath = "/ws/docs/decisions/0001-sample.md";
    vm.pickRelevantFiles();
    expect(postMessage).toHaveBeenCalledWith({
      command: "pickRelevantFiles",
      data: { currentFiles: ["src/a.ts"], fullPath: "/ws/docs/decisions/0001-sample.md" }
    });
  });

  it("relevantFilesPicked applies the selection and triggers an existence check", async () => {
    const vm = wrapper.vm as any;
    vm.fullPath = "/ws/docs/decisions/0001-sample.md";
    postMessage.mockClear();
    dispatchExtensionMessage({ command: "relevantFilesPicked", relevantFiles: ["src/a.ts", "src/b.ts"] });
    await vm.$nextTick();
    expect(vm.relevantFiles).toEqual(["src/a.ts", "src/b.ts"]);
    expect(postMessage).toHaveBeenCalledWith({
      command: "checkRelevantFiles",
      data: { paths: ["src/a.ts", "src/b.ts"], fullPath: "/ws/docs/decisions/0001-sample.md" }
    });
  });

  it("relevantFilesStatus updates the per-file existence map", async () => {
    const vm = wrapper.vm as any;
    dispatchExtensionMessage({ command: "relevantFilesStatus", status: { "src/a.ts": false } });
    await vm.$nextTick();
    expect(vm.relevantFilesStatus).toEqual({ "src/a.ts": false });
  });

  it("openRelevantFile asks the host to open the file", () => {
    const vm = wrapper.vm as any;
    vm.fullPath = "/ws/docs/decisions/0001-sample.md";
    vm.openRelevantFile("src/a.ts");
    expect(postMessage).toHaveBeenCalledWith({
      command: "openRelevantFile",
      data: { path: "src/a.ts", fullPath: "/ws/docs/decisions/0001-sample.md" }
    });
  });

  it("removeRelevantFile splices the entry and reports the input upwards", () => {
    const vm = wrapper.vm as any;
    vm.relevantFiles = ["src/a.ts", "src/b.ts"];
    vm.removeRelevantFile(0);
    expect(vm.relevantFiles).toEqual(["src/b.ts"]);
    const emitted = wrapper.emitted("sendInput");
    expect(emitted!.at(-1)![0]).toMatchObject({ relevantFiles: ["src/b.ts"] });
  });

  it("checkRelevantFiles with no linked files clears the status without a host round trip", () => {
    const vm = wrapper.vm as any;
    vm.relevantFiles = [];
    vm.relevantFilesStatus = { "src/a.ts": false };
    postMessage.mockClear();
    vm.checkRelevantFiles();
    expect(vm.relevantFilesStatus).toEqual({});
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("fetchAdrValues fills relevant files (dropping empties) and checks their existence", async () => {
    const vm = wrapper.vm as any;
    postMessage.mockClear();
    dispatchExtensionMessage({ command: "fetchAdrValues", adr: adrPayload });
    await vm.$nextTick();
    expect(vm.relevantFiles).toEqual(["src/a.ts"]);
    expect(postMessage).toHaveBeenCalledWith({
      command: "checkRelevantFiles",
      data: { paths: ["src/a.ts"], fullPath: "/ws/docs/decisions/0001-sample.md" }
    });
    const emitted = wrapper.emitted("sendInput");
    expect(emitted!.at(-1)![0]).toMatchObject({ relevantFiles: ["src/a.ts"] });
  });
});
