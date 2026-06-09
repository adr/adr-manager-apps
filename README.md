# ADR Manager Apps

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Extension · CI](https://github.com/adr/adr-manager-apps/actions/workflows/extension-ci.yml/badge.svg)](https://github.com/adr/adr-manager-apps/actions/workflows/extension-ci.yml)
[![Web · Tests](https://github.com/adr/adr-manager-apps/actions/workflows/web-tests.yml/badge.svg)](https://github.com/adr/adr-manager-apps/actions/workflows/web-tests.yml)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/StevenChen.vscode-adr-manager?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=StevenChen.vscode-adr-manager)

ADR Manager Apps is the monorepo for the web-based **ADR Manager** and the **ADR Manager VS Code extension**.
Both apps help teams create, edit, validate, and manage Architectural Decision Records (ADRs) written in Markdown with the [MADR](https://adr.github.io/madr/) template.

- **Web app**: manage MADRs in GitHub repositories, live at <https://adr.github.io/adr-manager-apps/>
- **VS Code extension**: manage MADRs in local workspaces, on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=StevenChen.vscode-adr-manager)

The apps share a common core and tooling, and are developed, tested, versioned, and released together from one pnpm workspace.

## Packages

| Package                        | Path                                                         | Description                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adr-manager`                  | [`apps/adr-manager`](apps/adr-manager)               | Web app (Vue 3, Vuetify, Vite, TypeScript, CodeMirror 6) for managing MADRs in GitHub repositories via GitHub OAuth                                   |
| `vscode-adr-manager`           | [`apps/vscode-adr-manager`](apps/vscode-adr-manager) | VS Code extension for managing MADRs in single-root, multi-root, and folder-based workspaces, with commands, context menus, snippets, and diagnostics |
| `@adr-manager/core`            | [`packages/core`](packages/core)                             | Shared MADR parser (ANTLR4), ADR domain model, and utilities used by both apps                                                                        |
| `@adr-manager/eslint-config`   | [`packages/eslint-config`](packages/eslint-config)           | Shared ESLint flat configs (`base`, `vue`, `node`)                                                                                                    |
| `@adr-manager/prettier-config` | [`packages/prettier-config`](packages/prettier-config)       | Shared Prettier configuration                                                                                                                         |
| `@adr-manager/tsconfig`        | [`packages/tsconfig`](packages/tsconfig)                     | Shared TypeScript configs (`base`, `vue`, `node`, `commonjs`)                                                                                         |

The two apps are the deliverables. The `@adr-manager/*` packages are private workspace packages and are not published anywhere.

Package-specific usage details live in the package docs:

- [Web app README](apps/adr-manager/README.md)
- [VS Code extension README](apps/vscode-adr-manager/README.md) and [CHANGELOG](apps/vscode-adr-manager/CHANGELOG.md)

## Architecture

- `@adr-manager/core` is consumed directly as TypeScript source (its exports point at `src/index.ts`), so there is no build step and no stale artifacts between the core and the apps.
- `@adr-manager/eslint-config`, `@adr-manager/prettier-config`, and `@adr-manager/tsconfig` centralize tooling so every package extends the same rules.
- Shared dependency versions are pinned once in the `catalog:` section of [`pnpm-workspace.yaml`](pnpm-workspace.yaml) and referenced from packages with the `catalog:` protocol.
- The workspace uses pnpm's `nodeLinker: hoisted` (flat `node_modules`) because the Vue and VS Code packaging toolchains expect flat dependency resolution.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22.13
- [pnpm](https://pnpm.io/) 11.5.1, pinned via the `packageManager` field so recent pnpm versions (or `corepack enable`) switch to it automatically
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/) when developing or testing the extension

## Getting started

```bash
git clone https://github.com/adr/adr-manager-apps.git
cd adr-manager-apps
pnpm install
```

Installs are hardened in [`pnpm-workspace.yaml`](pnpm-workspace.yaml): newly published dependency versions are delayed for five days, and only reviewed build scripts (`esbuild`, `cypress`, `core-js`) are allowed to run.
If pnpm reports blocked dependency build scripts, review and approve them with `pnpm approve-builds`.

## Development

### Web app

```bash
pnpm dev:web
```

The Vite dev server runs at `http://localhost:8000/adr-manager-apps/` (the `/adr-manager-apps/` base path matches the GitHub Pages deployment).
The main manager route is `http://localhost:8000/adr-manager-apps/#/manager`.

The web app connects to GitHub through OAuth and stores the active `authId` and local ADR changes in browser local storage.
You need a GitHub account with access to a repository that contains MADRs, normally under `docs/adr`.

### VS Code extension

There are two ways to run the extension locally:

- **Debug with F5**: open the `apps/vscode-adr-manager` folder in VS Code (the `Run Extension` launch configuration lives in that folder) and press `F5`. This builds the extension and opens an Extension Development Host.
- **Watch mode**: run `pnpm watch:ext` from the workspace root. This watches the extension host bundle (webpack) and the webview bundles (Rollup) in parallel and writes output to `apps/vscode-adr-manager/dist`.

In the Extension Development Host, open a folder that contains an ADR directory and run `Open ADR Manager` from the Command Palette.
The extension defaults to `docs/decisions` for the ADR directory. Change it with the `adrManager.adrDirectory` setting or the `Change ADR Directory` command.

## Build and package

```bash
pnpm build      # build every package
pnpm build:web  # web app only: vue-tsc type check + Vite build -> apps/adr-manager/dist
pnpm build:ext  # extension only: webpack + Rollup -> apps/vscode-adr-manager/dist
```

Package the extension as a VSIX file and install it into VS Code:

```bash
pnpm vsix
code --install-extension apps/vscode-adr-manager/vscode-adr-manager-<version>.vsix
```

Replace `<version>` with the version from `apps/vscode-adr-manager/package.json`.

## Testing and code quality

| Command                               | What it runs                                               |
| ------------------------------------- | ---------------------------------------------------------- |
| `pnpm test`                           | All package test suites                                    |
| `pnpm test:web`                       | Web app unit tests (Vitest)                                |
| `pnpm test:ext`                       | Extension tests (Jest, `pretest` compiles and lints first) |
| `pnpm e2e:web`                        | Web app end-to-end tests (Cypress)                         |
| `pnpm lint:ext`                       | Extension linting (ESLint)                                 |
| `pnpm --filter adr-manager lint`      | Web app linting (ESLint)                                   |
| `pnpm --filter adr-manager typecheck` | Web app type check (vue-tsc)                               |
| `pnpm format` / `pnpm format:check`   | Prettier write / check across the whole repository         |

### End-to-end tests

The Cypress tests need the web app dev server running and a valid GitHub OAuth session:

```bash
pnpm dev:web   # in a separate terminal
CYPRESS_OAUTH_E2E_AUTH_ID=<auth-id> CYPRESS_USER=<github-user> pnpm e2e:web
```

Alternatively, create `apps/adr-manager/cypress.env.json`:

```json
{
  "OAUTH_E2E_AUTH_ID": "<auth-id>",
  "USER": "<github-user>"
}
```

To get a local `authId`, sign in through the running web app, open the browser developer tools, and inspect local storage for `http://localhost:8000`.

## Releases and CI

Releases are coordinated with [Changesets](https://github.com/changesets/changesets):

1. Add a changeset alongside any change that should be released: `pnpm changeset`.
2. On every push to `main`, the `Release` workflow opens or updates a **Version Packages (joint release)** PR that applies pending changesets (version bumps and changelogs, via `pnpm version-packages`).
3. Merging that PR publishes the bumped versions to `main`. Neither package is published to npm. Instead:
   - the web app deploys to GitHub Pages automatically (`Web · Build & Publish` pushes `apps/adr-manager/dist` to the `gh-pages` branch), and
   - the extension is published to the VS Code Marketplace by manually running the `Extension · Publish` workflow (`vsce publish`, requires the `VSCE_PAT` secret).

| Workflow                | Trigger                                     | What it does                                               |
| ----------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `Extension · CI`        | Push touching the extension, manual         | Compiles, lints, tests, and uploads a VSIX artifact        |
| `Web · Tests`           | Push touching the web app, manual           | Vitest unit tests and Cypress e2e tests (Chrome)           |
| `Release`               | Push to `main`                              | Opens/updates the Changesets "Version Packages" PR         |
| `Web · Build & Publish` | Push to `main` touching the web app, manual | Builds the web app and deploys it to the `gh-pages` branch |
| `Extension · Publish`   | Manual                                      | Publishes the extension to the VS Code Marketplace         |

## Repository structure

```text
.
|-- .changeset/                  # changesets config and pending release notes
|-- .github/workflows/           # CI, release, and publish pipelines
|-- packages/
|   |-- adr-manager/             # web app (src, tests, cypress)
|   |-- vscode-adr-manager/      # VS Code extension (src, webviews in web/)
|   |-- core/                    # shared MADR parser and ADR domain model
|   |-- eslint-config/           # shared ESLint flat configs
|   |-- prettier-config/         # shared Prettier config
|   `-- tsconfig/                # shared TypeScript configs
|-- package.json                 # root orchestration scripts
|-- pnpm-workspace.yaml          # workspace layout, dependency catalog, install hardening
`-- README.md
```

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
pnpm format:check
```

If the extension package is affected, also run `pnpm vsix`.

### Reporting issues

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

## Acknowledgements

- The web-based ADR Manager started as an undergraduate research project at the Institute of Software Engineering of the University of Stuttgart and was submitted to the [ICSE Score Contest 2021](https://conf.researchr.org/home/icse-2021/score-2021).
- The VS Code extension was created by Steven Chen as part of a Bachelor thesis at the University of Stuttgart.
- Both apps build on the [MADR](https://adr.github.io/madr/) template from the [adr organization](https://github.com/adr).
