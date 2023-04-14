# Change Log
## Automate your Workspace Versioning, Publishing & Changelogs with [Lerna-Lite](https://github.com/lerna-lite/lerna-lite) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.0](https://github.com/lerna-lite/lerna-lite/compare/v1.17.0...v2.0.0) (2023-04-14)

### ⚠ BREAKING CHANGES

* **build:** prepare official Lerna-Lite 2.0 release (#567)

### Features

* **build:** prepare official Lerna-Lite 2.0 release ([#567](https://github.com/lerna-lite/lerna-lite/issues/567)) ([2865a60](https://github.com/lerna-lite/lerna-lite/commit/2865a604fe85e498cc8c4410cead51ad067a41e0)), closes [#537](https://github.com/lerna-lite/lerna-lite/issues/537) - by @ghiscoding

## [2.0.0-alpha.2](https://github.com/lerna-lite/lerna-lite/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2023-04-07)

**Note:** Version bump only for package @lerna-lite/version

## [2.0.0-alpha.1](https://github.com/lerna-lite/lerna-lite/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (2023-04-07)

**Note:** Version bump only for package @lerna-lite/version

## [2.0.0-alpha.0](https://github.com/lerna-lite/lerna-lite/compare/v1.17.0...v2.0.0-alpha.0) (2023-04-07)

### ⚠ BREAKING CHANGES

* **publish:** make version & publish commands optionnal, closes #450 (#552)
* **build:** migrate to ESM build & switch to Vitest for ESM support (#537)

### Features

* **build:** migrate to ESM build & switch to Vitest for ESM support ([#537](https://github.com/lerna-lite/lerna-lite/issues/537)) ([308fc2e](https://github.com/lerna-lite/lerna-lite/commit/308fc2e2d72d90f62b3a3954cbeeb3810b767a35)) - by @ghiscoding
* **cli:** remove listable dependency from CLI ([#553](https://github.com/lerna-lite/lerna-lite/issues/553)) ([1baa0d1](https://github.com/lerna-lite/lerna-lite/commit/1baa0d19b7116dac56c9326934c7cc9e07caec8c)) - by @ghiscoding
* **publish:** make version & publish commands optionnal, closes [#450](https://github.com/lerna-lite/lerna-lite/issues/450) ([#552](https://github.com/lerna-lite/lerna-lite/issues/552)) ([11e4dab](https://github.com/lerna-lite/lerna-lite/commit/11e4dab70185198692b30cc72a184512bdc0e55d)) - by @ghiscoding
* remove all deprecated options tagged to be removed in next major ([#545](https://github.com/lerna-lite/lerna-lite/issues/545)) ([a6f44b3](https://github.com/lerna-lite/lerna-lite/commit/a6f44b36038e5663d8c14fa062569b0f105a02f4)) - by @ghiscoding
* **version:** remove deprecated `--changelog-version-message` option ([#543](https://github.com/lerna-lite/lerna-lite/issues/543)) ([d125eef](https://github.com/lerna-lite/lerna-lite/commit/d125eef8d1689403ed8959d60514aec29ca08886)) - by @ghiscoding
* **version:** use await import instead of require() for GHE release ([#546](https://github.com/lerna-lite/lerna-lite/issues/546)) ([f6a2488](https://github.com/lerna-lite/lerna-lite/commit/f6a2488ac35f573e900674f74ace45e33d200968)) - by @ghiscoding

### Bug Fixes

* **deps:** update dependency minimatch to v8 and couple other deps patch ([#550](https://github.com/lerna-lite/lerna-lite/issues/550)) ([e7d29f1](https://github.com/lerna-lite/lerna-lite/commit/e7d29f105c4757526e059bc5ae1eaa24a6eeaa59)) - by @ghiscoding

# [1.17.0](https://github.com/lerna-lite/lerna-lite/compare/v1.16.2...v1.17.0) (2023-03-16)

### Features

* **version:** support git "describeTag" configuration in version/publish commands ([#515](https://github.com/lerna-lite/lerna-lite/issues/515)) ([6a041e4](https://github.com/lerna-lite/lerna-lite/commit/6a041e4e864a4868b2d1c213a561ad57a4053a11)) - by @xueran

## [1.16.2](https://github.com/lerna-lite/lerna-lite/compare/v1.16.1...v1.16.2) (2023-03-13)

### Bug Fixes

* **cli:** TypeScript should be saved & published as LF, fixes [#513](https://github.com/lerna-lite/lerna-lite/issues/513) ([#514](https://github.com/lerna-lite/lerna-lite/issues/514)) ([1c62eb7](https://github.com/lerna-lite/lerna-lite/commit/1c62eb7d222db3e7be426d402fbfceff622615fe)) - by @ghiscoding

## [1.16.1](https://github.com/lerna-lite/lerna-lite/compare/v1.16.0...v1.16.1) (2023-03-11)

### Bug Fixes

* sign tags sequentially to prevent gpg issues with many tags ([#511](https://github.com/lerna-lite/lerna-lite/issues/511)) ([5f300be](https://github.com/lerna-lite/lerna-lite/commit/5f300be84c827f4aab26bc82c28bbc8bda451355)) - by @heilmela

# [1.16.0](https://github.com/lerna-lite/lerna-lite/compare/v1.15.2...v1.16.0) (2023-03-03)

### Bug Fixes

* **deps:** update all non-major dependencies ([#488](https://github.com/lerna-lite/lerna-lite/issues/488)) ([126bdb7](https://github.com/lerna-lite/lerna-lite/commit/126bdb7713c7fe5444f755f9f719d07a483cf146)) - by @renovate[bot]
* **deps:** update dependency minimatch to v7 ([#489](https://github.com/lerna-lite/lerna-lite/issues/489)) ([4fd3ac0](https://github.com/lerna-lite/lerna-lite/commit/4fd3ac0c6b848cd2c3e2417441b36cbd35e05fd3)) - by @renovate[bot]
* **version:** highlight version prop required in `lerna.json` ([#486](https://github.com/lerna-lite/lerna-lite/issues/486)) ([8720397](https://github.com/lerna-lite/lerna-lite/commit/872039788f22d95b04f237b983013be3c63833c0)), closes [#485](https://github.com/lerna-lite/lerna-lite/issues/485) - by @ghiscoding
* **version:** validate yarn Berry gte 2.0 before running yarn sync lock ([#494](https://github.com/lerna-lite/lerna-lite/issues/494)) ([26d630e](https://github.com/lerna-lite/lerna-lite/commit/26d630ead0e2249418c29977070f89ad63034a5f)) - by @ghiscoding

### Features

* **version:** add `--independent-subpackages` option, closes [#491](https://github.com/lerna-lite/lerna-lite/issues/491) ([#495](https://github.com/lerna-lite/lerna-lite/issues/495)) ([dfd0a78](https://github.com/lerna-lite/lerna-lite/commit/dfd0a781cb895d6abe00288aee0a51d1abaaaa3d)) - by @ghiscoding
* **version:** add user-defined build metadata to bumped packages ([#504](https://github.com/lerna-lite/lerna-lite/issues/504)) ([b8fbf2c](https://github.com/lerna-lite/lerna-lite/commit/b8fbf2c7344c2fd5d0d0f3dee5c883eaa3b4be67)) - by @ghiscoding

## [1.15.1](https://github.com/lerna-lite/lerna-lite/compare/v1.15.0...v1.15.1) (2023-02-08)

### Bug Fixes

* **deps:** update dependency minimatch to v6 ([#481](https://github.com/lerna-lite/lerna-lite/issues/481)) ([b97ecee](https://github.com/lerna-lite/lerna-lite/commit/b97ecee5ed59663680a41579d341b03c467c6c55)) - by @renovate[bot]

# [1.15.0](https://github.com/lerna-lite/lerna-lite/compare/v1.14.2...v1.15.0) (2023-02-04)

### Features

* **version:** move all version related methods under version package ([#456](https://github.com/lerna-lite/lerna-lite/issues/456)) ([2c0921a](https://github.com/lerna-lite/lerna-lite/commit/2c0921aecb52330f853d08b453f3cd1a61a0857e)) - by @ghiscoding
* **watch:** add optional stdin key to exit watch mode cleanly ([#472](https://github.com/lerna-lite/lerna-lite/issues/472)) ([d0cf2d9](https://github.com/lerna-lite/lerna-lite/commit/d0cf2d9d8286f8016867cfd79e3b1146b96b747d)) - by @ghiscoding

## [1.14.2](https://github.com/lerna-lite/lerna-lite/compare/v1.14.1...v1.14.2) (2023-01-21)

**Note:** Version bump only for package @lerna-lite/version

## [1.14.1](https://github.com/lerna-lite/lerna-lite/compare/v1.14.0...v1.14.1) (2023-01-19)

**Note:** Version bump only for package @lerna-lite/version

# [1.14.0](https://github.com/lerna-lite/lerna-lite/compare/v1.13.0...v1.14.0) (2023-01-18)

### Bug Fixes

* **deps:** update all non-major dependencies ([#423](https://github.com/lerna-lite/lerna-lite/issues/423)) ([b965cc7](https://github.com/lerna-lite/lerna-lite/commit/b965cc79eca285a39ac420fd1c1e3e7614c9c6e0)) - by @renovate-bot

### Features

* **version:** allow passing multiple npmClientArgs as CSV ([#429](https://github.com/lerna-lite/lerna-lite/issues/429)) ([0f32a95](https://github.com/lerna-lite/lerna-lite/commit/0f32a950bd9309fd2aafe193dc4d4d64447af49f)) - by @ghiscoding
* **version:** support custom command for git tag ([#430](https://github.com/lerna-lite/lerna-lite/issues/430)) ([246ac57](https://github.com/lerna-lite/lerna-lite/commit/246ac57953239771a22901a32bd5be77447b8b43)) - by @ghiscoding

# [1.13.0](https://github.com/lerna-lite/lerna-lite/compare/v1.12.0...v1.13.0) (2022-11-22)

### Bug Fixes

* **deps:** update all non-major dependencies ([#402](https://github.com/lerna-lite/lerna-lite/issues/402)) ([3feeea9](https://github.com/lerna-lite/lerna-lite/commit/3feeea9559cafdf84f4b025950d7e4a862104284)) - by @renovate-bot
* **deps:** update all non-major dependencies ([#405](https://github.com/lerna-lite/lerna-lite/issues/405)) ([084da4f](https://github.com/lerna-lite/lerna-lite/commit/084da4f409b38f66bc1c5d4d2ef43f9a221ca80b)) - by @renovate-bot

### Features

* **version:** bump prerelease versions from conventional commits ([#409](https://github.com/lerna-lite/lerna-lite/issues/409)) ([dad936e](https://github.com/lerna-lite/lerna-lite/commit/dad936e9cc42252028175f08de73c8554d3f7cf1)) - by @ghiscoding
* **version:** use npmClientArgs in npm install after lerna version ([#417](https://github.com/lerna-lite/lerna-lite/issues/417)) ([43e5dcd](https://github.com/lerna-lite/lerna-lite/commit/43e5dcde6bfce0edc062fce4dc3431771423d77c)) - by @ghiscoding

# [1.12.0](https://github.com/lerna-lite/lerna-lite/compare/v1.11.3...v1.12.0) (2022-10-14)

### Bug Fixes

* bump min Node version to >=14.17.0 to align with external deps ([#387](https://github.com/lerna-lite/lerna-lite/issues/387)) ([2f804e9](https://github.com/lerna-lite/lerna-lite/commit/2f804e92bd319e2b27b1406ca82ec1fdab09c449)) - by @ghiscoding
* **deps:** update dependency npmlog to v7 ([#389](https://github.com/lerna-lite/lerna-lite/issues/389)) ([d2110f1](https://github.com/lerna-lite/lerna-lite/commit/d2110f1aebe4b6cd44bcae2691fbd18fefc78299)) - by @renovate-bot

### Features

* **commands:** rename `git-dry-run` and `cmd-dry-run` to simply `dry-run` ([#377](https://github.com/lerna-lite/lerna-lite/issues/377)) ([3a55f5e](https://github.com/lerna-lite/lerna-lite/commit/3a55f5e8f7c26f3890f1c7099ca85c9d72cd2674)) - by @ghiscoding
* **publish:** add new option `--remove-package-fields` before publish ([#359](https://github.com/lerna-lite/lerna-lite/issues/359)) ([45a2107](https://github.com/lerna-lite/lerna-lite/commit/45a2107aa8862546a261a0c377c3fc704248bc5a)) - by @ghiscoding
* **version:** add `--allow-peer-dependencies-update`, closes [#333](https://github.com/lerna-lite/lerna-lite/issues/333) ([#363](https://github.com/lerna-lite/lerna-lite/issues/363)) ([efaf011](https://github.com/lerna-lite/lerna-lite/commit/efaf0111e2e687718d33b42418abd701447a7031)) - by @ghiscoding
* **version:** use manual GitHub web interface when `GH_TOKEN` undefined ([83e9cce](https://github.com/lerna-lite/lerna-lite/commit/83e9cce5e45a12ccf7028d453a9fcddf965443a1)) - by @ghiscoding

## [1.11.3](https://github.com/lerna-lite/lerna-lite/compare/v1.11.2...v1.11.3) (2022-09-20)

**Note:** Version bump only for package @lerna-lite/version

## [1.11.2](https://github.com/lerna-lite/lerna-lite/compare/v1.11.1...v1.11.2) (2022-08-30)

### Bug Fixes

* **version:** --changelog-include-commits-[x] in cli should be truthy ([1ddde05](https://github.com/lerna-lite/lerna-lite/commit/1ddde050ccfb285725efb84869adfba733a4dc0c)) - by @ghiscoding
* **version:** `--changelog-header-message` should be added to all logs ([c27a97d](https://github.com/lerna-lite/lerna-lite/commit/c27a97d77d58e09ba746848f93e4a66237231473)) - by @ghiscoding

## [1.11.1](https://github.com/lerna-lite/lerna-lite/compare/v1.11.0...v1.11.1) (2022-08-24)

**Note:** Version bump only for package @lerna-lite/version

# [1.11.0](https://github.com/lerna-lite/lerna-lite/compare/v1.10.0...v1.11.0) (2022-08-19)

### Bug Fixes

* **core:** use match pattern to get last tag date with independent mode ([cebcecf](https://github.com/lerna-lite/lerna-lite/commit/cebcecf95afe30db35995749a9b2a558be176314)) - by @ghiscoding
* **deps:** update all non-major dependencies ([e3b379c](https://github.com/lerna-lite/lerna-lite/commit/e3b379cc1b2bc9632801950e24ebf964780c8aaf)) - by @renovate-bot
* **deps:** update all non-major dependencies ([e8dcfec](https://github.com/lerna-lite/lerna-lite/commit/e8dcfece2a45eb6648c3b76f4938d521078673e8)) - by @renovate-bot
* **version:** properly update dependencies npm lockfile v2 ([0abfa85](https://github.com/lerna-lite/lerna-lite/commit/0abfa85eec26b49f6af996bb4333eccd118072e0)) - by @ghiscoding

# [1.10.0](https://github.com/lerna-lite/lerna-lite/compare/v1.9.1...v1.10.0) (2022-08-06)

### Bug Fixes

* **core:** ensure to touch all nodes in package-graph ([f4f7bbc](https://github.com/lerna-lite/lerna-lite/commit/f4f7bbc60a7331a4077e2bf974bb5abffdb4e804)) - by @ghiscoding
* **deps:** update all non-major dependencies ([abe1eff](https://github.com/lerna-lite/lerna-lite/commit/abe1eff71fe211c36d05518a43f74da33967a450)) - by @renovate-bot

### Features

* **version:** use conventional commit changelog writer for perf ([e9d7c52](https://github.com/lerna-lite/lerna-lite/commit/e9d7c52bdd70cac8d1c6a918c0475b613cf9817d)) - by @ghiscoding

## [1.9.1](https://github.com/lerna-lite/lerna-lite/compare/v1.9.0...v1.9.1) (2022-08-01)

**Note:** Version bump only for package @lerna-lite/version

# [1.9.0](https://github.com/lerna-lite/lerna-lite/compare/v1.8.0...v1.9.0) (2022-07-28)

### Bug Fixes

* **version:** inherit stdio for lerna version lifecycle scripts ([#276](https://github.com/lerna-lite/lerna-lite/issues/276)) ([9c3625d](https://github.com/lerna-lite/lerna-lite/commit/9c3625dd06e59fc702b8eef52f2a14daf2095be5)) - by @ghiscoding
* **version:** make sure we always have regex match array ([#271](https://github.com/lerna-lite/lerna-lite/issues/271)) ([ba34849](https://github.com/lerna-lite/lerna-lite/commit/ba348495cdefc1acbce3cec82b1c68333761cece)) - by @ghiscoding
* **version:** rename option to `--changelog-include-commits-git-author` ([b095637](https://github.com/lerna-lite/lerna-lite/commit/b095637cdf1ce57f7ecaabf06480f86623e0553e)) - by @ghiscoding

### Features

* **publish:** include all deps in package graph by default, allow no-sort ([#277](https://github.com/lerna-lite/lerna-lite/issues/277)) ([3229e77](https://github.com/lerna-lite/lerna-lite/commit/3229e7765907bf3bcf208baca876054a5a1cec5e)) - by @ghiscoding
* **version:** option to add commit login username on each changelog entry, closes [#248](https://github.com/lerna-lite/lerna-lite/issues/248) ([#272](https://github.com/lerna-lite/lerna-lite/issues/272)) ([2ca0dca](https://github.com/lerna-lite/lerna-lite/commit/2ca0dcaa005cac6306d7d24ffa4d0d8f1a45e320)) - by @ghiscoding

# [1.8.0](https://github.com/lerna-lite/lerna-lite/compare/v1.6.0...v1.8.0) (2022-07-21)

### Bug Fixes

* **version:** Node14, import from "fs" instead of "node:fs", fixes [#260](https://github.com/lerna-lite/lerna-lite/issues/260) ([#261](https://github.com/lerna-lite/lerna-lite/issues/261)) ([5e420fd](https://github.com/lerna-lite/lerna-lite/commit/5e420fd4cff05011642f2a5fad4bb5e5f3e60694)) (by _Ghislain B_)
* **version:** rollback previous patch on pnpm lockfile update ([d9f933c](https://github.com/lerna-lite/lerna-lite/commit/d9f933c7c9c118727cb5108b3ef3b0527d0d3f2c)) (by _ghiscoding_)

### Features

* filter for lerna tags in independent mode ([#267](https://github.com/lerna-lite/lerna-lite/issues/267)) ([8c3cdb3](https://github.com/lerna-lite/lerna-lite/commit/8c3cdb38528baf7a4075c846bc33c8933a1a5c0b)) (by _Ghislain B_)
* **version:** add flag to include changelog commit author, close [#248](https://github.com/lerna-lite/lerna-lite/issues/248) ([#253](https://github.com/lerna-lite/lerna-lite/issues/253)) ([7fd8db1](https://github.com/lerna-lite/lerna-lite/commit/7fd8db1c80c1da9d857cdac13c6c6cea1c5b8a69)) (by _Ghislain B_)
* **version:** provide custom format to include commit author fullname ([#269](https://github.com/lerna-lite/lerna-lite/issues/269)) ([1f5a94e](https://github.com/lerna-lite/lerna-lite/commit/1f5a94e06de01ceb8143886b5c00fe845173ee9f)) (by _Ghislain B_)

# [1.6.0](https://github.com/lerna-lite/lerna-lite/compare/v1.5.1...v1.6.0) (2022-06-30)

### Bug Fixes

* **version:** use `--no-frozen-lockfile` instead of `--fix-lockfile` ([a6120b9](https://github.com/lerna-lite/lerna-lite/commit/a6120b9891b719b573ccc2e821cc9ece52d1781d))

## [1.5.1](https://github.com/lerna-lite/lerna-lite/compare/v1.5.0...v1.5.1) (2022-06-12)

### Bug Fixes

* **version:** add better msg for missing `npmClient` with sync lock ([01e26b1](https://github.com/lerna-lite/lerna-lite/commit/01e26b1df86ed09bf090df1d18e38bbbdce1fc1a))

# [1.5.0](https://github.com/lerna-lite/lerna-lite/compare/v1.4.0...v1.5.0) (2022-06-08)

### Bug Fixes

* correctly add npm package lock to git add list ([281586f](https://github.com/lerna-lite/lerna-lite/commit/281586f75e7e98d3d3410ccf95e49c428be2c889))
* **deps:** update all non-major dependencies ([c87e937](https://github.com/lerna-lite/lerna-lite/commit/c87e937da725a1d8fa1d685bc3957baf0bcedcee))
* **lock:** add `--package-lockfile-only` to update lock file ([200e385](https://github.com/lerna-lite/lerna-lite/commit/200e38500e046fb99e716b5bc1fc9d87a9c14aab))
* **version:** improve default git publish message, closes [#185](https://github.com/lerna-lite/lerna-lite/issues/185) ([735fbe6](https://github.com/lerna-lite/lerna-lite/commit/735fbe66069ef0b9389faf850ae7900ddd076f4d))
* **version:** support for updating pnpm-lock.yaml ([509ca33](https://github.com/lerna-lite/lerna-lite/commit/509ca3308a76557891feefa5a0f69e350a0687b7))

### Features

* **version:** support for updating `pnpm-lock.yaml`, expand on [#168](https://github.com/lerna-lite/lerna-lite/issues/168) ([ee1a964](https://github.com/lerna-lite/lerna-lite/commit/ee1a96432675886c887544a59dc88185f5ebbd21))

# [1.4.0](https://github.com/lerna-lite/lerna-lite/compare/v1.3.0...v1.4.0) (2022-05-30)

**Note:** Version bump only for package @lerna-lite/version

# [1.3.0](https://github.com/lerna-lite/lerna-lite/compare/v1.2.0...v1.3.0) (2022-05-13)

### Features

* **publish:** `workspace:*` (or ~) protocol should strictly match range ([acede60](https://github.com/lerna-lite/lerna-lite/commit/acede60425c9a9b136b86be74b2ef59c03b63646))

# [1.2.0](https://github.com/lerna-lite/lerna-lite/compare/v1.1.1...v1.2.0) (2022-05-11)

### Bug Fixes

* **version:** include the updated root package-lock.json file in commits ([d6dbc9a](https://github.com/lerna-lite/lerna-lite/commit/d6dbc9a3aec1f4460546582fad92c1e5d6ee901e))

### Features

* **core:** add version/publish `workspace:` protocol ([ee57dfb](https://github.com/lerna-lite/lerna-lite/commit/ee57dfbb3ad26cd4bd722e1b54941360ec22f698))

# [1.1.0](https://github.com/lerna-lite/lerna-lite/compare/v1.0.5...v1.1.0) (2022-05-01)

### Features

* **exec:** add Lerna `exec` command ([8e87ea1](https://github.com/lerna-lite/lerna-lite/commit/8e87ea1f3a9987e2700b07886e4f600af090f344))

* **info:** add `info` command to CLI ([6fa1154](https://github.com/lerna-lite/lerna-lite/commit/6fa1154a9412c78f26585f41d5612ad083d4494a))

## [1.0.5](https://github.com/lerna-lite/lerna-lite/compare/v1.0.4...v1.0.5) (2022-03-29)

### Bug Fixes

* relax "engines.node" version ([ee59fbc](https://github.com/lerna-lite/lerna-lite/commit/ee59fbcfc7eefa02c85ecff2babd50b1bec112ce))

## [1.0.4](https://github.com/lerna-lite/lerna-lite/compare/v1.0.3...v1.0.4) (2022-03-24)

### Bug Fixes

* **version:** load & write project root lockfile v2 only once ([7ad805a](https://github.com/lerna-lite/lerna-lite/commit/7ad805aaeadc2b7646e4e0aa3186830df7448242))

## [1.0.3](https://github.com/lerna-lite/lerna-lite/compare/v1.0.2...v1.0.3) (2022-03-19)

### Bug Fixes

* **version:** project root lockfile v2 should be updated correctly ([2689746](https://github.com/lerna-lite/lerna-lite/commit/2689746bd6515ce326bf5d6d678c706b08753300))

## [1.0.2](https://github.com/lerna-lite/lerna-lite/compare/v1.0.1...v1.0.2) (2022-03-17)

### Bug Fixes

* **version:** shown repo info when Create Release is enabled in dry-run ([5b0cf6d](https://github.com/lerna-lite/lerna-lite/commit/5b0cf6d7ed9df1cfbae0072a9402f777403c6dd6))

## [1.0.1](https://github.com/lerna-lite/lerna-lite/compare/v1.0.0...v1.0.1) (2022-03-15)

**Note:** Version bump only for package @lerna-lite/version

# [1.0.0](https://github.com/lerna-lite/lerna-lite/compare/v0.3.7...v1.0.0) (2022-03-15)

**Note:** Version bump only for package @lerna-lite/version

## [0.3.7](https://github.com/lerna-lite/lerna-lite/compare/v0.3.5...v0.3.7) (2022-03-09)

### Bug Fixes

* **core:** better handling of possible missing pkg name ([ef9633d](https://github.com/lerna-lite/lerna-lite/commit/ef9633dfe623e1aca3e9350739317b9c57872b54))

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

**Note:** Version bump only for package @lerna-lite/version

## [0.3.2](https://github.com/lerna-lite/lerna-lite/compare/v0.3.1...v0.3.2) (2022-02-22)

### Bug Fixes

* **core:** OTP please  method had non-strict code ([411f308](https://github.com/lerna-lite/lerna-lite/commit/411f3086d943e0c0d80d9c1a4745775ae7d803e9))

## [0.3.1](https://github.com/lerna-lite/lerna-lite/compare/v0.3.0...v0.3.1) (2022-02-12)

**Note:** Version bump only for package @lerna-lite/version

# [0.3.0](https://github.com/lerna-lite/lerna-lite/compare/v0.2.3...v0.3.0) (2022-02-12)

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
