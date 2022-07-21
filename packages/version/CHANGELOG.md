# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.8.0](https://github.com/ghiscoding/lerna-lite/compare/v1.6.0...v1.8.0) (2022-07-21)

### Bug Fixes

* **version:** Node14, import from "fs" instead of "node:fs", fixes [#260](https://github.com/ghiscoding/lerna-lite/issues/260) ([#261](https://github.com/ghiscoding/lerna-lite/issues/261)) ([5e420fd](https://github.com/ghiscoding/lerna-lite/commit/5e420fd4cff05011642f2a5fad4bb5e5f3e60694)) (by _Ghislain B_)
* **version:** rollback previous patch on pnpm lockfile update ([d9f933c](https://github.com/ghiscoding/lerna-lite/commit/d9f933c7c9c118727cb5108b3ef3b0527d0d3f2c)) (by _ghiscoding_)

### Features

* filter for lerna tags in independent mode ([#267](https://github.com/ghiscoding/lerna-lite/issues/267)) ([8c3cdb3](https://github.com/ghiscoding/lerna-lite/commit/8c3cdb38528baf7a4075c846bc33c8933a1a5c0b)) (by _Ghislain B_)
* **version:** add flag to include changelog commit author, close [#248](https://github.com/ghiscoding/lerna-lite/issues/248) ([#253](https://github.com/ghiscoding/lerna-lite/issues/253)) ([7fd8db1](https://github.com/ghiscoding/lerna-lite/commit/7fd8db1c80c1da9d857cdac13c6c6cea1c5b8a69)) (by _Ghislain B_)
* **version:** provide custom format to include commit author fullname ([#269](https://github.com/ghiscoding/lerna-lite/issues/269)) ([1f5a94e](https://github.com/ghiscoding/lerna-lite/commit/1f5a94e06de01ceb8143886b5c00fe845173ee9f)) (by _Ghislain B_)

# [1.6.0](https://github.com/ghiscoding/lerna-lite/compare/v1.5.1...v1.6.0) (2022-06-30)

### Bug Fixes

* **version:** use `--no-frozen-lockfile` instead of `--fix-lockfile` ([a6120b9](https://github.com/ghiscoding/lerna-lite/commit/a6120b9891b719b573ccc2e821cc9ece52d1781d))

## [1.5.1](https://github.com/ghiscoding/lerna-lite/compare/v1.5.0...v1.5.1) (2022-06-12)

### Bug Fixes

* **version:** add better msg for missing `npmClient` with sync lock ([01e26b1](https://github.com/ghiscoding/lerna-lite/commit/01e26b1df86ed09bf090df1d18e38bbbdce1fc1a))

# [1.5.0](https://github.com/ghiscoding/lerna-lite/compare/v1.4.0...v1.5.0) (2022-06-08)

### Bug Fixes

* correctly add npm package lock to git add list ([281586f](https://github.com/ghiscoding/lerna-lite/commit/281586f75e7e98d3d3410ccf95e49c428be2c889))
* **deps:** update all non-major dependencies ([c87e937](https://github.com/ghiscoding/lerna-lite/commit/c87e937da725a1d8fa1d685bc3957baf0bcedcee))
* **lock:** add `--package-lockfile-only` to update lock file ([200e385](https://github.com/ghiscoding/lerna-lite/commit/200e38500e046fb99e716b5bc1fc9d87a9c14aab))
* **version:** improve default git publish message, closes [#185](https://github.com/ghiscoding/lerna-lite/issues/185) ([735fbe6](https://github.com/ghiscoding/lerna-lite/commit/735fbe66069ef0b9389faf850ae7900ddd076f4d))
* **version:** support for updating pnpm-lock.yaml ([509ca33](https://github.com/ghiscoding/lerna-lite/commit/509ca3308a76557891feefa5a0f69e350a0687b7))

### Features

* **version:** support for updating `pnpm-lock.yaml`, expand on [#168](https://github.com/ghiscoding/lerna-lite/issues/168) ([ee1a964](https://github.com/ghiscoding/lerna-lite/commit/ee1a96432675886c887544a59dc88185f5ebbd21))

# [1.4.0](https://github.com/ghiscoding/lerna-lite/compare/v1.3.0...v1.4.0) (2022-05-30)

**Note:** Version bump only for package @lerna-lite/version

# [1.3.0](https://github.com/ghiscoding/lerna-lite/compare/v1.2.0...v1.3.0) (2022-05-13)

### Features

* **publish:** `workspace:*` (or ~) protocol should strictly match range ([acede60](https://github.com/ghiscoding/lerna-lite/commit/acede60425c9a9b136b86be74b2ef59c03b63646))

# [1.2.0](https://github.com/ghiscoding/lerna-lite/compare/v1.1.1...v1.2.0) (2022-05-11)

### Bug Fixes

* **version:** include the updated root package-lock.json file in commits ([d6dbc9a](https://github.com/ghiscoding/lerna-lite/commit/d6dbc9a3aec1f4460546582fad92c1e5d6ee901e))

### Features

* **core:** add version/publish `workspace:` protocol ([ee57dfb](https://github.com/ghiscoding/lerna-lite/commit/ee57dfbb3ad26cd4bd722e1b54941360ec22f698))

# [1.1.0](https://github.com/ghiscoding/lerna-lite/compare/v1.0.5...v1.1.0) (2022-05-01)

### Features

* **exec:** add Lerna `exec` command ([8e87ea1](https://github.com/ghiscoding/lerna-lite/commit/8e87ea1f3a9987e2700b07886e4f600af090f344))

* **info:** add `info` command to CLI ([6fa1154](https://github.com/ghiscoding/lerna-lite/commit/6fa1154a9412c78f26585f41d5612ad083d4494a))

## [1.0.5](https://github.com/ghiscoding/lerna-lite/compare/v1.0.4...v1.0.5) (2022-03-29)

### Bug Fixes

* relax "engines.node" version ([ee59fbc](https://github.com/ghiscoding/lerna-lite/commit/ee59fbcfc7eefa02c85ecff2babd50b1bec112ce))

## [1.0.4](https://github.com/ghiscoding/lerna-lite/compare/v1.0.3...v1.0.4) (2022-03-24)

### Bug Fixes

* **version:** load & write project root lockfile v2 only once ([7ad805a](https://github.com/ghiscoding/lerna-lite/commit/7ad805aaeadc2b7646e4e0aa3186830df7448242))

## [1.0.3](https://github.com/ghiscoding/lerna-lite/compare/v1.0.2...v1.0.3) (2022-03-19)

### Bug Fixes

* **version:** project root lockfile v2 should be updated correctly ([2689746](https://github.com/ghiscoding/lerna-lite/commit/2689746bd6515ce326bf5d6d678c706b08753300))

## [1.0.2](https://github.com/ghiscoding/lerna-lite/compare/v1.0.1...v1.0.2) (2022-03-17)

### Bug Fixes

* **version:** shown repo info when Create Release is enabled in dry-run ([5b0cf6d](https://github.com/ghiscoding/lerna-lite/commit/5b0cf6d7ed9df1cfbae0072a9402f777403c6dd6))

## [1.0.1](https://github.com/ghiscoding/lerna-lite/compare/v1.0.0...v1.0.1) (2022-03-15)

**Note:** Version bump only for package @lerna-lite/version

# [1.0.0](https://github.com/ghiscoding/lerna-lite/compare/v0.3.7...v1.0.0) (2022-03-15)

**Note:** Version bump only for package @lerna-lite/version

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

**Note:** Version bump only for package @lerna-lite/version

## [0.3.2](https://github.com/ghiscoding/lerna-lite/compare/v0.3.1...v0.3.2) (2022-02-22)

### Bug Fixes

* **core:** OTP please  method had non-strict code ([411f308](https://github.com/ghiscoding/lerna-lite/commit/411f3086d943e0c0d80d9c1a4745775ae7d803e9))

## [0.3.1](https://github.com/ghiscoding/lerna-lite/compare/v0.3.0...v0.3.1) (2022-02-12)

**Note:** Version bump only for package @lerna-lite/version

# [0.3.0](https://github.com/ghiscoding/lerna-lite/compare/v0.2.3...v0.3.0) (2022-02-12)

## BREAKING CHANGE

Rename the lib to Lerna-Lite

## [0.2.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.2...v0.2.3) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/version

## [0.2.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.1...v0.2.2) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/version

## [0.2.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.0...v0.2.1) (2022-02-11)

**Note:** Version bump only for package @ws-conventional-version-roller/version

# [0.2.0](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.8...v0.2.0) (2022-02-11)

### Bug Fixes

* **publish:** add version bump in a lockfile v2 format ([7907e81](https://github.com/ghiscoding/ws-conventional-version-roller/commit/7907e81c53f67eab5a29cd239bc58fd053cfd2a1)), closes [#2914](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2914)

* **version:** better non-atomic push fallback condition ([7afacb1](https://github.com/ghiscoding/ws-conventional-version-roller/commit/7afacb1ca726350792b748bf21c939f8db12bb28)), closes [#2696](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2696)

* **version:** fix overall exit code of 128 if git push --atomic fails ([175edc5](https://github.com/ghiscoding/ws-conventional-version-roller/commit/175edc5c778d03ca9cffbde0cdacf407d34cb115)), closes [#3005](https://github.com/ghiscoding/ws-conventional-version-roller/issues/3005)

### Features

* **cli:** add `ws-roller` CLI for publish & version commands ([6201c1d](https://github.com/ghiscoding/ws-conventional-version-roller/commit/6201c1dc6d016b1c61b4f17855a16ca6562d013a))

* **version:** add `--signoff` git flag ([8eea85a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/8eea85a1e7b233cc8fd542582d61ff59fe597448)), closes [#2897](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2897)

## [0.1.8](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.7...v0.1.8) (2022-02-03)

### Bug Fixes

* **build:** fix Promise return type ([31d2469](https://github.com/ghiscoding/ws-conventional-version-roller/commit/31d246998bb784b505d411a75b2cbf7fcc7742db))

* **version:** add npm lock file to git changed files for update ([1c50e5a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/1c50e5af05825f3aed5b18fe4f273262db4aa9f5))

## [0.1.7](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.6...v0.1.7) (2022-02-03)

### Bug Fixes

* **version:** should update npm root lock file when lockfileVersion>=2 ([8bd41fc](https://github.com/ghiscoding/ws-conventional-version-roller/commit/8bd41fc76dea4e025b89380a5ef98c327f23368e))

## [0.1.4](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.3...v0.1.4) (2022-02-01)

**Note:** Version bump only for package @ws-conventional-version-roller/version

## [0.1.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.2...v0.1.3) (2022-01-30)

### Bug Fixes

* **changelog:** add missing options for changelog header msg ([506505e](https://github.com/ghiscoding/ws-conventional-version-roller/commit/506505ed330869c1792d2a4f9cbf345f4aa9731c))

## [0.1.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.1...v0.1.2) (2022-01-30)

### Bug Fixes

* **publish:** add missing `publishConfig` to each package ([9924956](https://github.com/ghiscoding/ws-conventional-version-roller/commit/9924956f914361734d89a50f085151564ed33c02))

## [0.1.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.0...v0.1.1) (2022-01-30)

**Note:** Version bump only for package @ws-conventional-version-roller/version

# 0.1.0 (2022-01-30)

### Features

* **build:** initial commit with publish & version roller ([37e32c0](https://github.com/ghiscoding/ws-conventional-version-roller/commit/37e32c0af59b01d2516a8ee89828bd35ad4054cb))
