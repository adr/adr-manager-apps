# ADR Manager for VS Code

Create, edit, search, and validate Architectural Decision Records (ADRs) without leaving Visual Studio Code. ADR Manager stores decisions as Markdown and supports [MADR](https://adr.github.io/madr/) 2.1.2 and 4.0.0.

## Features

- Create and edit ADRs with basic or professional structured editors.
- Switch between MADR 2.1.2 and 4.0.0 while editing.
- Search ADRs by title and filter them by status or tag.
- Add tags and link decisions to relevant workspace files.
- Choose which optional MADR fields are visible without discarding their content.
- Reorder considered options and consequences.
- Convert nonconforming Markdown into a valid ADR before saving it.
- Open ADRs from the Command Palette or Explorer context menu.
- Validate numbered MADR files with diagnostics and title-case quick fixes.
- Insert basic and professional MADR snippets in Markdown files.
- Use the built-in tour to learn the overview and editor.
- Delete ADRs safely by moving their Markdown files to the system trash.

## Quick Start

1. Install [ADR Manager for VS Code](https://marketplace.visualstudio.com/items?itemName=adr-org.adr-manager-vscode).
2. Open a folder or workspace in VS Code.
3. Run `ADR Manager: Open ADR Manager` from the Command Palette.
4. Use `ADR Manager: Initialize ADR Directory` if the workspace does not have an ADR directory yet, or create an ADR and let the extension create the directory when needed.

The default ADR directory is `docs/decisions`. Change it with the `adrManager.adrDirectory` setting or the `ADR Manager: Change ADR Directory` command.

## Workspace and File Handling

ADR Manager supports normal single-root workspaces and multi-root workspaces. By default, a single workspace folder that contains only subfolders is treated like a collection of workspace roots. Disable this with `adrManager.treatSingleRootAsMultiRoot` when that behavior is not useful.

The overview scans Markdown files directly inside the configured ADR directory of each workspace root. It excludes the scaffolded `README.md` and `adr-template.md` files. Files do not need a four-digit MADR number to appear in the overview.

Conforming ADRs open in the structured editor. Other Markdown files open in a conversion view so their content can be reviewed and converted safely. Conversion does not overwrite the file until the converted ADR is saved. The `Open ADR Manager on This File` command and Explorer context menu can also open Markdown files outside the configured ADR directory.

New ADRs are saved as numbered Markdown files. Renaming an ADR title updates its filename while preserving an existing four-digit number prefix.

## Commands

| Command                                      | Purpose                                                   |
| -------------------------------------------- | --------------------------------------------------------- |
| `ADR Manager: Open ADR Manager`              | Open the ADR overview for the current workspace.          |
| `ADR Manager: Add New ADR`                   | Create an ADR with the configured editor mode.            |
| `ADR Manager: Initialize ADR Directory`      | Create the configured ADR directory and starter files.    |
| `ADR Manager: Change ADR Directory`          | Change the ADR directory relative to each workspace root. |
| `ADR Manager: Show Tour`                     | Replay the guided overview and editor tour.               |
| `ADR Manager: Open ADR Manager on This File` | Open or convert the selected Markdown file.               |

## Settings

| Setting                                   | Default          | Purpose                                                                                                      |
| ----------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `adrManager.adrDirectory`                 | `docs/decisions` | ADR directory relative to each workspace root. Use `.` for the workspace root itself.                        |
| `adrManager.editorMode.addAdrEditorMode`  | `basic`          | Choose `basic` or `professional` when creating an ADR.                                                       |
| `adrManager.editorMode.viewAdrEditorMode` | `sufficient`     | Choose `basic`, `professional`, or `sufficient`. `sufficient` selects the editor based on the ADR's content. |
| `adrManager.showDiagnostics`              | `true`           | Show MADR diagnostics in the Markdown editor.                                                                |
| `adrManager.treatSingleRootAsMultiRoot`   | `true`           | Treat a single folder containing only subfolders like a multi-root workspace.                                |

## Diagnostics and Snippets

Diagnostics apply to Markdown files with a numbered MADR-style filename such as `0001-use-markdown.md`. They report missing or empty required sections, headings that are not in title case, and a chosen option that is not listed among the considered options.

The extension provides two Markdown snippets:

- `basic-madr` inserts the required MADR fields.
- `professional-madr` inserts the complete MADR template.

## Support and Development

Report bugs and request features in the [adr-manager-apps issue tracker](https://github.com/adr/adr-manager-apps/issues).

The extension is developed in the [adr-manager-apps monorepo](https://github.com/adr/adr-manager-apps) and shares its parser and ADR domain model with the web app through [`@adr-manager/core`](https://github.com/adr/adr-manager-apps/tree/main/packages/core).

Run these commands from the repository root:

```bash
pnpm watch:ext
pnpm test:ext
pnpm build:ext
pnpm vsix
```

To debug the extension, open `apps/vscode-adr-manager` in VS Code and press `F5`. Maintainers can follow the [VS Code Marketplace Release Guide](https://github.com/adr/adr-manager-apps/blob/main/docs/vscode-marketplace-release.md) when publishing a new version.

## License and Acknowledgements

The extension is licensed under the [MIT License](https://github.com/adr/adr-manager-apps/blob/main/apps/vscode-adr-manager/LICENSE).

The VS Code extension was originally created by Steven Chen as part of a Bachelor thesis at the University of Stuttgart. It is now maintained alongside the web-based ADR Manager in the adr-manager-apps monorepo.
