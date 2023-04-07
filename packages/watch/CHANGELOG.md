# Change Log
## Automate your Workspace Versioning, Publishing & Changelogs with [Lerna-Lite](https://github.com/lerna-lite/lerna-lite) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.0-alpha.1](https://github.com/lerna-lite/lerna-lite/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (2023-04-07)

**Note:** Version bump only for package @lerna-lite/watch

## [2.0.0-alpha.0](https://github.com/lerna-lite/lerna-lite/compare/v1.17.0...v2.0.0-alpha.0) (2023-04-07)

### ⚠ BREAKING CHANGES

* **publish:** make version & publish commands optionnal, closes #450 (#552)
* **build:** migrate to ESM build & switch to Vitest for ESM support (#537)

### Features

* **build:** migrate to ESM build & switch to Vitest for ESM support ([#537](https://github.com/lerna-lite/lerna-lite/issues/537)) ([308fc2e](https://github.com/lerna-lite/lerna-lite/commit/308fc2e2d72d90f62b3a3954cbeeb3810b767a35)) - by @ghiscoding
* **cli:** remove listable dependency from CLI ([#553](https://github.com/lerna-lite/lerna-lite/issues/553)) ([1baa0d1](https://github.com/lerna-lite/lerna-lite/commit/1baa0d19b7116dac56c9326934c7cc9e07caec8c)) - by @ghiscoding
* **publish:** make version & publish commands optionnal, closes [#450](https://github.com/lerna-lite/lerna-lite/issues/450) ([#552](https://github.com/lerna-lite/lerna-lite/issues/552)) ([11e4dab](https://github.com/lerna-lite/lerna-lite/commit/11e4dab70185198692b30cc72a184512bdc0e55d)) - by @ghiscoding

# [1.17.0](https://github.com/lerna-lite/lerna-lite/compare/v1.16.2...v1.17.0) (2023-03-16)

**Note:** Version bump only for package @lerna-lite/watch

## [1.16.2](https://github.com/lerna-lite/lerna-lite/compare/v1.16.1...v1.16.2) (2023-03-13)

### Bug Fixes

* **cli:** TypeScript should be saved & published as LF, fixes [#513](https://github.com/lerna-lite/lerna-lite/issues/513) ([#514](https://github.com/lerna-lite/lerna-lite/issues/514)) ([1c62eb7](https://github.com/lerna-lite/lerna-lite/commit/1c62eb7d222db3e7be426d402fbfceff622615fe)) - by @ghiscoding

## [1.16.1](https://github.com/lerna-lite/lerna-lite/compare/v1.16.0...v1.16.1) (2023-03-11)

**Note:** Version bump only for package @lerna-lite/watch

# [1.16.0](https://github.com/lerna-lite/lerna-lite/compare/v1.15.2...v1.16.0) (2023-03-03)

**Note:** Version bump only for package @lerna-lite/watch

## [1.15.2](https://github.com/lerna-lite/lerna-lite/compare/v1.15.1...v1.15.2) (2023-02-14)

### Bug Fixes

* **watch:** watch execution shouldn't skip queued changes ([#482](https://github.com/lerna-lite/lerna-lite/issues/482)) ([d64950b](https://github.com/lerna-lite/lerna-lite/commit/d64950bd502444208235953c8620543ccf0d9170)) - by @ghiscoding

## [1.15.1](https://github.com/lerna-lite/lerna-lite/compare/v1.15.0...v1.15.1) (2023-02-08)

### Bug Fixes

* **watch:** remove watch stdin causing problem exiting the watch ([#478](https://github.com/lerna-lite/lerna-lite/issues/478)) ([6f1232f](https://github.com/lerna-lite/lerna-lite/commit/6f1232f188f12df1365aab7ede11767e3b09aff3)) - by @ghiscoding

# [1.15.0](https://github.com/lerna-lite/lerna-lite/compare/v1.14.2...v1.15.0) (2023-02-04)

### Bug Fixes

* **watch:** use a better debounce option name for the watch ([#476](https://github.com/lerna-lite/lerna-lite/issues/476)) ([eb0bbc1](https://github.com/lerna-lite/lerna-lite/commit/eb0bbc136133e47881a5ef38ad5e3feb45675e56)) - by @ghiscoding

### Features

* **watch:** add optional stdin key to exit watch mode cleanly ([#472](https://github.com/lerna-lite/lerna-lite/issues/472)) ([d0cf2d9](https://github.com/lerna-lite/lerna-lite/commit/d0cf2d9d8286f8016867cfd79e3b1146b96b747d)) - by @ghiscoding

## [1.14.2](https://github.com/lerna-lite/lerna-lite/compare/v1.14.1...v1.14.2) (2023-01-21)

### Bug Fixes

* **watch:** add missing --stream option ([#448](https://github.com/lerna-lite/lerna-lite/issues/448)) ([b249c7c](https://github.com/lerna-lite/lerna-lite/commit/b249c7c8570f3e08c43e2387f6ccc1d21bed5d7f)) - by @ghiscoding
* **watch:** add missing Chokidar option awaitWriteFinish as a boolean ([#449](https://github.com/lerna-lite/lerna-lite/issues/449)) ([6ed56dc](https://github.com/lerna-lite/lerna-lite/commit/6ed56dcac65a03ea2730142806541c679633edd8)) - by @ghiscoding
* **watch:** lerna watch should ignore git, dist & node_modules folders ([#452](https://github.com/lerna-lite/lerna-lite/issues/452)) ([fa34c58](https://github.com/lerna-lite/lerna-lite/commit/fa34c58ecbc342c547f5f6d50d416c10aa1adcf6)) - by @ghiscoding
* **watch:** queue watch callbacks to avoid breaking previous run ([#453](https://github.com/lerna-lite/lerna-lite/issues/453)) ([bd892ac](https://github.com/lerna-lite/lerna-lite/commit/bd892acffdbef89247f50eab5a297c8ac89f24ad)) - by @ghiscoding

## [1.14.1](https://github.com/lerna-lite/lerna-lite/compare/v1.14.0...v1.14.1) (2023-01-19)

### Bug Fixes

* **watch:** glob should work without slash prefix ([#447](https://github.com/lerna-lite/lerna-lite/issues/447)) ([e3ee22d](https://github.com/lerna-lite/lerna-lite/commit/e3ee22dab2719e12cea329670a83cc35bfc4f20c)) - by @ghiscoding

# [1.14.0](https://github.com/lerna-lite/lerna-lite/compare/v1.13.0...v1.14.0) (2023-01-18)

### Features

* **watch:** Add `lerna watch` command ([#441](https://github.com/lerna-lite/lerna-lite/issues/441)) ([a244128](https://github.com/lerna-lite/lerna-lite/commit/a24412848129fcfebd593e3c323d69f8f3172112)) - by @ghiscoding
