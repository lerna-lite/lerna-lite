# GitHub Copilot Instructions for Lerna-Lite

This repository is a monorepo for **Lerna-Lite**, a lightweight fork of the Lerna project. The preferred package manager is **pnpm** and the repo uses strict TypeScript, a workspace layout, and command-specific packages.

## General guidance

- Treat this repo as a monorepo with packages under `/packages/`, E2E tests under `/e2e/`, helper code under `/helpers/`, and fixtures under `/__fixtures__/`.
- Use modern Node.js module semantics and strict TypeScript conventions.
- Keep changes small, focused, and consistent with the existing repository conventions.
- If you are editing code, prefer tests and ensure the change is covered by unit or integration tests where appropriate.
- Use Conventional Commits for commit messages when applicable, especially if the change touches published commands.

## Tooling and commands

- Install dependencies with `pnpm install`.
- Lint with `pnpm lint`.
- Format code with `pnpm format`.
- Build the repository with `pnpm build`.
- Run type-aware linting with `pnpm lint-type`.
- Run tests with `pnpm test`.
- E2E tests may use Verdaccio and are under `/e2e/`.

## Safety rules

- Never run versioning or publishing commands unless explicitly instructed, and in those cases only use `--dry-run` unless the user says otherwise.
- Do not publish or tag releases on your own.
- If a suggested change includes `version` or `publish`, ask for clarification and avoid executing it.

## Shell command policy

- Prefer using `rtk` when running shell commands in this workspace to reduce output size and improve token efficiency.
- Example:
  - `rtk git status`
  - `rtk pnpm install`
  - `rtk pnpm test`

## Repository-specific notes

- `packages/cli/src/cli-commands/` contains CLI command definitions.
- Command implementations are provided in separate packages such as `packages/changed/`, `packages/diff/`, `packages/publish/`, etc.
- Shared utilities live in `packages/core/` and other internal packages.
- Tests use `vitest` and follow the `.spec.ts` convention.
- E2E tests are supported by helpers in `/helpers/` and fixtures in `/__fixtures__/`.

## What to do when modifying code

- Run formatting and linting after edits.
- Add or update tests for behavior changes.
- Avoid breaking the existing workspace structure or package build graph.
- Keep commits and PR descriptions concise and aligned with Conventional Commits when possible.

## When in doubt

- Ask for clarification before making large architectural changes.
- Prefer small, conservative changes over broad rewrites.
- Respect existing project rules and the `CLAUDE.md` guidance.

