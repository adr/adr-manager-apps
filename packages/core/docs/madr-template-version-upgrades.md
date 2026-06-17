# Updating MADR Template Versions

This guide explains adding another MADR template version.

## Core Contract

Template support is centralized in `packages/core/src/templates.ts`.
Each `MadrTemplateAdapter` in `MADR_TEMPLATE_ADAPTERS` defines:

- `version`, `label`, `subLabel`, and `description` for selectors.
- `fields` for field visibility.
- `peopleFields` for the people section shape.
- `optionArgumentKinds` for option argument inputs.
- `detect(markdown)` for version detection.
- `parse(markdown)` and `serialize(adr)` for Markdown conversion.
- `carryOverOnSwitch(record, from)` for preserving data during template switching.

`packages/core/src/types.ts` owns the `MadrTemplateVersion` union.
`packages/core/src/index.ts` re-exports the public API.

## Update Steps

1. Read the new MADR template and list the actual format changes.
2. Extend `MadrTemplateVersion` in `packages/core/src/types.ts`.
3. Add fields to `ArchitecturalDecisionRecord` only when the new template has data that cannot map to an existing property.
4. Add a version-specific reader and writer if the template is structurally different, use `packages/core/src/madr400.ts` as the current example.
5. Add detection markers that are unique to the new template.
6. Add a `MadrTemplateAdapter` entry in `packages/core/src/templates.ts`.
7. Put specific adapters before the classic fallback adapter, because detection runs from left to right.
8. Add tests for registration, metadata, detection, dispatch, round trips, and switching.
9. Update web app or VS Code UI only when adapter metadata is not enough.

## Parser And Writer Rules

- The writer should produce one Markdown shape.
- The writer must not mutate the input record.
- The reader should return an `ArchitecturalDecisionRecord`.
- The reader and writer should round-trip Markdown that the writer produces.
- If the ANTLR grammar changes, update `packages/core/src/parser/MADR.g4` and regenerate the checked-in parser files using `packages/core/src/parser/README.md`.

## Web App Touchpoints

Check these first:

- `apps/adr-manager/src/components/MadrVersionSelect.vue`
- `apps/adr-manager/src/components/FieldVisibilityPanel.vue`
- `apps/adr-manager/src/composables/useAdrEditor.ts`
- `apps/adr-manager/src/components/MadrMetaBar.vue`
- `apps/adr-manager/src/components/MadrConsideredOptions.vue`
- `apps/adr-manager/src/components/MadrEditor.vue`
- `apps/adr-manager/src/components/MadrDecisionOutcome.vue`

Prefer adapter metadata over inline checks like `templateVersion === "..."`.

## VS Code Touchpoints

The extension host parser already routes through `@adr-manager/core` in `apps/vscode-adr-manager/src/plugins/parser.ts`.
The older webview still has direct version checks, so review:

- `apps/vscode-adr-manager/web/components/VersionSelect.vue`
- `apps/vscode-adr-manager/web/components/FieldVisibilityPanel.vue`
- `apps/vscode-adr-manager/web/components/TemplateDateStatusDecidersSection.vue`
- `apps/vscode-adr-manager/web/components/TemplateDecisionOutcomeProfessionalSection.vue`
- `apps/vscode-adr-manager/web/components/TemplateConsideredOptionsProfessionalSection.vue`
- `apps/vscode-adr-manager/web/components/OptionContainerProfessional.vue`
- `apps/vscode-adr-manager/web/components/MadrTemplateProfessional.vue`
- `apps/vscode-adr-manager/web/mixins/adr-data.ts`
- `apps/vscode-adr-manager/web/mixins/save-adr.ts`
- `apps/vscode-adr-manager/src/extension-functions.ts`

Update snippets if the generated default template changes.

## Tests And Verification

Core:

```bash
pnpm --filter @adr-manager/core test
pnpm --filter @adr-manager/core typecheck
```

Web app, when touched:

```bash
pnpm --filter adr-manager test -- --runInBand
pnpm --filter adr-manager typecheck
pnpm --filter adr-manager build
pnpm --filter adr-manager e2e:test-ci
```

VS Code extension, when touched:

```bash
pnpm --filter vscode-adr-manager test
```

Always finish with:

```bash
git diff --check
```

For visible web app changes, smoke check `http://localhost:8000/adr-manager-apps/#/manager`.
Unauthenticated access should redirect to `#/login?redirect=/manager`.

Add a changeset when the update changes user-visible behavior.
