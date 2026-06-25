// @vitest-environment jsdom
/**
 * Verifies the convert view's no-premature-write contract: accepting a conversion hands the
 * converted Markdown back to the host via `acceptConversion` (which re-opens the editor in
 * memory) and never triggers `saveAdr`, so the filesystem is untouched until the user saves.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ConvertView from "../views/ConvertView.vue";

const postMessage = vi.fn();
vi.stubGlobal("vscode", { postMessage });

// Stub the CodeMirror-backed child: expose a button that emits the converted Markdown.
const stubs = {
  EditorConvert: {
    name: "EditorConvert",
    props: ["raw", "templateVersion"],
    emits: ["accept"],
    template: '<button data-cy="acceptDiv" @click="$emit(\'accept\', \'CONVERTED MARKDOWN\')">accept</button>'
  }
};

function dispatchMessage(data: Record<string, unknown>) {
  window.dispatchEvent(new MessageEvent("message", { data }));
}

describe("ConvertView", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    postMessage.mockClear();
    wrapper = mount(ConvertView, { global: { stubs } });
  });

  it("requests the convert source on mount", () => {
    expect(postMessage.mock.calls.some((call) => call[0].command === "getConvertSource")).toBe(true);
  });

  it("passes the host-provided source to the convert editor", async () => {
    dispatchMessage({
      command: "fetchConvertSource",
      data: JSON.stringify({ markdown: "# raw", templateVersion: "2.1.2", fullPath: "/ws/docs/decisions/0001-x.md" })
    });
    await wrapper.vm.$nextTick();
    const editor = wrapper.findComponent({ name: "EditorConvert" });
    expect(editor.props("raw")).toBe("# raw");
    expect(editor.props("templateVersion")).toBe("2.1.2");
  });

  it("hands accepted markdown back via acceptConversion and never writes via saveAdr", async () => {
    dispatchMessage({
      command: "fetchConvertSource",
      data: JSON.stringify({ markdown: "# raw", templateVersion: "4.0.0", fullPath: "/ws/docs/decisions/0001-x.md" })
    });
    await wrapper.vm.$nextTick();

    await wrapper.find("[data-cy=acceptDiv]").trigger("click");

    expect(postMessage).toHaveBeenCalledWith({
      command: "acceptConversion",
      data: { markdown: "CONVERTED MARKDOWN", fullPath: "/ws/docs/decisions/0001-x.md" }
    });
    const commands = postMessage.mock.calls.map((call) => call[0].command);
    expect(commands).not.toContain("saveAdr");
  });
});
