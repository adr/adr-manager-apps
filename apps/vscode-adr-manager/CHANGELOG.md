# Changelog

All notable changes to this extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Development history before this listing (versions 0.0.1 to 0.1.8) shipped as [StevenChen.vscode-adr-manager](https://marketplace.visualstudio.com/items?itemName=StevenChen.vscode-adr-manager).

## [Unreleased]

## [0.1.0] - 2026-11-09

### Changed

- The changelog now follows Keep a Changelog. There are no functional changes since 0.0.2.

## [0.0.2] - 2026-07-14

### Changed

- Refresh the VS Code Marketplace metadata and overview, and document the manual Microsoft Entra release process.

## [0.0.1] - 2026-07-13

### Added

- Initial release under the adr-org publisher as adr-org.adr-manager-vscode, continuing the work previously published as StevenChen.vscode-adr-manager.

### Changed

- Modernize the extension build and trim dependencies. The extension host is now bundled with esbuild and the webviews with Vite, replacing webpack and rollup. lodash was replaced by the native String.padStart.

### Fixed

- Ship the codicon font inside the extension bundle, fixing webview icons that were broken in the packaged extension because it loaded them from node_modules.

[Unreleased]: https://github.com/adr/adr-manager-apps/compare/vscode-v0.1.0...HEAD
[0.1.0]: https://github.com/adr/adr-manager-apps/compare/vscode-v0.0.2...vscode-v0.1.0
[0.0.2]: https://github.com/adr/adr-manager-apps/compare/vscode-v0.0.1...vscode-v0.0.2
[0.0.1]: https://github.com/adr/adr-manager-apps/releases/tag/vscode-v0.0.1
