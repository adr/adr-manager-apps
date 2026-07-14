# VS Code Marketplace Release Guide

This guide describes how maintainers publish ADR Manager for VS Code to the Visual Studio Marketplace.

## Marketplace Identity

| Field | Value |
| --- | --- |
| Publisher | `adr-org` |
| Extension name | `adr-manager-vscode` |
| Display name | `ADR Manager for VS Code` |
| Marketplace ID | `adr-org.adr-manager-vscode` |
| Marketplace page | <https://marketplace.visualstudio.com/items?itemName=adr-org.adr-manager-vscode> |

This listing started at version `0.0.1`. It is separate from the older `StevenChen.vscode-adr-manager` listing.

## Prerequisites

- The Microsoft account used for publishing must be a member of the `adr-org` Marketplace publisher and have permission to publish extensions.
- Install the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli).
- Install the Node.js and pnpm versions required by the root README.

The established local publishing flow uses Microsoft Entra authentication through the Azure CLI.

## Version the Release

Every releasable change must include a Changeset:

```bash
pnpm changeset
```

Select `adr-manager-vscode` and choose the appropriate semantic version bump. After the change is merged into `main`, the `Release` workflow opens or updates the `Version Packages (joint release)` pull request. Review and merge that pull request before publishing.

Changesets owns the version in `apps/vscode-adr-manager/package.json` and the extension changelog. Do not pass `patch`, `minor`, `major`, or a version number to `vsce publish`, because that would bypass the repository's release process.

## Publish the Release

Start from a clean, current `main` after the version pull request has been merged:

```bash
git switch main
git pull --ff-only
git status --short
pnpm install --frozen-lockfile
pnpm --filter adr-manager-vscode test
pnpm vsix
node -p "require('./apps/vscode-adr-manager/package.json').version"
az login
pnpm --filter adr-manager-vscode exec vsce publish --no-dependencies --azure-credential
az logout
```

`git status --short` should produce no output before publishing. The test command runs the extension type check, host compilation, lint, and test suite. `pnpm vsix` builds the production host and webviews, then produces an installable package for final inspection before `vsce publish` builds and uploads the release.

After publishing, open the [Marketplace page](https://marketplace.visualstudio.com/items?itemName=adr-org.adr-manager-vscode).

## Troubleshooting

### The version already exists

The Marketplace does not allow a published version to be replaced. Confirm that the `Version Packages (joint release)` pull request was merged and that local `main` contains the new version. Do not fix this by passing a version directly to `vsce publish`.

### Authentication or authorization fails

Run `az logout`, then run `az login` again with the Microsoft account that belongs to the `adr-org` publisher. If authentication succeeds but publishing is forbidden, confirm that the account still has permission to publish extensions for `adr-org`.

An Azure CLI message saying that the account has no subscriptions is not a Marketplace publishing failure. The interactive publishing path needs the signed-in identity, not an Azure subscription.

### Packaging fails

Run the test and VSIX commands separately to find whether the failure comes from validation, the production build, or Marketplace packaging. Do not publish if the generated VSIX cannot be inspected or installed locally.

## Why Publishing Is Manual

Microsoft recommends Microsoft Entra authentication because global Azure DevOps Personal Access Tokens are retired on December 1, 2026. The repository does not store a Marketplace PAT and does not have a GitHub Actions publishing workflow.

Automated publishing can be added later, but it requires a deliberately configured Entra workload identity or managed identity and supporting Azure infrastructure. Until that exists, local publishing with `az login` and `vsce publish --azure-credential` is the supported release path.

References:

- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Retirement of Global Personal Access Tokens in Azure DevOps](https://devblogs.microsoft.com/devops/retirement-of-global-personal-access-tokens-in-azure-devops/)
