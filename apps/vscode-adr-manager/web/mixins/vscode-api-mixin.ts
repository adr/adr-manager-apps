import { defineComponent } from "vue";

// The VS Code API is acquired once in the webview HTML (see WebPanel) under the constant "vscode"
declare const vscode: { postMessage(message: { command: string; data?: unknown }): void };

export default defineComponent({
  methods: {
    sendMessage(command: string, data?: unknown) {
      vscode.postMessage({
        command: command,
        data: data
      });
    }
  }
});
