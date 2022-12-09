# Change Log
## Automate your Workspace Versioning, Publishing & Changelogs with [Lerna-Lite](https://github.com/lerna-lite/lerna-lite) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.13.0](https://github.com/lerna-lite/lerna-lite/compare/v1.12.0...v1.13.0) (2022-11-22)

### Bug Fixes

* **deps:** update all non-major dependencies ([#405](https://github.com/lerna-lite/lerna-lite/issues/405)) ([084da4f](https://github.com/lerna-lite/lerna-lite/commit/084da4f409b38f66bc1c5d4d2ef43f9a221ca80b)) - by @renovate-bot

### Features

* **publish:** apply publishConfig overrides, closes [#404](https://github.com/lerna-lite/lerna-lite/issues/404) ([#415](https://github.com/lerna-lite/lerna-lite/issues/415)) ([03e8157](https://github.com/lerna-lite/lerna-lite/commit/03e81571b8e68bc54fa69afbbc00f6338b39b19f)) - by @ghiscoding
* **version:** bump prerelease versions from conventional commits ([#409](https://github.com/lerna-lite/lerna-lite/issues/409)) ([dad936e](https://github.com/lerna-lite/lerna-lite/commit/dad936e9cc42252028175f08de73c8554d3f7cf1)) - by @ghiscoding
* **version:** use npmClientArgs in npm install after lerna version ([#417](https://github.com/lerna-lite/lerna-lite/issues/417)) ([43e5dcd](https://github.com/lerna-lite/lerna-lite/commit/43e5dcde6bfce0edc062fce4dc3431771423d77c)) - by @ghiscoding

# [1.12.0](https://github.com/lerna-lite/lerna-lite/compare/v1.11.3...v1.12.0) (2022-10-14)

### Bug Fixes

* bump min Node version to >=14.17.0 to align with external deps ([#387](https://github.com/lerna-lite/lerna-lite/issues/387)) ([2f804e9](https://github.com/lerna-lite/lerna-lite/commit/2f804e92bd319e2b27b1406ca82ec1fdab09c449)) - by @ghiscoding
* **deps:** update dependency dotenv to ^16.0.3 ([66467f5](https://github.com/lerna-lite/lerna-lite/commit/66467f593198736a3074b1afddb0c86ea860003c)) - by @renovate-bot
* **deps:** update dependency npmlog to v7 ([#389](https://github.com/lerna-lite/lerna-lite/issues/389)) ([d2110f1](https://github.com/lerna-lite/lerna-lite/commit/d2110f1aebe4b6cd44bcae2691fbd18fefc78299)) - by @renovate-bot
* **run:** allow for loading of env files to be skipped ([#391](https://github.com/lerna-lite/lerna-lite/issues/391)) ([440611e](https://github.com/lerna-lite/lerna-lite/commit/440611ed3acceaef8a3cd4dcfa877591388d83a4)) - by @ghiscoding

### Features

* **commands:** rename `git-dry-run` and `cmd-dry-run` to simply `dry-run` ([#377](https://github.com/lerna-lite/lerna-lite/issues/377)) ([3a55f5e](https://github.com/lerna-lite/lerna-lite/commit/3a55f5e8f7c26f3890f1c7099ca85c9d72cd2674)) - by @ghiscoding
* **publish:** add new option `--remove-package-fields` before publish ([#359](https://github.com/lerna-lite/lerna-lite/issues/359)) ([45a2107](https://github.com/lerna-lite/lerna-lite/commit/45a2107aa8862546a261a0c377c3fc704248bc5a)) - by @ghiscoding
* **run:** add `--use-nx` as CLI option and add Nx profiler ([9da003e](https://github.com/lerna-lite/lerna-lite/commit/9da003e6b570f969c5da437c71f3a8f9753e4704)) - by @ghiscoding
* **version:** add `--allow-peer-dependencies-update`, closes [#333](https://github.com/lerna-lite/lerna-lite/issues/333) ([#363](https://github.com/lerna-lite/lerna-lite/issues/363)) ([efaf011](https://github.com/lerna-lite/lerna-lite/commit/efaf0111e2e687718d33b42418abd701447a7031)) - by @ghiscoding

## [1.11.3](https://github.com/lerna-lite/lerna-lite/compare/v1.11.2...v1.11.3) (2022-09-20)

### Bug Fixes

* **cli:** add missing Type to fix TSC build error ([836d7f0](https://github.com/lerna-lite/lerna-lite/commit/836d7f0df7973535aa4e5809fd2f9ba8f2b1cd46)) - by @ghiscoding
* **run:** exclude dependencies with `--scope` when `nx.json` is not present ([3c222ed](https://github.com/lerna-lite/lerna-lite/commit/3c222eda560722b2540c8fd29906f4f04c44ca4e)) - by @ghiscoding

## [1.11.2](https://github.com/lerna-lite/lerna-lite/compare/v1.11.1...v1.11.2) (2022-08-30)

### Bug Fixes

* **version:** `--changelog-header-message` should be added to all logs ([c27a97d](https://github.com/lerna-lite/lerna-lite/commit/c27a97d77d58e09ba746848f93e4a66237231473)) - by @ghiscoding

## [1.11.1](https://github.com/lerna-lite/lerna-lite/compare/v1.11.0...v1.11.1) (2022-08-24)

**Note:** Version bump only for package @lerna-lite/cli

# [1.11.0](https://github.com/lerna-lite/lerna-lite/compare/v1.10.0...v1.11.0) (2022-08-19)

### Features

* **cli:** add JSON schema for `lerna.json` ([fd93826](https://github.com/lerna-lite/lerna-lite/commit/fd93826f8476dc1cfeba33a46b045fa95a7c38c7)) - by @ghiscoding

# [1.10.0](https://github.com/lerna-lite/lerna-lite/compare/v1.9.1...v1.10.0) (2022-08-06)

### Bug Fixes

* **deps:** update all non-major dependencies ([abe1eff](https://github.com/lerna-lite/lerna-lite/commit/abe1eff71fe211c36d05518a43f74da33967a450)) - by @renovate-bot

## [1.9.1](https://github.com/lerna-lite/lerna-lite/compare/v1.9.0...v1.9.1) (2022-08-01)

**Note:** Version bump only for package @lerna-lite/cli

# [1.9.0](https://github.com/lerna-lite/lerna-lite/compare/v1.8.0...v1.9.0) (2022-07-28)

### Bug Fixes

* **version:** rename option to `--changelog-include-commits-git-author` ([b095637](https://github.com/lerna-lite/lerna-lite/commit/b095637cdf1ce57f7ecaabf06480f86623e0553e)) - by @ghiscoding

### Features

* **publish:** disable legacy `verifyAccess` behavior by default ([#274](https://github.com/lerna-lite/lerna-lite/issues/274)) ([fb1852d](https://github.com/lerna-lite/lerna-lite/commit/fb1852d09470cc6d3f74c9a8af87881686eabc34)) - by @ghiscoding
* **version:** option to add commit login username on each changelog entry, closes [#248](https://github.com/lerna-lite/lerna-lite/issues/248) ([#272](https://github.com/lerna-lite/lerna-lite/issues/272)) ([2ca0dca](https://github.com/lerna-lite/lerna-lite/commit/2ca0dcaa005cac6306d7d24ffa4d0d8f1a45e320)) - by @ghiscoding

# [1.8.0](https://github.com/lerna-lite/lerna-lite/compare/v1.6.0...v1.8.0) (2022-07-21)

### Bug Fixes

* **diff:** add `diff` command missing dependency ([#265](https://github.com/lerna-lite/lerna-lite/issues/265)) ([29168f7](https://github.com/lerna-lite/lerna-lite/commit/29168f7457966584817a5ecfb0c90c50f2df12b8)) (by _Ghislain B_)

### Features

* **version:** add flag to include changelog commit author, close [#248](https://github.com/lerna-lite/lerna-lite/issues/248) ([#253](https://github.com/lerna-lite/lerna-lite/issues/253)) ([7fd8db1](https://github.com/lerna-lite/lerna-lite/commit/7fd8db1c80c1da9d857cdac13c6c6cea1c5b8a69)) (by _Ghislain B_)
* **version:** provide custom format to include commit author fullname ([#269](https://github.com/lerna-lite/lerna-lite/issues/269)) ([1f5a94e](https://github.com/lerna-lite/lerna-lite/commit/1f5a94e06de01ceb8143886b5c00fe845173ee9f)) (by _Ghislain B_)

# [1.6.0](https://github.com/lerna-lite/lerna-lite/compare/v1.5.1...v1.6.0) (2022-06-30)

### Features

* **changed:** add Lerna `changed` as optional command ([b08417c](https://github.com/lerna-lite/lerna-lite/commit/b08417c125e6dd4a5a7348e9a1e64b1415dbef90))
* **diff:** add Lerna `diff` as optional command ([44dabb2](https://github.com/lerna-lite/lerna-lite/commit/44dabb21de678822188929fd5effe27ddd7f1e6c))

## [1.5.1](https://github.com/lerna-lite/lerna-lite/compare/v1.5.0...v1.5.1) (2022-06-12)

**Note:** Version bump only for package @lerna-lite/cli

# [1.5.0](https://github.com/lerna-lite/lerna-lite/compare/v1.4.0...v1.5.0) (2022-06-08)

### Bug Fixes

* **deps:** update all non-major dependencies ([c87e937](https://github.com/lerna-lite/lerna-lite/commit/c87e937da725a1d8fa1d685bc3957baf0bcedcee))
* **lock:** add `--package-lockfile-only` to update lock file ([200e385](https://github.com/lerna-lite/lerna-lite/commit/200e38500e046fb99e716b5bc1fc9d87a9c14aab))

# [1.4.0](https://github.com/lerna-lite/lerna-lite/compare/v1.3.0...v1.4.0) (2022-05-30)

### Bug Fixes

* **init:** add missing packages/workspaces ([f78860d](https://github.com/lerna-lite/lerna-lite/commit/f78860d158dc4e3772ca8e33113f79508c4fda83))

### Features

* **list:** add Lerna `list` as optional command ([65f810c](https://github.com/lerna-lite/lerna-lite/commit/65f810cd748b7cd06cc2e649d8513aeb7012f0ec))

# [1.3.0](https://github.com/lerna-lite/lerna-lite/compare/v1.2.0...v1.3.0) (2022-05-13)

### Features

* **init:** add Lerna `init` command to get started ([dfc3311](https://github.com/lerna-lite/lerna-lite/commit/dfc33114e9f17310f36427bc4e0905c634a82bb5))
* **publish:** `workspace:*` (or ~) protocol should strictly match range ([acede60](https://github.com/lerna-lite/lerna-lite/commit/acede60425c9a9b136b86be74b2ef59c03b63646))

# [1.2.0](https://github.com/lerna-lite/lerna-lite/compare/v1.1.1...v1.2.0) (2022-05-11)

**Note:** Version bump only for package @lerna-lite/cli

## [1.1.1](https://github.com/lerna-lite/lerna-lite/compare/v1.1.0...v1.1.1) (2022-05-01)

### Bug Fixes

* **cli:** new `info` must be a CLI dependency ([de0c00c](https://github.com/lerna-lite/lerna-lite/commit/de0c00cccf9b0965bab32f12aa0d8eaa3a080314))

# [1.1.0](https://github.com/lerna-lite/lerna-lite/compare/v1.0.5...v1.1.0) (2022-05-01)

### Features

* **cmd:** breaking, rename dry-run option to `cmd-dry-run` ([01e4777](https://github.com/lerna-lite/lerna-lite/commit/01e47776454bed89db320c17fae0c5c408af4940))

* **exec:** add Lerna `exec` command ([8e87ea1](https://github.com/lerna-lite/lerna-lite/commit/8e87ea1f3a9987e2700b07886e4f600af090f344))

* **info:** add `info` command to CLI ([6fa1154](https://github.com/lerna-lite/lerna-lite/commit/6fa1154a9412c78f26585f41d5612ad083d4494a))

## [1.0.5](https://github.com/lerna-lite/lerna-lite/compare/v1.0.4...v1.0.5) (2022-03-29)

### Bug Fixes

* relax "engines.node" version ([ee59fbc](https://github.com/lerna-lite/lerna-lite/commit/ee59fbcfc7eefa02c85ecff2babd50b1bec112ce))

## [1.0.4](https://github.com/lerna-lite/lerna-lite/compare/v1.0.3...v1.0.4) (2022-03-24)

**Note:** Version bump only for package @lerna-lite/cli

## [1.0.3](https://github.com/lerna-lite/lerna-lite/compare/v1.0.2...v1.0.3) (2022-03-19)

**Note:** Version bump only for package @lerna-lite/cli

## [1.0.2](https://github.com/lerna-lite/lerna-lite/compare/v1.0.1...v1.0.2) (2022-03-17)

**Note:** Version bump only for package @lerna-lite/cli

## [1.0.1](https://github.com/lerna-lite/lerna-lite/compare/v1.0.0...v1.0.1) (2022-03-15)

### Bug Fixes

* **cli:** add mising import-local dependency ([d1942e6](https://github.com/lerna-lite/lerna-lite/commit/d1942e600de03a1337f29e12dfa926a135d72bad))

# [1.0.0](https://github.com/lerna-lite/lerna-lite/compare/v0.3.7...v1.0.0) (2022-03-15)

**Note:** Version bump only for package @lerna-lite/cli

## [0.3.7](https://github.com/lerna-lite/lerna-lite/compare/v0.3.5...v0.3.7) (2022-03-09)

**Note:** Version bump only for package @lerna-lite/cli

## [0.3.6](https://github.com/lerna-lite/lerna-lite/compare/v0.3.4...v0.3.6) (2022-03-05)

### Bug Fixes

* **deps:** update few npm dependencies ([9175d48](https://github.com/lerna-lite/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

## [0.3.5](https://github.com/lerna-lite/lerna-lite/compare/v0.3.4...v0.3.5) (2022-03-05)

### Bug Fixes

* **deps:** update few npm dependencies ([9175d48](https://github.com/lerna-lite/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

## [0.3.4](https://github.com/lerna-lite/lerna-lite/compare/v0.3.3...v0.3.4) (2022-03-05)

**Note:** Version bump only for package @lerna-lite/cli

## [0.3.3](https://github.com/lerna-lite/lerna-lite/compare/v0.3.2...v0.3.3) (2022-02-27)

### Bug Fixes

* **publish:** should publish `from-package` without needing `--bump` ([48cffdd](https://github.com/lerna-lite/lerna-lite/commit/48cffdd30aae7f6c2d5b481b160f5553a4fc2922))

## [0.3.2](https://github.com/lerna-lite/lerna-lite/compare/v0.3.1...v0.3.2) (2022-02-22)

**Note:** Version bump only for package @lerna-lite/cli

## [0.3.1](https://github.com/lerna-lite/lerna-lite/compare/v0.3.0...v0.3.1) (2022-02-12)

**Note:** Version bump only for package @lerna-lite/cli

# [0.3.0](https://github.com/lerna-lite/lerna-lite/compare/v0.2.3...v0.3.0) (2022-02-12)

## BREAKING CHANGE

Rename the lib to Lerna-Lite

## [0.2.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.2...v0.2.3) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/cli

## [0.2.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.1...v0.2.2) (2022-02-11)

### Bug Fixes

* **cli:** load dotenv in CLI to fix env vars not found on Windows ([5f2ab87](https://github.com/ghiscoding/ws-conventional-version-roller/commit/5f2ab87a90861db599bac4e852bdffb7f0619602))

## [0.2.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.0...v0.2.1) (2022-02-11)

### Bug Fixes

* **cli:** yarn throw error w/line ending CRLF, must use LF in bin file ([e1a059a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/e1a059ad7b450ebc798b899e412bc0e6159ee9d1))

# [0.2.0](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.8...v0.2.0) (2022-02-11)

### Bug Fixes

* **publish:** yargs was throwing error bcoz of invalid commented code ([07bb70f](https://github.com/ghiscoding/ws-conventional-version-roller/commit/07bb70fcaf0e2db17490a126f28e199d662e5b77))

### Features

* **cli:** add `ws-roller` CLI for publish & version commands ([6201c1d](https://github.com/ghiscoding/ws-conventional-version-roller/commit/6201c1dc6d016b1c61b4f17855a16ca6562d013a))

* **version:** add `--signoff` git flag ([8eea85a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/8eea85a1e7b233cc8fd542582d61ff59fe597448)), closes [#2897](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2897)

## [0.1.8](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.7...v0.1.8) (2022-02-03)

**Note:** Version bump only for package @ws-conventional-version-roller/cli

## [0.1.7](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.6...v0.1.7) (2022-02-03)

**Note:** Version bump only for package @ws-conventional-version-roller/cli

## [0.1.4](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.3...v0.1.4) (2022-02-01)

### Bug Fixes

* **core:** add `dotenv` to fix create-release on windows ([0af87c7](https://github.com/ghiscoding/ws-conventional-version-roller/commit/0af87c79358495c89e11a6825a4fdc3b8578125d))

## [0.1.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.2...v0.1.3) (2022-01-30)

**Note:** Version bump only for package @ws-conventional-version-roller/cli

## [0.1.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.1...v0.1.2) (2022-01-30)

### Bug Fixes

* **commands:** rename run to roll version/publish commands ([dbfe136](https://github.com/ghiscoding/ws-conventional-version-roller/commit/dbfe1365f6a41726246b57ff221f4f11bc02a66e))

* **publish:** add missing `publishConfig` to each package ([9924956](https://github.com/ghiscoding/ws-conventional-version-roller/commit/9924956f914361734d89a50f085151564ed33c02))

## [0.1.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.0...v0.1.1) (2022-01-30)

**Note:** Version bump only for package @ws-conventional-version-roller/cli

# 0.1.0 (2022-01-30)

### Features

* **build:** initial commit with publish & version roller ([37e32c0](https://github.com/ghiscoding/ws-conventional-version-roller/commit/37e32c0af59b01d2516a8ee89828bd35ad4054cb))
