# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.8.0](https://github.com/ghiscoding/lerna-lite/compare/v1.6.0...v1.8.0) (2022-07-21)

### Bug Fixes

* **deps:** update all non-major dependencies ([ed1db35](https://github.com/ghiscoding/lerna-lite/commit/ed1db352cd0853dd338bb4a7ebf7998b99eb9f36)) (by _Renovate Bot_)
* **deps:** update all non-major dependencies ([#254](https://github.com/ghiscoding/lerna-lite/issues/254)) ([2d9a0d5](https://github.com/ghiscoding/lerna-lite/commit/2d9a0d563af74ad64cafad9225199668f6f6daf4)) (by _WhiteSource Renovate_)
* **deps:** update dependency @octokit/rest to v19 ([#251](https://github.com/ghiscoding/lerna-lite/issues/251)) ([d0018d7](https://github.com/ghiscoding/lerna-lite/commit/d0018d73f3b17e0d802aa998ce87004f45201d5d)) (by _WhiteSource Renovate_)
* **deps:** update dependency git-url-parse to v12 ([978bf36](https://github.com/ghiscoding/lerna-lite/commit/978bf3666c0d0cdc78e133066b3caf69d127213c)) (by _Renovate Bot_)

### Features

* filter for lerna tags in independent mode ([#267](https://github.com/ghiscoding/lerna-lite/issues/267)) ([8c3cdb3](https://github.com/ghiscoding/lerna-lite/commit/8c3cdb38528baf7a4075c846bc33c8933a1a5c0b)) (by _Ghislain B_)
* **version:** add flag to include changelog commit author, close [#248](https://github.com/ghiscoding/lerna-lite/issues/248) ([#253](https://github.com/ghiscoding/lerna-lite/issues/253)) ([7fd8db1](https://github.com/ghiscoding/lerna-lite/commit/7fd8db1c80c1da9d857cdac13c6c6cea1c5b8a69)) (by _Ghislain B_)
* **version:** provide custom format to include commit author fullname ([#269](https://github.com/ghiscoding/lerna-lite/issues/269)) ([1f5a94e](https://github.com/ghiscoding/lerna-lite/commit/1f5a94e06de01ceb8143886b5c00fe845173ee9f)) (by _Ghislain B_)

# [1.6.0](https://github.com/ghiscoding/lerna-lite/compare/v1.5.1...v1.6.0) (2022-06-30)

### Bug Fixes

* **deps:** update all non-major dependencies ([27921f4](https://github.com/ghiscoding/lerna-lite/commit/27921f4a027bac239eb13d99fd2ab268781cf36c))
* **run:** Nx correctly detect if target dependencies default are set ([4720351](https://github.com/ghiscoding/lerna-lite/commit/47203516ce87830bce8ce6275f5414190c842480))
* **version:** remove `workspace:` prefix on peerDeps & few refactor ([6e4e5b7](https://github.com/ghiscoding/lerna-lite/commit/6e4e5b7b75effb8f48957bc098edb47a6251cee2))

### Features

* **changed:** add Lerna `changed` as optional command ([b08417c](https://github.com/ghiscoding/lerna-lite/commit/b08417c125e6dd4a5a7348e9a1e64b1415dbef90))
* **diff:** add Lerna `diff` as optional command ([44dabb2](https://github.com/ghiscoding/lerna-lite/commit/44dabb21de678822188929fd5effe27ddd7f1e6c))

## [1.5.1](https://github.com/ghiscoding/lerna-lite/compare/v1.5.0...v1.5.1) (2022-06-12)

### Bug Fixes

* **version:** remove `workspace:` prefix on external deps, fixes [#200](https://github.com/ghiscoding/lerna-lite/issues/200) ([8d89256](https://github.com/ghiscoding/lerna-lite/commit/8d89256705e6f70b07213d823d3175c0bcf65598))

# [1.5.0](https://github.com/ghiscoding/lerna-lite/compare/v1.4.0...v1.5.0) (2022-06-08)

### Bug Fixes

* **deps:** update all non-major dependencies ([c87e937](https://github.com/ghiscoding/lerna-lite/commit/c87e937da725a1d8fa1d685bc3957baf0bcedcee))
* **deps:** update dependency @npmcli/run-script to v4 ([29a09a9](https://github.com/ghiscoding/lerna-lite/commit/29a09a99204e7faafa626173d39ad9752efe891d))
* **lock:** add `--package-lockfile-only` to update lock file ([200e385](https://github.com/ghiscoding/lerna-lite/commit/200e38500e046fb99e716b5bc1fc9d87a9c14aab))
* **version:** keep operator in `workspace:` protocol, fixes [#198](https://github.com/ghiscoding/lerna-lite/issues/198) ([1794ccd](https://github.com/ghiscoding/lerna-lite/commit/1794ccd769d90a47671a5f4b62c065cec39a401a))
* **version:** support for updating pnpm-lock.yaml ([509ca33](https://github.com/ghiscoding/lerna-lite/commit/509ca3308a76557891feefa5a0f69e350a0687b7))

# [1.4.0](https://github.com/ghiscoding/lerna-lite/compare/v1.3.0...v1.4.0) (2022-05-30)

### Bug Fixes

* **core:** replace `npm-lifecycle` with `@npmcli/run-script` ([6ab0e8d](https://github.com/ghiscoding/lerna-lite/commit/6ab0e8d90098c7d4f70bf63552c0240ba9a93e10)), closes [#60](https://github.com/ghiscoding/lerna-lite/issues/60) [#3134](https://github.com/ghiscoding/lerna-lite/issues/3134)
* **init:** add missing packages/workspaces ([f78860d](https://github.com/ghiscoding/lerna-lite/commit/f78860d158dc4e3772ca8e33113f79508c4fda83))

### Features

* **list:** add Lerna `list` as optional command ([65f810c](https://github.com/ghiscoding/lerna-lite/commit/65f810cd748b7cd06cc2e649d8513aeb7012f0ec))
* **run:** add experimental support to `run` tasks via Nx ([743d434](https://github.com/ghiscoding/lerna-lite/commit/743d4347e37198ddd6c0915f99daaf852cf800de)), closes [#3139](https://github.com/ghiscoding/lerna-lite/issues/3139)

# [1.3.0](https://github.com/ghiscoding/lerna-lite/compare/v1.2.0...v1.3.0) (2022-05-13)

### Features

* **init:** add Lerna `init` command to get started ([dfc3311](https://github.com/ghiscoding/lerna-lite/commit/dfc33114e9f17310f36427bc4e0905c634a82bb5))
* **publish:** `workspace:*` (or ~) protocol should strictly match range ([acede60](https://github.com/ghiscoding/lerna-lite/commit/acede60425c9a9b136b86be74b2ef59c03b63646))

# [1.2.0](https://github.com/ghiscoding/lerna-lite/compare/v1.1.1...v1.2.0) (2022-05-11)

### Bug Fixes

* **url:** deprecation notice of git.io ([816b7cb](https://github.com/ghiscoding/lerna-lite/commit/816b7cbdaca6eb4411097c517c6e29c6a7008cdd)), closes [#3116](https://github.com/ghiscoding/lerna-lite/issues/3116)

### Features

* **core:** add version/publish `workspace:` protocol ([ee57dfb](https://github.com/ghiscoding/lerna-lite/commit/ee57dfbb3ad26cd4bd722e1b54941360ec22f698))
* **core:** Support the `workspace:` protocol ([67d8ba1](https://github.com/ghiscoding/lerna-lite/commit/67d8ba18be5ba915547b8d8eda2c46b13f6410d2))

# [1.1.0](https://github.com/ghiscoding/lerna-lite/compare/v1.0.5...v1.1.0) (2022-05-01)

**Note:** Version bump only for package @lerna-lite/core

## [1.0.5](https://github.com/ghiscoding/lerna-lite/compare/v1.0.4...v1.0.5) (2022-03-29)

### Bug Fixes

* **deps:** move ts-node to devDependencies ([dabb00f](https://github.com/ghiscoding/lerna-lite/commit/dabb00f008807c0dfba076b66c71ce3f8c2ede8f))

* relax "engines.node" version ([ee59fbc](https://github.com/ghiscoding/lerna-lite/commit/ee59fbcfc7eefa02c85ecff2babd50b1bec112ce))

## [1.0.4](https://github.com/ghiscoding/lerna-lite/compare/v1.0.3...v1.0.4) (2022-03-24)

**Note:** Version bump only for package @lerna-lite/core

## [1.0.3](https://github.com/ghiscoding/lerna-lite/compare/v1.0.2...v1.0.3) (2022-03-19)

**Note:** Version bump only for package @lerna-lite/core

## [1.0.2](https://github.com/ghiscoding/lerna-lite/compare/v1.0.1...v1.0.2) (2022-03-17)

### Bug Fixes

* **version:** shown repo info when Create Release is enabled in dry-run ([5b0cf6d](https://github.com/ghiscoding/lerna-lite/commit/5b0cf6d7ed9df1cfbae0072a9402f777403c6dd6))

## [1.0.1](https://github.com/ghiscoding/lerna-lite/compare/v1.0.0...v1.0.1) (2022-03-15)

**Note:** Version bump only for package @lerna-lite/core

# [1.0.0](https://github.com/ghiscoding/lerna-lite/compare/v0.3.7...v1.0.0) (2022-03-15)

**Note:** Version bump only for package @lerna-lite/core

## [0.3.7](https://github.com/ghiscoding/lerna-lite/compare/v0.3.5...v0.3.7) (2022-03-09)

### Bug Fixes

* **core:** better handling of possible missing pkg name ([ef9633d](https://github.com/ghiscoding/lerna-lite/commit/ef9633dfe623e1aca3e9350739317b9c57872b54))

## [0.3.6](https://github.com/ghiscoding/lerna-lite/compare/v0.3.4...v0.3.6) (2022-03-05)

### Bug Fixes

* **deps:** update few npm dependencies ([9175d48](https://github.com/ghiscoding/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

## [0.3.5](https://github.com/ghiscoding/lerna-lite/compare/v0.3.4...v0.3.5) (2022-03-05)

### Bug Fixes

* **deps:** update few npm dependencies ([9175d48](https://github.com/ghiscoding/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

## [0.3.4](https://github.com/ghiscoding/lerna-lite/compare/v0.3.3...v0.3.4) (2022-03-05)

### Bug Fixes

* **version:** add missing lifecycle code from lerna ([a0d9e95](https://github.com/ghiscoding/lerna-lite/commit/a0d9e95b4e1cd80f6f6b933534364e85fa952817))

## [0.3.3](https://github.com/ghiscoding/lerna-lite/compare/v0.3.2...v0.3.3) (2022-02-27)

**Note:** Version bump only for package @lerna-lite/core

## [0.3.2](https://github.com/ghiscoding/lerna-lite/compare/v0.3.1...v0.3.2) (2022-02-22)

### Bug Fixes

* **core:** catch of error should work with `exitCode` and/or `code` ([461ec29](https://github.com/ghiscoding/lerna-lite/commit/461ec2943ccf48393dc5f0b105c76ee5c2260772))

* **core:** OTP please  method had non-strict code ([411f308](https://github.com/ghiscoding/lerna-lite/commit/411f3086d943e0c0d80d9c1a4745775ae7d803e9))

* **version:** add missing code conventional-preset legacy loading ([f0e105d](https://github.com/ghiscoding/lerna-lite/commit/f0e105df8acb267d00fbb46b5cc3b539af86d564))

## [0.3.1](https://github.com/ghiscoding/lerna-lite/compare/v0.3.0...v0.3.1) (2022-02-12)

### Bug Fixes

* **publish:** skip publish when using gitDryRun ([9408167](https://github.com/ghiscoding/lerna-lite/commit/9408167d0dbd8a8c962a166bd71c86220610acfd))

# [0.3.0](https://github.com/ghiscoding/lerna-lite/compare/v0.2.3...v0.3.0) (2022-02-12)

## BREAKING CHANGE

Rename the lib to Lerna-Lite

## [0.2.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.2...v0.2.3) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/core

## [0.2.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.1...v0.2.2) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/core

## [0.2.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.0...v0.2.1) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/core

# [0.2.0](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.8...v0.2.0) (2022-02-11)

### Bug Fixes

* **logs:** disabling the advanced terminal behavior when TERM is dumb ([9994130](https://github.com/ghiscoding/ws-conventional-version-roller/commit/99941301afe65ffd41f3f0cdc891b189cc19aed2)), closes [#2932](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2932)

### Features

* **cli:** add `ws-roller` CLI for publish & version commands ([6201c1d](https://github.com/ghiscoding/ws-conventional-version-roller/commit/6201c1dc6d016b1c61b4f17855a16ca6562d013a))

* **core:** drastically reduce time taken to check for cycles ([ddbc9d5](https://github.com/ghiscoding/ws-conventional-version-roller/commit/ddbc9d5d17e021d48fe3fa0e39fcb730b27ab8fe)), closes [#2874](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2874)

* **run:** add `run` command to help run workspace script in parallel ([a71191b](https://github.com/ghiscoding/ws-conventional-version-roller/commit/a71191b71b3af6ac64e9200c1ac1362efaa28b48))

## [0.1.8](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.7...v0.1.8) (2022-02-03)

**Note:** Version bump only for package @ws-conventional-version-roller/core

## [0.1.7](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.6...v0.1.7) (2022-02-03)

### Bug Fixes

* **version:** should update npm root lock file when lockfileVersion>=2 ([8bd41fc](https://github.com/ghiscoding/ws-conventional-version-roller/commit/8bd41fc76dea4e025b89380a5ef98c327f23368e))

## [0.1.4](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.3...v0.1.4) (2022-02-01)

**Note:** Version bump only for package @ws-conventional-version-roller/core

## [0.1.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.2...v0.1.3) (2022-01-30)

**Note:** Version bump only for package @ws-conventional-version-roller/core

## [0.1.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.1...v0.1.2) (2022-01-30)

### Bug Fixes

* **commands:** rename run to roll version/publish commands ([43e18e0](https://github.com/ghiscoding/ws-conventional-version-roller/commit/43e18e067031e6f1c7bde7aa7cfbc5ae76549f73))

* **publish:** add missing `publishConfig` to each package ([9924956](https://github.com/ghiscoding/ws-conventional-version-roller/commit/9924956f914361734d89a50f085151564ed33c02))

## [0.1.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.0...v0.1.1) (2022-01-30)

**Note:** Version bump only for package @ws-conventional-version-roller/core

# 0.1.0 (2022-01-30)

### Bug Fixes

* **version:** should not throw when changelog.md is missing ([eca9816](https://github.com/ghiscoding/ws-conventional-version-roller/commit/eca981632fc9611f5694cb8479b0711418506a5a))

### Features

* **build:** initial commit with publish & version roller ([37e32c0](https://github.com/ghiscoding/ws-conventional-version-roller/commit/37e32c0af59b01d2516a8ee89828bd35ad4054cb))
