# Lerna-Lite 🚀
### Previously known as "ws-conventional-version-roller"

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@lerna-lite/core.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/core)
[![NPM downloads](https://img.shields.io/npm/dy/@lerna-lite/core.svg)](https://www.npmjs.com/package/@lerna-lite/core)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-d428ff)](https://github.com/ghiscoding/lerna-lite)

[![PR](https://img.shields.io/badge/PR-Welcome-1abc9c.svg)](https://github.com/ghiscoding/lerna-lite/pulls)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/lerna-lite/branch/main/graph/badge.svg)](https://codecov.io/gh/ghiscoding/lerna-lite)
[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)

### License
[MIT License](LICENSE)

## Lerna-Lite
A super lite fork of Lerna, only 3 commands were extracted from the original [Lerna](https://github.com/lerna/lerna) (as shown below).

**Note:** Since the [Run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) command is totally optional, we created separate CLIs to handle each commands, see below.

| Command | CLI         | Description | Included |
|---------|-------------|-------------| ---------|
| [version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version) | [ws-roller](https://github.com/ghiscoding/lerna-lite/tree/main/packages/cli#installation) | create new version for each workspace package | Yes |
| [publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish) | [ws-roller](https://github.com/ghiscoding/lerna-lite/tree/main/packages/cli#installation) | publish each workspace package | Yes |
| [run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) | [ws-runner](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run#installation) | run npm script in each workspace package | Optional |

## Why create this lib/fork?
Mainly for the following reasons:
1. the original Lerna is no longer maintained (dependencies are out of date)
2. create a lighter lib that still provide Lerna's approach of Versioning and Publishing by following the [Conventional Commits](https://www.conventionalcommits.org/) and also automatically create [Conventional-Changelog](https://github.com/conventional-changelog/conventional-changelog) for each package of the workspace. We don't all packages of Lerna anymore since NPM Workspaces came out.
3. add some little extras

### This lib will help you with
##### [Version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version) & [Publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish) commands (`ws-roller`)
- Automate the rolling of new Versions (independent or fixed) for all your packages
  - it will automatically add Commit & Tag your new Version in Git & create new Release in GitHub when enabled
- Automate the creation of Changelogs for all your packages by reading all [Conventional Commits](https://www.conventionalcommits.org/)
  - each package will get its own changelog and a combined changelog will also be created in the root
- Automate the repository Publish of your new versions for all your packages
  - it could push to NPM or any other repository platform
##### [Run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) command (`ws-runner`)
- [Run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) is an optional package that will help you run npm script in parallel and in topological order.
## Lerna-Lite Packages

| Package Name | Version | Description | Changes |
| -------------| ------- | ----------- | ------- |
| [@lerna-lite/cli](https://github.com/ghiscoding/lerna-lite/tree/main/packages/cli) | [![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/cli) | Lerna-Lite Version/Publish comands CLI | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/cli/CHANGELOG.md) |
| [@lerna-lite/core](https://github.com/ghiscoding/lerna-lite/tree/main/packages/core) | [![npm](https://img.shields.io/npm/v/@lerna-lite/core.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/core) | Lerna-Lite core & utils methods | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/core/CHANGELOG.md) |
| [@lerna-lite/publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish) | [![npm](https://img.shields.io/npm/v/@lerna-lite/publish.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/publish) | Publish packages in the current workspace | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/publish/CHANGELOG.md) |
| [@lerna-lite/run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) | [![npm](https://img.shields.io/npm/v/@lerna-lite/run.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/run) | CLI to help running npm script in the workspace | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/run/CHANGELOG.md) |
| [@lerna-lite/version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version) | [![npm](https://img.shields.io/npm/v/@lerna-lite/version.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/version) | Bump Version & write Changelogs | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/version/CHANGELOG.md) |

### Project Demo?
You want to see a demo project? Sure, you're looking at it 😉

Yes indeed, this lib was created as an NPM Workspace specifically for the purpose of demoing and testing of its own code. All changelogs and published versions were created by the lib itself, how sweet is that? You will also find that it has its own [lerna.json](https://github.com/ghiscoding/lerna-lite/blob/main/lerna.json) config file just as well as you would when using the lib.

### See it in Action 🎦
You can see a small video of a new version release on this [Release Demo - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo) - Confused with all the options? You can watch this great YouTube video [How to Use Lerna](https://www.youtube.com/watch?v=p6qoJ4apCjA), the Lerna-Lite Options are all the same as Lerna + extras as shown below.

### README Badge
Using Lerna? Add a README badge to show it off: [![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-d428ff)](https://github.com/ghiscoding/lerna-lite)

```sh
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-cc00ff)](https://github.com/ghiscoding/lerna-lite)
```

## Installation
```bash
# publish/version commands CLI
npm install @lerna-lite/cli

# run command CLI
npm install @lerna-lite/run
```
**Note:** the `ws-roller` CLI only has 2 commands available `publish` and `version`

### Usage
Add the following NPM Scripts or simply run the following NodeJS command in your shell.
```js
// package.json / npm scripts
"scripts": {
  "roll-version": "ws-roller version",
  "roll-publish": "ws-roller publish from-package"
}
```

### Configuration
This lib requires a config file in order to do its job properly. It could come from a separate config file in the root (read [`lerna.json` - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/lerna.json) OR a `"lerna": {}` property directly under your `package.json`.

#### Command Options (`ws-roller`)
- [version](https://github.com/ghiscoding/lerna-lite/blob/main/packages/version/README.md)
- [publish](https://github.com/ghiscoding/lerna-lite/blob/main/packages/publish/README.md) (make sure to double-check your [publishConfig](https://docs.npmjs.com/cli/v6/configuring-npm/package-json#publishconfig) access of each package before publishing)

### Migration for [Lerna](https://github.com/lerna/lerna) Users
If you are migrating from Lerna, it is pretty easy and you have to do the following steps to use Lerna-Lite
1. remove Lerna from your dependencies
```sh
npm uninstall lerna # OR yarn remove lerna
```
2. install Lerna-Lite CLI(s)
```sh
npm install @lerna-lite/cli
# and/or run CLI
npm install @lerna-lite/run
```
3. change your npm scripts `lerna <command>` to `ws-roller` (or `ws-runner`)
```diff
- "roll-version": "lerna version",
+ "roll-version": "ws-roller version",

- "roll-publish": "lerna publish from-package"
+ "roll-publish": "ws-roller publish --bump from-package"

- "build": "lerna run build"
+ "build": "ws-runner run build"
```

### Development / Contributions
If you wish to contribute to the project, follow these steps
1. install with NPM
```sh
npm install
```
2. you can debug your code with the already defined launch configs
3. add/run Jest unit tests
```sh
npm run jest # or npm run jest:watch
```

## Need your Help
Anyone willing to help, please create Pull Request. I am trying to add as much Jest unit tests as possible (from the original Lerna) but really any type of PRs are welcome. 👷👷‍♀️

Also please note that I'm just a simpler developer & user of this lib, the same as you are, my knowledge of the library is also probably similar to yours, but together we can make it better (and lighter).

## Troubleshooting
If you have problems running the lib and your problems are with Git then you should first try the `--git-dry-run` option to see if that helps in finding the error. Another great, and possibly much more useful suggestion, is to search in the Lerna [issues](https://github.com/lerna/lerna/issues) because most of the code came from that library. Lastly if it that is not enough and you wish to troubleshoot yourself, then read this [Troubleshooting - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Troubleshooting)
