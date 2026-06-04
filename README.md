# ADR Manager Apps

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

ADR Manager Apps is the monorepo for the web-based ADR Manager and the ADR Manager VS Code extension.
Both packages help teams create, edit, validate, and manage Architecture Decision Records written in Markdown with the [MADR](https://adr.github.io/madr/) template.

The repository is maintained as a pnpm workspace so both packages can be developed, tested, built, versioned, and released together.

## Packages

| Package | Path | Description |
| --- | --- | --- |
| `adr-manager` | `packages/adr-manager` | Vue 2 and Vite web app for managing MADRs in GitHub repositories |
| `vscode-adr-manager` | `packages/vscode-adr-manager` | VS Code extension for managing MADRs inside local workspaces |

Read the package README files for package-specific usage details:

- [Web app README](packages/adr-manager/README.md)
- [VS Code extension README](packages/vscode-adr-manager/README.md)

## Features

- Manage ADRs that follow the MADR Markdown format
- Create, edit, delete, and push ADR changes through the web app
- Work with ADRs from single-root, multi-root, and folder-based VS Code workspaces
- Use VS Code commands, context menu entries, snippets, diagnostics, and webviews for ADR workflows
- Build and release both packages from one workspace

## Prerequisites

Install these tools before working on the repository:

- [Node.js](https://nodejs.org/) version 18 or newer
- [pnpm](https://pnpm.io/) version 10.33.0
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/) when developing or testing the extension

The workspace uses pnpm with a hoisted `node_modules` layout because the legacy Vue and VS Code packaging toolchains expect flat dependency resolution.
The relevant settings are stored in `.npmrc` and `pnpm-workspace.yaml`.

## Getting Started

Clone the repository and install dependencies from the workspace root.

```bash
git clone git@github.com:adr/adr-manager-apps.git
cd adr-manager-apps
pnpm install
```

If pnpm reports blocked dependency build scripts, run:

```bash
pnpm approve-builds
```

The workspace currently allows the build scripts needed by `esbuild`, `cypress`, and `core-js`.

## Run The Web App

Start the web app development server from the workspace root:

```bash
pnpm dev:web
```

The Vite server runs on:

```text
http://localhost:8000
```

The main manager route is:

```text
http://localhost:8000/adr-manager-apps/#/manager
```

The web app connects to GitHub and stores the active OAuth `authId` and local ADR changes in browser local storage.
You need a GitHub account with access to a repository that contains MADRs, normally under `docs/adr`.

## Run The VS Code Extension

Start the extension watcher from the workspace root:

```bash
pnpm watch:ext
```

This runs the extension bundle watcher and the webview bundle watcher in parallel.
It writes generated files to `packages/vscode-adr-manager/dist`.

For local extension development in VS Code:

1. Open this repository in VS Code.
2. Run `pnpm watch:ext` in a terminal.
3. Start the extension host from VS Code with the extension development launch configuration if one is available.
4. Open a workspace folder that contains an ADR directory such as `docs/decisions`.
5. Run `Open ADR Manager` from the Command Palette.

The extension defaults to `docs/decisions` for the ADR directory.
You can change this with the `adrManager.adrDirectory` setting or the `Change ADR Directory` command.

## Build

Build every package:

```bash
pnpm build
```

Build only the web app:

```bash
pnpm build:web
```

The web app production build is written to:

```text
packages/adr-manager/dist
```

Build only the VS Code extension:

```bash
pnpm build:ext
```

The extension build is written to:

```text
packages/vscode-adr-manager/dist
```

Package the VS Code extension as a VSIX file:

```bash
pnpm vsix
```

The VSIX file is written to:

```text
packages/vscode-adr-manager/vscode-adr-manager-<version>.vsix
```

Install a generated VSIX into VS Code with:

```bash
code --install-extension packages/vscode-adr-manager/vscode-adr-manager-<version>.vsix
```

Replace `<version>` with the version from `packages/vscode-adr-manager/package.json`.

## Test

Run all tests:

```bash
pnpm test
```

Run web app unit tests:

```bash
pnpm test:web
```

Run extension tests:

```bash
pnpm test:ext
```

Run extension linting:

```bash
pnpm lint:ext
```

Run web app end-to-end tests:

```bash
pnpm e2e:web
```

The end-to-end tests use Cypress.
They need the web app to be running and require a valid GitHub OAuth session.
Provide the session data with environment variables:

```bash
CYPRESS_OAUTH_E2E_AUTH_ID=<auth-id> CYPRESS_USER=<github-user> pnpm e2e:web
```

You can also create `packages/adr-manager/cypress.env.json`:

```json
{
  "OAUTH_E2E_AUTH_ID": "<auth-id>",
  "USER": "<github-user>"
}
```

To get a local `authId`, sign in through the running web app, open browser developer tools, and inspect local storage for `http://localhost:8000`.

## Useful Commands

| Command | Description |
| --- | --- |
| `pnpm install` | Install workspace dependencies |
| `pnpm dev:web` | Start the web app development server |
| `pnpm watch:ext` | Watch and rebuild the VS Code extension |
| `pnpm build` | Build all packages |
| `pnpm build:web` | Build only the web app |
| `pnpm build:ext` | Build only the VS Code extension |
| `pnpm vsix` | Package the VS Code extension as a VSIX |
| `pnpm test` | Run all package tests |
| `pnpm test:web` | Run web app unit tests |
| `pnpm test:ext` | Run extension tests |
| `pnpm e2e:web` | Run web app Cypress tests |
| `pnpm lint:ext` | Run extension linting |
| `pnpm format` | Format the web app package |
| `pnpm changeset` | Create a changeset for a release |
| `pnpm version-packages` | Apply changeset versions |

## Repository Structure

```text
.
|-- package.json
|-- pnpm-lock.yaml
|-- pnpm-workspace.yaml
|-- packages
|   |-- adr-manager
|   `-- vscode-adr-manager
`-- README.md
```

Important package directories:

- `packages/adr-manager/src` contains the web app source.
- `packages/adr-manager/tests` contains web app unit tests.
- `packages/adr-manager/cypress` contains web app Cypress tests.
- `packages/vscode-adr-manager/src` contains the extension source.
- `packages/vscode-adr-manager/web` contains the extension webview source.
- `packages/vscode-adr-manager/src/test` contains extension tests.

## Development Notes

- Use pnpm from the workspace root for normal development.
- Keep package-specific commands inside package scripts so root commands stay stable.
- Do not commit generated `dist`, Cypress artifact, coverage, or VSIX files.
- The web app Vite config uses `/adr-manager-apps/` as the production base path.
- The extension package command runs webpack for the extension host and Rollup for the webviews.
- Some test runs on newer Node versions may print a `punycode` deprecation warning from dependencies.

## Contributing

Contributions are welcome.
Before opening a pull request:

1. Create an issue or comment on an existing issue when the change affects behavior or public workflows.
2. Keep changes focused and describe the user-facing effect.
3. Add or update tests when changing behavior.
4. Run the relevant checks from the workspace root.
5. Add a changeset with `pnpm changeset` when the change should be released.

For a full validation pass, run:

```bash
pnpm build
pnpm test
```

If the extension package is affected, also run:

```bash
pnpm vsix
```

## Reporting Issues

Open a GitHub issue with:

- The package that is affected
- Your operating system
- Your Node.js and pnpm versions
- Steps to reproduce the issue
- Expected and actual behavior
- Screenshots or logs when they help explain the problem

Do not include private GitHub tokens, OAuth session values, or repository secrets in issues.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
