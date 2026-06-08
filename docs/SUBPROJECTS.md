# Subprojects / Additional Codebases

This repository is a monorepo that builds and publishes multiple independent packages (scoped npm packages). The list below documents the codebases produced by this project that may be packaged or published separately, with basic metadata required by OSPS-QA-04.01.

Notes:
- Repository URL: https://github.com/lerna-lite/lerna-lite
- License (repo): MIT
- Maintainer (author field in packages): Ghislain B.

## How to interpret entries
- **Name / repo**: package name and link to package.json in this repo
- **Purpose / intent**: short description from package metadata
- **Status**: code activity status in this repo (Active / Maintenance / Archived)
- **Inclusion in release**: how it's built or packaged in releases
- **License**: package license

---

## Package entries

### @lerna-lite/cli
- Name / repo: [packages/cli/package.json](packages/cli/package.json)
- Purpose / intent: Lerna-Lite CLI for the Version/Publish commands
- Status: Active
 Build & artifacts: `pnpm run build` (CI) produces `dist/`. The release workflow then runs the built CLI (`pnpm exec local-lerna`, which resolves to `node ./packages/cli/dist/cli.js`) to perform `version` and `publish` steps — see `.github/workflows/release.yml` and this package's `package.json` scripts for details.

### @lerna-lite/core
 Build & artifacts: `pnpm run build` (CI) produces `dist/`. The release workflow then runs the built CLI (`pnpm exec local-lerna`) to perform `version` and `publish` steps — see `.github/workflows/release.yml` and the package's `package.json` scripts for details.
- Inclusion in release: Built to `dist` and published as a scoped npm package.
 Build & artifacts: `pnpm run build` (CI) produces `dist/`. The release workflow then runs the built CLI (`pnpm exec local-lerna`) to perform `version` and `publish` steps — see `.github/workflows/release.yml` and the package's `package.json` scripts for details.
- Name / repo: [packages/changed/package.json](packages/changed/package.json)
- Purpose / intent: List local packages that have changed since the last tagged release
 Build & artifacts: `pnpm run build` (CI) produces `dist/`. The release workflow then runs the built CLI (`pnpm exec local-lerna`) to perform `version` and `publish` steps — see `.github/workflows/release.yml` and the package's `package.json` scripts for details.
- License: MIT

 Build & artifacts: `pnpm run build` (CI) produces `dist/`. The release workflow then runs the built CLI (`pnpm exec local-lerna`) to perform `version` and `publish` steps — see `.github/workflows/release.yml` and the package's `package.json` scripts for details.
- Status: Active
- Inclusion in release: Built to `dist` and published as a scoped npm package.
 Build & artifacts: `pnpm run build` (CI) produces `dist/`. The release workflow then runs the built CLI (`pnpm exec local-lerna`) to perform `version` and `publish` steps — see `.github/workflows/release.yml` and the package's `package.json` scripts for details.
### @lerna-lite/exec
- Name / repo: [packages/exec/package.json](packages/exec/package.json)
 Build & artifacts: `pnpm run build` (CI) produces `dist/`. The release workflow then runs the built CLI (`pnpm exec local-lerna`) to perform `version` and `publish` steps — see `.github/workflows/release.yml` and the package's `package.json` scripts for details.
- License: MIT
 Build & artifacts: `pnpm run build` (CI) produces `dist/`. The release workflow then runs the built CLI (`pnpm exec local-lerna`) to perform `version` and `publish` steps — see `.github/workflows/release.yml` and the package's `package.json` scripts for details.
- Purpose / intent: Create a new Lerna repo or upgrade an existing repo
- Status: Active
 Build & artifacts: `npm run build` produces `dist/`. Packaging/publishing is performed by the repository CI workflow — see `.github/workflows/release.yml` and the package `pack-tarball`/`publish` scripts in the package's `package.json` for details.

### @lerna-lite/list
 Build & artifacts: `npm run build` produces `dist/`; packaging for release via `npm pack` or CI publish.
- Inclusion in release: Built to `dist` and published as a scoped npm package.
 Build & artifacts: `npm run build` produces `dist/`. Packaging/publishing is performed by the repository CI workflow — see `.github/workflows/release.yml` and the package `pack-tarball`/`publish` scripts in the package's `package.json` for details.
- Name / repo: [packages/listable/package.json](packages/listable/package.json)
- Purpose / intent: listable utilities used by listing features
 Build & artifacts: `npm run build` produces `dist/`. Packaging/publishing is performed by the repository CI workflow — see `.github/workflows/release.yml` and the package `pack-tarball`/`publish` scripts in the package's `package.json` for details.
- License: MIT

 Build & artifacts: `npm run build` produces `dist/`. Packaging/publishing is performed by the repository CI workflow — see `.github/workflows/release.yml` and the package `pack-tarball`/`publish` scripts in the package's `package.json` for details.
- Status: Active
- Inclusion in release: Built to `dist` and published as a scoped npm package.
 Build & artifacts: `npm run build` produces `dist/`; packaging for release via `npm pack` or CI publish.
### @lerna-lite/profiler
- Name / repo: [packages/profiler/package.json](packages/profiler/package.json)
- Purpose / intent: Profiler used by optional commands (Run/Exec)
- Status: Active
- Inclusion in release: Built to `dist` and published as a scoped npm package.
- License: MIT

### @lerna-lite/publish
- Name / repo: [packages/publish/package.json](packages/publish/package.json)
- Purpose / intent: Publish packages in the current workspace
- Status: Active
- Inclusion in release: Built to `dist`, uses multiple npm publishing libraries to publish scoped packages.
- License: MIT

### @lerna-lite/run
- Name / repo: [packages/run/package.json](packages/run/package.json)
- Purpose / intent: Run npm scripts across package workspaces
- Status: Active
- Inclusion in release: Built to `dist` and published as a scoped npm package.
- License: MIT

### @lerna-lite/version
- Name / repo: [packages/version/package.json](packages/version/package.json)
- Purpose / intent: Bump versions & write changelogs for changed packages
- Status: Active
- Inclusion in release: Built to `dist` and published as a scoped npm package.
- License: MIT

### @lerna-lite/watch
- Name / repo: [packages/watch/package.json](packages/watch/package.json)
- Purpose / intent: Runs a command whenever packages or their dependents change
- Status: Active
- Inclusion in release: Built to `dist` and published as a scoped npm package.
- License: MIT
