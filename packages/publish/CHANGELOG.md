# Change Log
## Automate your Workspace Versioning, Publishing & Changelogs with [Lerna-Lite](https://github.com/lerna-lite/lerna-lite) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.4.1](https://github.com/lerna-lite/lerna-lite/compare/v4.4.0...v4.4.1) (2025-06-13)

### Bug Fixes

* add missing npmClient needed for Catalog while newing QueryGraph ([#1070](https://github.com/lerna-lite/lerna-lite/issues/1070)) ([eda2aac](https://github.com/lerna-lite/lerna-lite/commit/eda2aac1f7ea6387df39cf4c969ad6c7ae4f2681)) - by @ghiscoding

## [4.4.0](https://github.com/lerna-lite/lerna-lite/compare/v4.3.0...v4.4.0) (2025-06-13)

### Features

* support Bun Catalogs, fixes [#1063](https://github.com/lerna-lite/lerna-lite/issues/1063) ([#1065](https://github.com/lerna-lite/lerna-lite/issues/1065)) ([4f1e1aa](https://github.com/lerna-lite/lerna-lite/commit/4f1e1aacf0fcf00f42700cda73e7b9f735d17f2e)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1067](https://github.com/lerna-lite/lerna-lite/issues/1067)) ([a50cf0c](https://github.com/lerna-lite/lerna-lite/commit/a50cf0c5ef45fe78a946dc38cec8f8eeb37bd138)) - by @renovate[bot]

## [4.3.0](https://github.com/lerna-lite/lerna-lite/compare/v4.2.0...v4.3.0) (2025-05-29)

### Features

* **deps:** replace `temp-dir`, `tempy` and `make-dir` with native code ([#1056](https://github.com/lerna-lite/lerna-lite/issues/1056)) ([60d1669](https://github.com/lerna-lite/lerna-lite/commit/60d16693f0aedeb6a65648c75ffb5f7ec9f5f445)) - by @ghiscoding

### Bug Fixes

* **publish:** Provenance URLs should have their associated pkg name ([#1053](https://github.com/lerna-lite/lerna-lite/issues/1053)) ([1feda1f](https://github.com/lerna-lite/lerna-lite/commit/1feda1fce34fb089e829d652c040de3b6c507bc2)) - by @ghiscoding

## [4.2.0](https://github.com/lerna-lite/lerna-lite/compare/v4.1.2...v4.2.0) (2025-05-23)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1038](https://github.com/lerna-lite/lerna-lite/issues/1038)) ([b285218](https://github.com/lerna-lite/lerna-lite/commit/b285218259b45c73b3aa3f9627adb7057b589bd6)) - by @renovate[bot]
* **deps:** update dependency @npmcli/arborist to ^9.1.1 ([#1044](https://github.com/lerna-lite/lerna-lite/issues/1044)) ([2fe3139](https://github.com/lerna-lite/lerna-lite/commit/2fe3139091735cf02dfff51ed49dcb6390baea93)) - by @renovate[bot]

## [4.1.2](https://github.com/lerna-lite/lerna-lite/compare/v4.1.1...v4.1.2) (2025-05-12)

### Bug Fixes

* **publish:** re-prompt OTP if it expired when publishing too many pkgs ([#1034](https://github.com/lerna-lite/lerna-lite/issues/1034)) ([9df3f69](https://github.com/lerna-lite/lerna-lite/commit/9df3f695b188270c653d21ac00b6cb379e418e89)) - by @ghiscoding

## [4.1.1](https://github.com/lerna-lite/lerna-lite/compare/v4.1.0...v4.1.1) (2025-04-29)

**Note:** Version bump only for package @lerna-lite/publish

## [4.1.0](https://github.com/lerna-lite/lerna-lite/compare/v4.0.0...v4.1.0) (2025-04-29)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1014](https://github.com/lerna-lite/lerna-lite/issues/1014)) ([cbf1ff0](https://github.com/lerna-lite/lerna-lite/commit/cbf1ff0681cb0ec3f76dc9f7de54d5531d3415af)) - by @renovate[bot]
* **version:** pnpm catalog changes should be reflected in packages ([#1023](https://github.com/lerna-lite/lerna-lite/issues/1023)) ([1058573](https://github.com/lerna-lite/lerna-lite/commit/10585739a0c85191d7a8f5aa0aaa7f97b34d2752)) - by @ghiscoding

## [4.0.0](https://github.com/lerna-lite/lerna-lite/compare/v3.12.3...v4.0.0) (2025-03-28)

> [!NOTE]
> Please visit the [v4.0.0](https://github.com/lerna-lite/lerna-lite/releases/tag/v4.0.0) release for more details about the migration.

### ⚠ BREAKING CHANGES

* **deps:** update all major npm & other deps (#1008)
* **deps:** bump minimum Node version to ^20.17.0 || >=22.9.0 (#1000)
* **version:** change default "describe [Git] tag" pattern to `v*` (#1001)
* **watch:** upgrade Chokidar to v4.0 major version (#1004)

### Bug Fixes

* **deps:** bump minimum Node version to ^20.17.0 || >=22.9.0 ([#1000](https://github.com/lerna-lite/lerna-lite/issues/1000)) ([9a87d82](https://github.com/lerna-lite/lerna-lite/commit/9a87d82ff71f274dd41a0cd85f9036f11c2525b7)) - by @ghiscoding
* **deps:** update all major npm & other deps ([#1008](https://github.com/lerna-lite/lerna-lite/issues/1008)) ([332a1c0](https://github.com/lerna-lite/lerna-lite/commit/332a1c0c06dbb2d7354fecf53c3433e8d1d5e2bf)) - by @ghiscoding
* **publish:** replace +{SHA} with .{SHA} in lerna publish --canary ([#999](https://github.com/lerna-lite/lerna-lite/issues/999)) ([26da1a9](https://github.com/lerna-lite/lerna-lite/commit/26da1a9ba36a2fb71b082786572f1edb5ee19efc)) - by @ghiscoding
* **version:** change default "describe [Git] tag" pattern to `v*` ([#1001](https://github.com/lerna-lite/lerna-lite/issues/1001)) ([6b0f1e9](https://github.com/lerna-lite/lerna-lite/commit/6b0f1e90ac50437f355fd2c92fe9e4e964ecadc4)) - by @ghiscoding
* **watch:** upgrade Chokidar to v4.0 major version ([#1004](https://github.com/lerna-lite/lerna-lite/issues/1004)) ([d376975](https://github.com/lerna-lite/lerna-lite/commit/d3769750b63446f83f04ae797fbdb8863a18c311)) - by @ghiscoding

## [3.12.3](https://github.com/lerna-lite/lerna-lite/compare/v3.12.2...v3.12.3) (2025-03-12)

**Note:** Version bump only for package @lerna-lite/publish

## [3.12.2](https://github.com/lerna-lite/lerna-lite/compare/v3.12.1...v3.12.2) (2025-02-28)

**Note:** Version bump only for package @lerna-lite/publish

## [3.12.1](https://github.com/lerna-lite/lerna-lite/compare/v3.12.0...v3.12.1) (2025-02-18)

**Note:** Version bump only for package @lerna-lite/publish

## [3.12.0](https://github.com/lerna-lite/lerna-lite/compare/v3.11.0...v3.12.0) (2025-01-31)

### Features

* **publish:** support pnpm `catalog:` protocol with lerna publish ([#975](https://github.com/lerna-lite/lerna-lite/issues/975)) ([1dd3dc7](https://github.com/lerna-lite/lerna-lite/commit/1dd3dc74f2021a049cffb9f11af89a6890176d17)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#971](https://github.com/lerna-lite/lerna-lite/issues/971)) ([24d1bbc](https://github.com/lerna-lite/lerna-lite/commit/24d1bbccb3c263c53212e373ffe7d2fe1692551e)) - by @renovate[bot]
* **deps:** update dependency tinyrainbow to v2 ([#973](https://github.com/lerna-lite/lerna-lite/issues/973)) ([2c14288](https://github.com/lerna-lite/lerna-lite/commit/2c14288407e12d82b02fa2641c0d0b46990b7f6a)) - by @renovate[bot]

## [3.11.0](https://github.com/lerna-lite/lerna-lite/compare/v3.10.1...v3.11.0) (2025-01-02)

### Features

* **core:** support `catalog:` protocol ([#965](https://github.com/lerna-lite/lerna-lite/issues/965)) ([4d739e2](https://github.com/lerna-lite/lerna-lite/commit/4d739e25a44c46e5df24df156fc8b36ad49d0989)) - by @Mister-Hope

### Bug Fixes

* **deps:** update all non-major dependencies ([#966](https://github.com/lerna-lite/lerna-lite/issues/966)) ([956ad09](https://github.com/lerna-lite/lerna-lite/commit/956ad098754c6869263afb92ec629be1ad968bbc)) - by @renovate[bot]

## [3.10.1](https://github.com/lerna-lite/lerna-lite/compare/v3.10.0...v3.10.1) (2024-11-28)

**Note:** Version bump only for package @lerna-lite/publish

## [3.10.0](https://github.com/lerna-lite/lerna-lite/compare/v3.9.3...v3.10.0) (2024-10-15)

### Features

* support --scope filter options in all lerna commands ([#948](https://github.com/lerna-lite/lerna-lite/issues/948)) ([f72f893](https://github.com/lerna-lite/lerna-lite/commit/f72f893beb5b9c3c23c861caba06dab801c37435)) - by @farfromrefug

## [3.9.3](https://github.com/lerna-lite/lerna-lite/compare/v3.9.2...v3.9.3) (2024-10-08)

### Bug Fixes

* **deps:** replace `globby` with `tinyglobby` ([#941](https://github.com/lerna-lite/lerna-lite/issues/941)) ([be8d050](https://github.com/lerna-lite/lerna-lite/commit/be8d050dbe72b42ff98c8acbfdc0b3665396ed28)) - by @ghiscoding
* **deps:** replace `picocolors` with `tinyrainbow` ([#942](https://github.com/lerna-lite/lerna-lite/issues/942)) ([75fc4df](https://github.com/lerna-lite/lerna-lite/commit/75fc4dffca0f618c60a5932dab1a4a14ab8ee0ed)) - by @ghiscoding

## [3.9.2](https://github.com/lerna-lite/lerna-lite/compare/v3.9.1...v3.9.2) (2024-09-28)

### Bug Fixes

* **deps:** replace `chalk` with `picocolors` ([#940](https://github.com/lerna-lite/lerna-lite/issues/940)) ([7850c65](https://github.com/lerna-lite/lerna-lite/commit/7850c655bf138a38a9c9fbd90a84c594c0138ef0)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#929](https://github.com/lerna-lite/lerna-lite/issues/929)) ([fea1aec](https://github.com/lerna-lite/lerna-lite/commit/fea1aec3e4a3824c6d717fd1530475f4df3a4174)) - by @renovate[bot]

## [3.9.1](https://github.com/lerna-lite/lerna-lite/compare/v3.9.0...v3.9.1) (2024-09-07)

### Bug Fixes

* **deps:** update dependency ssri to v11 ([#926](https://github.com/lerna-lite/lerna-lite/issues/926)) ([7594054](https://github.com/lerna-lite/lerna-lite/commit/7594054fe2ae2ab5154fba1a6b987128a00ce945)) - by @renovate[bot]

## [3.9.0](https://github.com/lerna-lite/lerna-lite/compare/v3.8.0...v3.9.0) (2024-08-30)

### Features

* **publish:** support full file path for --summary-file ([#919](https://github.com/lerna-lite/lerna-lite/issues/919)) ([25b3718](https://github.com/lerna-lite/lerna-lite/commit/25b37184adff216655700cdc27cc9ec47ae291b7)) - by @ghiscoding

## [3.8.0](https://github.com/lerna-lite/lerna-lite/compare/v3.7.1...v3.8.0) (2024-08-05)

### Features

* **publish:** enable throttling when publishing modules ([#907](https://github.com/lerna-lite/lerna-lite/issues/907)) ([51e0ace](https://github.com/lerna-lite/lerna-lite/commit/51e0acebf79c9ee1f3352eed3a68eb09d8df6276)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#899](https://github.com/lerna-lite/lerna-lite/issues/899)) ([6e1f45a](https://github.com/lerna-lite/lerna-lite/commit/6e1f45a8d29cb76cbc9c19d8d18fb9b488284215)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#903](https://github.com/lerna-lite/lerna-lite/issues/903)) ([7dc9e7a](https://github.com/lerna-lite/lerna-lite/commit/7dc9e7ae021a6dbbac8c2eba1b117ba5ca85a514)) - by @renovate[bot]
* **deps:** update dependency byte-size to v9 ([#904](https://github.com/lerna-lite/lerna-lite/issues/904)) ([1a4d4be](https://github.com/lerna-lite/lerna-lite/commit/1a4d4bea5dfe460a060025ab720d10c72a5ffbd2)) - by @renovate[bot]
* **version:** add missing file extension to fix publish error ([#910](https://github.com/lerna-lite/lerna-lite/issues/910)) ([e9ccb79](https://github.com/lerna-lite/lerna-lite/commit/e9ccb79c48275368eb5dd19f6951f4c9f5b060ce)) - by @ghiscoding

## [3.7.1](https://github.com/lerna-lite/lerna-lite/compare/v3.7.0...v3.7.1) (2024-07-13)

### Bug Fixes

* **deps:** update all non-major dependencies ([#894](https://github.com/lerna-lite/lerna-lite/issues/894)) ([c2c40fa](https://github.com/lerna-lite/lerna-lite/commit/c2c40fa73c263dc73efbe2b16710f26854102eda)) - by @renovate[bot]

## [3.7.0](https://github.com/lerna-lite/lerna-lite/compare/v3.6.0...v3.7.0) (2024-07-05)

### Features

* **publish:** add `arboristLoadOptions` for optional `ignoreMissing` ([#889](https://github.com/lerna-lite/lerna-lite/issues/889)) ([f8417d1](https://github.com/lerna-lite/lerna-lite/commit/f8417d1eee5ecc8acbdff97afc7a044841a90920)) - by @ghiscoding

### Bug Fixes

* **publish:** ignore E409 error when re-publishing to NPM ([#890](https://github.com/lerna-lite/lerna-lite/issues/890)) ([d011168](https://github.com/lerna-lite/lerna-lite/commit/d0111685d03298d629b15607a29c23053018496e)) - by @ghiscoding

## [3.6.0](https://github.com/lerna-lite/lerna-lite/compare/v3.5.2...v3.6.0) (2024-06-27)

### Bug Fixes

* inline deprecated `npmlog` util dependency ([#882](https://github.com/lerna-lite/lerna-lite/issues/882)) ([9243e8e](https://github.com/lerna-lite/lerna-lite/commit/9243e8e0078c07add85dc997a4a04bfaf77a44e5)) - by @ghiscoding
* replace deprecated `read-package-json` with `@npmcli/package-json` ([#883](https://github.com/lerna-lite/lerna-lite/issues/883)) ([fe23cf7](https://github.com/lerna-lite/lerna-lite/commit/fe23cf7b471ce7b6f761b33a58b520082d539172)) - by @ghiscoding

## [3.5.2](https://github.com/lerna-lite/lerna-lite/compare/v3.5.1...v3.5.2) (2024-06-13)

**Note:** Version bump only for package @lerna-lite/publish

## [3.5.1](https://github.com/lerna-lite/lerna-lite/compare/v3.5.0...v3.5.1) (2024-06-07)

### Bug Fixes

* **publish:** always bump & publish peer deps with `workspace:` protocol ([#873](https://github.com/lerna-lite/lerna-lite/issues/873)) ([0325539](https://github.com/lerna-lite/lerna-lite/commit/03255399018b19bd3a7de1f0ef9ee0c82ed6137e)) - by @ghiscoding

## [3.5.0](https://github.com/lerna-lite/lerna-lite/compare/v3.4.0...v3.5.0) (2024-06-03)

**Note:** Version bump only for package @lerna-lite/publish

## [3.4.0](https://github.com/lerna-lite/lerna-lite/compare/v3.3.3...v3.4.0) (2024-05-15)

### Bug Fixes

* **deps:** update all non-major dependencies ([#849](https://github.com/lerna-lite/lerna-lite/issues/849)) ([bf23757](https://github.com/lerna-lite/lerna-lite/commit/bf23757941b7b334d1e2feb5f64b39b6748e5a1c)) - by @renovate[bot]
* **deps:** update dependency npm-registry-fetch to v17 ([#862](https://github.com/lerna-lite/lerna-lite/issues/862)) ([413f75c](https://github.com/lerna-lite/lerna-lite/commit/413f75cd0b275fb49f6bebdac4e3c1750d73020e)) - by @renovate[bot]
* **deps:** update dependency pacote to v18 ([#848](https://github.com/lerna-lite/lerna-lite/issues/848)) ([0f98a46](https://github.com/lerna-lite/lerna-lite/commit/0f98a46759e013fd51a57db130a691b18497f1e9)) - by @renovate[bot]

## [3.3.3](https://github.com/lerna-lite/lerna-lite/compare/v3.3.2...v3.3.3) (2024-04-15)

### Bug Fixes

* **deps:** update all non-major dependencies ([#841](https://github.com/lerna-lite/lerna-lite/issues/841)) ([86945b9](https://github.com/lerna-lite/lerna-lite/commit/86945b989840b9608bf7873afad7ec1183f3a740)) - by @renovate[bot]
* **publish:** downgrade npm-packlist to v5.1.1 ([#844](https://github.com/lerna-lite/lerna-lite/issues/844)) ([8d18186](https://github.com/lerna-lite/lerna-lite/commit/8d181860f83d516029cfd661955e3948642bcf96)) - by @wassim-ben-amor

## [3.3.2](https://github.com/lerna-lite/lerna-lite/compare/v3.3.1...v3.3.2) (2024-04-02)

**Note:** Version bump only for package @lerna-lite/publish

## [3.3.1](https://github.com/lerna-lite/lerna-lite/compare/v3.3.0...v3.3.1) (2024-03-04)

### Bug Fixes

* **deps:** update all non-major dependencies ([#824](https://github.com/lerna-lite/lerna-lite/issues/824)) ([ef9a442](https://github.com/lerna-lite/lerna-lite/commit/ef9a4427473a13044e9131b8cb7ec1fb5770bdb0)) - by @renovate[bot]

## [3.3.0](https://github.com/lerna-lite/lerna-lite/compare/v3.2.1...v3.3.0) (2024-02-10)

### Bug Fixes

* **deps:** update all non-major dependencies ([#808](https://github.com/lerna-lite/lerna-lite/issues/808)) ([cec587b](https://github.com/lerna-lite/lerna-lite/commit/cec587bd5571f1a536d17b917dcd2a9b82665526)) - by @renovate[bot]
* **publish:** removePackageFields shouldn't mutate original package.json ([#817](https://github.com/lerna-lite/lerna-lite/issues/817)) ([84f6a88](https://github.com/lerna-lite/lerna-lite/commit/84f6a88748d113a8571e3c84c28137c915312883)) - by @ghiscoding

## [3.2.1](https://github.com/lerna-lite/lerna-lite/compare/v3.2.0...v3.2.1) (2024-01-13)

### Bug Fixes

* **deps:** update all non-major dependencies ([#802](https://github.com/lerna-lite/lerna-lite/issues/802)) ([29e0504](https://github.com/lerna-lite/lerna-lite/commit/29e050449b5ff7d12461b4e27eaacf1c58640fb8)) - by @renovate[bot]
* **publish:** --canary --dry-run command should create valid tags ([#803](https://github.com/lerna-lite/lerna-lite/issues/803)) ([ff62bf1](https://github.com/lerna-lite/lerna-lite/commit/ff62bf16c344870f37fa3cb23ee0d20d32e0a6ed)) - by @ghiscoding
* **publish:** lerna publish --canary --dry-run shouldn't throw ([#801](https://github.com/lerna-lite/lerna-lite/issues/801)) ([9f44c71](https://github.com/lerna-lite/lerna-lite/commit/9f44c716c8ff84f731dc1db2bf078bc4d9015f43)) - by @ghiscoding

## [3.2.0](https://github.com/lerna-lite/lerna-lite/compare/v3.1.0...v3.2.0) (2024-01-06)

### Bug Fixes

* **deps:** update all non-major dependencies ([#794](https://github.com/lerna-lite/lerna-lite/issues/794)) ([4683b51](https://github.com/lerna-lite/lerna-lite/commit/4683b518bf7e06febfa19204f3ec032d7371fca5))

## [3.1.0](https://github.com/lerna-lite/lerna-lite/compare/v3.0.0...v3.1.0) (2023-12-08)

### Features

* **version:** update conventional-changelog pks to latest w/factory ([#788](https://github.com/lerna-lite/lerna-lite/issues/788)) ([a24f3c6](https://github.com/lerna-lite/lerna-lite/commit/a24f3c641c6dc99157c8bff414e24029b6026b35)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#783](https://github.com/lerna-lite/lerna-lite/issues/783)) ([fa026de](https://github.com/lerna-lite/lerna-lite/commit/fa026deb9de67c21de10ad985e339530b4d17cca)) - by @renovate[bot]
* **deps:** update dependency p-map to v7 ([#784](https://github.com/lerna-lite/lerna-lite/issues/784)) ([2644c23](https://github.com/lerna-lite/lerna-lite/commit/2644c23f563f5dafc60d2380802ef8bc81ba808c)) - by @renovate[bot]

## [3.0.0](https://github.com/lerna-lite/lerna-lite/compare/v2.7.2...v3.0.0) (2023-11-26)

### ⚠ BREAKING CHANGES

> Refer to the [v3.0.0](https://github.com/lerna-lite/lerna-lite/releases/tag/v3.0.0) release for more info about the migration.

* **core:** upgrade deps to Node 18 and higher (#777)

### Features

* **core:** upgrade deps to Node 18 and higher ([#777](https://github.com/lerna-lite/lerna-lite/issues/777)) ([70225e8](https://github.com/lerna-lite/lerna-lite/commit/70225e8d0ec396d5ce9565fafcecba851650d0d8)) - by @ghiscoding
* **version:** add --premajor-version-bump option to force patch bumps ([#774](https://github.com/lerna-lite/lerna-lite/issues/774)) ([d092fc6](https://github.com/lerna-lite/lerna-lite/commit/d092fc660c7c5fbf6b7da7ce4e1feb8827e93267)) - by @ghiscoding

### Bug Fixes

* **publish:** dry-run execution should be more obvious in logs ([#769](https://github.com/lerna-lite/lerna-lite/issues/769)) ([8fbd761](https://github.com/lerna-lite/lerna-lite/commit/8fbd761b72bb808ebac961dbca3b82109a5b702c)) - by @ghiscoding

## [2.7.2](https://github.com/lerna-lite/lerna-lite/compare/v2.7.1...v2.7.2) (2023-11-20)

**Note:** Version bump only for package @lerna-lite/publish

## 2.7.1 (2023-11-19)

**Note:** Version bump only for package @lerna-lite/publish

## 2.7.0 (2023-11-16)

### Features

* **core:** add (`.jsonc`, `.json5`) support to Lerna-Lite config ([#760](https://github.com/lerna-lite/lerna-lite/issues/760)) ([311c297](https://github.com/lerna-lite/lerna-lite/commit/311c2978f16648db3a041493c2b0be9b1f031a94)) - by @ghiscoding

## [2.6.0](https://github.com/lerna-lite/lerna-lite/compare/v2.5.1...v2.6.0) (2023-10-14)

### Bug Fixes

* **deps:** update all non-major dependencies ([#739](https://github.com/lerna-lite/lerna-lite/issues/739)) ([d8aeb27](https://github.com/lerna-lite/lerna-lite/commit/d8aeb27ffbd8f66822ba3c202492022a387464c1)) - by @renovate[bot]
* **publish:** fix version conflict recognition for github packages ([#738](https://github.com/lerna-lite/lerna-lite/issues/738)) ([210eefa](https://github.com/lerna-lite/lerna-lite/commit/210eefa4d0277093f45b30074f3b588c17c04f28)) - by @petermetz

## [2.5.1](https://github.com/lerna-lite/lerna-lite/compare/v2.5.0...v2.5.1) (2023-09-09)

### Bug Fixes

* CJS fallbacks should be at the end not at beginning ([#675](https://github.com/lerna-lite/lerna-lite/issues/675)) ([e3d7b9f](https://github.com/lerna-lite/lerna-lite/commit/e3d7b9f0028997a9ad24328f5e2d52de0ec91030)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#718](https://github.com/lerna-lite/lerna-lite/issues/718)) ([7c2897f](https://github.com/lerna-lite/lerna-lite/commit/7c2897fc23eb0b3c47cbd3a78d0a1e8592be35e2)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#722](https://github.com/lerna-lite/lerna-lite/issues/722)) ([c2afec6](https://github.com/lerna-lite/lerna-lite/commit/c2afec6dee0378814c1795bd24e9fdfa07d67296)) - by @renovate[bot]
* **deps:** update dependency @npmcli/arborist to v7 ([#715](https://github.com/lerna-lite/lerna-lite/issues/715)) ([c18600d](https://github.com/lerna-lite/lerna-lite/commit/c18600dd2c630f1745100eada98c5b878e33143b)) - by @renovate[bot]
* **deps:** update dependency libnpmaccess to v8 ([#716](https://github.com/lerna-lite/lerna-lite/issues/716)) ([f7802a5](https://github.com/lerna-lite/lerna-lite/commit/f7802a5133fea3496e42b81b47ea46ffa57c1c8e)) - by @renovate[bot]
* **deps:** update dependency libnpmpublish to v8 ([#680](https://github.com/lerna-lite/lerna-lite/issues/680)) ([6ae83d5](https://github.com/lerna-lite/lerna-lite/commit/6ae83d52e8e55a6bc1142a89d86d9494fbb92d5e)) - by @renovate[bot]
* **deps:** update dependency libnpmpublish to v9 ([#717](https://github.com/lerna-lite/lerna-lite/issues/717)) ([6fd8106](https://github.com/lerna-lite/lerna-lite/commit/6fd8106ae8de90b80973152c12f9e8be3aa4b7b5)) - by @renovate[bot]
* **deps:** update dependency npm-package-arg to v11 ([#692](https://github.com/lerna-lite/lerna-lite/issues/692)) ([2b69331](https://github.com/lerna-lite/lerna-lite/commit/2b693315ffa900c3ad047c29b68708e727fd2f43)) - by @renovate[bot]
* **deps:** update dependency npm-packlist to v8 ([#702](https://github.com/lerna-lite/lerna-lite/issues/702)) ([e0d4e12](https://github.com/lerna-lite/lerna-lite/commit/e0d4e12aba549798cb7b5013ddd1a290be3d25c0)) - by @renovate[bot]
* **deps:** update dependency npm-registry-fetch to v15 ([#684](https://github.com/lerna-lite/lerna-lite/issues/684)) ([94baefd](https://github.com/lerna-lite/lerna-lite/commit/94baefdac2b4945bb28b0d913710322eed8297a3)) - by @renovate[bot]
* **deps:** update dependency npm-registry-fetch to v16 ([#693](https://github.com/lerna-lite/lerna-lite/issues/693)) ([1f19ec5](https://github.com/lerna-lite/lerna-lite/commit/1f19ec51da959ec2ae16c7728816a474d597de6d)) - by @renovate[bot]
* **deps:** update dependency pacote to v17 ([#695](https://github.com/lerna-lite/lerna-lite/issues/695)) ([d92b678](https://github.com/lerna-lite/lerna-lite/commit/d92b6785ceb6e1c71457eb1ac8904c7a206a669c)) - by @renovate[bot]
* **deps:** update dependency read-package-json to v7 ([#696](https://github.com/lerna-lite/lerna-lite/issues/696)) ([325256b](https://github.com/lerna-lite/lerna-lite/commit/325256b0c23c263c9ce7ebfaba5b30b9eb5942c8)) - by @renovate[bot]

## [2.5.0](https://github.com/lerna-lite/lerna-lite/compare/v2.4.3...v2.5.0) (2023-07-06)

### Bug Fixes

* **deps:** update all non-major dependencies ([#654](https://github.com/lerna-lite/lerna-lite/issues/654)) ([247d17b](https://github.com/lerna-lite/lerna-lite/commit/247d17bf627b23776ad49f28d42b210dab5c713d)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#662](https://github.com/lerna-lite/lerna-lite/issues/662)) ([009a47c](https://github.com/lerna-lite/lerna-lite/commit/009a47c191d75b89a8bc68860ec83369a21bea91)) - by @renovate[bot]
* **deps:** update dependency chalk to ^5.3.0 ([#660](https://github.com/lerna-lite/lerna-lite/issues/660)) ([96c80a9](https://github.com/lerna-lite/lerna-lite/commit/96c80a9aace6f10967f0f6f31880b177ecd6e0f5)) - by @renovate[bot]
* **publish:** catch publish conflict 403 error from npm ([#657](https://github.com/lerna-lite/lerna-lite/issues/657)) ([738c028](https://github.com/lerna-lite/lerna-lite/commit/738c0282c8f50cbfdd4259185a9668aefb78c727)) - by @ghiscoding
* **publish:** ensure that error code is a number ([#656](https://github.com/lerna-lite/lerna-lite/issues/656)) ([0b823d5](https://github.com/lerna-lite/lerna-lite/commit/0b823d546a217d021b165a64f20e334b88bf4c09)) - by @ghiscoding
* strict-ssl mapping for node-fetch-registry during unpublished projects lookup ([#655](https://github.com/lerna-lite/lerna-lite/issues/655)) ([9b6a400](https://github.com/lerna-lite/lerna-lite/commit/9b6a400ab0cb0edc1efab5c45f2dded2856c0cff)) - by @ghiscoding

## [2.4.3](https://github.com/lerna-lite/lerna-lite/compare/v2.4.2...v2.4.3) (2023-06-20)

### Bug Fixes

* **publish:** handle empty scripts section on remove-fields flag ([#652](https://github.com/lerna-lite/lerna-lite/issues/652)) ([4b050ca](https://github.com/lerna-lite/lerna-lite/commit/4b050caad40520ab2f897498c9d59bb08ebf2e72)) - by @Naymi

## [2.4.2](https://github.com/lerna-lite/lerna-lite/compare/v2.4.1...v2.4.2) (2023-06-20)

### Bug Fixes

* **deps:** update dependency semver to ^7.5.2 ([#646](https://github.com/lerna-lite/lerna-lite/issues/646)) ([449358b](https://github.com/lerna-lite/lerna-lite/commit/449358b9db37b94e3e1ebcf3af4ad8cc0b2ae9ca)) - by @renovate[bot]
* **publish:** skip lifecycle scripts on pkg fields removal, fixes [#637](https://github.com/lerna-lite/lerna-lite/issues/637) ([#647](https://github.com/lerna-lite/lerna-lite/issues/647)) ([5b2a15a](https://github.com/lerna-lite/lerna-lite/commit/5b2a15afcb36c62fe9d3b9f49c59bea86613c633)) - by @ghiscoding

## [2.4.1](https://github.com/lerna-lite/lerna-lite/compare/v2.4.0...v2.4.1) (2023-06-07)

### Bug Fixes

* **deps:** update dependency glob to v10 ([#616](https://github.com/lerna-lite/lerna-lite/issues/616)) ([4f92ea2](https://github.com/lerna-lite/lerna-lite/commit/4f92ea21ce4a30006d44b2ef0c87e30acdf85a5e)) - by @renovate[bot]

## [2.4.0](https://github.com/lerna-lite/lerna-lite/compare/v2.3.0...v2.4.0) (2023-05-18)

### Bug Fixes

* **deps:** update all non-major dependencies ([#601](https://github.com/lerna-lite/lerna-lite/issues/601)) ([65fa856](https://github.com/lerna-lite/lerna-lite/commit/65fa8568e721fc7b4db4dff60396d99e419e69f6)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#608](https://github.com/lerna-lite/lerna-lite/issues/608)) ([b000303](https://github.com/lerna-lite/lerna-lite/commit/b000303e0bf66b1f1fbdd939124b0b97a828deea)) - by @renovate[bot]
* **deps:** update dependency glob to v10 ([#607](https://github.com/lerna-lite/lerna-lite/issues/607)) ([dadbaca](https://github.com/lerna-lite/lerna-lite/commit/dadbaca3f961405c96339e259268f548ea6e1e0e)) - by @renovate[bot]
* **deps:** update dependency glob to v10 ([#609](https://github.com/lerna-lite/lerna-lite/issues/609)) ([dc146e0](https://github.com/lerna-lite/lerna-lite/commit/dc146e079c482b14e5bafc220baea0eec87fd524)) - by @renovate[bot]

### Reverts

* Revert "chore: replace `glob` by `globby` to cleanup temp files (#605)" (#606) ([d940322](https://github.com/lerna-lite/lerna-lite/commit/d940322515345d5fee44817f54652acdb28daea8)), closes [#605](https://github.com/lerna-lite/lerna-lite/issues/605) [#606](https://github.com/lerna-lite/lerna-lite/issues/606) - by @ghiscoding

## [2.3.0](https://github.com/lerna-lite/lerna-lite/compare/v2.2.0...v2.3.0) (2023-05-05)

### Features

* **publish:** add npm provenance to lerna publish ([#600](https://github.com/lerna-lite/lerna-lite/issues/600)) ([dc082c2](https://github.com/lerna-lite/lerna-lite/commit/dc082c25282eee8ea0a67d6dc3ff17210a315b5b)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#597](https://github.com/lerna-lite/lerna-lite/issues/597)) ([48f8ad6](https://github.com/lerna-lite/lerna-lite/commit/48f8ad6f35fa7ef1b31b39a61e7eb73a1dffc798)) - by @renovate[bot]

## [2.2.0](https://github.com/lerna-lite/lerna-lite/compare/v2.1.0...v2.2.0) (2023-05-02)

### Bug Fixes

* **deps:** update all non-major dependencies ([#592](https://github.com/lerna-lite/lerna-lite/issues/592)) ([27c3a90](https://github.com/lerna-lite/lerna-lite/commit/27c3a908a6151197d78ad43c3f977ebe76135632)) - by @renovate[bot]
* **deps:** update dependency p-map to v6 ([#589](https://github.com/lerna-lite/lerna-lite/issues/589)) ([13c4c04](https://github.com/lerna-lite/lerna-lite/commit/13c4c04a4286f6833f3d1edf8e80f66140868fb8)) - by @renovate[bot]
* **version:** allowPeerDependenciesUpdate should work w/`workspace:^`, fix [#590](https://github.com/lerna-lite/lerna-lite/issues/590) ([#591](https://github.com/lerna-lite/lerna-lite/issues/591)) ([0de00e1](https://github.com/lerna-lite/lerna-lite/commit/0de00e16c29145a297a612c427d88f5ea263b8b5)) - by @ghiscoding

## [2.1.0](https://github.com/lerna-lite/lerna-lite/compare/v2.0.0...v2.1.0) (2023-04-21)

### Features

* **publish:** add name of package that fails to publish ([#574](https://github.com/lerna-lite/lerna-lite/issues/574)) ([94e5fed](https://github.com/lerna-lite/lerna-lite/commit/94e5fed11fc94f757f35c52d454c999135e86547)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#583](https://github.com/lerna-lite/lerna-lite/issues/583)) ([43c156c](https://github.com/lerna-lite/lerna-lite/commit/43c156cb64cef9bb9cbd800b8decbed9137e80a3)) - by @renovate[bot]
* **publish:** add normalize-path as a dependency ([#579](https://github.com/lerna-lite/lerna-lite/issues/579)) ([5dedbbe](https://github.com/lerna-lite/lerna-lite/commit/5dedbbe582d87521abdafc4d73f7b5504865521e)) - by @rfoel

## [2.0.0](https://github.com/lerna-lite/lerna-lite/compare/v1.17.0...v2.0.0) (2023-04-14)

### ⚠ BREAKING CHANGES

* **build:** prepare official Lerna-Lite 2.0 release (#567)

### Features

* **build:** prepare official Lerna-Lite 2.0 release ([#567](https://github.com/lerna-lite/lerna-lite/issues/567)) ([2865a60](https://github.com/lerna-lite/lerna-lite/commit/2865a604fe85e498cc8c4410cead51ad067a41e0)), closes [#537](https://github.com/lerna-lite/lerna-lite/issues/537) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#535](https://github.com/lerna-lite/lerna-lite/issues/535)) ([bdb1e9c](https://github.com/lerna-lite/lerna-lite/commit/bdb1e9c38082f1a5ac7f28d0fa123de08e48bd4b)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#547](https://github.com/lerna-lite/lerna-lite/issues/547)) ([deb467c](https://github.com/lerna-lite/lerna-lite/commit/deb467c6bef624ae10861ca1a4251263c8792a91)) - by @renovate[bot]

## [2.0.0-alpha.2](https://github.com/lerna-lite/lerna-lite/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2023-04-07)

**Note:** Version bump only for package @lerna-lite/publish

## [2.0.0-alpha.1](https://github.com/lerna-lite/lerna-lite/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (2023-04-07)

**Note:** Version bump only for package @lerna-lite/publish

## [2.0.0-alpha.0](https://github.com/lerna-lite/lerna-lite/compare/v1.17.0...v2.0.0-alpha.0) (2023-04-07)

### ⚠ BREAKING CHANGES

* **publish:** make version & publish commands optionnal, closes #450 (#552)
* **build:** migrate to ESM build & switch to Vitest for ESM support (#537)

### Features

* **build:** migrate to ESM build & switch to Vitest for ESM support ([#537](https://github.com/lerna-lite/lerna-lite/issues/537)) ([308fc2e](https://github.com/lerna-lite/lerna-lite/commit/308fc2e2d72d90f62b3a3954cbeeb3810b767a35)) - by @ghiscoding
* **cli:** remove listable dependency from CLI ([#553](https://github.com/lerna-lite/lerna-lite/issues/553)) ([1baa0d1](https://github.com/lerna-lite/lerna-lite/commit/1baa0d19b7116dac56c9326934c7cc9e07caec8c)) - by @ghiscoding
* **publish:** make version & publish commands optionnal, closes [#450](https://github.com/lerna-lite/lerna-lite/issues/450) ([#552](https://github.com/lerna-lite/lerna-lite/issues/552)) ([11e4dab](https://github.com/lerna-lite/lerna-lite/commit/11e4dab70185198692b30cc72a184512bdc0e55d)) - by @ghiscoding
* **publish:** remove `--require-scripts`, keep npm scripts lifecycle ([#542](https://github.com/lerna-lite/lerna-lite/issues/542)) ([6559aec](https://github.com/lerna-lite/lerna-lite/commit/6559aec9e517fb073583d7684191449e78b809f5)) - by @ghiscoding
* remove all deprecated options tagged to be removed in next major ([#545](https://github.com/lerna-lite/lerna-lite/issues/545)) ([a6f44b3](https://github.com/lerna-lite/lerna-lite/commit/a6f44b36038e5663d8c14fa062569b0f105a02f4)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#535](https://github.com/lerna-lite/lerna-lite/issues/535)) ([bdb1e9c](https://github.com/lerna-lite/lerna-lite/commit/bdb1e9c38082f1a5ac7f28d0fa123de08e48bd4b)) - by @renovate[bot]
* **deps:** update dependency minimatch to v8 and couple other deps patch ([#550](https://github.com/lerna-lite/lerna-lite/issues/550)) ([e7d29f1](https://github.com/lerna-lite/lerna-lite/commit/e7d29f105c4757526e059bc5ae1eaa24a6eeaa59)) - by @ghiscoding

# [1.17.0](https://github.com/lerna-lite/lerna-lite/compare/v1.16.2...v1.17.0) (2023-03-16)

### Features

* **version:** support git "describeTag" configuration in version/publish commands ([#515](https://github.com/lerna-lite/lerna-lite/issues/515)) ([6a041e4](https://github.com/lerna-lite/lerna-lite/commit/6a041e4e864a4868b2d1c213a561ad57a4053a11)) - by @xueran

## [1.16.2](https://github.com/lerna-lite/lerna-lite/compare/v1.16.1...v1.16.2) (2023-03-13)

### Bug Fixes

* **cli:** TypeScript should be saved & published as LF, fixes [#513](https://github.com/lerna-lite/lerna-lite/issues/513) ([#514](https://github.com/lerna-lite/lerna-lite/issues/514)) ([1c62eb7](https://github.com/lerna-lite/lerna-lite/commit/1c62eb7d222db3e7be426d402fbfceff622615fe)) - by @ghiscoding

## [1.16.1](https://github.com/lerna-lite/lerna-lite/compare/v1.16.0...v1.16.1) (2023-03-11)

**Note:** Version bump only for package @lerna-lite/publish

# [1.16.0](https://github.com/lerna-lite/lerna-lite/compare/v1.15.2...v1.16.0) (2023-03-03)

### Bug Fixes

* **deps:** update all non-major dependencies ([#488](https://github.com/lerna-lite/lerna-lite/issues/488)) ([126bdb7](https://github.com/lerna-lite/lerna-lite/commit/126bdb7713c7fe5444f755f9f719d07a483cf146)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#502](https://github.com/lerna-lite/lerna-lite/issues/502)) ([b26827d](https://github.com/lerna-lite/lerna-lite/commit/b26827d7c4157d68494a9bc801f97e37eedf9b04)) - by @ghiscoding
* **publish:** ensure zero exit code when EWORKINGTREE warning occurs ([#500](https://github.com/lerna-lite/lerna-lite/issues/500)) ([b14150b](https://github.com/lerna-lite/lerna-lite/commit/b14150b66b9979e1c4735669b2b6834ff6a8d162)) - by @ghiscoding

### Features

* **version:** add user-defined build metadata to bumped packages ([#504](https://github.com/lerna-lite/lerna-lite/issues/504)) ([b8fbf2c](https://github.com/lerna-lite/lerna-lite/commit/b8fbf2c7344c2fd5d0d0f3dee5c883eaa3b4be67)) - by @ghiscoding

## [1.15.1](https://github.com/lerna-lite/lerna-lite/compare/v1.15.0...v1.15.1) (2023-02-08)

**Note:** Version bump only for package @lerna-lite/publish

# [1.15.0](https://github.com/lerna-lite/lerna-lite/compare/v1.14.2...v1.15.0) (2023-02-04)

### Bug Fixes

* **deps:** update dependency @npmcli/arborist to ^6.2.1 ([#471](https://github.com/lerna-lite/lerna-lite/issues/471)) ([5387b4e](https://github.com/lerna-lite/lerna-lite/commit/5387b4ecbba72e95639b9143233e736507b4ff17)) - by @renovate[bot]
* **publish:** deprecate publish --require-scripts ([#463](https://github.com/lerna-lite/lerna-lite/issues/463)) ([e8ef54e](https://github.com/lerna-lite/lerna-lite/commit/e8ef54ed18581e092cdd9da89d547635f7792249)) - by @ghiscoding
* **publish:** downgrade `glob` deps to cleanup temp file ([#475](https://github.com/lerna-lite/lerna-lite/issues/475)) ([de09614](https://github.com/lerna-lite/lerna-lite/commit/de09614454aca271067275de6d97c78d70157a95)) - by @ghiscoding

### Features

* **publish:** add `--cleanup-temp-files` option to cleanup packed tmp ([#474](https://github.com/lerna-lite/lerna-lite/issues/474)) ([6781c79](https://github.com/lerna-lite/lerna-lite/commit/6781c7938a3594b5cd0f6da28f02e3c230d4e045)) - by @ghiscoding
* **publish:** recover from network failure ([#469](https://github.com/lerna-lite/lerna-lite/issues/469)) ([acd586d](https://github.com/lerna-lite/lerna-lite/commit/acd586d161c95725350b1f9fc51b7b00ce2b8752)) - by @ghiscoding
* **version:** move all version related methods under version package ([#456](https://github.com/lerna-lite/lerna-lite/issues/456)) ([2c0921a](https://github.com/lerna-lite/lerna-lite/commit/2c0921aecb52330f853d08b453f3cd1a61a0857e)) - by @ghiscoding
* **watch:** add optional stdin key to exit watch mode cleanly ([#472](https://github.com/lerna-lite/lerna-lite/issues/472)) ([d0cf2d9](https://github.com/lerna-lite/lerna-lite/commit/d0cf2d9d8286f8016867cfd79e3b1146b96b747d)) - by @ghiscoding

## [1.14.2](https://github.com/lerna-lite/lerna-lite/compare/v1.14.1...v1.14.2) (2023-01-21)

**Note:** Version bump only for package @lerna-lite/publish

## [1.14.1](https://github.com/lerna-lite/lerna-lite/compare/v1.14.0...v1.14.1) (2023-01-19)

**Note:** Version bump only for package @lerna-lite/publish

# [1.14.0](https://github.com/lerna-lite/lerna-lite/compare/v1.13.0...v1.14.0) (2023-01-18)

### Bug Fixes

* **deps:** update all non-major dependencies ([#423](https://github.com/lerna-lite/lerna-lite/issues/423)) ([b965cc7](https://github.com/lerna-lite/lerna-lite/commit/b965cc79eca285a39ac420fd1c1e3e7614c9c6e0)) - by @renovate-bot
* **deps:** update all non-major dependencies ([#425](https://github.com/lerna-lite/lerna-lite/issues/425)) ([3793929](https://github.com/lerna-lite/lerna-lite/commit/3793929488365180a7da3e03686bf42eb2172482)) - by @renovate-bot
* **deps:** update dependency @npmcli/arborist to ^6.1.6 ([#440](https://github.com/lerna-lite/lerna-lite/issues/440)) ([51eec47](https://github.com/lerna-lite/lerna-lite/commit/51eec4746aa8413900666e817d73d22da4252995)) - by @renovate[bot]

### Features

* **publish:** add --summary-file option ([#428](https://github.com/lerna-lite/lerna-lite/issues/428)) ([3de55ef](https://github.com/lerna-lite/lerna-lite/commit/3de55ef1ad7127b4e86f4c2f5accfa009c10d79b)) - by @ghiscoding

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
