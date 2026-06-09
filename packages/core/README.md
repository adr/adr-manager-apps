# @adr-manager/core

Shared MADR parser (ANTLR4), ADR domain model, and string utilities for the [`adr-manager-apps`](../../README.md) monorepo.
Both the web app ([`adr-manager`](../adr-manager)) and the VS Code extension ([`vscode-adr-manager`](../vscode-adr-manager)) consume this package so that parsing, serialization, and the ADR domain model stay identical across the two apps.

## Source-only package

This is a private workspace package, used only inside this monorepo and not published anywhere.
Its `exports` point directly at `src/index.ts`, so it is consumed as TypeScript source with no build step and no stale artifacts between the core and the apps.

Apps depend on it through the workspace protocol:

```json
{
  "dependencies": {
    "@adr-manager/core": "workspace:*"
  }
}
```

## Public API

Everything below is re-exported from `src/index.ts`.

### Parser

- `md2adr(markdown, options?)` parses a MADR Markdown string into an `ArchitecturalDecisionRecord`.
- `adr2md(adr, options?)` serializes an `ArchitecturalDecisionRecord` back into MADR Markdown.
- Option types: `Md2AdrOptions`, `Adr2MdOptions`.

### Domain model

- `ArchitecturalDecisionRecord` is the class that represents a single ADR.
- Types: `Option`, `DecisionOutcome`, `AdrInit`, `ParseError`.

### Utilities

String transformation helpers used when building titles and matching options:

- `cleanUpString`
- `createShortTitle`
- `snakeCase2naturalCase`
- `naturalCase2snakeCase`
- `naturalCase2titleCase`
- `matchOptionTitleMoreRelaxed`

## Usage

```ts
import { md2adr, adr2md, ArchitecturalDecisionRecord } from "@adr-manager/core";

const adr = md2adr(markdown);
const markdown = adr2md(adr);
```

## Generated parser

The lexer, parser, and listener under `src/parser` are generated from `MADR.g4` by ANTLR.
See [`src/parser/README.md`](src/parser/README.md) for how to regenerate them.

## Development

See the [root README](../../README.md) for prerequisites and the monorepo development workflow.
