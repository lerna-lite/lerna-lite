# Change Log
## Automate your Workspace Versioning, Publishing & Changelogs with [Lerna-Lite](https://github.com/lerna-lite/lerna-lite) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.2.0](https://github.com/lerna-lite/lerna-lite/compare/v4.1.2...v4.2.0) (2025-05-23)

### Features

* upgrade `conventional-changelog` to v7 ([#1045](https://github.com/lerna-lite/lerna-lite/issues/1045)) ([dd34362](https://github.com/lerna-lite/lerna-lite/commit/dd34362f180d6783b74bd3425105c53689368e27)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1038](https://github.com/lerna-lite/lerna-lite/issues/1038)) ([b285218](https://github.com/lerna-lite/lerna-lite/commit/b285218259b45c73b3aa3f9627adb7057b589bd6)) - by @renovate[bot]
* **deps:** update dependency @npmcli/arborist to ^9.1.1 ([#1044](https://github.com/lerna-lite/lerna-lite/issues/1044)) ([2fe3139](https://github.com/lerna-lite/lerna-lite/commit/2fe3139091735cf02dfff51ed49dcb6390baea93)) - by @renovate[bot]
* **deps:** update inquirer packages ([#1047](https://github.com/lerna-lite/lerna-lite/issues/1047)) ([aa49ff8](https://github.com/lerna-lite/lerna-lite/commit/aa49ff8b653fa4e3978bbe5ef9ca3396e37e2407)) - by @renovate[bot]

## [4.1.2](https://github.com/lerna-lite/lerna-lite/compare/v4.1.1...v4.1.2) (2025-05-12)

### Bug Fixes

* **deps:** update inquirer packages ([#1035](https://github.com/lerna-lite/lerna-lite/issues/1035)) ([16b6745](https://github.com/lerna-lite/lerna-lite/commit/16b67458e086b320badf951c961ffad7408987b0)) - by @renovate[bot]
* **publish:** re-prompt OTP if it expired when publishing too many pkgs ([#1034](https://github.com/lerna-lite/lerna-lite/issues/1034)) ([9df3f69](https://github.com/lerna-lite/lerna-lite/commit/9df3f695b188270c653d21ac00b6cb379e418e89)) - by @ghiscoding

## [4.1.1](https://github.com/lerna-lite/lerna-lite/compare/v4.1.0...v4.1.1) (2025-04-29)

### Bug Fixes

* pnpm local catalog changes should be reflected in packages ([#1028](https://github.com/lerna-lite/lerna-lite/issues/1028)) ([20479ca](https://github.com/lerna-lite/lerna-lite/commit/20479ca8f6a33b4f930af7198222e60bf914c2e7)) - by @ghiscoding

## [4.1.0](https://github.com/lerna-lite/lerna-lite/compare/v4.0.0...v4.1.0) (2025-04-29)

### Features

* **core:** upgrade to Execa v9 ([#1019](https://github.com/lerna-lite/lerna-lite/issues/1019)) ([0e41889](https://github.com/lerna-lite/lerna-lite/commit/0e41889d15ddb6e968b987598406d666749298ec)) - by @ghiscoding

### Bug Fixes

* **core:** fix wrong regexp about workspace protocol ([#1012](https://github.com/lerna-lite/lerna-lite/issues/1012)) ([eb4c47c](https://github.com/lerna-lite/lerna-lite/commit/eb4c47ca5ab08866f0abbab842b24d7c85b240a9)) - by @Mister-Hope
* **deps:** update all non-major dependencies ([#1014](https://github.com/lerna-lite/lerna-lite/issues/1014)) ([cbf1ff0](https://github.com/lerna-lite/lerna-lite/commit/cbf1ff0681cb0ec3f76dc9f7de54d5531d3415af)) - by @renovate[bot]
* **deps:** update dependency @inquirer/select to ^4.2.0 ([#1022](https://github.com/lerna-lite/lerna-lite/issues/1022)) ([ba1b380](https://github.com/lerna-lite/lerna-lite/commit/ba1b3806a9f59fa8038d5e2dec4c47365d06f04f)) - by @renovate[bot]
* **deps:** update inquirer packages ([#1015](https://github.com/lerna-lite/lerna-lite/issues/1015)) ([c16622a](https://github.com/lerna-lite/lerna-lite/commit/c16622ae73580b77cbc44de88cd9032acf2d9c0a)) - by @renovate[bot]
* **version:** pnpm catalog changes should be reflected in packages ([#1023](https://github.com/lerna-lite/lerna-lite/issues/1023)) ([1058573](https://github.com/lerna-lite/lerna-lite/commit/10585739a0c85191d7a8f5aa0aaa7f97b34d2752)) - by @ghiscoding

## [4.0.0](https://github.com/lerna-lite/lerna-lite/compare/v3.12.3...v4.0.0) (2025-03-28)

> [!NOTE]
> Please visit the [v4.0.0](https://github.com/lerna-lite/lerna-lite/releases/tag/v4.0.0) release for more details about the migration.

### ⚠ BREAKING CHANGES

* **deps:** update all major npm & other deps (#1008)
* **deps:** bump minimum Node version to ^20.17.0 || >=22.9.0 (#1000)
* **version:** change default "describe [Git] tag" pattern to `v*` (#1001)
* **watch:** upgrade Chokidar to v4.0 major version (#1004)
* **deps:** remove `node-fetch`, fixes punycode warning (#998)
* **deps:** upgrade all conventional-changelog-* to major versions (#997)

### Bug Fixes

* **deps:** bump minimum Node version to ^20.17.0 || >=22.9.0 ([#1000](https://github.com/lerna-lite/lerna-lite/issues/1000)) ([9a87d82](https://github.com/lerna-lite/lerna-lite/commit/9a87d82ff71f274dd41a0cd85f9036f11c2525b7)) - by @ghiscoding
* **deps:** update all major npm & other deps ([#1008](https://github.com/lerna-lite/lerna-lite/issues/1008)) ([332a1c0](https://github.com/lerna-lite/lerna-lite/commit/332a1c0c06dbb2d7354fecf53c3433e8d1d5e2bf)) - by @ghiscoding
* **deps:** update inquirer packages ([#996](https://github.com/lerna-lite/lerna-lite/issues/996)) ([6eb5a80](https://github.com/lerna-lite/lerna-lite/commit/6eb5a80d9dd42898b8028712cd15abc7959ade3b)) - by @renovate[bot]
* **deps:** upgrade all conventional-changelog-* to major versions ([#997](https://github.com/lerna-lite/lerna-lite/issues/997)) ([df2d462](https://github.com/lerna-lite/lerna-lite/commit/df2d46206b791064dd476bd20ec133766b6f8afa)) - by @ghiscoding
* **publish:** replace +{SHA} with .{SHA} in lerna publish --canary ([#999](https://github.com/lerna-lite/lerna-lite/issues/999)) ([26da1a9](https://github.com/lerna-lite/lerna-lite/commit/26da1a9ba36a2fb71b082786572f1edb5ee19efc)) - by @ghiscoding
* **version:** change default "describe [Git] tag" pattern to `v*` ([#1001](https://github.com/lerna-lite/lerna-lite/issues/1001)) ([6b0f1e9](https://github.com/lerna-lite/lerna-lite/commit/6b0f1e90ac50437f355fd2c92fe9e4e964ecadc4)) - by @ghiscoding
* **watch:** upgrade Chokidar to v4.0 major version ([#1004](https://github.com/lerna-lite/lerna-lite/issues/1004)) ([d376975](https://github.com/lerna-lite/lerna-lite/commit/d3769750b63446f83f04ae797fbdb8863a18c311)) - by @ghiscoding

### Miscellaneous Chores

* **deps:** remove `node-fetch`, fixes punycode warning ([#998](https://github.com/lerna-lite/lerna-lite/issues/998)) ([f3c6388](https://github.com/lerna-lite/lerna-lite/commit/f3c6388f98875bba817a17fdfc0864e58cab1d11)) - by @ghiscoding

## [3.12.3](https://github.com/lerna-lite/lerna-lite/compare/v3.12.2...v3.12.3) (2025-03-12)

### Bug Fixes

* **deps:** update inquirer packages ([#994](https://github.com/lerna-lite/lerna-lite/issues/994)) ([a6bfed2](https://github.com/lerna-lite/lerna-lite/commit/a6bfed284e65be34b41d12947b8897aeb861f472)) - by @renovate[bot]
* use cosmiconfig global searchStrategy to fix breaking behaviour ([#992](https://github.com/lerna-lite/lerna-lite/issues/992)) ([5f1cd42](https://github.com/lerna-lite/lerna-lite/commit/5f1cd42fe9b2057c726ae57463cbac8ca2b68a42)) - by @ghiscoding

## [3.12.2](https://github.com/lerna-lite/lerna-lite/compare/v3.12.1...v3.12.2) (2025-02-28)

### Bug Fixes

* **deps:** update all non-major dependencies ([#986](https://github.com/lerna-lite/lerna-lite/issues/986)) ([1cc92ee](https://github.com/lerna-lite/lerna-lite/commit/1cc92ee781107f61f2e76e7bd5796b376b7674c8)) - by @renovate[bot]
* dry-run, don't throw no changelog w/o release, fixes [#988](https://github.com/lerna-lite/lerna-lite/issues/988) ([#990](https://github.com/lerna-lite/lerna-lite/issues/990)) ([0587015](https://github.com/lerna-lite/lerna-lite/commit/05870159422742fec8e62c97c66c9f46ad77841f)) - by @ghiscoding

## [3.12.1](https://github.com/lerna-lite/lerna-lite/compare/v3.12.0...v3.12.1) (2025-02-18)

### Bug Fixes

* **deps:** update all non-major dependencies ([#981](https://github.com/lerna-lite/lerna-lite/issues/981)) ([2be4207](https://github.com/lerna-lite/lerna-lite/commit/2be420786f571934d35c7a916aa564765e9f2084)) - by @renovate[bot]
* **deps:** update inquirer packages ([#980](https://github.com/lerna-lite/lerna-lite/issues/980)) ([2c7eb45](https://github.com/lerna-lite/lerna-lite/commit/2c7eb45e2185a4ebf4bb203d43c47f24d2f8b808)) - by @renovate[bot]

## [3.12.0](https://github.com/lerna-lite/lerna-lite/compare/v3.11.0...v3.12.0) (2025-01-31)

### Features

* **publish:** support pnpm `catalog:` protocol with lerna publish ([#975](https://github.com/lerna-lite/lerna-lite/issues/975)) ([1dd3dc7](https://github.com/lerna-lite/lerna-lite/commit/1dd3dc74f2021a049cffb9f11af89a6890176d17)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#971](https://github.com/lerna-lite/lerna-lite/issues/971)) ([24d1bbc](https://github.com/lerna-lite/lerna-lite/commit/24d1bbccb3c263c53212e373ffe7d2fe1692551e)) - by @renovate[bot]
* **deps:** update dependency tinyrainbow to v2 ([#973](https://github.com/lerna-lite/lerna-lite/issues/973)) ([2c14288](https://github.com/lerna-lite/lerna-lite/commit/2c14288407e12d82b02fa2641c0d0b46990b7f6a)) - by @renovate[bot]
* **deps:** update inquirer packages ([#970](https://github.com/lerna-lite/lerna-lite/issues/970)) ([dc737b6](https://github.com/lerna-lite/lerna-lite/commit/dc737b6403f8cc6c24d3bc4ca161eff359f0b653)) - by @renovate[bot]
* **deps:** update inquirer packages ([#974](https://github.com/lerna-lite/lerna-lite/issues/974)) ([2e6caf6](https://github.com/lerna-lite/lerna-lite/commit/2e6caf6c1a2fe5f3d897e9303076636d9faba3a6)) - by @renovate[bot]

## [3.11.0](https://github.com/lerna-lite/lerna-lite/compare/v3.10.1...v3.11.0) (2025-01-02)

### Features

* **core:** support `catalog:` protocol ([#965](https://github.com/lerna-lite/lerna-lite/issues/965)) ([4d739e2](https://github.com/lerna-lite/lerna-lite/commit/4d739e25a44c46e5df24df156fc8b36ad49d0989)) - by @Mister-Hope

### Bug Fixes

* **deps:** update all non-major dependencies ([#966](https://github.com/lerna-lite/lerna-lite/issues/966)) ([956ad09](https://github.com/lerna-lite/lerna-lite/commit/956ad098754c6869263afb92ec629be1ad968bbc)) - by @renovate[bot]
* **deps:** update dependency is-ci to v4 ([#968](https://github.com/lerna-lite/lerna-lite/issues/968)) ([d8424a7](https://github.com/lerna-lite/lerna-lite/commit/d8424a7bcedf7ae445977e198e706e642180ee27)) - by @renovate[bot]
* **deps:** update inquirer packages ([#967](https://github.com/lerna-lite/lerna-lite/issues/967)) ([3bc8dff](https://github.com/lerna-lite/lerna-lite/commit/3bc8dff3712c35a2ad86f49b51ad036e171c7805)) - by @renovate[bot]

## [3.10.1](https://github.com/lerna-lite/lerna-lite/compare/v3.10.0...v3.10.1) (2024-11-28)

### Bug Fixes

* **deps:** update dependency git-url-parse to v16 ([#960](https://github.com/lerna-lite/lerna-lite/issues/960)) ([c4d1833](https://github.com/lerna-lite/lerna-lite/commit/c4d1833971f799de77e873cf420f3abce52b5bbf)) - by @renovate[bot]
* **deps:** update dependency uuid to v11 ([#957](https://github.com/lerna-lite/lerna-lite/issues/957)) ([cbda4b6](https://github.com/lerna-lite/lerna-lite/commit/cbda4b6a5a4759c599b8d408ff8a54b3636f10c1)) - by @renovate[bot]
* **deps:** update inquirer packages to ^4.0.1 ([#956](https://github.com/lerna-lite/lerna-lite/issues/956)) ([55de3de](https://github.com/lerna-lite/lerna-lite/commit/55de3de4a623dd09c281c83c7f7e95c482144477)) - by @renovate[bot]
* **deps:** update inquirer packages to ^4.0.2 ([#961](https://github.com/lerna-lite/lerna-lite/issues/961)) ([eca73dc](https://github.com/lerna-lite/lerna-lite/commit/eca73dc72220910cd28e41413c20d62e3fac7a08)) - by @renovate[bot]
* drop `strip-ansi` in favor of native stripVTControlCharacters ([#950](https://github.com/lerna-lite/lerna-lite/issues/950)) ([2f23996](https://github.com/lerna-lite/lerna-lite/commit/2f23996fec6bcc695515a344957a7cf46edf90d4)) - by @ghiscoding

## [3.10.0](https://github.com/lerna-lite/lerna-lite/compare/v3.9.3...v3.10.0) (2024-10-15)

### Features

* support --scope filter options in all lerna commands ([#948](https://github.com/lerna-lite/lerna-lite/issues/948)) ([f72f893](https://github.com/lerna-lite/lerna-lite/commit/f72f893beb5b9c3c23c861caba06dab801c37435)) - by @farfromrefug

## [3.9.3](https://github.com/lerna-lite/lerna-lite/compare/v3.9.2...v3.9.3) (2024-10-08)

### Bug Fixes

* **deps:** replace `globby` with `tinyglobby` ([#941](https://github.com/lerna-lite/lerna-lite/issues/941)) ([be8d050](https://github.com/lerna-lite/lerna-lite/commit/be8d050dbe72b42ff98c8acbfdc0b3665396ed28)) - by @ghiscoding
* **deps:** replace `picocolors` with `tinyrainbow` ([#942](https://github.com/lerna-lite/lerna-lite/issues/942)) ([75fc4df](https://github.com/lerna-lite/lerna-lite/commit/75fc4dffca0f618c60a5932dab1a4a14ab8ee0ed)) - by @ghiscoding
* **deps:** update inquirer packages to v4 ([#944](https://github.com/lerna-lite/lerna-lite/issues/944)) ([c9be87d](https://github.com/lerna-lite/lerna-lite/commit/c9be87df2d650b334eafed4bfc077b0ccac29619)) - by @renovate[bot]

## [3.9.2](https://github.com/lerna-lite/lerna-lite/compare/v3.9.1...v3.9.2) (2024-09-28)

### Bug Fixes

* **deps:** replace `chalk` with `picocolors` ([#940](https://github.com/lerna-lite/lerna-lite/issues/940)) ([7850c65](https://github.com/lerna-lite/lerna-lite/commit/7850c655bf138a38a9c9fbd90a84c594c0138ef0)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#929](https://github.com/lerna-lite/lerna-lite/issues/929)) ([fea1aec](https://github.com/lerna-lite/lerna-lite/commit/fea1aec3e4a3824c6d717fd1530475f4df3a4174)) - by @renovate[bot]
* **deps:** update inquirer packages to v3 (major) ([#937](https://github.com/lerna-lite/lerna-lite/issues/937)) ([c53390a](https://github.com/lerna-lite/lerna-lite/commit/c53390a2e3e200daead8e04ddc6765fb12e29804)) - by @renovate[bot]
* **schema:** bool prop `useWorkspaces` missing in Schema, fixes [#930](https://github.com/lerna-lite/lerna-lite/issues/930) ([#931](https://github.com/lerna-lite/lerna-lite/issues/931)) ([a24a59a](https://github.com/lerna-lite/lerna-lite/commit/a24a59ac8f47400a18415a619e0294d5fcb105c1)) - by @ghiscoding

## [3.9.1](https://github.com/lerna-lite/lerna-lite/compare/v3.9.0...v3.9.1) (2024-09-07)

### Bug Fixes

* **deps:** update all non-major dependencies ([#927](https://github.com/lerna-lite/lerna-lite/issues/927)) ([a7a69e7](https://github.com/lerna-lite/lerna-lite/commit/a7a69e782e7e60a8ccda66a13c28d93b169a5b8d)) - by @renovate[bot]
* **deps:** update dependency ssri to v11 ([#926](https://github.com/lerna-lite/lerna-lite/issues/926)) ([7594054](https://github.com/lerna-lite/lerna-lite/commit/7594054fe2ae2ab5154fba1a6b987128a00ce945)) - by @renovate[bot]
* **version:** Renamed 'skip-bump-only-release' CLI option to plural ([#925](https://github.com/lerna-lite/lerna-lite/issues/925)) ([b552346](https://github.com/lerna-lite/lerna-lite/commit/b55234609030a7f9443bfb8a18a587a091d274e6)), closes [#924](https://github.com/lerna-lite/lerna-lite/issues/924) - by @SchulteMarkus

## [3.9.0](https://github.com/lerna-lite/lerna-lite/compare/v3.8.0...v3.9.0) (2024-08-30)

### Features

* **publish:** support full file path for --summary-file ([#919](https://github.com/lerna-lite/lerna-lite/issues/919)) ([25b3718](https://github.com/lerna-lite/lerna-lite/commit/25b37184adff216655700cdc27cc9ec47ae291b7)) - by @ghiscoding

### Bug Fixes

* **core:** don't include other deps when `graphType` is provided ([#922](https://github.com/lerna-lite/lerna-lite/issues/922)) ([8fe05bc](https://github.com/lerna-lite/lerna-lite/commit/8fe05bcbb6572d63fcb832c921879bdb27654fce)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#916](https://github.com/lerna-lite/lerna-lite/issues/916)) ([42ee0e3](https://github.com/lerna-lite/lerna-lite/commit/42ee0e3218ec1e10517287a5eac713cf69d03e37)) - by @renovate[bot]
* **deps:** update dependency git-url-parse to v15 ([#918](https://github.com/lerna-lite/lerna-lite/issues/918)) ([5b4d649](https://github.com/lerna-lite/lerna-lite/commit/5b4d64970732c4fe848080053ccd31f61b1c682e)) - by @renovate[bot]
* **schema:** add extends property in schema ([#921](https://github.com/lerna-lite/lerna-lite/issues/921)) ([726145f](https://github.com/lerna-lite/lerna-lite/commit/726145fe305bed155243b81008c97c2b8bf61b4b)) - by @ghiscoding
* **version:** enable changing commit message when using amend ([#920](https://github.com/lerna-lite/lerna-lite/issues/920)) ([d00c87e](https://github.com/lerna-lite/lerna-lite/commit/d00c87e356a0e97cafdabbe57a658d054ce096fe)) - by @ghiscoding

## [3.8.0](https://github.com/lerna-lite/lerna-lite/compare/v3.7.1...v3.8.0) (2024-08-05)

### Features

* **publish:** enable throttling when publishing modules ([#907](https://github.com/lerna-lite/lerna-lite/issues/907)) ([51e0ace](https://github.com/lerna-lite/lerna-lite/commit/51e0acebf79c9ee1f3352eed3a68eb09d8df6276)) - by @ghiscoding

### Bug Fixes

* **core:** use inquirer new modern approach to move away from legacy ([#897](https://github.com/lerna-lite/lerna-lite/issues/897)) ([4d07ed0](https://github.com/lerna-lite/lerna-lite/commit/4d07ed04962e2ffd04cfdb3c704e2b12cb5fe122)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#899](https://github.com/lerna-lite/lerna-lite/issues/899)) ([6e1f45a](https://github.com/lerna-lite/lerna-lite/commit/6e1f45a8d29cb76cbc9c19d8d18fb9b488284215)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#903](https://github.com/lerna-lite/lerna-lite/issues/903)) ([7dc9e7a](https://github.com/lerna-lite/lerna-lite/commit/7dc9e7ae021a6dbbac8c2eba1b117ba5ca85a514)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#908](https://github.com/lerna-lite/lerna-lite/issues/908)) ([2502959](https://github.com/lerna-lite/lerna-lite/commit/250295988c753d8bc6785bdb39b66fe843153500)) - by @renovate[bot]
* **deps:** update dependency byte-size to v9 ([#904](https://github.com/lerna-lite/lerna-lite/issues/904)) ([1a4d4be](https://github.com/lerna-lite/lerna-lite/commit/1a4d4bea5dfe460a060025ab720d10c72a5ffbd2)) - by @renovate[bot]
* **deps:** update dependency write-json-file to v6 ([#905](https://github.com/lerna-lite/lerna-lite/issues/905)) ([754c57f](https://github.com/lerna-lite/lerna-lite/commit/754c57f591261ed7d25dd28f4a898688df5aee1a)) - by @renovate[bot]
* **version:** add missing file extension to fix publish error ([#910](https://github.com/lerna-lite/lerna-lite/issues/910)) ([e9ccb79](https://github.com/lerna-lite/lerna-lite/commit/e9ccb79c48275368eb5dd19f6951f4c9f5b060ce)) - by @ghiscoding
* **version:** truncate release body based on maximum size allowed ([#909](https://github.com/lerna-lite/lerna-lite/issues/909)) ([72b576f](https://github.com/lerna-lite/lerna-lite/commit/72b576fd16d0f28ca45eddec9c0a54e32294eab0)) - by @ghiscoding

## [3.7.1](https://github.com/lerna-lite/lerna-lite/compare/v3.7.0...v3.7.1) (2024-07-13)

### Bug Fixes

* **deps:** update all non-major dependencies ([#894](https://github.com/lerna-lite/lerna-lite/issues/894)) ([c2c40fa](https://github.com/lerna-lite/lerna-lite/commit/c2c40fa73c263dc73efbe2b16710f26854102eda)) - by @renovate[bot]
* **deps:** update dependency inquirer to v10 ([#896](https://github.com/lerna-lite/lerna-lite/issues/896)) ([d0f5298](https://github.com/lerna-lite/lerna-lite/commit/d0f52983ac2a4d02c69eb803fec806d5843192e6)) - by @ghiscoding
* **version:** don't throw when invalid since date found to query GraphQL ([#893](https://github.com/lerna-lite/lerna-lite/issues/893)) ([eee5bca](https://github.com/lerna-lite/lerna-lite/commit/eee5bcad884bb57b38968359cb226944d27bb88f)) - by @ghiscoding

## [3.7.0](https://github.com/lerna-lite/lerna-lite/compare/v3.6.0...v3.7.0) (2024-07-05)

### Features

* add support for Yarn patch protocol ([#887](https://github.com/lerna-lite/lerna-lite/issues/887)) ([05579ab](https://github.com/lerna-lite/lerna-lite/commit/05579ab949fbdf8a83300a637aba0e5e89cb6a93)), closes [#223](https://github.com/lerna-lite/lerna-lite/issues/223) - by @petermetz
* **publish:** add `arboristLoadOptions` for optional `ignoreMissing` ([#889](https://github.com/lerna-lite/lerna-lite/issues/889)) ([f8417d1](https://github.com/lerna-lite/lerna-lite/commit/f8417d1eee5ecc8acbdff97afc7a044841a90920)) - by @ghiscoding

### Bug Fixes

* **deps:** update dependency p-limit to v6 ([#888](https://github.com/lerna-lite/lerna-lite/issues/888)) ([bba892f](https://github.com/lerna-lite/lerna-lite/commit/bba892ff127323e0003a189ebdf224d5f8af1ed3)) - by @renovate[bot]
* **publish:** ignore E409 error when re-publishing to NPM ([#890](https://github.com/lerna-lite/lerna-lite/issues/890)) ([d011168](https://github.com/lerna-lite/lerna-lite/commit/d0111685d03298d629b15607a29c23053018496e)) - by @ghiscoding

## [3.6.0](https://github.com/lerna-lite/lerna-lite/compare/v3.5.2...v3.6.0) (2024-06-27)

### Features

* **version:** option to not ignore scripts on lock update, fixes [#877](https://github.com/lerna-lite/lerna-lite/issues/877) ([#881](https://github.com/lerna-lite/lerna-lite/issues/881)) ([1b78b53](https://github.com/lerna-lite/lerna-lite/commit/1b78b53a19e20b21b589025ff2b287d583390975)) - by @ghiscoding

### Bug Fixes

* **deps:** update dependency @octokit/rest to v21 ([#880](https://github.com/lerna-lite/lerna-lite/issues/880)) ([17d7d8c](https://github.com/lerna-lite/lerna-lite/commit/17d7d8c53695d7c20ba8586085f232fd8c97ca56)) - by @renovate[bot]
* **deps:** update dependency uuid to v10 ([#879](https://github.com/lerna-lite/lerna-lite/issues/879)) ([5bc0d9a](https://github.com/lerna-lite/lerna-lite/commit/5bc0d9a753f1463340ed1b63d4585142dfa5a62f)) - by @renovate[bot]
* inline deprecated `npmlog` util dependency ([#882](https://github.com/lerna-lite/lerna-lite/issues/882)) ([9243e8e](https://github.com/lerna-lite/lerna-lite/commit/9243e8e0078c07add85dc997a4a04bfaf77a44e5)) - by @ghiscoding
* replace deprecated `read-package-json` with `@npmcli/package-json` ([#883](https://github.com/lerna-lite/lerna-lite/issues/883)) ([fe23cf7](https://github.com/lerna-lite/lerna-lite/commit/fe23cf7b471ce7b6f761b33a58b520082d539172)) - by @ghiscoding

## [3.5.2](https://github.com/lerna-lite/lerna-lite/compare/v3.5.1...v3.5.2) (2024-06-13)

### Bug Fixes

* **version:** update get last commit hash info regex to support all timezone ([#875](https://github.com/lerna-lite/lerna-lite/issues/875)) ([30bf0e7](https://github.com/lerna-lite/lerna-lite/commit/30bf0e7b20e445845c68c3b177d096c9ccde0e3b)) - by @njfamirm

## [3.5.1](https://github.com/lerna-lite/lerna-lite/compare/v3.5.0...v3.5.1) (2024-06-07)

### Bug Fixes

* **publish:** always bump & publish peer deps with `workspace:` protocol ([#873](https://github.com/lerna-lite/lerna-lite/issues/873)) ([0325539](https://github.com/lerna-lite/lerna-lite/commit/03255399018b19bd3a7de1f0ef9ee0c82ed6137e)) - by @ghiscoding
* **publish:** update lerna-lite schema for graphType property ([15be75f](https://github.com/lerna-lite/lerna-lite/commit/15be75feb7bd8f499b20d29ee25f63df3d6293ca)) - by @ghiscoding

## [3.5.0](https://github.com/lerna-lite/lerna-lite/compare/v3.4.0...v3.5.0) (2024-06-03)

### Bug Fixes

* **version:** throw when using `workspace:` without allow peer bump, fixes [#869](https://github.com/lerna-lite/lerna-lite/issues/869) ([#870](https://github.com/lerna-lite/lerna-lite/issues/870)) ([12b29ee](https://github.com/lerna-lite/lerna-lite/commit/12b29ee67968522f090964d3f7c7ea221bbc2c68))

### Features

* **version:** add `--push-tags-one-by-one`, fixes [#701](https://github.com/lerna-lite/lerna-lite/issues/701) ([#871](https://github.com/lerna-lite/lerna-lite/issues/871)) ([88ad61b](https://github.com/lerna-lite/lerna-lite/commit/88ad61b11e87565d1615d451aef09b9b2d7b533c)) - by @ghiscoding

## [3.4.0](https://github.com/lerna-lite/lerna-lite/compare/v3.3.3...v3.4.0) (2024-05-15)

### Features

* **deps:** upgrade `temp-dir` to new major which is now ESM ([#863](https://github.com/lerna-lite/lerna-lite/issues/863)) ([2a93250](https://github.com/lerna-lite/lerna-lite/commit/2a93250ca5efe9b80775075b2d59f5759dbbdf03)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#849](https://github.com/lerna-lite/lerna-lite/issues/849)) ([bf23757](https://github.com/lerna-lite/lerna-lite/commit/bf23757941b7b334d1e2feb5f64b39b6748e5a1c)) - by @renovate[bot]
* **deps:** update dependency @npmcli/run-script to v8 ([#847](https://github.com/lerna-lite/lerna-lite/issues/847)) ([de2b7ca](https://github.com/lerna-lite/lerna-lite/commit/de2b7ca3a786f2921565e73225c0dcc9141b7636)) - by @renovate[bot]
* **deps:** update dependency npm-registry-fetch to v17 ([#862](https://github.com/lerna-lite/lerna-lite/issues/862)) ([413f75c](https://github.com/lerna-lite/lerna-lite/commit/413f75cd0b275fb49f6bebdac4e3c1750d73020e)) - by @renovate[bot]
* **deps:** update dependency pacote to v18 ([#848](https://github.com/lerna-lite/lerna-lite/issues/848)) ([0f98a46](https://github.com/lerna-lite/lerna-lite/commit/0f98a46759e013fd51a57db130a691b18497f1e9)) - by @renovate[bot]
* **versions:** support `changelogPreset.header`, fixes [#852](https://github.com/lerna-lite/lerna-lite/issues/852) ([#864](https://github.com/lerna-lite/lerna-lite/issues/864)) ([358324c](https://github.com/lerna-lite/lerna-lite/commit/358324cd8d4fd0dd92f90eed91625cbb6179488b)) - by @ghiscoding

## [3.3.3](https://github.com/lerna-lite/lerna-lite/compare/v3.3.2...v3.3.3) (2024-04-15)

### Bug Fixes

* **deps:** update all non-major dependencies ([#841](https://github.com/lerna-lite/lerna-lite/issues/841)) ([86945b9](https://github.com/lerna-lite/lerna-lite/commit/86945b989840b9608bf7873afad7ec1183f3a740)) - by @renovate[bot]
* **publish:** downgrade npm-packlist to v5.1.1 ([#844](https://github.com/lerna-lite/lerna-lite/issues/844)) ([8d18186](https://github.com/lerna-lite/lerna-lite/commit/8d181860f83d516029cfd661955e3948642bcf96)) - by @wassim-ben-amor

## [3.3.2](https://github.com/lerna-lite/lerna-lite/compare/v3.3.1...v3.3.2) (2024-04-02)

### Bug Fixes

* **deps:** update dependency get-stream to v9 ([#836](https://github.com/lerna-lite/lerna-lite/issues/836)) ([c247658](https://github.com/lerna-lite/lerna-lite/commit/c247658904900389e548d52771362bcb7c18f972)) - by @renovate[bot]
* **version:** create release when using custom tag-version-separator ([#837](https://github.com/lerna-lite/lerna-lite/issues/837)) ([5fa6184](https://github.com/lerna-lite/lerna-lite/commit/5fa61841151b767671bda8c108206d5a0b412935)) - by @ghiscoding

## [3.3.1](https://github.com/lerna-lite/lerna-lite/compare/v3.3.0...v3.3.1) (2024-03-04)

### Bug Fixes

* **deps:** update all non-major dependencies ([#824](https://github.com/lerna-lite/lerna-lite/issues/824)) ([ef9a442](https://github.com/lerna-lite/lerna-lite/commit/ef9a4427473a13044e9131b8cb7ec1fb5770bdb0)) - by @renovate[bot]
* **deps:** update dependency is-stream to v4 ([#828](https://github.com/lerna-lite/lerna-lite/issues/828)) ([412deb3](https://github.com/lerna-lite/lerna-lite/commit/412deb374b52ea4f338550d0ae435a924503591c)) - by @renovate[bot]
* **version:** describeTag in lerna config version cmd/root, fix [#826](https://github.com/lerna-lite/lerna-lite/issues/826) ([#827](https://github.com/lerna-lite/lerna-lite/issues/827)) ([878091d](https://github.com/lerna-lite/lerna-lite/commit/878091d08390cc479914ef0bf901a13dc1c1ee3b)) - by @ghiscoding

## [3.3.0](https://github.com/lerna-lite/lerna-lite/compare/v3.2.1...v3.3.0) (2024-02-10)

### Features

* **version:** custom tag-version-separator for independent projects ([#814](https://github.com/lerna-lite/lerna-lite/issues/814)) ([3cd5824](https://github.com/lerna-lite/lerna-lite/commit/3cd582451bd8fbf23c7b79c0aa24952a162e8167)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#808](https://github.com/lerna-lite/lerna-lite/issues/808)) ([cec587b](https://github.com/lerna-lite/lerna-lite/commit/cec587bd5571f1a536d17b917dcd2a9b82665526)) - by @renovate[bot]
* improve git binary error message ([#816](https://github.com/lerna-lite/lerna-lite/issues/816)) ([441313d](https://github.com/lerna-lite/lerna-lite/commit/441313d4565d48aeded9c28752683fbba6eb2579)) - by @ghiscoding
* **publish:** removePackageFields shouldn't mutate original package.json ([#817](https://github.com/lerna-lite/lerna-lite/issues/817)) ([84f6a88](https://github.com/lerna-lite/lerna-lite/commit/84f6a88748d113a8571e3c84c28137c915312883)) - by @ghiscoding

## [3.2.1](https://github.com/lerna-lite/lerna-lite/compare/v3.2.0...v3.2.1) (2024-01-13)

### Bug Fixes

* **deps:** update all non-major dependencies ([#802](https://github.com/lerna-lite/lerna-lite/issues/802)) ([29e0504](https://github.com/lerna-lite/lerna-lite/commit/29e050449b5ff7d12461b4e27eaacf1c58640fb8)) - by @renovate[bot]
* **publish:** --canary --dry-run command should create valid tags ([#803](https://github.com/lerna-lite/lerna-lite/issues/803)) ([ff62bf1](https://github.com/lerna-lite/lerna-lite/commit/ff62bf16c344870f37fa3cb23ee0d20d32e0a6ed)) - by @ghiscoding
* **publish:** lerna publish --canary --dry-run shouldn't throw ([#801](https://github.com/lerna-lite/lerna-lite/issues/801)) ([9f44c71](https://github.com/lerna-lite/lerna-lite/commit/9f44c716c8ff84f731dc1db2bf078bc4d9015f43)) - by @ghiscoding
* **version:** allow generateReleaseNotes w/o changelog ([#800](https://github.com/lerna-lite/lerna-lite/issues/800)) ([aea5f1f](https://github.com/lerna-lite/lerna-lite/commit/aea5f1fe1b3ab10f9b0f1a1a45777c75e73a9e21)) - by @ghiscoding

## [3.2.0](https://github.com/lerna-lite/lerna-lite/compare/v3.1.0...v3.2.0) (2024-01-06)

### Features

* **version:** add `--generate-release-notes` for GitHub release ([#798](https://github.com/lerna-lite/lerna-lite/issues/798)) ([96d4a61](https://github.com/lerna-lite/lerna-lite/commit/96d4a61e9c234d17d91b8b6c77f771af5e7d59e1))

### Bug Fixes

* **deps:** update all non-major dependencies ([#794](https://github.com/lerna-lite/lerna-lite/issues/794)) ([4683b51](https://github.com/lerna-lite/lerna-lite/commit/4683b518bf7e06febfa19204f3ec032d7371fca5))
* **deps:** update dependency git-url-parse to v14 ([#795](https://github.com/lerna-lite/lerna-lite/issues/795)) ([549abfa](https://github.com/lerna-lite/lerna-lite/commit/549abfa09ddf8d1a7f84edd4efd13c413f7b9ad0))
* **watch:** avoid chokidar throttling on watch startup ([#789](https://github.com/lerna-lite/lerna-lite/issues/789)) ([cbea60f](https://github.com/lerna-lite/lerna-lite/commit/cbea60fdbcdb51d449fd0dd81ff5214e71587a8d))

## [3.1.0](https://github.com/lerna-lite/lerna-lite/compare/v3.0.0...v3.1.0) (2023-12-08)

### Features

* **version:** update conventional-changelog pks to latest w/factory ([#788](https://github.com/lerna-lite/lerna-lite/issues/788)) ([a24f3c6](https://github.com/lerna-lite/lerna-lite/commit/a24f3c641c6dc99157c8bff414e24029b6026b35)) - by @ghiscoding

### Bug Fixes

* **core:** avoid reading empty `.config.json`, upgrade `cosmiconfig` v9, fixes [#729](https://github.com/lerna-lite/lerna-lite/issues/729) ([#754](https://github.com/lerna-lite/lerna-lite/issues/754)) ([e47ed90](https://github.com/lerna-lite/lerna-lite/commit/e47ed9018fde0c7d6aeaa3a83912b2558ff9837a)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#783](https://github.com/lerna-lite/lerna-lite/issues/783)) ([fa026de](https://github.com/lerna-lite/lerna-lite/commit/fa026deb9de67c21de10ad985e339530b4d17cca)) - by @renovate[bot]
* **deps:** update dependency p-map to v7 ([#784](https://github.com/lerna-lite/lerna-lite/issues/784)) ([2644c23](https://github.com/lerna-lite/lerna-lite/commit/2644c23f563f5dafc60d2380802ef8bc81ba808c)) - by @renovate[bot]
* **deps:** update dependency p-queue to v8 ([#787](https://github.com/lerna-lite/lerna-lite/issues/787)) ([5c0d470](https://github.com/lerna-lite/lerna-lite/commit/5c0d470a24551c9ab2b679ebb5885c14184492a6)) - by @renovate[bot]

## [3.0.0](https://github.com/lerna-lite/lerna-lite/compare/v2.7.2...v3.0.0) (2023-11-26)

### ⚠ BREAKING CHANGES

> Refer to the [v3.0.0](https://github.com/lerna-lite/lerna-lite/releases/tag/v3.0.0) release for more info about the migration.

* **core:** upgrade deps to Node 18 and higher (#777)
* **run:** remove `--use-nx` (powered by Nx) option from `run` command (#776)

### Features

* **core:** upgrade deps to Node 18 and higher ([#777](https://github.com/lerna-lite/lerna-lite/issues/777)) ([70225e8](https://github.com/lerna-lite/lerna-lite/commit/70225e8d0ec396d5ce9565fafcecba851650d0d8)) - by @ghiscoding
* **core:** use corepack when enabled to sync lockfile/run npm script ([#775](https://github.com/lerna-lite/lerna-lite/issues/775)) ([3f5624c](https://github.com/lerna-lite/lerna-lite/commit/3f5624cbee9c846981d5231b56c9c5936dc25b3e)) - by @ghiscoding
* **run:** remove `--use-nx` (powered by Nx) option from `run` command ([#776](https://github.com/lerna-lite/lerna-lite/issues/776)) ([2653907](https://github.com/lerna-lite/lerna-lite/commit/265390759c0f0abea8dec122c57bc419a5f6effe)) - by @ghiscoding
* **version:** add --premajor-version-bump option to force patch bumps ([#774](https://github.com/lerna-lite/lerna-lite/issues/774)) ([d092fc6](https://github.com/lerna-lite/lerna-lite/commit/d092fc660c7c5fbf6b7da7ce4e1feb8827e93267)) - by @ghiscoding

### Bug Fixes

* **publish:** dry-run execution should be more obvious in logs ([#769](https://github.com/lerna-lite/lerna-lite/issues/769)) ([8fbd761](https://github.com/lerna-lite/lerna-lite/commit/8fbd761b72bb808ebac961dbca3b82109a5b702c)) - by @ghiscoding

## [2.7.2](https://github.com/lerna-lite/lerna-lite/compare/v2.7.1...v2.7.2) (2023-11-20)

### Bug Fixes

* **version:** writing to lerna.json5 should keep json5 format ([#768](https://github.com/lerna-lite/lerna-lite/issues/768)) ([fd66852](https://github.com/lerna-lite/lerna-lite/commit/fd66852ea3ec40b51070e76f25aca4e7d6c99e88)) - by @ghiscoding

## 2.7.1 (2023-11-19)

### Bug Fixes

* support changelog-presets using async factory funcs ([#766](https://github.com/lerna-lite/lerna-lite/issues/766)) ([77c293f](https://github.com/lerna-lite/lerna-lite/commit/77c293f46cf6a8eacf4e2d2d4626e48471e82fc3)) - by @ghiscoding

## 2.7.0 (2023-11-16)

### Features

* **core:** add (`.jsonc`, `.json5`) support to Lerna-Lite config ([#760](https://github.com/lerna-lite/lerna-lite/issues/760)) ([311c297](https://github.com/lerna-lite/lerna-lite/commit/311c2978f16648db3a041493c2b0be9b1f031a94)) - by @ghiscoding

## [2.6.0](https://github.com/lerna-lite/lerna-lite/compare/v2.5.1...v2.6.0) (2023-10-14)

### Features

* add `GITHUB_TOKEN` as valid alias to `GH_TOKEN` ([#742](https://github.com/lerna-lite/lerna-lite/issues/742)) ([e31eddb](https://github.com/lerna-lite/lerna-lite/commit/e31eddb4c0ecddf1c10ec02e43da72675ddcd86c)) - by @ghiscoding
* **version:** add `--force-conventional-graduate` to force update ([#743](https://github.com/lerna-lite/lerna-lite/issues/743)) ([d9de881](https://github.com/lerna-lite/lerna-lite/commit/d9de88154be32bd2de8c28acfda774c7e9985ffd)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#739](https://github.com/lerna-lite/lerna-lite/issues/739)) ([d8aeb27](https://github.com/lerna-lite/lerna-lite/commit/d8aeb27ffbd8f66822ba3c202492022a387464c1)) - by @renovate[bot]
* **publish:** fix version conflict recognition for github packages ([#738](https://github.com/lerna-lite/lerna-lite/issues/738)) ([210eefa](https://github.com/lerna-lite/lerna-lite/commit/210eefa4d0277093f45b30074f3b588c17c04f28)) - by @petermetz

### Reverts

* Revert "chore(deps): update codecov/codecov-action action to v4 (#726)" (#727) ([b6b83a8](https://github.com/lerna-lite/lerna-lite/commit/b6b83a86939e945d24849367a7d3feeaad6dd9a8)), closes [#726](https://github.com/lerna-lite/lerna-lite/issues/726) [#727](https://github.com/lerna-lite/lerna-lite/issues/727) - by @ghiscoding

## [2.5.1](https://github.com/lerna-lite/lerna-lite/compare/v2.5.0...v2.5.1) (2023-09-09)

### Bug Fixes

* CJS fallbacks should be at the end not at beginning ([#675](https://github.com/lerna-lite/lerna-lite/issues/675)) ([e3d7b9f](https://github.com/lerna-lite/lerna-lite/commit/e3d7b9f0028997a9ad24328f5e2d52de0ec91030)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#718](https://github.com/lerna-lite/lerna-lite/issues/718)) ([7c2897f](https://github.com/lerna-lite/lerna-lite/commit/7c2897fc23eb0b3c47cbd3a78d0a1e8592be35e2)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#722](https://github.com/lerna-lite/lerna-lite/issues/722)) ([c2afec6](https://github.com/lerna-lite/lerna-lite/commit/c2afec6dee0378814c1795bd24e9fdfa07d67296)) - by @renovate[bot]
* **deps:** update dependency @npmcli/arborist to v7 ([#715](https://github.com/lerna-lite/lerna-lite/issues/715)) ([c18600d](https://github.com/lerna-lite/lerna-lite/commit/c18600dd2c630f1745100eada98c5b878e33143b)) - by @renovate[bot]
* **deps:** update dependency @npmcli/run-script to v7 ([#705](https://github.com/lerna-lite/lerna-lite/issues/705)) ([bf45173](https://github.com/lerna-lite/lerna-lite/commit/bf4517304220eb7159a91729f23e275d900bcf85)) - by @renovate[bot]
* **deps:** update dependency conventional-commits-parser to v5 ([#709](https://github.com/lerna-lite/lerna-lite/issues/709)) ([af5b43a](https://github.com/lerna-lite/lerna-lite/commit/af5b43a8de8a10b81b7522550eebd5b29932259c)) - by @renovate[bot]
* **deps:** update dependency dedent to ^1.3.0 ([#682](https://github.com/lerna-lite/lerna-lite/issues/682)) ([4c94183](https://github.com/lerna-lite/lerna-lite/commit/4c9418327058b04210474314b9f675e13fb5efd7)) - by @renovate[bot]
* **deps:** update dependency dedent to v1 and fix method call ([#673](https://github.com/lerna-lite/lerna-lite/issues/673)) ([fd543fe](https://github.com/lerna-lite/lerna-lite/commit/fd543fe8ba048e3fd5525df9c77872c865f4af40)) - by @ghiscoding
* **deps:** update dependency get-stream to ^8.0.1 ([#698](https://github.com/lerna-lite/lerna-lite/issues/698)) ([3e7dcb7](https://github.com/lerna-lite/lerna-lite/commit/3e7dcb7fcc9bb5d56b57141f23572a67b8e3b073)) - by @renovate[bot]
* **deps:** update dependency get-stream to v8 ([#691](https://github.com/lerna-lite/lerna-lite/issues/691)) ([c6d8a5e](https://github.com/lerna-lite/lerna-lite/commit/c6d8a5eb3eab4af87c9a32d736b70d8e41a8a21e)) - by @renovate[bot]
* **deps:** update dependency inquirer to ^9.2.8 ([#672](https://github.com/lerna-lite/lerna-lite/issues/672)) ([d92d224](https://github.com/lerna-lite/lerna-lite/commit/d92d2246a0ce45b5d9be798a4c174a3decee2732)) - by @renovate[bot]
* **deps:** update dependency libnpmaccess to v8 ([#716](https://github.com/lerna-lite/lerna-lite/issues/716)) ([f7802a5](https://github.com/lerna-lite/lerna-lite/commit/f7802a5133fea3496e42b81b47ea46ffa57c1c8e)) - by @renovate[bot]
* **deps:** update dependency libnpmpublish to v8 ([#680](https://github.com/lerna-lite/lerna-lite/issues/680)) ([6ae83d5](https://github.com/lerna-lite/lerna-lite/commit/6ae83d52e8e55a6bc1142a89d86d9494fbb92d5e)) - by @renovate[bot]
* **deps:** update dependency libnpmpublish to v9 ([#717](https://github.com/lerna-lite/lerna-lite/issues/717)) ([6fd8106](https://github.com/lerna-lite/lerna-lite/commit/6fd8106ae8de90b80973152c12f9e8be3aa4b7b5)) - by @renovate[bot]
* **deps:** update dependency minimatch to ^9.0.3 ([#665](https://github.com/lerna-lite/lerna-lite/issues/665)) ([18c78ea](https://github.com/lerna-lite/lerna-lite/commit/18c78ea6299d2a157512da907d17245af1f42cb1)) - by @renovate[bot]
* **deps:** update dependency npm-package-arg to v11 ([#692](https://github.com/lerna-lite/lerna-lite/issues/692)) ([2b69331](https://github.com/lerna-lite/lerna-lite/commit/2b693315ffa900c3ad047c29b68708e727fd2f43)) - by @renovate[bot]
* **deps:** update dependency npm-packlist to v8 ([#702](https://github.com/lerna-lite/lerna-lite/issues/702)) ([e0d4e12](https://github.com/lerna-lite/lerna-lite/commit/e0d4e12aba549798cb7b5013ddd1a290be3d25c0)) - by @renovate[bot]
* **deps:** update dependency npm-registry-fetch to v15 ([#684](https://github.com/lerna-lite/lerna-lite/issues/684)) ([94baefd](https://github.com/lerna-lite/lerna-lite/commit/94baefdac2b4945bb28b0d913710322eed8297a3)) - by @renovate[bot]
* **deps:** update dependency npm-registry-fetch to v16 ([#693](https://github.com/lerna-lite/lerna-lite/issues/693)) ([1f19ec5](https://github.com/lerna-lite/lerna-lite/commit/1f19ec51da959ec2ae16c7728816a474d597de6d)) - by @renovate[bot]
* **deps:** update dependency pacote to v17 ([#695](https://github.com/lerna-lite/lerna-lite/issues/695)) ([d92b678](https://github.com/lerna-lite/lerna-lite/commit/d92b6785ceb6e1c71457eb1ac8904c7a206a669c)) - by @renovate[bot]
* **deps:** update dependency read-package-json to v7 ([#696](https://github.com/lerna-lite/lerna-lite/issues/696)) ([325256b](https://github.com/lerna-lite/lerna-lite/commit/325256b0c23c263c9ce7ebfaba5b30b9eb5942c8)) - by @renovate[bot]
* **version:** skipBumpOnlyReleases reimplementation, fixes [#703](https://github.com/lerna-lite/lerna-lite/issues/703) ([#721](https://github.com/lerna-lite/lerna-lite/issues/721)) ([4fc2f55](https://github.com/lerna-lite/lerna-lite/commit/4fc2f552efedc1df98c6a1fd4aeac0959c0ab46e)) - by @ghiscoding

## [2.5.0](https://github.com/lerna-lite/lerna-lite/compare/v2.4.3...v2.5.0) (2023-07-06)

### Features

* **version:** update conventional-changelog to new major versions ([#666](https://github.com/lerna-lite/lerna-lite/issues/666)) ([b29c647](https://github.com/lerna-lite/lerna-lite/commit/b29c647fe8b077e7c9ae13cc72f667979b45d97c)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#654](https://github.com/lerna-lite/lerna-lite/issues/654)) ([247d17b](https://github.com/lerna-lite/lerna-lite/commit/247d17bf627b23776ad49f28d42b210dab5c713d)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#662](https://github.com/lerna-lite/lerna-lite/issues/662)) ([009a47c](https://github.com/lerna-lite/lerna-lite/commit/009a47c191d75b89a8bc68860ec83369a21bea91)) - by @renovate[bot]
* **deps:** update dependency chalk to ^5.3.0 ([#660](https://github.com/lerna-lite/lerna-lite/issues/660)) ([96c80a9](https://github.com/lerna-lite/lerna-lite/commit/96c80a9aace6f10967f0f6f31880b177ecd6e0f5)) - by @renovate[bot]
* **deps:** update dependency make-dir to v4 ([#659](https://github.com/lerna-lite/lerna-lite/issues/659)) ([81dd798](https://github.com/lerna-lite/lerna-lite/commit/81dd7982979febcd2453b8f0ec72f9a1c7e56413)) - by @renovate[bot]
* **publish:** catch publish conflict 403 error from npm ([#657](https://github.com/lerna-lite/lerna-lite/issues/657)) ([738c028](https://github.com/lerna-lite/lerna-lite/commit/738c0282c8f50cbfdd4259185a9668aefb78c727)) - by @ghiscoding
* **publish:** ensure that error code is a number ([#656](https://github.com/lerna-lite/lerna-lite/issues/656)) ([0b823d5](https://github.com/lerna-lite/lerna-lite/commit/0b823d546a217d021b165a64f20e334b88bf4c09)) - by @ghiscoding
* strict-ssl mapping for node-fetch-registry during unpublished projects lookup ([#655](https://github.com/lerna-lite/lerna-lite/issues/655)) ([9b6a400](https://github.com/lerna-lite/lerna-lite/commit/9b6a400ab0cb0edc1efab5c45f2dded2856c0cff)) - by @ghiscoding

## [2.4.3](https://github.com/lerna-lite/lerna-lite/compare/v2.4.2...v2.4.3) (2023-06-20)

### Bug Fixes

* **publish:** handle empty scripts section on remove-fields flag ([#652](https://github.com/lerna-lite/lerna-lite/issues/652)) ([4b050ca](https://github.com/lerna-lite/lerna-lite/commit/4b050caad40520ab2f897498c9d59bb08ebf2e72)) - by @Naymi

## [2.4.2](https://github.com/lerna-lite/lerna-lite/compare/v2.4.1...v2.4.2) (2023-06-20)

### Bug Fixes

* **deps:** update all non-major dependencies ([#648](https://github.com/lerna-lite/lerna-lite/issues/648)) ([a54b90f](https://github.com/lerna-lite/lerna-lite/commit/a54b90f91d1888c72c23b16321b1f5947472e74b)) - by @renovate[bot]
* **deps:** update dependency semver to ^7.5.2 ([#646](https://github.com/lerna-lite/lerna-lite/issues/646)) ([449358b](https://github.com/lerna-lite/lerna-lite/commit/449358b9db37b94e3e1ebcf3af4ad8cc0b2ae9ca)) - by @renovate[bot]
* **publish:** skip lifecycle scripts on pkg fields removal, fixes [#637](https://github.com/lerna-lite/lerna-lite/issues/637) ([#647](https://github.com/lerna-lite/lerna-lite/issues/647)) ([5b2a15a](https://github.com/lerna-lite/lerna-lite/commit/5b2a15afcb36c62fe9d3b9f49c59bea86613c633)) - by @ghiscoding

## [2.4.1](https://github.com/lerna-lite/lerna-lite/compare/v2.4.0...v2.4.1) (2023-06-07)

### Bug Fixes

* **deps:** update all non-major dependencies ([#615](https://github.com/lerna-lite/lerna-lite/issues/615)) ([e5b28bf](https://github.com/lerna-lite/lerna-lite/commit/e5b28bfd89060ffa31a41c25eae2134b8c317d4a)) - by @renovate[bot]
* **deps:** update dependency get-stream to v7 ([#620](https://github.com/lerna-lite/lerna-lite/issues/620)) ([723ca54](https://github.com/lerna-lite/lerna-lite/commit/723ca542651c25e3a3eb9da41b6a8f09a088b9ce)) - by @renovate[bot]
* **deps:** update dependency glob to v10 ([#616](https://github.com/lerna-lite/lerna-lite/issues/616)) ([4f92ea2](https://github.com/lerna-lite/lerna-lite/commit/4f92ea21ce4a30006d44b2ef0c87e30acdf85a5e)) - by @renovate[bot]
* fix GitHub Enterprise plugin import path ([#625](https://github.com/lerna-lite/lerna-lite/issues/625)) ([acbfa43](https://github.com/lerna-lite/lerna-lite/commit/acbfa4361c18178c75c50e2d0fb76c01bb0778d1)) - by @p-chan

## [2.4.0](https://github.com/lerna-lite/lerna-lite/compare/v2.3.0...v2.4.0) (2023-05-18)

### Features

* **version:** add new `--create-release-discussion` option ([#604](https://github.com/lerna-lite/lerna-lite/issues/604)) ([c246d0d](https://github.com/lerna-lite/lerna-lite/commit/c246d0da01dac1c8241a357f1280c873d39f981c)) - by @ghiscoding

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
* **deps:** update dependency inquirer to ^9.2.1 ([#599](https://github.com/lerna-lite/lerna-lite/issues/599)) ([b043c78](https://github.com/lerna-lite/lerna-lite/commit/b043c7886e3745b6ae0ca4bedbc8e42e918ee2db)) - by @renovate[bot]

## [2.2.0](https://github.com/lerna-lite/lerna-lite/compare/v2.1.0...v2.2.0) (2023-05-02)

### Features

* **core:** accept comments in lerna.json config via JSON5 format ([#586](https://github.com/lerna-lite/lerna-lite/issues/586)) ([2aed0c0](https://github.com/lerna-lite/lerna-lite/commit/2aed0c016f0805d44dc1607c20a5226c4b6886f1)) - by @ghiscoding

### Bug Fixes

* **cli:** missing --allow-peer-dependencies-update flag ([#593](https://github.com/lerna-lite/lerna-lite/issues/593)) ([b95d370](https://github.com/lerna-lite/lerna-lite/commit/b95d3708bffd9abd45f23c2d979ceb7f5d4506f4)) - by @ma-multipla
* **deps:** update all non-major dependencies ([#592](https://github.com/lerna-lite/lerna-lite/issues/592)) ([27c3a90](https://github.com/lerna-lite/lerna-lite/commit/27c3a908a6151197d78ad43c3f977ebe76135632)) - by @renovate[bot]
* **deps:** update dependency p-map to v6 ([#589](https://github.com/lerna-lite/lerna-lite/issues/589)) ([13c4c04](https://github.com/lerna-lite/lerna-lite/commit/13c4c04a4286f6833f3d1edf8e80f66140868fb8)) - by @renovate[bot]
* **version:** allowPeerDependenciesUpdate should work w/`workspace:^`, fix [#590](https://github.com/lerna-lite/lerna-lite/issues/590) ([#591](https://github.com/lerna-lite/lerna-lite/issues/591)) ([0de00e1](https://github.com/lerna-lite/lerna-lite/commit/0de00e16c29145a297a612c427d88f5ea263b8b5)) - by @ghiscoding

## [2.1.0](https://github.com/lerna-lite/lerna-lite/compare/v2.0.0...v2.1.0) (2023-04-21)

### Features

* **publish:** add name of package that fails to publish ([#574](https://github.com/lerna-lite/lerna-lite/issues/574)) ([94e5fed](https://github.com/lerna-lite/lerna-lite/commit/94e5fed11fc94f757f35c52d454c999135e86547)) - by @ghiscoding

### Bug Fixes

* cannot find `publish` module if `cli` inside a monorepo package ([#573](https://github.com/lerna-lite/lerna-lite/issues/573)) ([6cb85d8](https://github.com/lerna-lite/lerna-lite/commit/6cb85d8cacfb486a01fe3b2e1b326014b4cd0eab)) - by @johnsoncodehk
* cannot find optional commands if `cli` inside a monorepo package ([#578](https://github.com/lerna-lite/lerna-lite/issues/578)) ([c1979dd](https://github.com/lerna-lite/lerna-lite/commit/c1979ddd2de7c735ae5e62116d3e87e3a3d472e8)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#583](https://github.com/lerna-lite/lerna-lite/issues/583)) ([43c156c](https://github.com/lerna-lite/lerna-lite/commit/43c156cb64cef9bb9cbd800b8decbed9137e80a3)) - by @renovate[bot]
* **deps:** update dependency p-map to v5 ([#568](https://github.com/lerna-lite/lerna-lite/issues/568)) ([e7c4ee9](https://github.com/lerna-lite/lerna-lite/commit/e7c4ee9ca7c64ff3d9eecae3666c8e4eb21e2c18)) - by @renovate[bot]
* keep only peerDependenciesMeta without peerDeps, fixes [#578](https://github.com/lerna-lite/lerna-lite/issues/578) ([#585](https://github.com/lerna-lite/lerna-lite/issues/585)) ([b804aac](https://github.com/lerna-lite/lerna-lite/commit/b804aacd71f9f048a6bea1b1df7cf45b90ff7ebe)) - by @ghiscoding
* **publish:** add normalize-path as a dependency ([#579](https://github.com/lerna-lite/lerna-lite/issues/579)) ([5dedbbe](https://github.com/lerna-lite/lerna-lite/commit/5dedbbe582d87521abdafc4d73f7b5504865521e)) - by @rfoel
* **version:** invalid --conventional-prerelease should throw, fix [#569](https://github.com/lerna-lite/lerna-lite/issues/569) ([#577](https://github.com/lerna-lite/lerna-lite/issues/577)) ([b4d9e1f](https://github.com/lerna-lite/lerna-lite/commit/b4d9e1f45438436196891f471ddfafb25dced542)) - by @ghiscoding

## [2.0.0](https://github.com/lerna-lite/lerna-lite/compare/v1.17.0...v2.0.0) (2023-04-14)

### ⚠ BREAKING CHANGES

> Refer to the [v2.0.0](https://github.com/lerna-lite/lerna-lite/releases/tag/v2.0.0) release for more info about the migration.

* **build:** prepare official Lerna-Lite 2.0 release (#567)

### Features

* **build:** prepare official Lerna-Lite 2.0 release ([#567](https://github.com/lerna-lite/lerna-lite/issues/567)) ([2865a60](https://github.com/lerna-lite/lerna-lite/commit/2865a604fe85e498cc8c4410cead51ad067a41e0)), closes [#537](https://github.com/lerna-lite/lerna-lite/issues/537) - by @ghiscoding
* **version** add `--skip-bump-only-release` to avoid empty gh releases ([#555](https://github.com/lerna-lite/lerna-lite/pull/555)) ([e93e6fd](https://github.com/lerna-lite/lerna-lite/commit/e93e6fd348170466d06c825193d4ec4b42cb3920)) - by @ghiscoding
* **run** add back optional `--use-nx` option to `run` command ([#557](https://github.com/lerna-lite/lerna-lite/pull/557)) ([7baf389](https://github.com/lerna-lite/lerna-lite/commit/7baf389ef62a7e8d99118be15b4b70de897cd30e)) - by @ghiscoding

### Bug Fixes

* **config:** catch initialization errors, update cosmiconfig ([#519](https://github.com/lerna-lite/lerna-lite/issues/519)) ([66299a2](https://github.com/lerna-lite/lerna-lite/commit/66299a22084a668f0712745269d71a493c470e18)) - by @d-fischer
* **core:** ignore globby pattern type should be an array not a string ([#529](https://github.com/lerna-lite/lerna-lite/issues/529)) ([c45dcb1](https://github.com/lerna-lite/lerna-lite/commit/c45dcb1bfaecd4bd306d2a057f150797381f7bee)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#535](https://github.com/lerna-lite/lerna-lite/issues/535)) ([bdb1e9c](https://github.com/lerna-lite/lerna-lite/commit/bdb1e9c38082f1a5ac7f28d0fa123de08e48bd4b)) - by @renovate[bot]
* **deps:** update all non-major dependencies ([#547](https://github.com/lerna-lite/lerna-lite/issues/547)) ([deb467c](https://github.com/lerna-lite/lerna-lite/commit/deb467c6bef624ae10861ca1a4251263c8792a91)) - by @renovate[bot]
* **deps:** update dependency cosmiconfig to ^8.1.3 ([#523](https://github.com/lerna-lite/lerna-lite/issues/523)) ([6870489](https://github.com/lerna-lite/lerna-lite/commit/68704899973067d51b1afb76bd06e3d23b697770)) - by @renovate[bot]
* **run:** only use run-one w/Nx when not passing multiple scripts ([#531](https://github.com/lerna-lite/lerna-lite/issues/531)) ([731f783](https://github.com/lerna-lite/lerna-lite/commit/731f783c89b9b4f96d0c65cdf36c115c7f1e51d3)) - by @ghiscoding

## [2.0.0-alpha.2](https://github.com/lerna-lite/lerna-lite/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2023-04-07)

### ⚠ BREAKING CHANGES

* **run:** remove `--use-nx` (powered by Nx) option from `run` command (#554)
* **publish:** make version & publish commands optionnal, closes #450 (#552)
* **build:** migrate to ESM build & switch to Vitest for ESM support (#537)

### Features

* **build:** migrate to ESM build & switch to Vitest for ESM support ([#537](https://github.com/lerna-lite/lerna-lite/issues/537)) ([308fc2e](https://github.com/lerna-lite/lerna-lite/commit/308fc2e2d72d90f62b3a3954cbeeb3810b767a35)) - by @ghiscoding
* **cli:** remove listable dependency from CLI ([#553](https://github.com/lerna-lite/lerna-lite/issues/553)) ([1baa0d1](https://github.com/lerna-lite/lerna-lite/commit/1baa0d19b7116dac56c9326934c7cc9e07caec8c)) - by @ghiscoding
* **publish:** make version & publish commands optionnal, closes [#450](https://github.com/lerna-lite/lerna-lite/issues/450) ([#552](https://github.com/lerna-lite/lerna-lite/issues/552)) ([11e4dab](https://github.com/lerna-lite/lerna-lite/commit/11e4dab70185198692b30cc72a184512bdc0e55d)) - by @ghiscoding
* **publish:** remove `--require-scripts`, keep npm scripts lifecycle ([#542](https://github.com/lerna-lite/lerna-lite/issues/542)) ([6559aec](https://github.com/lerna-lite/lerna-lite/commit/6559aec9e517fb073583d7684191449e78b809f5)) - by @ghiscoding
* remove all deprecated options tagged to be removed in next major ([#545](https://github.com/lerna-lite/lerna-lite/issues/545)) ([a6f44b3](https://github.com/lerna-lite/lerna-lite/commit/a6f44b36038e5663d8c14fa062569b0f105a02f4)) - by @ghiscoding
* **run:** remove `--use-nx` (powered by Nx) option from `run` command ([#554](https://github.com/lerna-lite/lerna-lite/issues/554)) ([b5ff9c9](https://github.com/lerna-lite/lerna-lite/commit/b5ff9c90bf73b221cb30c9dbc184bf34354222fd)) - by @ghiscoding
* **version:** remove deprecated `--changelog-version-message` option ([#543](https://github.com/lerna-lite/lerna-lite/issues/543)) ([d125eef](https://github.com/lerna-lite/lerna-lite/commit/d125eef8d1689403ed8959d60514aec29ca08886)) - by @ghiscoding
* **version:** use await import instead of require() for GHE release ([#546](https://github.com/lerna-lite/lerna-lite/issues/546)) ([f6a2488](https://github.com/lerna-lite/lerna-lite/commit/f6a2488ac35f573e900674f74ace45e33d200968)) - by @ghiscoding

### Bug Fixes

* **config:** catch initialization errors, update cosmiconfig ([#519](https://github.com/lerna-lite/lerna-lite/issues/519)) ([66299a2](https://github.com/lerna-lite/lerna-lite/commit/66299a22084a668f0712745269d71a493c470e18)) - by @d-fischer
* **core:** ignore globby pattern type should be an array not a string ([#529](https://github.com/lerna-lite/lerna-lite/issues/529)) ([c45dcb1](https://github.com/lerna-lite/lerna-lite/commit/c45dcb1bfaecd4bd306d2a057f150797381f7bee)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#535](https://github.com/lerna-lite/lerna-lite/issues/535)) ([bdb1e9c](https://github.com/lerna-lite/lerna-lite/commit/bdb1e9c38082f1a5ac7f28d0fa123de08e48bd4b)) - by @renovate[bot]
* **deps:** update dependency cosmiconfig to ^8.1.3 ([#523](https://github.com/lerna-lite/lerna-lite/issues/523)) ([6870489](https://github.com/lerna-lite/lerna-lite/commit/68704899973067d51b1afb76bd06e3d23b697770)) - by @renovate[bot]
* **deps:** update dependency minimatch to v8 and couple other deps patch ([#550](https://github.com/lerna-lite/lerna-lite/issues/550)) ([e7d29f1](https://github.com/lerna-lite/lerna-lite/commit/e7d29f105c4757526e059bc5ae1eaa24a6eeaa59)) - by @ghiscoding
* **run:** only use run-one w/Nx when not passing multiple scripts ([#531](https://github.com/lerna-lite/lerna-lite/issues/531)) ([731f783](https://github.com/lerna-lite/lerna-lite/commit/731f783c89b9b4f96d0c65cdf36c115c7f1e51d3)) - by @ghiscoding

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
* **deps:** update all non-major dependencies ([#502](https://github.com/lerna-lite/lerna-lite/issues/502)) ([b26827d](https://github.com/lerna-lite/lerna-lite/commit/b26827d7c4157d68494a9bc801f97e37eedf9b04)) - by @ghiscoding
* **deps:** update dependency minimatch to v7 ([#489](https://github.com/lerna-lite/lerna-lite/issues/489)) ([4fd3ac0](https://github.com/lerna-lite/lerna-lite/commit/4fd3ac0c6b848cd2c3e2417441b36cbd35e05fd3)) - by @renovate[bot]
* **exec:** add note to wrap lerna exec commands in quotes ([#497](https://github.com/lerna-lite/lerna-lite/issues/497)) ([29c6389](https://github.com/lerna-lite/lerna-lite/commit/29c63897457225949efec451ea0691eb5403e006)) - by @ghiscoding
* **init:** the `--use-workspaces` option should update `lerna.json` ([#501](https://github.com/lerna-lite/lerna-lite/issues/501)) ([dfbe1eb](https://github.com/lerna-lite/lerna-lite/commit/dfbe1eb679a6c097bd35720cec4fc3e4d925b9b4)) - by @ghiscoding
* **publish:** ensure zero exit code when EWORKINGTREE warning occurs ([#500](https://github.com/lerna-lite/lerna-lite/issues/500)) ([b14150b](https://github.com/lerna-lite/lerna-lite/commit/b14150b66b9979e1c4735669b2b6834ff6a8d162)) - by @ghiscoding
* **version:** highlight version prop required in `lerna.json` ([#486](https://github.com/lerna-lite/lerna-lite/issues/486)) ([8720397](https://github.com/lerna-lite/lerna-lite/commit/872039788f22d95b04f237b983013be3c63833c0)), closes [#485](https://github.com/lerna-lite/lerna-lite/issues/485) - by @ghiscoding
* **version:** validate yarn Berry gte 2.0 before running yarn sync lock ([#494](https://github.com/lerna-lite/lerna-lite/issues/494)) ([26d630e](https://github.com/lerna-lite/lerna-lite/commit/26d630ead0e2249418c29977070f89ad63034a5f)) - by @ghiscoding

### Features

* **version:** add `--independent-subpackages` option, closes [#491](https://github.com/lerna-lite/lerna-lite/issues/491) ([#495](https://github.com/lerna-lite/lerna-lite/issues/495)) ([dfd0a78](https://github.com/lerna-lite/lerna-lite/commit/dfd0a781cb895d6abe00288aee0a51d1abaaaa3d)) - by @ghiscoding
* **version:** add user-defined build metadata to bumped packages ([#504](https://github.com/lerna-lite/lerna-lite/issues/504)) ([b8fbf2c](https://github.com/lerna-lite/lerna-lite/commit/b8fbf2c7344c2fd5d0d0f3dee5c883eaa3b4be67)) - by @ghiscoding

## [1.15.2](https://github.com/lerna-lite/lerna-lite/compare/v1.15.1...v1.15.2) (2023-02-14)

### Bug Fixes

* **watch:** watch execution shouldn't skip queued changes ([#482](https://github.com/lerna-lite/lerna-lite/issues/482)) ([d64950b](https://github.com/lerna-lite/lerna-lite/commit/d64950bd502444208235953c8620543ccf0d9170)) - by @ghiscoding

## [1.15.1](https://github.com/lerna-lite/lerna-lite/compare/v1.15.0...v1.15.1) (2023-02-08)

### Bug Fixes

* **deps:** update dependency minimatch to v6 ([#481](https://github.com/lerna-lite/lerna-lite/issues/481)) ([b97ecee](https://github.com/lerna-lite/lerna-lite/commit/b97ecee5ed59663680a41579d341b03c467c6c55)) - by @renovate[bot]
* **watch:** remove watch stdin causing problem exiting the watch ([#478](https://github.com/lerna-lite/lerna-lite/issues/478)) ([6f1232f](https://github.com/lerna-lite/lerna-lite/commit/6f1232f188f12df1365aab7ede11767e3b09aff3)) - by @ghiscoding

# [1.15.0](https://github.com/lerna-lite/lerna-lite/compare/v1.14.2...v1.15.0) (2023-02-04)

### Bug Fixes

* **deps:** update dependency @npmcli/arborist to ^6.2.1 ([#471](https://github.com/lerna-lite/lerna-lite/issues/471)) ([5387b4e](https://github.com/lerna-lite/lerna-lite/commit/5387b4ecbba72e95639b9143233e736507b4ff17)) - by @renovate[bot]
* **publish:** deprecate publish --require-scripts ([#463](https://github.com/lerna-lite/lerna-lite/issues/463)) ([e8ef54e](https://github.com/lerna-lite/lerna-lite/commit/e8ef54ed18581e092cdd9da89d547635f7792249)) - by @ghiscoding
* **publish:** downgrade `glob` deps to cleanup temp file ([#475](https://github.com/lerna-lite/lerna-lite/issues/475)) ([de09614](https://github.com/lerna-lite/lerna-lite/commit/de09614454aca271067275de6d97c78d70157a95)) - by @ghiscoding
* **schema:** `--contents` type should be string, fixes [#466](https://github.com/lerna-lite/lerna-lite/issues/466) ([#467](https://github.com/lerna-lite/lerna-lite/issues/467)) ([c12aafe](https://github.com/lerna-lite/lerna-lite/commit/c12aafe4dacb99f3334617149f1a6892599d7d49)) - by @ghiscoding
* **watch:** use a better debounce option name for the watch ([#476](https://github.com/lerna-lite/lerna-lite/issues/476)) ([eb0bbc1](https://github.com/lerna-lite/lerna-lite/commit/eb0bbc136133e47881a5ef38ad5e3feb45675e56)) - by @ghiscoding

### Features

* **publish:** add `--cleanup-temp-files` option to cleanup packed tmp ([#474](https://github.com/lerna-lite/lerna-lite/issues/474)) ([6781c79](https://github.com/lerna-lite/lerna-lite/commit/6781c7938a3594b5cd0f6da28f02e3c230d4e045)) - by @ghiscoding
* **publish:** recover from network failure ([#469](https://github.com/lerna-lite/lerna-lite/issues/469)) ([acd586d](https://github.com/lerna-lite/lerna-lite/commit/acd586d161c95725350b1f9fc51b7b00ce2b8752)) - by @ghiscoding
* **version:** move all version related methods under version package ([#456](https://github.com/lerna-lite/lerna-lite/issues/456)) ([2c0921a](https://github.com/lerna-lite/lerna-lite/commit/2c0921aecb52330f853d08b453f3cd1a61a0857e)) - by @ghiscoding
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

### Bug Fixes

* **core:** more detailed error message when version cannot be found ([#431](https://github.com/lerna-lite/lerna-lite/issues/431)) ([7f3dffb](https://github.com/lerna-lite/lerna-lite/commit/7f3dffb23d75630226a5a4474651200eec6f136d)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#423](https://github.com/lerna-lite/lerna-lite/issues/423)) ([b965cc7](https://github.com/lerna-lite/lerna-lite/commit/b965cc79eca285a39ac420fd1c1e3e7614c9c6e0)) - by @renovate-bot
* **deps:** update all non-major dependencies ([#425](https://github.com/lerna-lite/lerna-lite/issues/425)) ([3793929](https://github.com/lerna-lite/lerna-lite/commit/3793929488365180a7da3e03686bf42eb2172482)) - by @renovate-bot
* **deps:** update dependency @npmcli/arborist to ^6.1.6 ([#440](https://github.com/lerna-lite/lerna-lite/issues/440)) ([51eec47](https://github.com/lerna-lite/lerna-lite/commit/51eec4746aa8413900666e817d73d22da4252995)) - by @renovate[bot]
* **schema:** add the other format changelogPreset can assume ([#422](https://github.com/lerna-lite/lerna-lite/issues/422)) ([060a7e9](https://github.com/lerna-lite/lerna-lite/commit/060a7e9be65d6d955357f50eab9c8a6de06004b4)) - by @ghiscoding

### Features

* **publish:** add --summary-file option ([#428](https://github.com/lerna-lite/lerna-lite/issues/428)) ([3de55ef](https://github.com/lerna-lite/lerna-lite/commit/3de55ef1ad7127b4e86f4c2f5accfa009c10d79b)) - by @ghiscoding
* **version:** allow passing multiple npmClientArgs as CSV ([#429](https://github.com/lerna-lite/lerna-lite/issues/429)) ([0f32a95](https://github.com/lerna-lite/lerna-lite/commit/0f32a950bd9309fd2aafe193dc4d4d64447af49f)) - by @ghiscoding
* **version:** support custom command for git tag ([#430](https://github.com/lerna-lite/lerna-lite/issues/430)) ([246ac57](https://github.com/lerna-lite/lerna-lite/commit/246ac57953239771a22901a32bd5be77447b8b43)) - by @ghiscoding
* **watch:** Add `lerna watch` command ([#441](https://github.com/lerna-lite/lerna-lite/issues/441)) ([a244128](https://github.com/lerna-lite/lerna-lite/commit/a24412848129fcfebd593e3c323d69f8f3172112)) - by @ghiscoding

# [1.13.0](https://github.com/lerna-lite/lerna-lite/compare/v1.12.0...v1.13.0) (2022-11-22)

### Bug Fixes

* **deps:** libnpmaccess was rewritten, lsPackages is now getPackages ([#401](https://github.com/lerna-lite/lerna-lite/issues/401)) ([abb78b0](https://github.com/lerna-lite/lerna-lite/commit/abb78b0178e33ee0911aebea28a396b75897635d)) - by @ghiscoding
* **deps:** npm-package-arg now normalize x, x@, x@* ([#400](https://github.com/lerna-lite/lerna-lite/issues/400)) ([41b6eaa](https://github.com/lerna-lite/lerna-lite/commit/41b6eaa7077801084c8cb6308aba4cf2285f7063)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#402](https://github.com/lerna-lite/lerna-lite/issues/402)) ([3feeea9](https://github.com/lerna-lite/lerna-lite/commit/3feeea9559cafdf84f4b025950d7e4a862104284)) - by @renovate-bot
* **deps:** update all non-major dependencies ([#405](https://github.com/lerna-lite/lerna-lite/issues/405)) ([084da4f](https://github.com/lerna-lite/lerna-lite/commit/084da4f409b38f66bc1c5d4d2ef43f9a221ca80b)) - by @renovate-bot
* **deps:** update all non-major dependencies ([#414](https://github.com/lerna-lite/lerna-lite/issues/414)) ([267fced](https://github.com/lerna-lite/lerna-lite/commit/267fced53045193e6a3a7b53fcfc58b6a961bcdc)) - by @renovate-bot
* **deps:** update dependency @npmcli/arborist to v6 ([#396](https://github.com/lerna-lite/lerna-lite/issues/396)) ([39b0feb](https://github.com/lerna-lite/lerna-lite/commit/39b0feba0938dcd7082ba9fa2e8350c637c0e36c)) - by @renovate-bot
* **deps:** update dependency @npmcli/run-script to v6 ([#406](https://github.com/lerna-lite/lerna-lite/issues/406)) ([02c998e](https://github.com/lerna-lite/lerna-lite/commit/02c998e6ac3187c3f20807431f6c1ffe3bc7e5ea)) - by @renovate-bot
* **deps:** update dependency cosmiconfig to v8 ([#419](https://github.com/lerna-lite/lerna-lite/issues/419)) ([b31dfe7](https://github.com/lerna-lite/lerna-lite/commit/b31dfe7471d7a6e6572336414bc0c9a47458acc6)) - by @renovate-bot
* **deps:** update dependency libnpmpublish to v7 ([#399](https://github.com/lerna-lite/lerna-lite/issues/399)) ([4eaea64](https://github.com/lerna-lite/lerna-lite/commit/4eaea642ad336d1a2739ba63812367df114aa03e)) - by @renovate-bot
* **run:** detect Nx target configuration in package.json files ([#416](https://github.com/lerna-lite/lerna-lite/issues/416)) ([be2af28](https://github.com/lerna-lite/lerna-lite/commit/be2af28c921e9bf52ce28141321b4bfe92c6935b)) - by @ghiscoding

### Features

* **publish:** apply publishConfig overrides, closes [#404](https://github.com/lerna-lite/lerna-lite/issues/404) ([#415](https://github.com/lerna-lite/lerna-lite/issues/415)) ([03e8157](https://github.com/lerna-lite/lerna-lite/commit/03e81571b8e68bc54fa69afbbc00f6338b39b19f)) - by @ghiscoding, @artechventure
* **version:** bump prerelease versions from conventional commits ([#409](https://github.com/lerna-lite/lerna-lite/issues/409)) ([dad936e](https://github.com/lerna-lite/lerna-lite/commit/dad936e9cc42252028175f08de73c8554d3f7cf1)) - by @ghiscoding
* **version:** use npmClientArgs in npm install after lerna version ([#417](https://github.com/lerna-lite/lerna-lite/issues/417)) ([43e5dcd](https://github.com/lerna-lite/lerna-lite/commit/43e5dcde6bfce0edc062fce4dc3431771423d77c)) - by @ghiscoding

# [1.12.0](https://github.com/lerna-lite/lerna-lite/compare/v1.11.3...v1.12.0) (2022-10-14)

### Bug Fixes

* bump min Node version to >=14.17.0 to align with external deps ([#387](https://github.com/lerna-lite/lerna-lite/issues/387)) ([2f804e9](https://github.com/lerna-lite/lerna-lite/commit/2f804e92bd319e2b27b1406ca82ec1fdab09c449)) - by @ghiscoding
* **deps:** update dependency @npmcli/run-script to v5 ([#388](https://github.com/lerna-lite/lerna-lite/issues/388)) ([f8a8995](https://github.com/lerna-lite/lerna-lite/commit/f8a8995a4a23f5b4e0aa21de79f6be490acd46a1)) - by @renovate-bot
* **deps:** update dependency @octokit/rest to ^19.0.5 ([#380](https://github.com/lerna-lite/lerna-lite/issues/380)) ([18155d8](https://github.com/lerna-lite/lerna-lite/commit/18155d89b078aebcea2ef55704910bea56e8514a)) - by @renovate-bot
* **deps:** update dependency dotenv to ^16.0.3 ([66467f5](https://github.com/lerna-lite/lerna-lite/commit/66467f593198736a3074b1afddb0c86ea860003c)) - by @renovate-bot
* **deps:** update dependency npm-packlist to v6 ([4241c2f](https://github.com/lerna-lite/lerna-lite/commit/4241c2f8b530538fc2ea1dec3dbfebb438056470)) - by @renovate-bot
* **deps:** update dependency npmlog to v7 ([#389](https://github.com/lerna-lite/lerna-lite/issues/389)) ([d2110f1](https://github.com/lerna-lite/lerna-lite/commit/d2110f1aebe4b6cd44bcae2691fbd18fefc78299)) - by @renovate-bot
* **deps:** update dependency read-package-json to v6 ([#390](https://github.com/lerna-lite/lerna-lite/issues/390)) ([c585090](https://github.com/lerna-lite/lerna-lite/commit/c5850900957dec8d6dd6f7542ee2e088315ee338)) - by @renovate-bot
* **deps:** update dependency ssri to v10 ([#385](https://github.com/lerna-lite/lerna-lite/issues/385)) ([04457c9](https://github.com/lerna-lite/lerna-lite/commit/04457c95efd4c135adab9e70de66d5942aa9d18e)) - by @renovate-bot
* **deps:** update dependency write-file-atomic to v5 ([#386](https://github.com/lerna-lite/lerna-lite/issues/386)) ([ffdea0d](https://github.com/lerna-lite/lerna-lite/commit/ffdea0d16e03c0f63e5de4cd61ac53d5eda907e9)) - by @renovate-bot
* **deps:** upgrading pacote & npm-packlist to v7 requires arborist tree ([#367](https://github.com/lerna-lite/lerna-lite/issues/367)) ([8c34a3b](https://github.com/lerna-lite/lerna-lite/commit/8c34a3bccf582f90543b80253d065b22bddd8e35)) - by @ghiscoding
* **npm-publish:** Allows disabling of strict SSL checks ([#374](https://github.com/lerna-lite/lerna-lite/issues/374)) ([a26d849](https://github.com/lerna-lite/lerna-lite/commit/a26d8491dcbe2b3867c9f07c93db6d58d7358198)) - by @ghiscoding
* **run:** allow for loading of env files to be skipped ([#391](https://github.com/lerna-lite/lerna-lite/issues/391)) ([440611e](https://github.com/lerna-lite/lerna-lite/commit/440611ed3acceaef8a3cd4dcfa877591388d83a4)) - by @ghiscoding
* **run:** fully defer to Nx for dep detection when nx.json exists ([0657aa4](https://github.com/lerna-lite/lerna-lite/commit/0657aa41c7502bedad346bed9a2bf91f4b3405d6)) - by @ghiscoding
* **run:** only defer to Nx when targetDefaults are defined in nx.json ([127f90c](https://github.com/lerna-lite/lerna-lite/commit/127f90ce512a9ba0142821f5f1819857b8eb1123)) - by @ghiscoding
* **run:** warn on incompatible arguments with useNx ([bc5e823](https://github.com/lerna-lite/lerna-lite/commit/bc5e82368533d435765250927ecebfa01caeaf62)) - by @ghiscoding

### Features

* **commands:** rename `git-dry-run` and `cmd-dry-run` to simply `dry-run` ([#377](https://github.com/lerna-lite/lerna-lite/issues/377)) ([3a55f5e](https://github.com/lerna-lite/lerna-lite/commit/3a55f5e8f7c26f3890f1c7099ca85c9d72cd2674)) - by @ghiscoding
* **publish:** add new option `--remove-package-fields` before publish ([#359](https://github.com/lerna-lite/lerna-lite/issues/359)) ([45a2107](https://github.com/lerna-lite/lerna-lite/commit/45a2107aa8862546a261a0c377c3fc704248bc5a)) - by @ghiscoding
* **run:** add `--use-nx` as CLI option and add Nx profiler ([9da003e](https://github.com/lerna-lite/lerna-lite/commit/9da003e6b570f969c5da437c71f3a8f9753e4704)) - by @ghiscoding
* **version:** add `--allow-peer-dependencies-update`, closes [#333](https://github.com/lerna-lite/lerna-lite/issues/333) ([#363](https://github.com/lerna-lite/lerna-lite/issues/363)) ([efaf011](https://github.com/lerna-lite/lerna-lite/commit/efaf0111e2e687718d33b42418abd701447a7031)) - by @ghiscoding
* **version:** use manual GitHub web interface when `GH_TOKEN` undefined ([83e9cce](https://github.com/lerna-lite/lerna-lite/commit/83e9cce5e45a12ccf7028d453a9fcddf965443a1)) - by @ghiscoding

## [1.11.3](https://github.com/lerna-lite/lerna-lite/compare/v1.11.2...v1.11.3) (2022-09-20)

### Bug Fixes

* **cli:** add missing Type to fix TSC build error ([836d7f0](https://github.com/lerna-lite/lerna-lite/commit/836d7f0df7973535aa4e5809fd2f9ba8f2b1cd46)) - by @ghiscoding
* **deps:** update dependency git-url-parse to ^13.1.0 ([bcce5ae](https://github.com/lerna-lite/lerna-lite/commit/bcce5ae8fc5b6f04a46d41d4c1c1210398bfb933)) - by @renovate-bot
* **deps:** update dependency git-url-parse to v13 ([3bf8155](https://github.com/lerna-lite/lerna-lite/commit/3bf815527390531be221e14f10a4f61d33aa1bde)) - by @renovate-bot
* **deps:** update dependency uuid to v9 ([e97efb6](https://github.com/lerna-lite/lerna-lite/commit/e97efb605dc7d94bbd1ecfa6a3c07e371e5013c4)) - by @renovate-bot
* **run:** exclude dependencies with `--scope` when `nx.json` is not present ([3c222ed](https://github.com/lerna-lite/lerna-lite/commit/3c222eda560722b2540c8fd29906f4f04c44ca4e)) - by @ghiscoding

## [1.11.2](https://github.com/lerna-lite/lerna-lite/compare/v1.11.1...v1.11.2) (2022-08-30)

### Bug Fixes

* **version:** --changelog-include-commits-[x] in cli should be truthy ([1ddde05](https://github.com/lerna-lite/lerna-lite/commit/1ddde050ccfb285725efb84869adfba733a4dc0c)) - by @ghiscoding
* **version:** `--changelog-header-message` should be added to all logs ([c27a97d](https://github.com/lerna-lite/lerna-lite/commit/c27a97d77d58e09ba746848f93e4a66237231473)) - by @ghiscoding

## [1.11.1](https://github.com/lerna-lite/lerna-lite/compare/v1.11.0...v1.11.1) (2022-08-24)

### Bug Fixes

* **core:** fix parsing commit date with different time zone ([2dc37ec](https://github.com/lerna-lite/lerna-lite/commit/2dc37ec5974c6d82967cd4e11b26ab0f90857185)) - by @ahrbil

# [1.11.0](https://github.com/lerna-lite/lerna-lite/compare/v1.10.0...v1.11.0) (2022-08-19)

### Bug Fixes

* **core:** use match pattern to get last tag date with independent mode ([cebcecf](https://github.com/lerna-lite/lerna-lite/commit/cebcecf95afe30db35995749a9b2a558be176314)) - by @ghiscoding
* **deps:** update all non-major dependencies ([e3b379c](https://github.com/lerna-lite/lerna-lite/commit/e3b379cc1b2bc9632801950e24ebf964780c8aaf)) - by @renovate-bot
* **deps:** update all non-major dependencies ([e8dcfec](https://github.com/lerna-lite/lerna-lite/commit/e8dcfece2a45eb6648c3b76f4938d521078673e8)) - by @renovate-bot
* **version:** changelog client login not need  linkRefs in template ([57047ab](https://github.com/lerna-lite/lerna-lite/commit/57047abe188325cb70bbfa0a8b3edee6b303ef7d)) - by @ghiscoding
* **version:** commit user login, oldest commit might be undefined ([4132f43](https://github.com/lerna-lite/lerna-lite/commit/4132f436d9ed8a0d826920749f3b76a1f3e0c7cc)) - by @ghiscoding
* **version:** properly update dependencies npm lockfile v2 ([0abfa85](https://github.com/lerna-lite/lerna-lite/commit/0abfa85eec26b49f6af996bb4333eccd118072e0)) - by @ghiscoding
* **version:** use `%aI` to pull oldest commit author date ([e033e05](https://github.com/lerna-lite/lerna-lite/commit/e033e05982be3a590ede21cdbc9f839c4d871ab3)) - by @ghiscoding

### Features

* **cli:** add JSON schema for `lerna.json` ([fd93826](https://github.com/lerna-lite/lerna-lite/commit/fd93826f8476dc1cfeba33a46b045fa95a7c38c7)) - by @ghiscoding

# [1.10.0](https://github.com/lerna-lite/lerna-lite/compare/v1.9.1...v1.10.0) (2022-08-06)

### Bug Fixes

* **core:** ensure to touch all nodes in package-graph, fix issue found by Jest team ([f4f7bbc](https://github.com/lerna-lite/lerna-lite/commit/f4f7bbc60a7331a4077e2bf974bb5abffdb4e804)) - by @ghiscoding
* **deps:** update all non-major dependencies ([abe1eff](https://github.com/lerna-lite/lerna-lite/commit/abe1eff71fe211c36d05518a43f74da33967a450)) - by @renovate-bot
* **run:** do not toposort when running in parallel with useNx to match legacy ([af1192c](https://github.com/lerna-lite/lerna-lite/commit/af1192cb11f1378a9b2c03a03b9361b8285bc52d)) - by @ghiscoding
* **version:** get oldest commit data for changelog include commit login ([5d7464b](https://github.com/lerna-lite/lerna-lite/commit/5d7464b9224b3da39be2accefe5524ef820980d7)) - by @ghiscoding

### Features

* **version:** use conventional commit changelog writer for perf ([e9d7c52](https://github.com/lerna-lite/lerna-lite/commit/e9d7c52bdd70cac8d1c6a918c0475b613cf9817d)) - by @ghiscoding

## [1.9.1](https://github.com/lerna-lite/lerna-lite/compare/v1.9.0...v1.9.1) (2022-08-01)

### Bug Fixes

* **publish:** should only warn when using `--no-workspace-strict-match` ([37dd3e7](https://github.com/lerna-lite/lerna-lite/commit/37dd3e7d51c869e3ecd6b2ea0965489038f62d19)) - by @ghiscoding

# [1.9.0](https://github.com/lerna-lite/lerna-lite/compare/v1.8.0...v1.9.0) (2022-07-28)

### Bug Fixes

* **core:** ensure to touch all nodes in package-graph, fix issue found by Jest team ([#301](https://github.com/lerna-lite/lerna-lite/issues/301))  ([f4f7bbc](https://github.com/lerna-lite/lerna-lite/commit/f4f7bbc60a7331a4077e2bf974bb5abffdb4e804)) - by @ghiscoding
* **version:** inherit stdio for lerna version lifecycle scripts ([#276](https://github.com/lerna-lite/lerna-lite/issues/276)) ([9c3625d](https://github.com/lerna-lite/lerna-lite/commit/9c3625dd06e59fc702b8eef52f2a14daf2095be5)) - by @ghiscoding
* **version:** make sure we always have regex match array ([#271](https://github.com/lerna-lite/lerna-lite/issues/271)) ([ba34849](https://github.com/lerna-lite/lerna-lite/commit/ba348495cdefc1acbce3cec82b1c68333761cece)) - by @ghiscoding
* **version:** rename option to `--changelog-include-commits-git-author` ([b095637](https://github.com/lerna-lite/lerna-lite/commit/b095637cdf1ce57f7ecaabf06480f86623e0553e)) - by @ghiscoding

### Features

* **publish:** disable legacy `verifyAccess` behavior by default ([#274](https://github.com/lerna-lite/lerna-lite/issues/274)) ([fb1852d](https://github.com/lerna-lite/lerna-lite/commit/fb1852d09470cc6d3f74c9a8af87881686eabc34)) - by @ghiscoding
* **publish:** include all deps in package graph by default, allow no-sort ([#277](https://github.com/lerna-lite/lerna-lite/issues/277)) ([3229e77](https://github.com/lerna-lite/lerna-lite/commit/3229e7765907bf3bcf208baca876054a5a1cec5e)) - by @ghiscoding
* **version:** option to add commit login username on each changelog entry, closes [#248](https://github.com/lerna-lite/lerna-lite/issues/248) ([#272](https://github.com/lerna-lite/lerna-lite/issues/272)) ([2ca0dca](https://github.com/lerna-lite/lerna-lite/commit/2ca0dcaa005cac6306d7d24ffa4d0d8f1a45e320)) - by @ghiscoding

# [1.8.0](https://github.com/lerna-lite/lerna-lite/compare/v1.6.0...v1.8.0) (2022-07-21)

### Bug Fixes

* **deps:** update all non-major dependencies ([ed1db35](https://github.com/lerna-lite/lerna-lite/commit/ed1db352cd0853dd338bb4a7ebf7998b99eb9f36)) (by _Renovate Bot_)
* **deps:** update all non-major dependencies ([#254](https://github.com/lerna-lite/lerna-lite/issues/254)) ([2d9a0d5](https://github.com/lerna-lite/lerna-lite/commit/2d9a0d563af74ad64cafad9225199668f6f6daf4)) (by _WhiteSource Renovate_)
* **deps:** update dependency @octokit/rest to v19 ([#251](https://github.com/lerna-lite/lerna-lite/issues/251)) ([d0018d7](https://github.com/lerna-lite/lerna-lite/commit/d0018d73f3b17e0d802aa998ce87004f45201d5d)) (by _WhiteSource Renovate_)
* **deps:** update dependency git-url-parse to v12 ([978bf36](https://github.com/lerna-lite/lerna-lite/commit/978bf3666c0d0cdc78e133066b3caf69d127213c)) (by _Renovate Bot_)
* **diff:** add `diff` command missing dependency ([#265](https://github.com/lerna-lite/lerna-lite/issues/265)) ([29168f7](https://github.com/lerna-lite/lerna-lite/commit/29168f7457966584817a5ecfb0c90c50f2df12b8)) (by _Ghislain B_)
* **run:** add double quotes around script target containing colon ([18da175](https://github.com/lerna-lite/lerna-lite/commit/18da175f3b4525c51800affe78b57e151448c643)) (by _ghiscoding_)
* **version:** Node14, import from "fs" instead of "node:fs", fixes [#260](https://github.com/lerna-lite/lerna-lite/issues/260) ([#261](https://github.com/lerna-lite/lerna-lite/issues/261)) ([5e420fd](https://github.com/lerna-lite/lerna-lite/commit/5e420fd4cff05011642f2a5fad4bb5e5f3e60694)) (by _Ghislain B_)
* **version:** rollback previous patch on pnpm lockfile update ([d9f933c](https://github.com/lerna-lite/lerna-lite/commit/d9f933c7c9c118727cb5108b3ef3b0527d0d3f2c)) (by _ghiscoding_)

### Features

* filter for lerna tags in independent mode ([#267](https://github.com/lerna-lite/lerna-lite/issues/267)) ([8c3cdb3](https://github.com/lerna-lite/lerna-lite/commit/8c3cdb38528baf7a4075c846bc33c8933a1a5c0b)) (by _Ghislain B_)
* **version:** add flag to include changelog commit author, close [#248](https://github.com/lerna-lite/lerna-lite/issues/248) ([#253](https://github.com/lerna-lite/lerna-lite/issues/253)) ([7fd8db1](https://github.com/lerna-lite/lerna-lite/commit/7fd8db1c80c1da9d857cdac13c6c6cea1c5b8a69)) (by _Ghislain B_)
* **version:** provide custom format to include commit author fullname ([#269](https://github.com/lerna-lite/lerna-lite/issues/269)) ([1f5a94e](https://github.com/lerna-lite/lerna-lite/commit/1f5a94e06de01ceb8143886b5c00fe845173ee9f)) (by _Ghislain B_)

# [1.6.0](https://github.com/lerna-lite/lerna-lite/compare/v1.5.1...v1.6.0) (2022-06-30)

### Bug Fixes

* **deps:** update all non-major dependencies ([27921f4](https://github.com/lerna-lite/lerna-lite/commit/27921f4a027bac239eb13d99fd2ab268781cf36c))
* **run:** lerna run parallel should maximize concurrency with useNx ([14a113b](https://github.com/lerna-lite/lerna-lite/commit/14a113bf25aec6a5d79626787f34bbea5a671a3a)), closes [#3205](https://github.com/lerna-lite/lerna-lite/issues/3205)
* **run:** Nx correctly detect if target dependencies default are set ([4720351](https://github.com/lerna-lite/lerna-lite/commit/47203516ce87830bce8ce6275f5414190c842480))
* **version:** remove `workspace:` prefix on peerDeps & few refactor ([6e4e5b7](https://github.com/lerna-lite/lerna-lite/commit/6e4e5b7b75effb8f48957bc098edb47a6251cee2))
* **version:** use `--no-frozen-lockfile` instead of `--fix-lockfile` ([a6120b9](https://github.com/lerna-lite/lerna-lite/commit/a6120b9891b719b573ccc2e821cc9ece52d1781d))

### Features

* **changed:** add Lerna `changed` as optional command ([b08417c](https://github.com/lerna-lite/lerna-lite/commit/b08417c125e6dd4a5a7348e9a1e64b1415dbef90))
* **diff:** add Lerna `diff` as optional command ([44dabb2](https://github.com/lerna-lite/lerna-lite/commit/44dabb21de678822188929fd5effe27ddd7f1e6c))

## [1.5.1](https://github.com/lerna-lite/lerna-lite/compare/v1.5.0...v1.5.1) (2022-06-12)

### Bug Fixes

* **version:** add better msg for missing `npmClient` with sync lock ([01e26b1](https://github.com/lerna-lite/lerna-lite/commit/01e26b1df86ed09bf090df1d18e38bbbdce1fc1a))
* **version:** remove `workspace:` prefix on external deps, fixes [#200](https://github.com/lerna-lite/lerna-lite/issues/200) ([8d89256](https://github.com/lerna-lite/lerna-lite/commit/8d89256705e6f70b07213d823d3175c0bcf65598))

# [1.5.0](https://github.com/lerna-lite/lerna-lite/compare/v1.4.0...v1.5.0) (2022-06-08)

### Bug Fixes

- correctly add npm package lock to git add list ([281586f](https://github.com/lerna-lite/lerna-lite/commit/281586f75e7e98d3d3410ccf95e49c428be2c889))
- **deps:** update all non-major dependencies ([c87e937](https://github.com/lerna-lite/lerna-lite/commit/c87e937da725a1d8fa1d685bc3957baf0bcedcee))
- **deps:** update dependency @npmcli/run-script to v4 ([29a09a9](https://github.com/lerna-lite/lerna-lite/commit/29a09a99204e7faafa626173d39ad9752efe891d))
- **version:** improve default git publish message, closes [#185](https://github.com/lerna-lite/lerna-lite/issues/185) ([735fbe6](https://github.com/lerna-lite/lerna-lite/commit/735fbe66069ef0b9389faf850ae7900ddd076f4d))
- **version:** keep semver range operator in `workspace:` protocol, fixes [#198](https://github.com/lerna-lite/lerna-lite/issues/198) ([1794ccd](https://github.com/lerna-lite/lerna-lite/commit/1794ccd769d90a47671a5f4b62c065cec39a401a))

### Features

- **lock:** feat(lock): add version `--sync-workspace-lock` flag to update lock file ([200e385](https://github.com/lerna-lite/lerna-lite/commit/200e38500e046fb99e716b5bc1fc9d87a9c14aab))

### Chore

- **version:** chore(build): add Prettier to the project ([ee1a964](https://github.com/lerna-lite/lerna-lite/commit/ee1a96432675886c887544a59dc88185f5ebbd21))

# [1.4.0](https://github.com/lerna-lite/lerna-lite/compare/v1.3.0...v1.4.0) (2022-05-30)

### Bug Fixes

- **core:** replace `npm-lifecycle` with `@npmcli/run-script` ([6ab0e8d](https://github.com/lerna-lite/lerna-lite/commit/6ab0e8d90098c7d4f70bf63552c0240ba9a93e10)), closes [#60](https://github.com/lerna-lite/lerna-lite/issues/60) [#3134](https://github.com/lerna-lite/lerna-lite/issues/3134)
- **init:** add missing packages/workspaces ([f78860d](https://github.com/lerna-lite/lerna-lite/commit/f78860d158dc4e3772ca8e33113f79508c4fda83))

### Features

- **list:** add Lerna `list` as optional command ([65f810c](https://github.com/lerna-lite/lerna-lite/commit/65f810cd748b7cd06cc2e649d8513aeb7012f0ec))
- **run:** add experimental support to `run` tasks via Nx ([743d434](https://github.com/lerna-lite/lerna-lite/commit/743d4347e37198ddd6c0915f99daaf852cf800de)), closes [#3139](https://github.com/lerna-lite/lerna-lite/issues/3139)

# [1.3.0](https://github.com/lerna-lite/lerna-lite/compare/v1.2.0...v1.3.0) (2022-05-13)

### Features

- **init:** add Lerna `init` command to get started ([dfc3311](https://github.com/lerna-lite/lerna-lite/commit/dfc33114e9f17310f36427bc4e0905c634a82bb5))
- **publish:** `workspace:*` (or ~) protocol should strictly match range ([acede60](https://github.com/lerna-lite/lerna-lite/commit/acede60425c9a9b136b86be74b2ef59c03b63646))

# [1.2.0](https://github.com/lerna-lite/lerna-lite/compare/v1.1.1...v1.2.0) (2022-05-11)

### Bug Fixes

- **run:** display pkg name only when not streaming, fixes [#149](https://github.com/lerna-lite/lerna-lite/issues/149) ([bf60bf0](https://github.com/lerna-lite/lerna-lite/commit/bf60bf09f6eaa206378fccf4ba4b3e551fc8eb3c))
- **url:** deprecation notice of git.io ([816b7cb](https://github.com/lerna-lite/lerna-lite/commit/816b7cbdaca6eb4411097c517c6e29c6a7008cdd)), closes [#3116](https://github.com/lerna-lite/lerna-lite/issues/3116)
- **version:** include the updated root package-lock.json file in commits ([d6dbc9a](https://github.com/lerna-lite/lerna-lite/commit/d6dbc9a3aec1f4460546582fad92c1e5d6ee901e))

### Features

- **core:** add version/publish `workspace:` protocol ([ee57dfb](https://github.com/lerna-lite/lerna-lite/commit/ee57dfbb3ad26cd4bd722e1b54941360ec22f698))
- **core:** Support the `workspace:` protocol ([67d8ba1](https://github.com/lerna-lite/lerna-lite/commit/67d8ba18be5ba915547b8d8eda2c46b13f6410d2))
- **run:** add `LERNA_PACKAGE_NAME` env var to `run` command ([ae88a0a](https://github.com/lerna-lite/lerna-lite/commit/ae88a0a9169ebc9937455062d4e856a1e612dce0)), closes [#3107](https://github.com/lerna-lite/lerna-lite/issues/3107)

## [1.1.1](https://github.com/lerna-lite/lerna-lite/compare/v1.1.0...v1.1.1) (2022-05-01)

### Bug Fixes

- **cli:** new `info` must be a CLI dependency ([de0c00c](https://github.com/lerna-lite/lerna-lite/commit/de0c00cccf9b0965bab32f12aa0d8eaa3a080314))

# [1.1.0](https://github.com/lerna-lite/lerna-lite/compare/v1.0.5...v1.1.0) (2022-05-01)

### Bug Fixes

- incorrect import npmlog was throwing log fn not found ([23860f9](https://github.com/lerna-lite/lerna-lite/commit/23860f900f6d77c840463452c2709e6c6b188b99))

### Features

- **cmd:** breaking, rename dry-run option to `cmd-dry-run` ([01e4777](https://github.com/lerna-lite/lerna-lite/commit/01e47776454bed89db320c17fae0c5c408af4940))

- **exec:** add Lerna `exec` command ([8e87ea1](https://github.com/lerna-lite/lerna-lite/commit/8e87ea1f3a9987e2700b07886e4f600af090f344))

- **info:** add `info` command to CLI ([6fa1154](https://github.com/lerna-lite/lerna-lite/commit/6fa1154a9412c78f26585f41d5612ad083d4494a))

## [1.0.5](https://github.com/lerna-lite/lerna-lite/compare/v1.0.4...v1.0.5) (2022-03-29)

### Bug Fixes

- **deps:** move ts-node to devDependencies ([dabb00f](https://github.com/lerna-lite/lerna-lite/commit/dabb00f008807c0dfba076b66c71ce3f8c2ede8f))

- relax "engines.node" version ([ee59fbc](https://github.com/lerna-lite/lerna-lite/commit/ee59fbcfc7eefa02c85ecff2babd50b1bec112ce))

## [1.0.4](https://github.com/lerna-lite/lerna-lite/compare/v1.0.3...v1.0.4) (2022-03-24)

### Bug Fixes

- **version:** load & write project root lockfile v2 only once ([7ad805a](https://github.com/lerna-lite/lerna-lite/commit/7ad805aaeadc2b7646e4e0aa3186830df7448242))

## [1.0.3](https://github.com/lerna-lite/lerna-lite/compare/v1.0.2...v1.0.3) (2022-03-19)

### Bug Fixes

- **version:** project root lockfile v2 should be updated correctly ([2689746](https://github.com/lerna-lite/lerna-lite/commit/2689746bd6515ce326bf5d6d678c706b08753300))

## [1.0.2](https://github.com/lerna-lite/lerna-lite/compare/v1.0.1...v1.0.2) (2022-03-17)

### Bug Fixes

- **version:** show repo info when Create Release is enabled in dry-run ([5b0cf6d](https://github.com/lerna-lite/lerna-lite/commit/5b0cf6d7ed9df1cfbae0072a9402f777403c6dd6))

## [1.0.1](https://github.com/lerna-lite/lerna-lite/compare/v1.0.0...v1.0.1) (2022-03-15)

### Bug Fixes

- **cli:** add mising import-local dependency ([d1942e6](https://github.com/lerna-lite/lerna-lite/commit/d1942e600de03a1337f29e12dfa926a135d72bad))

# [1.0.0](https://github.com/lerna-lite/lerna-lite/compare/v0.3.7...v1.0.0) (2022-03-15)

- **BREAKING CHANGE:** use lerna CLI for all commands, fixes #28

## [0.3.7](https://github.com/lerna-lite/lerna-lite/compare/v0.3.5...v0.3.7) (2022-03-09)

### Bug Fixes

- **core:** better handling of possible missing pkg name ([ef9633d](https://github.com/lerna-lite/lerna-lite/commit/ef9633dfe623e1aca3e9350739317b9c57872b54))

- **publish:** use Lerna code for `detectFromGit` and `detectFromPackage` ([811111f](https://github.com/lerna-lite/lerna-lite/commit/811111fbc0cdd7a91f45da03c8dcd729bb34fa35))

## [0.3.6](https://github.com/lerna-lite/lerna-lite/compare/v0.3.4...v0.3.6) (2022-03-05)

### Bug Fixes

- **deps:** update few npm dependencies ([9175d48](https://github.com/lerna-lite/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

- **deps:** update npm dependencies ([32da06c](https://github.com/lerna-lite/lerna-lite/commit/32da06cdcea86e38561740e95a1782f09a7add00))

## [0.3.5](https://github.com/lerna-lite/lerna-lite/compare/v0.3.4...v0.3.5) (2022-03-05)

### Bug Fixes

- **deps:** update few npm dependencies ([9175d48](https://github.com/lerna-lite/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

## [0.3.4](https://github.com/lerna-lite/lerna-lite/compare/v0.3.3...v0.3.4) (2022-03-05)

### Bug Fixes

- **version:** add missing lifecycle code from lerna ([a0d9e95](https://github.com/lerna-lite/lerna-lite/commit/a0d9e95b4e1cd80f6f6b933534364e85fa952817))

## [0.3.3](https://github.com/lerna-lite/lerna-lite/compare/v0.3.2...v0.3.3) (2022-02-27)

### Bug Fixes

- **publish:** should publish `from-package` without needing `--bump` ([48cffdd](https://github.com/lerna-lite/lerna-lite/commit/48cffdd30aae7f6c2d5b481b160f5553a4fc2922))

## [0.3.2](https://github.com/lerna-lite/lerna-lite/compare/v0.3.1...v0.3.2) (2022-02-22)

### Bug Fixes

- **core:** catch of error should work with `exitCode` and/or `code` ([461ec29](https://github.com/lerna-lite/lerna-lite/commit/461ec2943ccf48393dc5f0b105c76ee5c2260772))

- **core:** OTP please method had non-strict code ([411f308](https://github.com/lerna-lite/lerna-lite/commit/411f3086d943e0c0d80d9c1a4745775ae7d803e9))

- **version:** add missing code conventional-preset legacy loading ([f0e105d](https://github.com/lerna-lite/lerna-lite/commit/f0e105df8acb267d00fbb46b5cc3b539af86d564))

## [0.3.1](https://github.com/lerna-lite/lerna-lite/compare/v0.3.0...v0.3.1) (2022-02-12)

### Bug Fixes

- **publish:** skip publish when using gitDryRun ([ea97c92](https://github.com/lerna-lite/lerna-lite/commit/ea97c9289ba690c47713d7feb75f0c760b601a15))

- **publish:** skip publish when using gitDryRun ([9408167](https://github.com/lerna-lite/lerna-lite/commit/9408167d0dbd8a8c962a166bd71c86220610acfd))

# [0.3.0](https://github.com/lerna-lite/lerna-lite/compare/v0.2.3...v0.3.0) (2022-02-12)

## BREAKING CHANGE

Rename the lib to Lerna-Lite

## [0.2.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.2...v0.2.3) (2022-02-11)

### Bug Fixes

- **run:** use optional chaining because of possible null result object ([cca5309](https://github.com/ghiscoding/ws-conventional-version-roller/commit/cca53090ac88c0753d834b0026674a82983be6c6))

## [0.2.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.1...v0.2.2) (2022-02-11)

### Bug Fixes

- **cli:** load dotenv in CLI to fix env vars not found on Windows ([5f2ab87](https://github.com/ghiscoding/ws-conventional-version-roller/commit/5f2ab87a90861db599bac4e852bdffb7f0619602))

## [0.2.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.2.0...v0.2.1) (2022-02-11)

### Bug Fixes

- **cli:** yarn throw error w/line ending CRLF, must use LF in bin file ([e1a059a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/e1a059ad7b450ebc798b899e412bc0e6159ee9d1))

- **publish:** add missing `--bump` option in publish roller ([57d3db7](https://github.com/ghiscoding/ws-conventional-version-roller/commit/57d3db74d855cb56dd82b3ddc870568b0ee8e0eb))

# [0.2.0](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.8...v0.2.0) (2022-02-11)

### Bug Fixes

- **logs:** disabling the advanced terminal behavior when TERM is dumb ([9994130](https://github.com/ghiscoding/ws-conventional-version-roller/commit/99941301afe65ffd41f3f0cdc891b189cc19aed2)), closes [#2932](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2932)

- **publish:** add version bump in a lockfile v2 format ([7907e81](https://github.com/ghiscoding/ws-conventional-version-roller/commit/7907e81c53f67eab5a29cd239bc58fd053cfd2a1)), closes [#2914](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2914)

- **publish:** yargs was throwing error bcoz of invalid commented code ([07bb70f](https://github.com/ghiscoding/ws-conventional-version-roller/commit/07bb70fcaf0e2db17490a126f28e199d662e5b77))

- **version:** better non-atomic push fallback condition ([7afacb1](https://github.com/ghiscoding/ws-conventional-version-roller/commit/7afacb1ca726350792b748bf21c939f8db12bb28)), closes [#2696](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2696)

- **version:** fix overall exit code of 128 if git push --atomic fails ([175edc5](https://github.com/ghiscoding/ws-conventional-version-roller/commit/175edc5c778d03ca9cffbde0cdacf407d34cb115)), closes [#3005](https://github.com/ghiscoding/ws-conventional-version-roller/issues/3005)

### Features

- **cli:** add `ws-roller` CLI for publish & version commands ([6201c1d](https://github.com/ghiscoding/ws-conventional-version-roller/commit/6201c1dc6d016b1c61b4f17855a16ca6562d013a))

- **core:** drastically reduce time taken to check for cycles ([ddbc9d5](https://github.com/ghiscoding/ws-conventional-version-roller/commit/ddbc9d5d17e021d48fe3fa0e39fcb730b27ab8fe)), closes [#2874](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2874)

- **run:** add `run` command to help run workspace script in parallel ([a71191b](https://github.com/ghiscoding/ws-conventional-version-roller/commit/a71191b71b3af6ac64e9200c1ac1362efaa28b48))

- **run:** Improve output with `--no-bail` ([3d86e53](https://github.com/ghiscoding/ws-conventional-version-roller/commit/3d86e53fd6c7b30b39d36d89c5d7096f44f11c9d)), closes [#2974](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2974)

- **version:** add `--signoff` git flag ([8eea85a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/8eea85a1e7b233cc8fd542582d61ff59fe597448)), closes [#2897](https://github.com/ghiscoding/ws-conventional-version-roller/issues/2897)

## [0.1.8](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.7...v0.1.8) (2022-02-03)

### Bug Fixes

- **build:** fix Promise return type ([31d2469](https://github.com/ghiscoding/ws-conventional-version-roller/commit/31d246998bb784b505d411a75b2cbf7fcc7742db))

- **version:** add npm lock file to git changed files for update ([1c50e5a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/1c50e5af05825f3aed5b18fe4f273262db4aa9f5))

## [0.1.7](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.6...v0.1.7) (2022-02-03)

### Bug Fixes

- **version:** should update npm root lock file when lockfileVersion>=2 ([8bd41fc](https://github.com/ghiscoding/ws-conventional-version-roller/commit/8bd41fc76dea4e025b89380a5ef98c327f23368e))

## [0.1.4](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.3...v0.1.4) (2022-02-01)

### Bug Fixes

- **build:** remove outdated crypto and use default NodeJS pkg instead ([54a812a](https://github.com/ghiscoding/ws-conventional-version-roller/commit/54a812a590685e83542bd7872376ac5970712c23))

- **core:** add `dotenv` to fix create-release on windows ([0af87c7](https://github.com/ghiscoding/ws-conventional-version-roller/commit/0af87c79358495c89e11a6825a4fdc3b8578125d))

## [0.1.3](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.2...v0.1.3) (2022-01-30)

### Bug Fixes

- **changelog:** add missing options for changelog header msg ([506505e](https://github.com/ghiscoding/ws-conventional-version-roller/commit/506505ed330869c1792d2a4f9cbf345f4aa9731c))

## [0.1.2](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.1...v0.1.2) (2022-01-30)

### Bug Fixes

- **commands:** rename run to roll version/publish commands ([43e18e0](https://github.com/ghiscoding/ws-conventional-version-roller/commit/43e18e067031e6f1c7bde7aa7cfbc5ae76549f73))

- **commands:** rename run to roll version/publish commands ([dbfe136](https://github.com/ghiscoding/ws-conventional-version-roller/commit/dbfe1365f6a41726246b57ff221f4f11bc02a66e))

- **publish:** add missing `publishConfig` to each package ([9924956](https://github.com/ghiscoding/ws-conventional-version-roller/commit/9924956f914361734d89a50f085151564ed33c02))

- **publish:** get a working publish command ([35f44ff](https://github.com/ghiscoding/ws-conventional-version-roller/commit/35f44fffbaeec6c14b8552ee5b4a20a380945bc0))

- **publish:** remove bump from config to fix version rolling ([73285c9](https://github.com/ghiscoding/ws-conventional-version-roller/commit/73285c92d223860d35449ac897ea0c8a352655b8))

## [0.1.1](https://github.com/ghiscoding/ws-conventional-version-roller/compare/v0.1.0...v0.1.1) (2022-01-30)

**Note:** Version bump only for package ws-conventional-version-roller

# 0.1.0 (2022-01-30)

### Bug Fixes

- **version:** should not throw when changelog.md is missing ([eca9816](https://github.com/ghiscoding/ws-conventional-version-roller/commit/eca981632fc9611f5694cb8479b0711418506a5a))

### Features

- **build:** initial commit with publish & version roller ([37e32c0](https://github.com/ghiscoding/ws-conventional-version-roller/commit/37e32c0af59b01d2516a8ee89828bd35ad4054cb))
