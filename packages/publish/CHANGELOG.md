# Change Log
## Automate your Workspace Versioning, Publishing & Changelogs with [Lerna-Lite](https://github.com/lerna-lite/lerna-lite) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.13.0](https://github.com/lerna-lite/lerna-lite/compare/v1.12.0...v1.13.0) (2022-11-22)

### Bug Fixes

* **deps:** libnpmaccess was rewritten, lsPackages is now getPackages ([#401](https://github.com/lerna-lite/lerna-lite/issues/401)) ([abb78b0](https://github.com/lerna-lite/lerna-lite/commit/abb78b0178e33ee0911aebea28a396b75897635d)) - by @ghiscoding
* **deps:** npm-package-arg now normalize x, x@, x@* ([#400](https://github.com/lerna-lite/lerna-lite/issues/400)) ([41b6eaa](https://github.com/lerna-lite/lerna-lite/commit/41b6eaa7077801084c8cb6308aba4cf2285f7063)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#402](https://github.com/lerna-lite/lerna-lite/issues/402)) ([3feeea9](https://github.com/lerna-lite/lerna-lite/commit/3feeea9559cafdf84f4b025950d7e4a862104284)) - by @renovate-bot
* **deps:** update all non-major dependencies ([#405](https://github.com/lerna-lite/lerna-lite/issues/405)) ([084da4f](https://github.com/lerna-lite/lerna-lite/commit/084da4f409b38f66bc1c5d4d2ef43f9a221ca80b)) - by @renovate-bot
* **deps:** update all non-major dependencies ([#414](https://github.com/lerna-lite/lerna-lite/issues/414)) ([267fced](https://github.com/lerna-lite/lerna-lite/commit/267fced53045193e6a3a7b53fcfc58b6a961bcdc)) - by @renovate-bot
* **deps:** update dependency @npmcli/arborist to v6 ([#396](https://github.com/lerna-lite/lerna-lite/issues/396)) ([39b0feb](https://github.com/lerna-lite/lerna-lite/commit/39b0feba0938dcd7082ba9fa2e8350c637c0e36c)) - by @renovate-bot
* **deps:** update dependency libnpmpublish to v7 ([#399](https://github.com/lerna-lite/lerna-lite/issues/399)) ([4eaea64](https://github.com/lerna-lite/lerna-lite/commit/4eaea642ad336d1a2739ba63812367df114aa03e)) - by @renovate-bot

### Features

* **publish:** apply publishConfig overrides, closes [#404](https://github.com/lerna-lite/lerna-lite/issues/404) ([#415](https://github.com/lerna-lite/lerna-lite/issues/415)) ([03e8157](https://github.com/lerna-lite/lerna-lite/commit/03e81571b8e68bc54fa69afbbc00f6338b39b19f)) - by @ghiscoding

# [1.12.0](https://github.com/lerna-lite/lerna-lite/compare/v1.11.3...v1.12.0) (2022-10-14)

### Bug Fixes

* bump min Node version to >=14.17.0 to align with external deps ([#387](https://github.com/lerna-lite/lerna-lite/issues/387)) ([2f804e9](https://github.com/lerna-lite/lerna-lite/commit/2f804e92bd319e2b27b1406ca82ec1fdab09c449)) - by @ghiscoding
* **deps:** update dependency npm-packlist to v6 ([4241c2f](https://github.com/lerna-lite/lerna-lite/commit/4241c2f8b530538fc2ea1dec3dbfebb438056470)) - by @renovate-bot
* **deps:** update dependency npmlog to v7 ([#389](https://github.com/lerna-lite/lerna-lite/issues/389)) ([d2110f1](https://github.com/lerna-lite/lerna-lite/commit/d2110f1aebe4b6cd44bcae2691fbd18fefc78299)) - by @renovate-bot
* **deps:** update dependency read-package-json to v6 ([#390](https://github.com/lerna-lite/lerna-lite/issues/390)) ([c585090](https://github.com/lerna-lite/lerna-lite/commit/c5850900957dec8d6dd6f7542ee2e088315ee338)) - by @renovate-bot
* **deps:** update dependency ssri to v10 ([#385](https://github.com/lerna-lite/lerna-lite/issues/385)) ([04457c9](https://github.com/lerna-lite/lerna-lite/commit/04457c95efd4c135adab9e70de66d5942aa9d18e)) - by @renovate-bot
* **deps:** upgrading pacote & npm-packlist to v7 requires arborist tree ([#367](https://github.com/lerna-lite/lerna-lite/issues/367)) ([8c34a3b](https://github.com/lerna-lite/lerna-lite/commit/8c34a3bccf582f90543b80253d065b22bddd8e35)) - by @ghiscoding
* **npm-publish:** Allows disabling of strict SSL checks ([#374](https://github.com/lerna-lite/lerna-lite/issues/374)) ([a26d849](https://github.com/lerna-lite/lerna-lite/commit/a26d8491dcbe2b3867c9f07c93db6d58d7358198)) - by @ghiscoding

### Features

* **commands:** rename `git-dry-run` and `cmd-dry-run` to simply `dry-run` ([#377](https://github.com/lerna-lite/lerna-lite/issues/377)) ([3a55f5e](https://github.com/lerna-lite/lerna-lite/commit/3a55f5e8f7c26f3890f1c7099ca85c9d72cd2674)) - by @ghiscoding
* **publish:** add new option `--remove-package-fields` before publish ([#359](https://github.com/lerna-lite/lerna-lite/issues/359)) ([45a2107](https://github.com/lerna-lite/lerna-lite/commit/45a2107aa8862546a261a0c377c3fc704248bc5a)) - by @ghiscoding
* **version:** add `--allow-peer-dependencies-update`, closes [#333](https://github.com/lerna-lite/lerna-lite/issues/333) ([#363](https://github.com/lerna-lite/lerna-lite/issues/363)) ([efaf011](https://github.com/lerna-lite/lerna-lite/commit/efaf0111e2e687718d33b42418abd701447a7031)) - by @ghiscoding

## [1.11.3](https://github.com/lerna-lite/lerna-lite/compare/v1.11.2...v1.11.3) (2022-09-20)

**Note:** Version bump only for package @lerna-lite/publish

## [1.11.2](https://github.com/lerna-lite/lerna-lite/compare/v1.11.1...v1.11.2) (2022-08-30)

**Note:** Version bump only for package @lerna-lite/publish

## [1.11.1](https://github.com/lerna-lite/lerna-lite/compare/v1.11.0...v1.11.1) (2022-08-24)

**Note:** Version bump only for package @lerna-lite/publish

# [1.11.0](https://github.com/lerna-lite/lerna-lite/compare/v1.10.0...v1.11.0) (2022-08-19)

### Bug Fixes

* **deps:** update all non-major dependencies ([e3b379c](https://github.com/lerna-lite/lerna-lite/commit/e3b379cc1b2bc9632801950e24ebf964780c8aaf)) - by @renovate-bot
* **deps:** update all non-major dependencies ([e8dcfec](https://github.com/lerna-lite/lerna-lite/commit/e8dcfece2a45eb6648c3b76f4938d521078673e8)) - by @renovate-bot

# [1.10.0](https://github.com/lerna-lite/lerna-lite/compare/v1.9.1...v1.10.0) (2022-08-06)

### Bug Fixes

* **core:** ensure to touch all nodes in package-graph ([f4f7bbc](https://github.com/lerna-lite/lerna-lite/commit/f4f7bbc60a7331a4077e2bf974bb5abffdb4e804)) - by @ghiscoding
* **deps:** update all non-major dependencies ([abe1eff](https://github.com/lerna-lite/lerna-lite/commit/abe1eff71fe211c36d05518a43f74da33967a450)) - by @renovate-bot

## [1.9.1](https://github.com/lerna-lite/lerna-lite/compare/v1.9.0...v1.9.1) (2022-08-01)

### Bug Fixes

* **publish:** should only warn when using `--no-workspace-strict-match` ([37dd3e7](https://github.com/lerna-lite/lerna-lite/commit/37dd3e7d51c869e3ecd6b2ea0965489038f62d19)) - by @ghiscoding

# [1.9.0](https://github.com/lerna-lite/lerna-lite/compare/v1.8.0...v1.9.0) (2022-07-28)

### Bug Fixes

* **run-lifecycle:** lifecycle events should run to completion in series ([#275](https://github.com/lerna-lite/lerna-lite/issues/275)) ([8e45a1e](https://github.com/lerna-lite/lerna-lite/commit/8e45a1ef62dfca3a0f30f6375efc496d57f3ddc1)) - by @ghiscoding

### Features

* **publish:** disable legacy `verifyAccess` behavior by default ([#274](https://github.com/lerna-lite/lerna-lite/issues/274)) ([fb1852d](https://github.com/lerna-lite/lerna-lite/commit/fb1852d09470cc6d3f74c9a8af87881686eabc34)) - by @ghiscoding
* **publish:** include all deps in package graph by default, allow no-sort ([#277](https://github.com/lerna-lite/lerna-lite/issues/277)) ([3229e77](https://github.com/lerna-lite/lerna-lite/commit/3229e7765907bf3bcf208baca876054a5a1cec5e)) - by @ghiscoding

# [1.8.0](https://github.com/lerna-lite/lerna-lite/compare/v1.6.0...v1.8.0) (2022-07-21)

### Bug Fixes

* **deps:** update all non-major dependencies ([ed1db35](https://github.com/lerna-lite/lerna-lite/commit/ed1db352cd0853dd338bb4a7ebf7998b99eb9f36)) (by _Renovate Bot_)
* **deps:** update all non-major dependencies ([#254](https://github.com/lerna-lite/lerna-lite/issues/254)) ([2d9a0d5](https://github.com/lerna-lite/lerna-lite/commit/2d9a0d563af74ad64cafad9225199668f6f6daf4)) (by _WhiteSource Renovate_)

### Features

* filter for lerna tags in independent mode ([#267](https://github.com/lerna-lite/lerna-lite/issues/267)) ([8c3cdb3](https://github.com/lerna-lite/lerna-lite/commit/8c3cdb38528baf7a4075c846bc33c8933a1a5c0b)) (by _Ghislain B_)

# [1.6.0](https://github.com/lerna-lite/lerna-lite/compare/v1.5.1...v1.6.0) (2022-06-30)

### Bug Fixes

* **deps:** update all non-major dependencies ([27921f4](https://github.com/lerna-lite/lerna-lite/commit/27921f4a027bac239eb13d99fd2ab268781cf36c))
* **version:** remove `workspace:` prefix on peerDeps & few refactor ([6e4e5b7](https://github.com/lerna-lite/lerna-lite/commit/6e4e5b7b75effb8f48957bc098edb47a6251cee2))

## [1.5.1](https://github.com/lerna-lite/lerna-lite/compare/v1.5.0...v1.5.1) (2022-06-12)

### Bug Fixes

* **version:** remove `workspace:` prefix on external deps, fixes [#200](https://github.com/lerna-lite/lerna-lite/issues/200) ([8d89256](https://github.com/lerna-lite/lerna-lite/commit/8d89256705e6f70b07213d823d3175c0bcf65598))

# [1.5.0](https://github.com/lerna-lite/lerna-lite/compare/v1.4.0...v1.5.0) (2022-06-08)

### Bug Fixes

* **deps:** update all non-major dependencies ([c87e937](https://github.com/lerna-lite/lerna-lite/commit/c87e937da725a1d8fa1d685bc3957baf0bcedcee))
* **version:** keep operator in `workspace:` protocol, fixes [#198](https://github.com/lerna-lite/lerna-lite/issues/198) ([1794ccd](https://github.com/lerna-lite/lerna-lite/commit/1794ccd769d90a47671a5f4b62c065cec39a401a))

# [1.4.0](https://github.com/lerna-lite/lerna-lite/compare/v1.3.0...v1.4.0) (2022-05-30)

**Note:** Version bump only for package @lerna-lite/publish

# [1.3.0](https://github.com/lerna-lite/lerna-lite/compare/v1.2.0...v1.3.0) (2022-05-13)

### Features

* **publish:** `workspace:*` (or ~) protocol should strictly match range ([acede60](https://github.com/lerna-lite/lerna-lite/commit/acede60425c9a9b136b86be74b2ef59c03b63646))

# [1.2.0](https://github.com/lerna-lite/lerna-lite/compare/v1.1.1...v1.2.0) (2022-05-11)

### Bug Fixes

* **url:** deprecation notice of git.io ([816b7cb](https://github.com/lerna-lite/lerna-lite/commit/816b7cbdaca6eb4411097c517c6e29c6a7008cdd)), closes [#3116](https://github.com/lerna-lite/lerna-lite/issues/3116)

### Features

* **core:** add version/publish `workspace:` protocol ([ee57dfb](https://github.com/lerna-lite/lerna-lite/commit/ee57dfbb3ad26cd4bd722e1b54941360ec22f698))

# [1.1.0](https://github.com/lerna-lite/lerna-lite/compare/v1.0.5...v1.1.0) (2022-05-01)

### Features

* **exec:** add Lerna `exec` command ([8e87ea1](https://github.com/lerna-lite/lerna-lite/commit/8e87ea1f3a9987e2700b07886e4f600af090f344))

* **info:** add `info` command to CLI ([6fa1154](https://github.com/lerna-lite/lerna-lite/commit/6fa1154a9412c78f26585f41d5612ad083d4494a))

## [1.0.5](https://github.com/lerna-lite/lerna-lite/compare/v1.0.4...v1.0.5) (2022-03-29)

### Bug Fixes

* **deps:** move ts-node to devDependencies ([dabb00f](https://github.com/lerna-lite/lerna-lite/commit/dabb00f008807c0dfba076b66c71ce3f8c2ede8f))

* relax "engines.node" version ([ee59fbc](https://github.com/lerna-lite/lerna-lite/commit/ee59fbcfc7eefa02c85ecff2babd50b1bec112ce))

## [1.0.4](https://github.com/lerna-lite/lerna-lite/compare/v1.0.3...v1.0.4) (2022-03-24)

**Note:** Version bump only for package @lerna-lite/publish

## [1.0.3](https://github.com/lerna-lite/lerna-lite/compare/v1.0.2...v1.0.3) (2022-03-19)

**Note:** Version bump only for package @lerna-lite/publish

## [1.0.2](https://github.com/lerna-lite/lerna-lite/compare/v1.0.1...v1.0.2) (2022-03-17)

**Note:** Version bump only for package @lerna-lite/publish

## [1.0.1](https://github.com/lerna-lite/lerna-lite/compare/v1.0.0...v1.0.1) (2022-03-15)

**Note:** Version bump only for package @lerna-lite/publish

# [1.0.0](https://github.com/lerna-lite/lerna-lite/compare/v0.3.7...v1.0.0) (2022-03-15)

**Note:** Version bump only for package @lerna-lite/publish

## [0.3.7](https://github.com/lerna-lite/lerna-lite/compare/v0.3.5...v0.3.7) (2022-03-09)

### Bug Fixes

* **core:** better handling of possible missing pkg name ([ef9633d](https://github.com/lerna-lite/lerna-lite/commit/ef9633dfe623e1aca3e9350739317b9c57872b54))

* **publish:** use Lerna code for `detectFromGit` and `detectFromPackage` ([811111f](https://github.com/lerna-lite/lerna-lite/commit/811111fbc0cdd7a91f45da03c8dcd729bb34fa35))

## [0.3.6](https://github.com/lerna-lite/lerna-lite/compare/v0.3.4...v0.3.6) (2022-03-05)

### Bug Fixes

* **deps:** update few npm dependencies ([9175d48](https://github.com/lerna-lite/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

## [0.3.5](https://github.com/lerna-lite/lerna-lite/compare/v0.3.4...v0.3.5) (2022-03-05)

### Bug Fixes

* **deps:** update few npm dependencies ([9175d48](https://github.com/lerna-lite/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

## [0.3.4](https://github.com/lerna-lite/lerna-lite/compare/v0.3.3...v0.3.4) (2022-03-05)

### Bug Fixes

* **version:** add missing lifecycle code from lerna ([a0d9e95](https://github.com/lerna-lite/lerna-lite/commit/a0d9e95b4e1cd80f6f6b933534364e85fa952817))

## [0.3.3](https://github.com/lerna-lite/lerna-lite/compare/v0.3.2...v0.3.3) (2022-02-27)

**Note:** Version bump only for package @lerna-lite/publish

## [0.3.2](https://github.com/lerna-lite/lerna-lite/compare/v0.3.1...v0.3.2) (2022-02-22)

### Bug Fixes

* **core:** OTP please  method had non-strict code ([411f308](https://github.com/lerna-lite/lerna-lite/commit/411f3086d943e0c0d80d9c1a4745775ae7d803e9))

## [0.3.1](https://github.com/lerna-lite/lerna-lite/compare/v0.3.0...v0.3.1) (2022-02-12)

### Bug Fixes

* **publish:** skip publish when using gitDryRun ([ea97c92](https://github.com/lerna-lite/lerna-lite/commit/ea97c9289ba690c47713d7feb75f0c760b601a15))

* **publish:** skip publish when using gitDryRun ([9408167](https://github.com/lerna-lite/lerna-lite/commit/9408167d0dbd8a8c962a166bd71c86220610acfd))

# [0.3.0](https://github.com/lerna-lite/lerna-lite/compare/v0.2.3...v0.3.0) (2022-02-12)

## BREAKING CHANGE

Rename the lib to Lerna-Lite

## [0.2.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.2...v0.2.3) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/publish

## [0.2.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.1...v0.2.2) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/publish

## [0.2.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.0...v0.2.1) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/publish

# [0.2.0](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.8...v0.2.0) (2022-02-11)

### Features

* **cli:** add `ws-roller` CLI for publish & version commands ([6201c1d](https://github.com/ghiscoding/ws-conventional-version-roller/commit/6201c1dc6d016b1c61b4f17855a16ca6562d013a))

## [0.1.8](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.7...v0.1.8) (2022-02-03)

**Note:** Version bump only for package @ws-conventional-version-roller/publish

## [0.1.7](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.6...v0.1.7) (2022-02-03)

**Note:** Version bump only for package @ws-conventional-version-roller/publish

## [0.1.4](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.3...v0.1.4) (2022-02-01)

### Bug Fixes

* **build:** remove outdated crypto and use default NodeJS pkg instead ([54a812a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/54a812a590685e83542bd7872376ac5970712c23))

## [0.1.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.2...v0.1.3) (2022-01-30)

**Note:** Version bump only for package @ws-conventional-version-roller/publish

## [0.1.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.1...v0.1.2) (2022-01-30)

### Bug Fixes

* **publish:** add missing `publishConfig` to each package ([9924956](https://github.com/ghiscoding/ws-conventional-version-roller/commit/9924956f914361734d89a50f085151564ed33c02))

* **publish:** get a working publish command ([35f44ff](https://github.com/ghiscoding/ws-conventional-version-roller/commit/35f44fffbaeec6c14b8552ee5b4a20a380945bc0))

## [0.1.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.0...v0.1.1) (2022-01-30)

**Note:** Version bump only for package @ws-conventional-version-roller/publish

# 0.1.0 (2022-01-30)

### Features

* **build:** initial commit with publish & version roller ([37e32c0](https://github.com/ghiscoding/ws-conventional-version-roller/commit/37e32c0af59b01d2516a8ee89828bd35ad4054cb))
