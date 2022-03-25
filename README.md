# Lerna-Lite 🐉

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@lerna-lite/core.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/core)
[![NPM downloads](https://img.shields.io/npm/dy/@lerna-lite/core.svg)](https://www.npmjs.com/package/@lerna-lite/core)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-d428ff)](https://github.com/ghiscoding/lerna-lite)

[![PR](https://img.shields.io/badge/PR-Welcome-1abc9c.svg)](https://github.com/ghiscoding/lerna-lite/pulls)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/lerna-lite/branch/main/graph/badge.svg)](https://codecov.io/gh/ghiscoding/lerna-lite)
[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)

## Lerna-Lite is a super light version of the original [Lerna](https://github.com/lerna/lerna)

- [About Lerna-Lite](https://github.com/ghiscoding/lerna-lite#about-lerna-lite)
- [Why create this lib/fork?](https://github.com/ghiscoding/lerna-lite#why-create-this-libfork)
- [See it in Action](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo)
- [README Badge](https://github.com/ghiscoding/lerna-lite#readme-badge)
- [Installation](https://github.com/ghiscoding/lerna-lite#installation)
- [`lerna.json` config file](https://github.com/ghiscoding/lerna-lite/wiki/Lerna.json)
- [Migration for Lerna users](https://github.com/ghiscoding/lerna-lite#migration-for-lerna-users)
- [Troubleshooting](https://github.com/ghiscoding/lerna-lite/wiki/Troubleshooting)
- Commands
   - [`publish`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish#readme) - publish workspace packages (included with CLI)
   - [`version`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version#readme) - create new version for each workspace packages (included with CLI)
   - [`run`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run#readme) - run npm script in each workspace packages (separate install)

---

## License
[MIT License](LICENSE)

## About Lerna-Lite
Lerna-Lite differs from the original [Lerna](https://github.com/lerna/lerna) in the sense that it only includes 3 commands (1 is optional) out of 15 commands that the original Lerna has. It also assume that you have already setup a Workspace through NPM, Yarn or any other technology that will take care of the symlinks (Lerna-Lite does **not include** the `bootstrap` command hence the need for a pre-setup workspace), so make sure that your workspace is properly setup before installing Lerna-Lite.

## Why create this lib/fork?
Mainly for the following reasons:
1. the original Lerna is no longer maintained (dependencies are out of date)
2. create a lighter lib that still provide Lerna's approach of Versioning and Publishing by following the [Conventional Commits](https://www.conventionalcommits.org/) and also automatically create [Conventional-Changelog](https://github.com/conventional-changelog/conventional-changelog) for each package of the workspace. We don't need all packages of Lerna anymore since NPM Workspaces (or other technologies) came out.
3. add some little extras while keeping the lib small.
   - the lib is smaller because we only copied 3 out of 15 commands from Lerna
4. rewrite the lib with TypeScript 

### This lib will help you with
#### [Version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version) & [Publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish) commands
- Automate the rolling of new Versions (`independent` or `fixed`) for all your workspace packages
  - it will automatically add Commit & Tag your new Version in Git & create new GitHub or GitLab Release when enabled
- Automate the creation of Changelogs for all your packages by reading all [Conventional Commits](https://www.conventionalcommits.org/)
  - each package will get its own changelog and a combined changelog will also be created in the root
- Automate the repository Publish of your new versions for all your packages (NPM or other platform)

#### [Run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) command (optional)
- [Run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) is an optional package that will help you run npm script in parallel and in topological order.

## Lerna-Lite Packages

| Package Name | Version | Description | Changes |
| -------------| ------- | ----------- | ------- |
| [@lerna-lite/cli](https://github.com/ghiscoding/lerna-lite/tree/main/packages/cli) | [![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/cli) | Lerna-Lite Version/Publish comands CLI | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/cli/CHANGELOG.md) |
| [@lerna-lite/core](https://github.com/ghiscoding/lerna-lite/tree/main/packages/core) | [![npm](https://img.shields.io/npm/v/@lerna-lite/core.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/core) | Lerna-Lite core & shared methods | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/core/CHANGELOG.md) |
| [@lerna-lite/publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish) | [![npm](https://img.shields.io/npm/v/@lerna-lite/publish.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/publish) | Publish packages in the current workspace | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/publish/CHANGELOG.md) |
| [@lerna-lite/run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) | [![npm](https://img.shields.io/npm/v/@lerna-lite/run.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/run) | Run command and CLI to run npm scripts in the workspace | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/run/CHANGELOG.md) |
| [@lerna-lite/version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version) | [![npm](https://img.shields.io/npm/v/@lerna-lite/version.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/version) | Bump Version & write Changelogs | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/version/CHANGELOG.md) |

### Project Demo?
You want to see a demo project? Sure, you're looking at it 😉

Yes indeed, this lib was created as an NPM Workspace specifically for the purpose of demoing and testing of its own code. All changelogs and published versions were created by the lib itself, how sweet is that? You will also find that it has its own [lerna.json](https://github.com/ghiscoding/lerna-lite/blob/main/lerna.json) config file just as well as you would when using the lib.

### See it in Action 🎦
You can see a small video of a new version release on this [Release Demo - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo) - Confused with all the options? Consult the multiple links below.

#### References
- [Release Demo - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo) - Lerna-Lite demo (animated gif)
- [How to Use Lerna](https://www.youtube.com/watch?v=p6qoJ4apCjA) - YouTube video
- [Lerna Release Workflow](https://github.com/curiousNoob/lerna-release-workflow) - GitHub Template

### README Badge
Using Lerna-Lite? Add a README badge to show it off: [![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-d428ff)](https://github.com/ghiscoding/lerna-lite)

```sh
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-cc00ff)](https://github.com/ghiscoding/lerna-lite)
```

## Installation
Run the following commands to install Lerna-Lite in your project and/or install it globally once with the `-g` option.

| Command | Install         | Description | Included |
|---------|-------------|-------------| ---------|
| 📰 [version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version) | `npm install @lerna-lite/cli` | create new version for each workspace package | Yes |
| 📰 [publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish) | `npm install @lerna-lite/cli` | publish each workspace package | Yes |
| 🏃 [run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) | `npm install @lerna-lite/run` | run npm script in each workspace package | Optional |

**Note:** the default `lerna` CLI is only including 2 built-in commands (`publish` and `version`), while the (`run`) command is optional and must be installed separately as shown below.

```bash
# Lerna CLI which includes `publish`, `version` commands
npm install @lerna-lite/cli  # OR yard add @lerna-lite/cli

# install optional `run` command
npm install @lerna-lite/run  # OR yarn add @lerna-lite/run
```

### Usage
Add custom NPM Scripts or simply run the commands in a shell with Lerna-Lite CLI.
```js
// package.json / npm scripts
"scripts": {
  "new-version": "lerna version",
  "new-publish": "lerna publish from-package",
  "run-tests": "lerna run test", // optional `run` command
}
```

### Configuration
You could configure and run Lerna in 3 different ways: 
1. via a `lerna.json` file
2. via a `"lerna": {}` property directly under your `package.json` 
3. or by passing arguments directly directly in the shell when executing the command. 

You can find more info by reading about the [`lerna.json` - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/lerna.json).

### Migration for [Lerna](https://github.com/lerna/lerna) Users
If you are migrating from Lerna, it should be fairly easy to just replace Lerna with Lerna-Lite in your dependencies and that's about it, the CLI commands are the same, take a look at the quick steps shown below:
1. remove Lerna from your local & global dependencies
```sh
npm uninstall lerna     # OR yarn remove lerna
npm uninstall -g lerna  # OR yarn global remove lerna
```
2. install Lerna-Lite CLI to get `version` and `publish` commands
   - `run` command is **optional** and can be installed separately as shown below
```sh
# Lerna CLI (`version` & `publish` commands)
npm install @lerna-lite/cli

# install optional `run` command
npm install @lerna-lite/run
```

### Development / Contribution
If you wish to contribute to the project, please follow these steps
1. clone the lib:
   - `git clone https://github.com/ghiscoding/lerna-lite`
2. install with NPM:
   - `npm install`
3. run a TypeScript (TSC) build
   - `npm run build`
4. add/run Jest unit tests (make sure to run the previous step first):
   - `npm run jest  # OR npm run jest:watch`
5. you can troubleshoot/debug the code via the VSCode debugger launch configs that were setup

## Contributions
Feel free to contribute any Pull Request, PRs are very welcome. 👷👷‍♀️

Also please note that I'm just a simple developer & user of this lib, the same as you are, my knowledge of the library is also probably similar to yours but together we can make it better (and lighter).

## Troubleshooting
If you have problems running the lib and your problems are related to Git commands that were executed, then we suggest to first try with the `--git-dry-run` option to see if it helps in finding the error(s) you may have. Another great, and possibly much more useful suggestion, is to search in the original Lerna [issues](https://github.com/lerna/lerna/issues) list and see if any solution could help you (remember that Lerna-Lite is a fork of the original code from Lerna and it works the same way). Lastly, if that is not enough and you wish to troubleshoot yourself, then read this [Troubleshooting - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Troubleshooting) to possibly troubleshoot yourself in your own environment.
