# GitHub Pages CI/CD Guide

This guide explains what is needed to publish the ADR Manager web app to GitHub Pages from this repository.

The target hosted URL is:

```text
https://adr.github.io/adr-manager-apps/
```

The authenticated manager route is:

```text
https://adr.github.io/adr-manager-apps/#/manager
```

## Current State

The repository already has the core deployment pieces:

| Area | Current setup |
| --- | --- |
| Repository | `adr/adr-manager-apps` |
| Web app package | `apps/adr-manager` |
| Build command | `pnpm --filter adr-manager build` |
| Build output | `apps/adr-manager/dist` |
| Vite base path | `/adr-manager-apps/`, from `apps/adr-manager/vite.config.ts` |
| Router mode | Hash routing, so GitHub Pages does not need a SPA fallback |
| Deploy workflow | `.github/workflows/web-publish.yml` |
| Pages branch | `gh-pages` |

The deployment workflow already builds the web app and pushes the static output to the `gh-pages` branch with the default `GITHUB_TOKEN`.

## Required Repository Settings

Configure these in the GitHub repository settings.

1. Go to **Settings**, then **Actions**, then **General**.
2. Make sure GitHub Actions is allowed to run.
3. Make sure the workflow token can write repository contents, or confirm the organization does not block the workflow-level `contents: write` permission.
4. Go to **Settings**, then **Pages**.
5. Set **Source** to **Deploy from a branch**.
6. Set **Branch** to `gh-pages`.
7. Set **Folder** to `/root`.
8. Save the Pages settings.

If the `gh-pages` branch is not available yet, run the `Web · Build & Publish` workflow manually once from the Actions tab. After it creates the branch, return to the Pages settings and select it.

## Deployment Flow

The intended flow is:

1. Open a pull request with the web change.
2. Let `Repo · Checks` and `Web · Tests` pass.
3. Merge the pull request to `main`.
4. `Web · Build & Publish` runs automatically if the change touches the web app, shared packages, the lockfile, or the workflow itself.
5. The workflow builds `apps/adr-manager`.
6. The workflow publishes `apps/adr-manager/dist` to the `gh-pages` branch.
7. GitHub Pages serves the new branch contents at `https://adr.github.io/adr-manager-apps/`.

The workflow can also be started manually from **Actions**, then **Web · Build & Publish**, then **Run workflow**.

## OAuth Setup

The page can load without OAuth setup, but sign-in depends on provider configuration.

### GitHub Sign-In

GitHub sign-in uses Firebase Authentication.

Current app configuration:

| Setting | Value |
| --- | --- |
| Firebase project ID | `adr-manager` |
| Firebase auth domain | `adr-manager.firebaseapp.com` |
| Hosted Pages domain | `adr.github.io` |

Required setup:

1. In Firebase Authentication, add `adr.github.io` as an authorized domain if it is not already present.
2. In the Firebase GitHub sign-in provider settings, confirm the GitHub OAuth client ID and client secret are configured.
3. In the GitHub OAuth app, confirm the authorization callback URL matches the Firebase callback URL shown by Firebase. For the current auth domain, this is normally `https://adr-manager.firebaseapp.com/__/auth/handler`.
4. Confirm the OAuth app allows the scopes the web app asks for, `repo`, `read:user`, `gist`, `workflow`, and `read:org`.

No GitHub OAuth secret belongs in this repository or in the GitHub Actions workflow.

### GitLab.com Sign-In

GitLab.com sign-in needs a GitLab OAuth application ID at build time.

Required setup if GitLab.com sign-in should work from the hosted page:

1. Create a GitLab OAuth application.
2. Set the redirect URI to `https://adr.github.io/adr-manager-apps/`.
3. Do not mark the application as confidential.
4. Select the `api` scope.
5. Add the application ID as a GitHub Actions repository variable named `VITE_GITLAB_CLIENT_ID`.
6. Update `.github/workflows/web-publish.yml` so the build step passes the variable:

```yaml
- run: pnpm --filter adr-manager build
  env:
    VITE_GITLAB_CLIENT_ID: ${{ vars.VITE_GITLAB_CLIENT_ID }}
```

### Self-Hosted GitLab Sign-In

No build-time variable is needed for self-hosted GitLab.

Each self-hosted GitLab instance needs its own OAuth application:

1. Register an OAuth application in GitLab.
2. Set the redirect URI to the exact hosted app URL, including the trailing slash.
3. Use `https://adr.github.io/adr-manager-apps/` for the public Pages deployment.
4. Do not mark the application as confidential.
5. Select the `api` scope.
6. Give users the application ID so they can enter it in the self-hosted GitLab dialog.

## Local Verification Before Enabling Pages

Run these from the repository root:

```bash
pnpm install
pnpm format:check
pnpm typecheck
pnpm lint
pnpm --filter @adr-manager/core test
pnpm --filter adr-manager test
pnpm --filter adr-manager build
```

For Cypress locally:

```bash
pnpm dev:web
pnpm e2e:web
```

The local dev URL should be:

```text
http://localhost:8000/adr-manager-apps/#/manager
```

When unauthenticated, that route should redirect to:

```text
http://localhost:8000/adr-manager-apps/#/login?redirect=/manager
```

## Production Verification After Deployment

After the Pages deployment finishes:

1. Open `https://adr.github.io/adr-manager-apps/`.
2. Open `https://adr.github.io/adr-manager-apps/#/manager`.
3. Confirm the manager route redirects to `#/login?redirect=/manager` when signed out.
4. Confirm the landing page shows GitHub and GitLab connection options.
5. Start GitHub sign-in and confirm the Firebase popup opens.
6. If GitLab.com is enabled, start GitLab sign-in and confirm it redirects to GitLab instead of showing a missing application ID error.
7. If self-hosted GitLab is needed, enter a test instance URL and application ID, then confirm the redirect URI shown in the dialog matches the registered GitLab OAuth application.

## When the URL Changes

If the repository name changes, the Vite base path must change too.

For example, if the Pages URL becomes `https://adr.github.io/new-repo/`, set the base path to `/new-repo/`.

The current default lives in `apps/adr-manager/vite.config.ts`:

```text
/adr-manager-apps/
```

For a custom domain hosted at the root, build with:

```bash
VITE_BASE_PATH=/ pnpm --filter adr-manager build
```

Any URL change also requires updating OAuth redirect and authorized-domain settings for GitHub, GitLab.com, and self-hosted GitLab.

## Minimal Checklist

Use this as the setup checklist:

- Keep `.github/workflows/web-publish.yml`.
- Allow GitHub Actions to write repository contents.
- Run `Web · Build & Publish` once to create `gh-pages`.
- Configure GitHub Pages to deploy from `gh-pages` and `/root`.
- Confirm Firebase allows `adr.github.io`.
- Configure GitLab.com `VITE_GITLAB_CLIENT_ID` only if hosted GitLab.com sign-in is required.
- Verify `https://adr.github.io/adr-manager-apps/#/manager` after the first deploy.
