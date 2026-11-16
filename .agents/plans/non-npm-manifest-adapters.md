# Plan: Non-npm manifest adapters (version/release for non-JS projects)

- **Reference:** https://github.com/lerna-lite/lerna-lite/issues/834 (closed as "not planned", labelled "PR Welcome")
- **Loosely related:** https://github.com/lerna/lerna/issues/3918 asks for `package.yaml` / `package.json5` support, i.e. other formats for npm manifests, which is a different request. The maintainer's reply in #834 quotes it only for its "no custom manifest files" stance.
- **Status:** Investigation only, nothing implemented
- **Date:** 2026-11-16

## 1. Request summary

The issue asks for lerna-lite to version and release projects that are not npm packages (Go, Rust, etc.) in a mixed-language monorepo. Those projects would be described by a neutral manifest such as `release.yml`:

```yaml
name: 'my-app'
version: '0.0.1'
hooks:
  postVersion: 'gh workflow run ${name}'
```

Discussion takeaways:

- **Maintainer:** this is outside the project's original scope and too large to build himself, but a PR is welcome. He suggested `postpublish` lifecycle scripts for the "hook after release" need.
- **Lerna's position (quoted by the maintainer):** Lerna is built on npm CLI internals, and custom manifests would add unnecessary complexity.
- **Author:** the actual need is a subset of what lerna-lite already does: find projects, bump versions from conventional commits, write changelogs, create tags and GitHub releases. Publishing to npm is "just an intermediate step".
- **Other user:** pointed to Nx for mixed-language monorepos and described lerna-lite as deliberately npm-focused.
- **Workaround available today:** add a stub `package.json` with `"private": true` and use `version`/`postversion` scripts for hooks.

## 2. Feasibility verdict

**Doable.** There is no technical blocker, only cost in scope and maintenance. Since publishing is not needed, every non-npm package can be treated as `private: true`, which keeps all npm-specific code paths unchanged.

### Already language-agnostic

- Conventional-commit version bumps
- Changelog generation (based on git history per package folder)
- Git tags, release commit, GitHub/GitLab releases
- Changed-package detection (based on git diffs per package location)

### Currently tied to `package.json`

| Area | Location | Impact |
| --- | --- | --- |
| Package discovery | `packages/core/src/project/project.ts` (`getPackages()` / `getPackagesSync()` search for `package.json`) | Must also search for adapter file names |
| `Package` model | `packages/core/src/package.ts` | Read/write assumes a JSON npm manifest |
| Dependency graph | `packages/core/src/package-graph/` | Built from npm `dependencies` fields; adapter packages have none at first |
| Lifecycle scripts | `npm run-script` based | Need a separate shell-hook runner for adapter packages |
| Lockfile / workspace sync | `packages/version/src/lib/update-lockfile-version.ts` and related | Must be skipped for adapter packages |
| Publish | `packages/publish/` | Skipped for adapter packages because they are private |

## 3. Architecture decision: thin core hook + optional package

lerna-lite is installed as a CLI with separate packages per command, and users only install the commands they need. ESM tree-shaking does not shrink what gets installed. To keep the default install unchanged, non-npm support should not add dependencies to core.

- **`@lerna-lite/core`:** a small extension point only, with no new third-party dependencies.
- **New optional package** (e.g. `@lerna-lite/manifests`, or one package per format): the actual format parsers/writers, their dependencies (YAML/TOML/XML parsers), and the shell-hook runner.

Precedents in the repo for dynamic, opt-in loading:

- `packages/cli/src/cli-commands/*.ts` load each optional command with `await import('@lerna-lite/<cmd>')`.
- `packages/version/src/conventional-commits/get-changelog-config.ts` loads a changelog preset by a name taken from config.

## 4. High-level implementation plan

### Phase 1: Core extension point (`@lerna-lite/core`)

1. Define a `ManifestAdapter` interface, for example:
   - `fileNames: string[]` (e.g. `['release.yml']`)
   - `read(location): Promise<{ name, version, private?: true, dependencies?: Record<string, string> }>`
   - `writeVersion(location, newVersion): Promise<void>`
   - optional `hooks` (e.g. `preVersion`, `postVersion`)
2. Add a `lerna.json` option such as `manifestAdapters: string[]` (package names or relative paths). Update `packages/cli/schemas/lerna-schema.json`.
3. In `Project` discovery, if adapters are configured, load them with `await import()` and also search for their file names using the existing file finder.
4. Let `Package` take an optional adapter. Force `private: true` for adapter packages, and route manifest read/write through the adapter instead of JSON serialization.
5. If no adapters are configured, behaviour must be identical to today, with no extra file-system scans.

### Phase 2: Command integration

1. **`version`:** bump versions through `adapter.writeVersion()`, skip lockfile updates for adapter packages, and run adapter hooks at the matching lifecycle points.
2. **`changed` / `list`:** confirm adapter packages show up correctly, and decide whether `list` should label them.
3. **`publish`:** confirm adapter packages are skipped because they are private. No new code is expected.
4. **`exec` / `run` / `watch`:** `run` has no npm scripts for these packages, so they should be skipped quietly. `exec` and `watch` should work as-is.

### Phase 3: Optional adapters package

1. Create the package (e.g. `@lerna-lite/manifests`) with adapters such as `yaml`, `toml` (Cargo), `version-file` (plain `VERSION`), or a configurable regex adapter.
2. Add a shell-hook runner that uses the existing `child-process` helpers from core.
3. Add CLI/docs entries and README sections.

### Phase 4: Tests

- **Unit:** adapter loading, discovery of mixed manifests, `Package` read/write through adapters, and the private-only rule.
- **Fixtures:** add e.g. `__fixtures__/mixed-manifests/` containing npm packages and `release.yml` packages.
- **E2E:** `version --dry-run` and real `version` on a mixed repo (tags, changelogs, bumped versions in non-JSON files). `changed` and `list` should show adapter packages.

## 5. Open questions / design decisions

- Can adapter packages declare dependencies on each other or on npm packages? (Suggest: no in v1.)
- Should there be one generic adapters package, or one package per format to minimize install size?
- How should adapter packages appear in `list` / `changed` JSON output?
- Hook naming and variable substitution (e.g. `${name}`, `${version}`). Keep it simple and avoid a templating engine.
- Fixed vs. independent mode: both should work unchanged, but this needs verifying with fixtures.

## 6. Risks

- `Package` / `PackageGraph` are used by every command, so even a thin abstraction affects many tests.
- Long-term maintenance: every new format is another surface to support. Keep the adapter contract minimal and stable.
- Scope creep toward a general-purpose polyglot monorepo tool (Nx territory), which goes against the project's "lite" goal.

## 7. Lower-cost alternative (fallback)

If the full adapter approach is too large, a much smaller feature covers most use cases. Add a `version` option that also bumps a version string in extra files inside a **private** npm package, e.g. `syncVersionFiles: ['VERSION', 'Cargo.toml']` with a simple regex replace. This still requires a stub `package.json`, but it needs no core changes and no new package.
