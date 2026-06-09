---
"vscode-adr-manager": patch
---

Modernize the extension build and trim dependencies. The extension host is now bundled with esbuild and the webviews with Vite, replacing webpack and rollup. lodash was replaced by the native String.padStart. The codicon font is now shipped inside the extension bundle, fixing webview icons that were broken in the packaged extension because it loaded them from node_modules.
