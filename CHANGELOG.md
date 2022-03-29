# Change Log
### Automate your Workspace Versions, Changelogs & Publish with [Lerna-Lite](https://github.com/ghiscoding/lerna-lite) 🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.5](https://github.com/ghiscoding/lerna-lite/compare/v1.0.4...v1.0.5) (2022-03-29)

### Bug Fixes

* **deps:** move ts-node to devDependencies ([dabb00f](https://github.com/ghiscoding/lerna-lite/commit/dabb00f008807c0dfba076b66c71ce3f8c2ede8f))
* relax "engines.node" version ([ee59fbc](https://github.com/ghiscoding/lerna-lite/commit/ee59fbcfc7eefa02c85ecff2babd50b1bec112ce))

## [1.0.4](https://github.com/ghiscoding/lerna-lite/compare/v1.0.3...v1.0.4) (2022-03-24)

### Bug Fixes

* **version:** load & write project root lockfile v2 only once ([7ad805a](https://github.com/ghiscoding/lerna-lite/commit/7ad805aaeadc2b7646e4e0aa3186830df7448242))

## [1.0.3](https://github.com/ghiscoding/lerna-lite/compare/v1.0.2...v1.0.3) (2022-03-19)

### Bug Fixes

* **version:** project root lockfile v2 should be updated correctly ([2689746](https://github.com/ghiscoding/lerna-lite/commit/2689746bd6515ce326bf5d6d678c706b08753300))

## [1.0.2](https://github.com/ghiscoding/lerna-lite/compare/v1.0.1...v1.0.2) (2022-03-17)

### Bug Fixes

* **version:** show repo info when Create Release is enabled in dry-run ([5b0cf6d](https://github.com/ghiscoding/lerna-lite/commit/5b0cf6d7ed9df1cfbae0072a9402f777403c6dd6))

## [1.0.1](https://github.com/ghiscoding/lerna-lite/compare/v1.0.0...v1.0.1) (2022-03-15)

### Bug Fixes

* **cli:** add mising import-local dependency ([d1942e6](https://github.com/ghiscoding/lerna-lite/commit/d1942e600de03a1337f29e12dfa926a135d72bad))

# [1.0.0](https://github.com/ghiscoding/lerna-lite/compare/v0.3.7...v1.0.0) (2022-03-15)

* **BREAKING CHANGE:** use lerna CLI for all commands, fixes #28

## [0.3.7](https://github.com/ghiscoding/lerna-lite/compare/v0.3.5...v0.3.7) (2022-03-09)

### Bug Fixes

* **core:** better handling of possible missing pkg name ([ef9633d](https://github.com/ghiscoding/lerna-lite/commit/ef9633dfe623e1aca3e9350739317b9c57872b54))

* **publish:** use Lerna code for `detectFromGit` and `detectFromPackage` ([811111f](https://github.com/ghiscoding/lerna-lite/commit/811111fbc0cdd7a91f45da03c8dcd729bb34fa35))

## [0.3.6](https://github.com/ghiscoding/lerna-lite/compare/v0.3.4...v0.3.6) (2022-03-05)

### Bug Fixes

* **deps:** update few npm dependencies ([9175d48](https://github.com/ghiscoding/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

* **deps:** update npm dependencies ([32da06c](https://github.com/ghiscoding/lerna-lite/commit/32da06cdcea86e38561740e95a1782f09a7add00))

## [0.3.5](https://github.com/ghiscoding/lerna-lite/compare/v0.3.4...v0.3.5) (2022-03-05)

### Bug Fixes

* **deps:** update few npm dependencies ([9175d48](https://github.com/ghiscoding/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

## [0.3.4](https://github.com/ghiscoding/lerna-lite/compare/v0.3.3...v0.3.4) (2022-03-05)

### Bug Fixes

* **version:** add missing lifecycle code from lerna ([a0d9e95](https://github.com/ghiscoding/lerna-lite/commit/a0d9e95b4e1cd80f6f6b933534364e85fa952817))

## [0.3.3](https://github.com/ghiscoding/lerna-lite/compare/v0.3.2...v0.3.3) (2022-02-27)

### Bug Fixes

* **publish:** should publish `from-package` without needing `--bump` ([48cffdd](https://github.com/ghiscoding/lerna-lite/commit/48cffdd30aae7f6c2d5b481b160f5553a4fc2922))

## [0.3.2](https://github.com/ghiscoding/lerna-lite/compare/v0.3.1...v0.3.2) (2022-02-22)

### Bug Fixes

* **core:** catch of error should work with `exitCode` and/or `code` ([461ec29](https://github.com/ghiscoding/lerna-lite/commit/461ec2943ccf48393dc5f0b105c76ee5c2260772))

* **core:** OTP please  method had non-strict code ([411f308](https://github.com/ghiscoding/lerna-lite/commit/411f3086d943e0c0d80d9c1a4745775ae7d803e9))

* **version:** add missing code conventional-preset legacy loading ([f0e105d](https://github.com/ghiscoding/lerna-lite/commit/f0e105df8acb267d00fbb46b5cc3b539af86d564))

## [0.3.1](https://github.com/ghiscoding/lerna-lite/compare/v0.3.0...v0.3.1) (2022-02-12)

### Bug Fixes

* **publish:** skip publish when using gitDryRun ([ea97c92](https://github.com/ghiscoding/lerna-lite/commit/ea97c9289ba690c47713d7feb75f0c760b601a15))

* **publish:** skip publish when using gitDryRun ([9408167](https://github.com/ghiscoding/lerna-lite/commit/9408167d0dbd8a8c962a166bd71c86220610acfd))

# [0.3.0](https://github.com/ghiscoding/lerna-lite/compare/v0.2.3...v0.3.0) (2022-02-12)

## BREAKING CHANGE 

Rename the lib to Lerna-Lite

## [0.2.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.2...v0.2.3) (2022-02-11)

### Bug Fixes

* **run:** use optional chaining because of possible null result object ([cca5309](https://github.com/ghiscoding/ws-conventional-version-roller/commit/cca53090ac88c0753d834b0026674a82983be6c6))

## [0.2.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.1...v0.2.2) (2022-02-11)

### Bug Fixes

* **cli:** load dotenv in CLI to fix env vars not found on Windows ([5f2ab87](https://github.com/ghiscoding/ws-conventional-version-roller/commit/5f2ab87a90861db599bac4e852bdffb7f0619602))

## [0.2.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.0...v0.2.1) (2022-02-11)

### Bug Fixes

* **cli:** yarn throw error w/line ending CRLF, must use LF in bin file ([e1a059a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/e1a059ad7b450ebc798b899e412bc0e6159ee9d1))

* **publish:** add missing `--bump` option in publish roller ([57d3db7](https://github.com/ghiscoding/ws-conventional-version-roller/commit/57d3db74d855cb56dd82b3ddc870568b0ee8e0eb))

# [0.2.0](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.8...v0.2.0) (2022-02-11)

### Bug Fixes

* **logs:** disabling the advanced terminal behavior when TERM is dumb ([9994130](https://github.com/ghiscoding/ws-conventional-version-roller/commit/99941301afe65ffd41f3f0cdc891b189cc19aed2)), closes [#2932](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2932)

* **publish:** add version bump in a lockfile v2 format ([7907e81](https://github.com/ghiscoding/ws-conventional-version-roller/commit/7907e81c53f67eab5a29cd239bc58fd053cfd2a1)), closes [#2914](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2914)

* **publish:** yargs was throwing error bcoz of invalid commented code ([07bb70f](https://github.com/ghiscoding/ws-conventional-version-roller/commit/07bb70fcaf0e2db17490a126f28e199d662e5b77))

* **version:** better non-atomic push fallback condition ([7afacb1](https://github.com/ghiscoding/ws-conventional-version-roller/commit/7afacb1ca726350792b748bf21c939f8db12bb28)), closes [#2696](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2696)

* **version:** fix overall exit code of 128 if git push --atomic fails ([175edc5](https://github.com/ghiscoding/ws-conventional-version-roller/commit/175edc5c778d03ca9cffbde0cdacf407d34cb115)), closes [#3005](https://github.com/ghiscoding/ws-conventional-version-roller/issues/3005)

### Features

* **cli:** add `ws-roller` CLI for publish & version commands ([6201c1d](https://github.com/ghiscoding/ws-conventional-version-roller/commit/6201c1dc6d016b1c61b4f17855a16ca6562d013a))

* **core:** drastically reduce time taken to check for cycles ([ddbc9d5](https://github.com/ghiscoding/ws-conventional-version-roller/commit/ddbc9d5d17e021d48fe3fa0e39fcb730b27ab8fe)), closes [#2874](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2874)

* **run:** add `run` command to help run workspace script in parallel ([a71191b](https://github.com/ghiscoding/ws-conventional-version-roller/commit/a71191b71b3af6ac64e9200c1ac1362efaa28b48))

* **run:** Improve output with `--no-bail` ([3d86e53](https://github.com/ghiscoding/ws-conventional-version-roller/commit/3d86e53fd6c7b30b39d36d89c5d7096f44f11c9d)), closes [#2974](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2974)

* **version:** add `--signoff` git flag ([8eea85a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/8eea85a1e7b233cc8fd542582d61ff59fe597448)), closes [#2897](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2897)

## [0.1.8](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.7...v0.1.8) (2022-02-03)

### Bug Fixes

* **build:** fix Promise return type ([31d2469](https://github.com/ghiscoding/ws-conventional-version-roller/commit/31d246998bb784b505d411a75b2cbf7fcc7742db))

* **version:** add npm lock file to git changed files for update ([1c50e5a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/1c50e5af05825f3aed5b18fe4f273262db4aa9f5))

## [0.1.7](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.6...v0.1.7) (2022-02-03)

### Bug Fixes

* **version:** should update npm root lock file when lockfileVersion>=2 ([8bd41fc](https://github.com/ghiscoding/ws-conventional-version-roller/commit/8bd41fc76dea4e025b89380a5ef98c327f23368e))

## [0.1.4](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.3...v0.1.4) (2022-02-01)

### Bug Fixes

* **build:** remove outdated crypto and use default NodeJS pkg instead ([54a812a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/54a812a590685e83542bd7872376ac5970712c23))

* **core:** add `dotenv` to fix create-release on windows ([0af87c7](https://github.com/ghiscoding/ws-conventional-version-roller/commit/0af87c79358495c89e11a6825a4fdc3b8578125d))

## [0.1.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.2...v0.1.3) (2022-01-30)

### Bug Fixes

* **changelog:** add missing options for changelog header msg ([506505e](https://github.com/ghiscoding/ws-conventional-version-roller/commit/506505ed330869c1792d2a4f9cbf345f4aa9731c))

## [0.1.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.1...v0.1.2) (2022-01-30)

### Bug Fixes

* **commands:** rename run to roll version/publish commands ([43e18e0](https://github.com/ghiscoding/ws-conventional-version-roller/commit/43e18e067031e6f1c7bde7aa7cfbc5ae76549f73))

* **commands:** rename run to roll version/publish commands ([dbfe136](https://github.com/ghiscoding/ws-conventional-version-roller/commit/dbfe1365f6a41726246b57ff221f4f11bc02a66e))

* **publish:** add missing `publishConfig` to each package ([9924956](https://github.com/ghiscoding/ws-conventional-version-roller/commit/9924956f914361734d89a50f085151564ed33c02))

* **publish:** get a working publish command ([35f44ff](https://github.com/ghiscoding/ws-conventional-version-roller/commit/35f44fffbaeec6c14b8552ee5b4a20a380945bc0))

* **publish:** remove bump from config to fix version rolling ([73285c9](https://github.com/ghiscoding/ws-conventional-version-roller/commit/73285c92d223860d35449ac897ea0c8a352655b8))

## [0.1.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.0...v0.1.1) (2022-01-30)

**Note:** Version bump only for package ws-conventional-version-roller

# 0.1.0 (2022-01-30)

### Bug Fixes

* **version:** should not throw when changelog.md is missing ([eca9816](https://github.com/ghiscoding/ws-conventional-version-roller/commit/eca981632fc9611f5694cb8479b0711418506a5a))

### Features

* **build:** initial commit with publish & version roller ([37e32c0](https://github.com/ghiscoding/ws-conventional-version-roller/commit/37e32c0af59b01d2516a8ee89828bd35ad4054cb))
