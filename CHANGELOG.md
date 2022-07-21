# Change Log
### Automate your Workspace Versions, Changelogs & Publish with [Lerna-Lite](https://github.com/ghiscoding/lerna-lite) 🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.8.0](https://github.com/ghiscoding/lerna-lite/compare/v1.6.0...v1.8.0) (2022-07-21)

### Bug Fixes

* **deps:** update all non-major dependencies ([ed1db35](https://github.com/ghiscoding/lerna-lite/commit/ed1db352cd0853dd338bb4a7ebf7998b99eb9f36)) (by _Renovate Bot_)
* **deps:** update all non-major dependencies ([#254](https://github.com/ghiscoding/lerna-lite/issues/254)) ([2d9a0d5](https://github.com/ghiscoding/lerna-lite/commit/2d9a0d563af74ad64cafad9225199668f6f6daf4)) (by _WhiteSource Renovate_)
* **deps:** update dependency @octokit/rest to v19 ([#251](https://github.com/ghiscoding/lerna-lite/issues/251)) ([d0018d7](https://github.com/ghiscoding/lerna-lite/commit/d0018d73f3b17e0d802aa998ce87004f45201d5d)) (by _WhiteSource Renovate_)
* **deps:** update dependency git-url-parse to v12 ([978bf36](https://github.com/ghiscoding/lerna-lite/commit/978bf3666c0d0cdc78e133066b3caf69d127213c)) (by _Renovate Bot_)
* **diff:** add `diff` command missing dependency ([#265](https://github.com/ghiscoding/lerna-lite/issues/265)) ([29168f7](https://github.com/ghiscoding/lerna-lite/commit/29168f7457966584817a5ecfb0c90c50f2df12b8)) (by _Ghislain B_)
* **run:** add double quotes around script target containing colon ([18da175](https://github.com/ghiscoding/lerna-lite/commit/18da175f3b4525c51800affe78b57e151448c643)) (by _ghiscoding_)
* **version:** Node14, import from "fs" instead of "node:fs", fixes [#260](https://github.com/ghiscoding/lerna-lite/issues/260) ([#261](https://github.com/ghiscoding/lerna-lite/issues/261)) ([5e420fd](https://github.com/ghiscoding/lerna-lite/commit/5e420fd4cff05011642f2a5fad4bb5e5f3e60694)) (by _Ghislain B_)
* **version:** rollback previous patch on pnpm lockfile update ([d9f933c](https://github.com/ghiscoding/lerna-lite/commit/d9f933c7c9c118727cb5108b3ef3b0527d0d3f2c)) (by _ghiscoding_)

### Features

* filter for lerna tags in independent mode ([#267](https://github.com/ghiscoding/lerna-lite/issues/267)) ([8c3cdb3](https://github.com/ghiscoding/lerna-lite/commit/8c3cdb38528baf7a4075c846bc33c8933a1a5c0b)) (by _Ghislain B_)
* **version:** add flag to include changelog commit author, close [#248](https://github.com/ghiscoding/lerna-lite/issues/248) ([#253](https://github.com/ghiscoding/lerna-lite/issues/253)) ([7fd8db1](https://github.com/ghiscoding/lerna-lite/commit/7fd8db1c80c1da9d857cdac13c6c6cea1c5b8a69)) (by _Ghislain B_)
* **version:** provide custom format to include commit author fullname ([#269](https://github.com/ghiscoding/lerna-lite/issues/269)) ([1f5a94e](https://github.com/ghiscoding/lerna-lite/commit/1f5a94e06de01ceb8143886b5c00fe845173ee9f)) (by _Ghislain B_)

# [1.6.0](https://github.com/ghiscoding/lerna-lite/compare/v1.5.1...v1.6.0) (2022-06-30)

### Bug Fixes

* **deps:** update all non-major dependencies ([27921f4](https://github.com/ghiscoding/lerna-lite/commit/27921f4a027bac239eb13d99fd2ab268781cf36c))
* **run:** lerna run parallel should maximize concurrency with useNx ([14a113b](https://github.com/ghiscoding/lerna-lite/commit/14a113bf25aec6a5d79626787f34bbea5a671a3a)), closes [#3205](https://github.com/ghiscoding/lerna-lite/issues/3205)
* **run:** Nx correctly detect if target dependencies default are set ([4720351](https://github.com/ghiscoding/lerna-lite/commit/47203516ce87830bce8ce6275f5414190c842480))
* **version:** remove `workspace:` prefix on peerDeps & few refactor ([6e4e5b7](https://github.com/ghiscoding/lerna-lite/commit/6e4e5b7b75effb8f48957bc098edb47a6251cee2))
* **version:** use `--no-frozen-lockfile` instead of `--fix-lockfile` ([a6120b9](https://github.com/ghiscoding/lerna-lite/commit/a6120b9891b719b573ccc2e821cc9ece52d1781d))

### Features

* **changed:** add Lerna `changed` as optional command ([b08417c](https://github.com/ghiscoding/lerna-lite/commit/b08417c125e6dd4a5a7348e9a1e64b1415dbef90))
* **diff:** add Lerna `diff` as optional command ([44dabb2](https://github.com/ghiscoding/lerna-lite/commit/44dabb21de678822188929fd5effe27ddd7f1e6c))

## [1.5.1](https://github.com/ghiscoding/lerna-lite/compare/v1.5.0...v1.5.1) (2022-06-12)

### Bug Fixes

* **version:** add better msg for missing `npmClient` with sync lock ([01e26b1](https://github.com/ghiscoding/lerna-lite/commit/01e26b1df86ed09bf090df1d18e38bbbdce1fc1a))
* **version:** remove `workspace:` prefix on external deps, fixes [#200](https://github.com/ghiscoding/lerna-lite/issues/200) ([8d89256](https://github.com/ghiscoding/lerna-lite/commit/8d89256705e6f70b07213d823d3175c0bcf65598))

# [1.5.0](https://github.com/ghiscoding/lerna-lite/compare/v1.4.0...v1.5.0) (2022-06-08)

### Bug Fixes

- correctly add npm package lock to git add list ([281586f](https://github.com/ghiscoding/lerna-lite/commit/281586f75e7e98d3d3410ccf95e49c428be2c889))
- **deps:** update all non-major dependencies ([c87e937](https://github.com/ghiscoding/lerna-lite/commit/c87e937da725a1d8fa1d685bc3957baf0bcedcee))
- **deps:** update dependency @npmcli/run-script to v4 ([29a09a9](https://github.com/ghiscoding/lerna-lite/commit/29a09a99204e7faafa626173d39ad9752efe891d))
- **version:** improve default git publish message, closes [#185](https://github.com/ghiscoding/lerna-lite/issues/185) ([735fbe6](https://github.com/ghiscoding/lerna-lite/commit/735fbe66069ef0b9389faf850ae7900ddd076f4d))
- **version:** keep semver range operator in `workspace:` protocol, fixes [#198](https://github.com/ghiscoding/lerna-lite/issues/198) ([1794ccd](https://github.com/ghiscoding/lerna-lite/commit/1794ccd769d90a47671a5f4b62c065cec39a401a))

### Features

- **lock:** feat(lock): add version `--sync-workspace-lock` flag to update lock file ([200e385](https://github.com/ghiscoding/lerna-lite/commit/200e38500e046fb99e716b5bc1fc9d87a9c14aab))

### Chore

- **version:** chore(build): add Prettier to the project ([ee1a964](https://github.com/ghiscoding/lerna-lite/commit/ee1a96432675886c887544a59dc88185f5ebbd21))

# [1.4.0](https://github.com/ghiscoding/lerna-lite/compare/v1.3.0...v1.4.0) (2022-05-30)

### Bug Fixes

- **core:** replace `npm-lifecycle` with `@npmcli/run-script` ([6ab0e8d](https://github.com/ghiscoding/lerna-lite/commit/6ab0e8d90098c7d4f70bf63552c0240ba9a93e10)), closes [#60](https://github.com/ghiscoding/lerna-lite/issues/60) [#3134](https://github.com/ghiscoding/lerna-lite/issues/3134)
- **init:** add missing packages/workspaces ([f78860d](https://github.com/ghiscoding/lerna-lite/commit/f78860d158dc4e3772ca8e33113f79508c4fda83))

### Features

- **list:** add Lerna `list` as optional command ([65f810c](https://github.com/ghiscoding/lerna-lite/commit/65f810cd748b7cd06cc2e649d8513aeb7012f0ec))
- **run:** add experimental support to `run` tasks via Nx ([743d434](https://github.com/ghiscoding/lerna-lite/commit/743d4347e37198ddd6c0915f99daaf852cf800de)), closes [#3139](https://github.com/ghiscoding/lerna-lite/issues/3139)

# [1.3.0](https://github.com/ghiscoding/lerna-lite/compare/v1.2.0...v1.3.0) (2022-05-13)

### Features

- **init:** add Lerna `init` command to get started ([dfc3311](https://github.com/ghiscoding/lerna-lite/commit/dfc33114e9f17310f36427bc4e0905c634a82bb5))
- **publish:** `workspace:*` (or ~) protocol should strictly match range ([acede60](https://github.com/ghiscoding/lerna-lite/commit/acede60425c9a9b136b86be74b2ef59c03b63646))

# [1.2.0](https://github.com/ghiscoding/lerna-lite/compare/v1.1.1...v1.2.0) (2022-05-11)

### Bug Fixes

- **run:** display pkg name only when not streaming, fixes [#149](https://github.com/ghiscoding/lerna-lite/issues/149) ([bf60bf0](https://github.com/ghiscoding/lerna-lite/commit/bf60bf09f6eaa206378fccf4ba4b3e551fc8eb3c))
- **url:** deprecation notice of git.io ([816b7cb](https://github.com/ghiscoding/lerna-lite/commit/816b7cbdaca6eb4411097c517c6e29c6a7008cdd)), closes [#3116](https://github.com/ghiscoding/lerna-lite/issues/3116)
- **version:** include the updated root package-lock.json file in commits ([d6dbc9a](https://github.com/ghiscoding/lerna-lite/commit/d6dbc9a3aec1f4460546582fad92c1e5d6ee901e))

### Features

- **core:** add version/publish `workspace:` protocol ([ee57dfb](https://github.com/ghiscoding/lerna-lite/commit/ee57dfbb3ad26cd4bd722e1b54941360ec22f698))
- **core:** Support the `workspace:` protocol ([67d8ba1](https://github.com/ghiscoding/lerna-lite/commit/67d8ba18be5ba915547b8d8eda2c46b13f6410d2))
- **run:** add `LERNA_PACKAGE_NAME` env var to `run` command ([ae88a0a](https://github.com/ghiscoding/lerna-lite/commit/ae88a0a9169ebc9937455062d4e856a1e612dce0)), closes [#3107](https://github.com/ghiscoding/lerna-lite/issues/3107)

## [1.1.1](https://github.com/ghiscoding/lerna-lite/compare/v1.1.0...v1.1.1) (2022-05-01)

### Bug Fixes

- **cli:** new `info` must be a CLI dependency ([de0c00c](https://github.com/ghiscoding/lerna-lite/commit/de0c00cccf9b0965bab32f12aa0d8eaa3a080314))

# [1.1.0](https://github.com/ghiscoding/lerna-lite/compare/v1.0.5...v1.1.0) (2022-05-01)

### Bug Fixes

- incorrect import npmlog was throwing log fn not found ([23860f9](https://github.com/ghiscoding/lerna-lite/commit/23860f900f6d77c840463452c2709e6c6b188b99))

### Features

- **cmd:** breaking, rename dry-run option to `cmd-dry-run` ([01e4777](https://github.com/ghiscoding/lerna-lite/commit/01e47776454bed89db320c17fae0c5c408af4940))

- **exec:** add Lerna `exec` command ([8e87ea1](https://github.com/ghiscoding/lerna-lite/commit/8e87ea1f3a9987e2700b07886e4f600af090f344))

- **info:** add `info` command to CLI ([6fa1154](https://github.com/ghiscoding/lerna-lite/commit/6fa1154a9412c78f26585f41d5612ad083d4494a))

## [1.0.5](https://github.com/ghiscoding/lerna-lite/compare/v1.0.4...v1.0.5) (2022-03-29)

### Bug Fixes

- **deps:** move ts-node to devDependencies ([dabb00f](https://github.com/ghiscoding/lerna-lite/commit/dabb00f008807c0dfba076b66c71ce3f8c2ede8f))

- relax "engines.node" version ([ee59fbc](https://github.com/ghiscoding/lerna-lite/commit/ee59fbcfc7eefa02c85ecff2babd50b1bec112ce))

## [1.0.4](https://github.com/ghiscoding/lerna-lite/compare/v1.0.3...v1.0.4) (2022-03-24)

### Bug Fixes

- **version:** load & write project root lockfile v2 only once ([7ad805a](https://github.com/ghiscoding/lerna-lite/commit/7ad805aaeadc2b7646e4e0aa3186830df7448242))

## [1.0.3](https://github.com/ghiscoding/lerna-lite/compare/v1.0.2...v1.0.3) (2022-03-19)

### Bug Fixes

- **version:** project root lockfile v2 should be updated correctly ([2689746](https://github.com/ghiscoding/lerna-lite/commit/2689746bd6515ce326bf5d6d678c706b08753300))

## [1.0.2](https://github.com/ghiscoding/lerna-lite/compare/v1.0.1...v1.0.2) (2022-03-17)

### Bug Fixes

- **version:** show repo info when Create Release is enabled in dry-run ([5b0cf6d](https://github.com/ghiscoding/lerna-lite/commit/5b0cf6d7ed9df1cfbae0072a9402f777403c6dd6))

## [1.0.1](https://github.com/ghiscoding/lerna-lite/compare/v1.0.0...v1.0.1) (2022-03-15)

### Bug Fixes

- **cli:** add mising import-local dependency ([d1942e6](https://github.com/ghiscoding/lerna-lite/commit/d1942e600de03a1337f29e12dfa926a135d72bad))

# [1.0.0](https://github.com/ghiscoding/lerna-lite/compare/v0.3.7...v1.0.0) (2022-03-15)

- **BREAKING CHANGE:** use lerna CLI for all commands, fixes #28

## [0.3.7](https://github.com/ghiscoding/lerna-lite/compare/v0.3.5...v0.3.7) (2022-03-09)

### Bug Fixes

- **core:** better handling of possible missing pkg name ([ef9633d](https://github.com/ghiscoding/lerna-lite/commit/ef9633dfe623e1aca3e9350739317b9c57872b54))

- **publish:** use Lerna code for `detectFromGit` and `detectFromPackage` ([811111f](https://github.com/ghiscoding/lerna-lite/commit/811111fbc0cdd7a91f45da03c8dcd729bb34fa35))

## [0.3.6](https://github.com/ghiscoding/lerna-lite/compare/v0.3.4...v0.3.6) (2022-03-05)

### Bug Fixes

- **deps:** update few npm dependencies ([9175d48](https://github.com/ghiscoding/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

- **deps:** update npm dependencies ([32da06c](https://github.com/ghiscoding/lerna-lite/commit/32da06cdcea86e38561740e95a1782f09a7add00))

## [0.3.5](https://github.com/ghiscoding/lerna-lite/compare/v0.3.4...v0.3.5) (2022-03-05)

### Bug Fixes

- **deps:** update few npm dependencies ([9175d48](https://github.com/ghiscoding/lerna-lite/commit/9175d48002ba7efb1b6b69506c3f6e864898b8a0))

## [0.3.4](https://github.com/ghiscoding/lerna-lite/compare/v0.3.3...v0.3.4) (2022-03-05)

### Bug Fixes

- **version:** add missing lifecycle code from lerna ([a0d9e95](https://github.com/ghiscoding/lerna-lite/commit/a0d9e95b4e1cd80f6f6b933534364e85fa952817))

## [0.3.3](https://github.com/ghiscoding/lerna-lite/compare/v0.3.2...v0.3.3) (2022-02-27)

### Bug Fixes

- **publish:** should publish `from-package` without needing `--bump` ([48cffdd](https://github.com/ghiscoding/lerna-lite/commit/48cffdd30aae7f6c2d5b481b160f5553a4fc2922))

## [0.3.2](https://github.com/ghiscoding/lerna-lite/compare/v0.3.1...v0.3.2) (2022-02-22)

### Bug Fixes

- **core:** catch of error should work with `exitCode` and/or `code` ([461ec29](https://github.com/ghiscoding/lerna-lite/commit/461ec2943ccf48393dc5f0b105c76ee5c2260772))

- **core:** OTP please method had non-strict code ([411f308](https://github.com/ghiscoding/lerna-lite/commit/411f3086d943e0c0d80d9c1a4745775ae7d803e9))

- **version:** add missing code conventional-preset legacy loading ([f0e105d](https://github.com/ghiscoding/lerna-lite/commit/f0e105df8acb267d00fbb46b5cc3b539af86d564))

## [0.3.1](https://github.com/ghiscoding/lerna-lite/compare/v0.3.0...v0.3.1) (2022-02-12)

### Bug Fixes

- **publish:** skip publish when using gitDryRun ([ea97c92](https://github.com/ghiscoding/lerna-lite/commit/ea97c9289ba690c47713d7feb75f0c760b601a15))

- **publish:** skip publish when using gitDryRun ([9408167](https://github.com/ghiscoding/lerna-lite/commit/9408167d0dbd8a8c962a166bd71c86220610acfd))

# [0.3.0](https://github.com/ghiscoding/lerna-lite/compare/v0.2.3...v0.3.0) (2022-02-12)

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
