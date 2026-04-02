# Change Log
## Automate your Workspace Versioning, Publishing & Changelogs with [Lerna-Lite](https://github.com/lerna-lite/lerna-lite) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.0](https://github.com/lerna-lite/lerna-lite/compare/v4.11.5...v5.0.0) (2026-04-02)

### ⚠ BREAKING CHANGES

* **build:** use `module --nodenext` instead of bundler/esnext (#1301)
* bump NodeJS requirement to Node v22.17 (#1299)
* **core:** replace tinyrainbow with native `util.styleText()` (#1293)

### Bug Fixes

* **core:** replace `aproba` with internal `validate` implementation ([#1285](https://github.com/lerna-lite/lerna-lite/issues/1285)) ([d4494f3](https://github.com/lerna-lite/lerna-lite/commit/d4494f33d22059705fd002c2d96a11d5a4005d81)) - by @ghiscoding
* **npmlog:** replace `has-unicode` with internal implementation ([#1284](https://github.com/lerna-lite/lerna-lite/issues/1284)) ([c729652](https://github.com/lerna-lite/lerna-lite/commit/c729652bd73f170164894a846a00810295c11be0)) - by @ghiscoding
* **npmlog:** replace wide-align with internal implementation ([#1281](https://github.com/lerna-lite/lerna-lite/issues/1281)) ([615d2f4](https://github.com/lerna-lite/lerna-lite/commit/615d2f445f0f9db9f0c20c16c7f7588897134769)) - by @ghiscoding

### Code Refactoring

* **build:** use `module --nodenext` instead of bundler/esnext ([#1301](https://github.com/lerna-lite/lerna-lite/issues/1301)) ([14990ba](https://github.com/lerna-lite/lerna-lite/commit/14990bae3a6c3d300d8c0fd46a05d44a8b726cdf)) - by @ghiscoding
* bump NodeJS requirement to Node v22.17 ([#1299](https://github.com/lerna-lite/lerna-lite/issues/1299)) ([91ca715](https://github.com/lerna-lite/lerna-lite/commit/91ca715121915d64a0e08dca28758268eba0de77)) - by @ghiscoding
* **core:** replace tinyrainbow with native `util.styleText()` ([#1293](https://github.com/lerna-lite/lerna-lite/issues/1293)) ([1d36057](https://github.com/lerna-lite/lerna-lite/commit/1d360571668a99fb30dac1b4877c2ee0d4453773)) - by @ghiscoding

## [4.11.5](https://github.com/lerna-lite/lerna-lite/compare/v4.11.4...v4.11.5) (2026-03-14)

### Bug Fixes

* **deps:** remove set-blocking, is-stream ([#1276](https://github.com/lerna-lite/lerna-lite/issues/1276)) ([8f0d1e3](https://github.com/lerna-lite/lerna-lite/commit/8f0d1e3e7aa0a1c972609c8a0f964c3fec4251fd)) - by @ghiscoding

## [4.11.3](https://github.com/lerna-lite/lerna-lite/compare/v4.11.2...v4.11.3) (2026-02-19)

**Note:** Version bump only for package @lerna-lite/npmlog

## [4.11.0](https://github.com/lerna-lite/lerna-lite/compare/v4.10.5...v4.11.0) (2026-01-16)

**Note:** Version bump only for package @lerna-lite/npmlog

## [4.10.4](https://github.com/lerna-lite/lerna-lite/compare/v4.10.3...v4.10.4) (2026-01-06)

**Note:** Version bump only for package @lerna-lite/npmlog

## [4.10.3](https://github.com/lerna-lite/lerna-lite/compare/v4.10.2...v4.10.3) (2025-12-27)

**Note:** Version bump only for package @lerna-lite/npmlog

## [4.10.0](https://github.com/lerna-lite/lerna-lite/compare/v4.9.4...v4.10.0) (2025-12-12)

**Note:** Version bump only for package @lerna-lite/npmlog

## [4.9.4](https://github.com/lerna-lite/lerna-lite/compare/v4.9.3...v4.9.4) (2025-11-27)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1192](https://github.com/lerna-lite/lerna-lite/issues/1192)) ([2a6b79c](https://github.com/lerna-lite/lerna-lite/commit/2a6b79c0b9ebb7166b30d419b358247ef6eaf02c)) - by @ghiscoding

## [4.9.3](https://github.com/lerna-lite/lerna-lite/compare/v4.9.2...v4.9.3) (2025-11-20)

**Note:** Version bump only for package @lerna-lite/npmlog

## [4.9.1](https://github.com/lerna-lite/lerna-lite/compare/v4.9.0...v4.9.1) (2025-10-17)

### Bug Fixes

* **deps:** replace console-control-strings/color-support w/tinyrainbow in npmlog ([#1159](https://github.com/lerna-lite/lerna-lite/issues/1159)) ([b553861](https://github.com/lerna-lite/lerna-lite/commit/b55386119ca2f3ba71ae1f6e9a65c2e5020feb1a)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#1173](https://github.com/lerna-lite/lerna-lite/issues/1173)) ([c644fb1](https://github.com/lerna-lite/lerna-lite/commit/c644fb1868908e983d342d72d1ff1f50d4d2b76c)) - by @renovate[bot]

## [4.7.3](https://github.com/lerna-lite/lerna-lite/compare/v4.7.2...v4.7.3) (2025-08-29)

### Bug Fixes

* **deps:** update dependency fast-string-width to v3 ([#1120](https://github.com/lerna-lite/lerna-lite/issues/1120)) ([0c5fd00](https://github.com/lerna-lite/lerna-lite/commit/0c5fd0097d906663e6abc2ccfdae47b588323b05)) - by @renovate[bot]

## [4.7.1](https://github.com/lerna-lite/lerna-lite/compare/v4.7.0...v4.7.1) (2025-08-13)

### Bug Fixes

* **deps:** replace `string-width` with `fast-string-width` ([#1107](https://github.com/lerna-lite/lerna-lite/issues/1107)) ([8d00d2f](https://github.com/lerna-lite/lerna-lite/commit/8d00d2f5e71dc831ac5341597925146328c44304)) - by @ghiscoding

## [4.7.0](https://github.com/lerna-lite/lerna-lite/compare/v4.6.2...v4.7.0) (2025-08-08)

**Note:** Version bump only for package @lerna-lite/npmlog

## [4.6.2](https://github.com/lerna-lite/lerna-lite/compare/v4.6.1...v4.6.2) (2025-07-25)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1091](https://github.com/lerna-lite/lerna-lite/issues/1091)) ([dfb1eca](https://github.com/lerna-lite/lerna-lite/commit/dfb1eca7afa9f74efabfdaeb102dc91bac617a86)) - by @renovate[bot]

## [4.6.0](https://github.com/lerna-lite/lerna-lite/compare/v4.5.1...v4.6.0) (2025-07-08)

**Note:** Version bump only for package @lerna-lite/npmlog

## [4.1.2](https://github.com/lerna-lite/lerna-lite/compare/v4.1.1...v4.1.2) (2025-05-12)

**Note:** Version bump only for package @lerna-lite/npmlog

## [4.0.0](https://github.com/lerna-lite/lerna-lite/compare/v3.12.3...v4.0.0) (2025-03-28)

> [!NOTE]
> Please visit the [v4.0.0](https://github.com/lerna-lite/lerna-lite/releases/tag/v4.0.0) release for more details about the migration.

### ⚠ BREAKING CHANGES

* **deps:** bump minimum Node version to ^20.17.0 || >=22.9.0 (#1000)
* **watch:** upgrade Chokidar to v4.0 major version (#1004)

### Bug Fixes

* **deps:** bump minimum Node version to ^20.17.0 || >=22.9.0 ([#1000](https://github.com/lerna-lite/lerna-lite/issues/1000)) ([9a87d82](https://github.com/lerna-lite/lerna-lite/commit/9a87d82ff71f274dd41a0cd85f9036f11c2525b7)) - by @ghiscoding
* **watch:** upgrade Chokidar to v4.0 major version ([#1004](https://github.com/lerna-lite/lerna-lite/issues/1004)) ([d376975](https://github.com/lerna-lite/lerna-lite/commit/d3769750b63446f83f04ae797fbdb8863a18c311)) - by @ghiscoding

## [3.12.1](https://github.com/lerna-lite/lerna-lite/compare/v3.12.0...v3.12.1) (2025-02-18)

**Note:** Version bump only for package @lerna-lite/npmlog

## [3.12.0](https://github.com/lerna-lite/lerna-lite/compare/v3.11.0...v3.12.0) (2025-01-31)

### Bug Fixes

* **deps:** update all non-major dependencies ([#971](https://github.com/lerna-lite/lerna-lite/issues/971)) ([24d1bbc](https://github.com/lerna-lite/lerna-lite/commit/24d1bbccb3c263c53212e373ffe7d2fe1692551e)) - by @renovate[bot]

## [3.11.0](https://github.com/lerna-lite/lerna-lite/compare/v3.10.1...v3.11.0) (2025-01-02)

### Bug Fixes

* **deps:** update all non-major dependencies ([#966](https://github.com/lerna-lite/lerna-lite/issues/966)) ([956ad09](https://github.com/lerna-lite/lerna-lite/commit/956ad098754c6869263afb92ec629be1ad968bbc)) - by @renovate[bot]

## [3.10.1](https://github.com/lerna-lite/lerna-lite/compare/v3.10.0...v3.10.1) (2024-11-28)

### Bug Fixes

* drop `strip-ansi` in favor of native stripVTControlCharacters ([#950](https://github.com/lerna-lite/lerna-lite/issues/950)) ([2f23996](https://github.com/lerna-lite/lerna-lite/commit/2f23996fec6bcc695515a344957a7cf46edf90d4)) - by @ghiscoding

## [3.10.0](https://github.com/lerna-lite/lerna-lite/compare/v3.9.3...v3.10.0) (2024-10-15)

**Note:** Version bump only for package @lerna-lite/npmlog

## [3.9.3](https://github.com/lerna-lite/lerna-lite/compare/v3.9.2...v3.9.3) (2024-10-08)

**Note:** Version bump only for package @lerna-lite/npmlog

## [3.8.0](https://github.com/lerna-lite/lerna-lite/compare/v3.7.1...v3.8.0) (2024-08-05)

**Note:** Version bump only for package @lerna-lite/npmlog

## [3.7.0](https://github.com/lerna-lite/lerna-lite/compare/v3.6.0...v3.7.0) (2024-07-05)

**Note:** Version bump only for package @lerna-lite/npmlog

## [3.6.0](https://github.com/lerna-lite/lerna-lite/compare/v3.5.2...v3.6.0) (2024-06-27)

### Bug Fixes

* inline deprecated `npmlog` util dependency ([#882](https://github.com/lerna-lite/lerna-lite/issues/882)) ([9243e8e](https://github.com/lerna-lite/lerna-lite/commit/9243e8e0078c07add85dc997a4a04bfaf77a44e5)) - by @ghiscoding
