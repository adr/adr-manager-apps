# Changelog

All notable changes to the web app are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions up to and including 2.0.0 were released from [adr/adr-manager](https://github.com/adr/adr-manager/releases).

The web app deploys whenever a change reaches `main`, so entries under Unreleased can already be live. They are not yet part of a numbered version.

## [Unreleased]

## [3.0.0] - 2026-11-09

### Added

- GitLab support, including self-hosted instances.
- A replayable first-time tour that uses demo data when no real ADRs exist.
- Tags on ADRs.
- Search across ADRs.
- Toggleable fields, with a dialog for hidden fields that keeps their content.
- A Relevant Files section for linking decision-related files, with a searchable file picker, missing-file warnings, and links that open the files on GitHub or GitLab.
- A convert view that turns non-conforming Markdown into MADR.

### Changed

- Replace Vuetify and Bootstrap with a custom token-based design system.
- Use MADR template version 4 by default.
- Show readable error toasts and retryable loading states for Git provider errors.
- Renaming an ADR's title updates the filename live and renames the file safely on commit.

### Fixed

- ADRs using MADR template version 4 with only basic fields were read as version 2.
- Pushing failed after an access token expired.
- Committing failed when the user had not given access to their email address.
- Reordering consequences did not work.
- The tour appeared again after signing out and back in.
- Tooltips were sometimes not visible.

[Unreleased]: https://github.com/adr/adr-manager-apps/compare/web-v3.0.0...HEAD
[3.0.0]: https://github.com/adr/adr-manager-apps/compare/002eeaa...web-v3.0.0
