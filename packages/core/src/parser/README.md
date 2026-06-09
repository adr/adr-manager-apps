# MADR parser (generated)

`MADRLexer.js`, `MADRParser.js`, and `MADRListener.js` are generated from `MADR.g4` by
ANTLR (JavaScript target). The hand-written `*.d.ts` files provide their TypeScript types,
since the ANTLR JavaScript target does not emit declarations. The generated `.js` files are
excluded from type-checking in `tsconfig.json`.

## Regenerating

Requires Java and the ANTLR 4.13.x "complete" jar (https://www.antlr.org/download.html).
The tool version must match the `antlr4` runtime line declared in the workspace catalog
(`pnpm-workspace.yaml`).

```sh
java -jar antlr-4.13.2-complete.jar -Dlanguage=JavaScript MADR.g4
```

Run this from `packages/core/src/parser`. Delete the generated `*.interp` / `*.tokens`
files afterwards (only the `.js` files are needed at runtime).
