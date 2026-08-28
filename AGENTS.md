# Agent Instructions

This file contains repository guidance for automated coding agents working in this project.

## Project Overview

This repository is **Lerna-Lite**, a fork of Lerna for managing JavaScript monorepos with multiple packages. Commands are published as separate optional packages.

## Package Manager

Use `pnpm` for dependency and workspace management.

For local setup, prefer `corepack enable` or the project setup script:

```bash
sh ./scripts/setup.sh
```

## Required Checks

Prefer the smallest relevant verification loop while iterating. Before finalizing non-trivial code changes, run the checks that match the surface area you touched.

For broad or core code changes, the main local verification commands are:

```bash
pnpm lint
pnpm format:check
pnpm build
pnpm lint-type
pnpm test
```

For command behavior and end-to-end CLI changes, also run:

```bash
pnpm test:e2e
```

For docs-only or narrowly scoped test-only changes, use judgment and run only the relevant checks.

When working on a specific Lerna command, prefer the debugger configurations in `.vscode/launch.json` when available. Many commands support `--dry-run` and should be exercised that way first.

## Project Structure

- `packages/`: Published packages and shared internal packages
- `helpers/`: Test helpers, mocks, and fixtures
- `e2e/`: End-to-end test suites by command
- `e2e-utils/`: Utilities for end-to-end testing
- `__fixtures__/`: Reusable test scenarios and sample monorepos

## Code Conventions

- TypeScript is strict and targets modern Node.js environments.
- Test files use the `.spec.ts` suffix.
- CLI definitions live in `packages/cli/src/cli-commands/`.
- Command descriptions are maintained in `packages/cli/schemas/lerna-schema.json`.
- Most commands support `--dry-run` or `dryRun`.
- The workspace packages currently include `changed`, `cli`, `core`, `diff`, `exec`, `init`, `list`, `listable`, `npmlog`, `profiler`, `publish`, `run`, `version`, and `watch`.

When creating or modifying Lerna commands:

1. Implement command logic in the corresponding package under `packages/`.
2. Keep CLI wiring in `packages/cli/src/cli-commands/`.
3. Update shared schema or supporting utilities when the command surface changes.
4. Prefer existing shared utilities from `packages/core/` and related internal packages.

## Testing Conventions

- Use Vitest for unit tests.
- Use e2e suites for realistic command execution scenarios.
- Reuse fixtures when possible instead of creating ad hoc test setups.
- Prefer targeted Vitest runs while iterating, then broaden verification before finalizing.
- Use `pnpm exec vitest run --config ./e2e/vitest.config.ts <path>` for focused e2e runs when needed.

## Build and Release

- Build with TypeScript project references.
- Use Conventional Commits for commit messages and PR titles.
- Never run versioning or publishing commands unless `--dry-run` is set.
- Do not merge, publish, or tag releases unless explicitly instructed by a maintainer.
- Treat `new-version`, `new-publish`, `roll-new-release`, `major-release`, `lerna version`, and `lerna publish` as release actions.

## Commit and PR Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and pull request titles.

- When a change affects a single command, use its name as the scope, for example `fix(version): relax GitHub comment throttling`.
- When multiple commands are affected, omit the scope if that reads more naturally.
- For test-only changes, prefer `test` or `chore` instead of `fix` or `feat`.

When drafting a pull request, follow `.github/PULL_REQUEST_TEMPLATE.md`, including its conventional-commit title requirement and applicable sections and checklist items.

## Tooling

- Node.js engines: `^22.17.0 || >=24.0.0`
- CI currently runs on Node `22`, `24`, and `26` on Ubuntu
- pnpm: `11.x` (`packageManager` is `pnpm@11.17.0`)
- TypeScript: project references with `tsc --build`
- Vitest: unit and e2e testing
- OXC tools: `oxlint` and `oxfmt`

## Safety Rules

- Never run versioning or publishing commands unless `--dry-run` is set.
- If a command is destructive or irreversible, require explicit maintainer intent first.
- If unsure whether a release-related action is safe, stop and ask for human confirmation.

## Lerna Configuration

The repository includes a `lerna.json` configuration that defines command behavior, conventional commits, GitHub releases integration, and ignored files for change detection.

Note: this repository uses `version.changelogIncludeCommitsClientLogin` to format changelog commit entries with remote client login information. That feature relies on the GitHub GraphQL API and may not work behind some proxies.
