# Changelog

## 0.0.1

### Patch Changes

- Initial release under the adr-org publisher as adr-org.adr-manager-vscode, continuing the work previously published as StevenChen.vscode-adr-manager.
- 2098a7d: Modernize the extension build and trim dependencies. The extension host is now bundled with esbuild and the webviews with Vite, replacing webpack and rollup. lodash was replaced by the native String.padStart. The codicon font is now shipped inside the extension bundle, fixing webview icons that were broken in the packaged extension because it loaded them from node_modules.

Development history before this listing (versions 0.0.1 to 0.1.8) shipped as [StevenChen.vscode-adr-manager](https://marketplace.visualstudio.com/items?itemName=StevenChen.vscode-adr-manager).
