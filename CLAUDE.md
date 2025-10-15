# Guidelines for Claude Code

> **Note:** This file is intended for Claude AI and other automated agents. Please follow all instructions and restrictions outlined below when contributing or automating tasks in this repository.

This repository is **Lerna-Lite**, a fork of the popular Lerna tool. It is used for managing JavaScript projects with multiple packages. Unlike Lerna, Lerna-Lite requires separate installation for each command since all commands are optional.

## Package Manager

This project uses **pnpm** as the package manager to install the project.

## Required checks

When modifying core Lerna-Lite functionality, commands, or documentation, run the following commands and ensure they pass:

```bash
pnpm prettier:write # Prettier formatting/linting
pnpm build # build the entire project
pnpm test # run all unit tests or use `pnpm test:watch`
```

When working on a specific Lerna command, you can troubleshoot your code by using the debugger available in `launch.json`, a few of these commands have a debugger defined for them and often use the `--dry-run` argument for a dry-run mode.

## Project Structure

This is a monorepo which uses pnpm `workspace:` protocol with the following main structure:

### `/packages/` - Published Packages

All command implementations (cli, changed, diff, exec, init, list, publish, run, version, watch) and all other packages used internally (core, listable, npmlog, profiler)

### `/helpers/` - End-to-End Tests

- a bunch of helpers used by unit tests, mocks and fixtures

### `/__fixtures__/` - Test Fixtures

- Various test scenarios and generic sample monorepo structures that can be used bt multiple command tests

## Code Conventions

### TypeScript Configuration

- **Strict TypeScript**: Uses strict mode with modern ES2021 target
- **Target**: ES2021 with Node.js module resolution

# Guidelines for Claude Code

> **Note:** This file is intended for Claude AI and other automated agents. Please follow all instructions and restrictions outlined below when contributing or automating tasks in this repository.

- **Module system**: Modern Node.js compatibility
- **Node.js version**: 20.17.0 OR >=22.9.0

### OXLint Configuration

- Uses `.oxlintrc.json` for its configuration
- TypeScript with OXLint for type-aware linting

### File Naming and Structure

- **Test files**: Use `.spec.ts` suffix and live in `__tests__/` or `src/__tests__/` directories
- **Command files**: Individual TypeScript files in `libs/commands/{command-name}/src/`
- **Core utilities**: In `libs/core/src/` and related core packages
- **E2E tests**: Organized in `e2e/{command-name}/src/` directories
- **Fixtures**: Test scenarios in `__fixtures__/` directories

### Command Development Patterns

When creating or modifying Lerna commands:

1. Commands are implemented in TypeScript as Classes and located under each `packages/{command-name}-command.ts`
2. All CLI definitions are located under `packages/cli/src/cli-commands/`
3. Each of these CLI commands will try to `await import('@lerna-lite/{command-name}')` and if the command isn't install then it will throw and error saying it needs to be installed separately.
4. Commands use shared utilities from `packages/core/` and other core packages
5. All commands are also defined with descriptions in a JSON Schema located in `packages/cli/schemas/lerna-schema.json`
6. Most commands have a `--dry-run` (or `dryRun` when defined in `lerna.json`) flag that can be used to test the command

### Testing Conventions

- **Vitest**: Primary testing framework
- **Fixtures**: Predefined test scenarios for consistent testing

### Build and Release

- **Build**: Uses TypeScript with Project References for faster build
- **Targets**: Multiple build targets with dependency management
- **Release**: Conventional Commits with automated versioning
- **Versioning**: Uses Lerna's own versioning system
- **Publishing**: Commands handle npm package publishing

**Claude must NEVER run versioning or publishing commands unless `--dry-run` mode is set.**

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and PR titles.

- When a change affects a single command, include its name as the scope: `feat(publish): add registry authentication`.
- When multiple commands are affected, omit the scope: `fix: correct workspace detection`.
- When affecting core functionality: `feat(core): add new package discovery method`.

By convention, if only updating a single command within the commands library, for example the `version` command, the commit message should be `fix(version): description of the change`.

For any changes that only update tests, use `test` or `chore` as the commit/PR type, do not use `fix` or `feat`.

## Development Tools

- **Node.js**: Version 20.17.0 OR >=22.9.0 (check `package.json` for current version in `engines.node` property)
- **npm**: Version 11.5.1 or later as the package manager to publish with OIDC Trusted Publishing
- **TypeScript**: Strict configuration for type safety and use `tsc -b` with Project References to speed up the build
- **Vitest**: Testing framework

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run all tests with coverage
npm run test

# Lint code
npm run lint

# Format Code
pnpm run prettier:write
```

## Claude Restrictions

These rules apply to Claude AI and any automated agents:

- Never run versioning or publishing commands unless `--dry-run` mode is set.
- Always run formatting, build, and test checks before merging or publishing code.
- Do not merge, publish, or tag releases unless explicitly instructed by a maintainer.
- Respect all commit conventions and PR requirements outlined above.
- If in doubt, request human review before performing any destructive or irreversible actions.

## Lerna Configuration

The project includes a `lerna.json` configuration file that defines:

- Command-specific settings (run, publish, version)
- Conventional commits for versioning
- GitHub releases integration
- Files to ignore when detecting changes

This configuration is used both for Lerna's own development and as a reference implementation for users.

> **Note:** The Lerna configuration in this project sets `version.changelogIncludeCommitsClientLogin` as a string to format changelog commit entries with remote client login information. This feature uses the GitHub GraphQL API and may not work behind a proxy; consider disabling it in your local `lerna.json` if you encounter issues.
