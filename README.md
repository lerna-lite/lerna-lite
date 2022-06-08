# Lerna-Lite 🐉

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PR](https://img.shields.io/badge/PR-Welcome-1abc9c)](https://github.com/ghiscoding/lerna-lite/pulls)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-d428ff)](https://github.com/ghiscoding/lerna-lite)

[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)
[![codecov](https://codecov.io/gh/ghiscoding/lerna-lite/branch/main/graph/badge.svg)](https://codecov.io/gh/ghiscoding/lerna-lite)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![NPM downloads](https://img.shields.io/npm/dm/@lerna-lite/cli.svg)](https://www.npmjs.com/package/@lerna-lite/cli)
[![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/cli)

## Lerna-Lite is a super light version of the original [Lerna](https://github.com/lerna/lerna)

- [About Lerna-Lite](#about-lerna-lite)
- [Why create this lib/fork?](#why-create-this-libfork)
- [See it in Action](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo)
- [README Badge](#readme-badge)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [`lerna.json` config file](https://github.com/ghiscoding/lerna-lite/wiki/lerna.json)
- [Migration for Lerna users](#migration-for-lerna-users)
- [Troubleshooting](https://github.com/ghiscoding/lerna-lite/wiki/Troubleshooting)
- Commands
  - included with CLI
    - 🛠️ [`init`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/init#readme) - create a new Lerna-Lite repo (creates `lerna.json` and a workspace structure)
    - 💻 [`info`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/info#readme) - print local environment information (useful when opening new issue)
    - ☁️ [`publish`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish#readme) - publish every workspace packages that changed
    - 📑 [`version`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version#readme) - create new version for each workspace packages
  - optional (**separate install**, see [installation](#installation) table below)
    - 👷 [`exec`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/exec#readme) - execute shell command in each workspace package
    - 📖 [`list`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/list#readme) - list local packages
    - 🏃 [`run`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run#readme) - run npm script in each workspace packages

_If a command that you wish to use is missing, simply reach out and we could potentially add it as an optional command. However please note that the following commands (`bootstrap` and `link`) are totally out of the picture._

---

## 📢 Lerna-Lite now supports pnpm/yarn `workspace:` protocol

#### _this new feature was introduced with release [1.2.0](https://github.com/ghiscoding/lerna-lite/releases/tag/v1.2.0) of Lerna-Lite, however we recommend using >=[1.3.0](https://github.com/ghiscoding/lerna-lite/releases)._

If you are using this new feature, please take 30sec. to fill in this small [poll survey](https://github.com/ghiscoding/lerna-lite/discussions/156) just to see which package manager is the most popular and how many of you are taking advantage of this new `workspace:` protocol. Thanks :wink:

---

## License

[MIT License](LICENSE)

## About Lerna-Lite

Lerna-Lite differs from the original [Lerna](https://github.com/lerna/lerna) in the sense that it only has a limited set of commands from Lerna which itself has 15 commands while Lerna-Lite only includes half of them (and a few are optional). Lerna was originally built as an all-in-one tool, however nowadays Workspaces are available in all package managers and the need for an all-in-one tool which includes built-in workspaces functionalities is no longer required. Lerna-Lite is built around this new reality and so its CLI only includes the minimum commands `init`, `info`, `publish` and `version`, while other commands are available (`exec`, `list` and `run`) they are totally optional and you won't download them unless you opt-in. So in summary it is more modular than the original Lerna and it may seem like a small change but it does make it more versatile (with smaller downloads and less dependencies) to use with other tools like Turborepo, pnpm and others...

As a summary, Lerna-Lite assumes, and requires, to pre-setup a Workspace through your favorite package manager (npm, pnpm, yarn) that will take care of the symlinks (Lerna-Lite does **not include** the `bootstrap`, neither `link` commands hence the need for a workspace pre-setup), so make sure that your workspace is properly setup **before** installing Lerna-Lite.

For more info on how to setup a workspace, choose the best option for you: [Yarn classic](https://classic.yarnpkg.com/en/docs/workspaces) / [Yarn 2+](https://yarnpkg.com/features/workspaces) / [pnpm](https://pnpm.io/workspaces) / [npm 7+](https://docs.npmjs.com/cli/v8/using-npm/workspaces)

## Why create this lib/fork?

Mainly for the following reasons:

1. original Lerna was no longer maintained (dependencies were out of date)
   - this is no longer true since Nrwl took over ownership of Lerna, but the next few points are still valid
2. wanted to create a smaller lib that is more modular than the original Lerna
   - the lib is smaller since we only copied half of Lerna's commands and a few are totally optional.
   - we don't need all packages of Lerna anymore since Workspaces now exists for all package managers.
   - the main goal of this fork was to keep only `version` and `publish` commands in the core and make everything else as optional packages (install and use only what you need).
3. rewrite the lib in TypeScript
4. replicate a few opened PRs (fixes and features) from Lerna and also add extra features in Lerna-Lite
   - for example we now support the `workspace:` protocol and `dry-run` options

### This lib will help you with

#### [Version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version) and [Publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish) commands (included with the CLI)

- Automate the rolling of new Versions (`independent` or `fixed`) of all your workspace packages.
  - it will automatically Commit/Tag your new Version & create new GitHub/GitLab Release (when enabled).
- Automate the creation of Changelogs for all your packages by reading all [Conventional Commits](https://www.conventionalcommits.org/).
  - each package will get its own Changelog and a merged Changelog will also be created in the root.
- Automate the repository Publishing of your new version for all your packages (NPM or other platform).

#### Other useful but optional commands

- [Exec](https://github.com/ghiscoding/lerna-lite/tree/main/packages/exec#readme) command, when installed, will help you execute shell commands in parallel and in topological order.
- [List](https://github.com/ghiscoding/lerna-lite/tree/main/packages/list#readme) command, when installed, will list all workspace local packages
- [Run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run#readme) command, when installed, will help you run npm script in parallel and in topological order.

### README Badge

Using Lerna-Lite? Add a README badge to show it off: [![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-d428ff)](https://github.com/ghiscoding/lerna-lite)

```sh
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-cc00ff)](https://github.com/ghiscoding/lerna-lite)
```

## Getting Started

Let's start by installing Lerna as a dev dependency of your project with [npm](https://www.npmjs.com/).

```sh
$ mkdir lerna-repo
$ cd lerna-repo
$ npx lerna init
```

This will create a `lerna.json` configuration file as well as a `packages` folder, so your folder should now look like this:

```
lerna-repo/
  packages/
    package-a
  package.json
  lerna.json
```

Note that `package-a` will not be created, it is only shown shown here to help clarify the structure. For more info and full details about the `lerna.json` file, you can read the [lerna.json](https://github.com/ghiscoding/lerna-lite/wiki/lerna.json) Wiki.

## Installation

Run the following commands to install Lerna-Lite in your project and/or install it globally by adding the `-g` option.

If you are new to Lerna-Lite, you could also run the [lerna init](https://github.com/ghiscoding/lerna-lite/tree/main/packages/init#readme) command which will create the `lerna.json` for you. If you are using a different client other than npm, then make sure to update the `npmClient` property in `lerna.json` (for example: `"npmClient": "yarn"`).

| Command                                                                                  | Install                        | Description                                   | Included |
| ---------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------- | -------- |
| 🛠️ [init](https://github.com/ghiscoding/lerna-lite/tree/main/packages/init#readme)       | `npm i @lerna-lite/cli -D -W`  | create/initialize a new Lerna-Lite repo       | Yes      |
| 💻 [info](https://github.com/ghiscoding/lerna-lite/tree/main/packages/info#readme)       | `npm i @lerna-lite/cli -D -W`  | print local environment information           | Yes      |
| 📑 [version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version#readme) | `npm i @lerna-lite/cli -D -W`  | create new version for each workspace package | Yes      |
| ☁️ [publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish#readme) | `npm i @lerna-lite/cli -D -W`  | publish each workspace package                | Yes      |
| 👷 [exec](https://github.com/ghiscoding/lerna-lite/tree/main/packages/exec#readme)       | `npm i @lerna-lite/exec -D -W` | execute an command in each workspace package  | Optional |
| 📖 [list](https://github.com/ghiscoding/lerna-lite/tree/main/packages/list#readme)       | `npm i @lerna-lite/list -D -W` | list local packages                           | Optional |
| 🏃 [run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run#readme)         | `npm i @lerna-lite/run -D -W`  | run npm script in each workspace package      | Optional |

**Note:** the default `lerna` CLI is only including 4 built-in commands (`init`,`info`,`publish`,`version`), while the (`exec`, `list` and `run`) commands are optional and must be installed separately as shown in the table.

### Usage

Add custom NPM Scripts or simply run the commands in a shell with Lerna-Lite CLI, below are a few very simple demo scripts.

```js
// package.json / npm scripts
"scripts": {
  "new-version": "lerna version",
  "new-publish": "lerna publish from-package",

  "exec-echo": "lerna exec echo hello", // optional `exec` command
  "run-tests": "lerna run test",        // optional `run` command
}
```

### Project Demo?

You want to see a project demo? Sure, you're looking at it 😉

Yes indeed, this lib was created specifically as an NPM Workspace for the sole purpose of demoing and testing its own code. All changelogs and published versions were created and pushed by the lib itself, how sweet is that? You will also find that it has its own [lerna.json](https://github.com/ghiscoding/lerna-lite/blob/main/lerna.json) config file to run properly.

### See it in Action 🎦

You can see a small video of a new version release on this [Release Demo - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo) to demonstrate its usage. Are you confused with all the options? Then take a look at the references shown below, it might help you get started.

##### References

- [Release Demo - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo) - Lerna-Lite demo (animated gif)
- [How to Use Lerna](https://www.youtube.com/watch?v=p6qoJ4apCjA) - YouTube video
- [Lerna Release Workflow](https://github.com/curiousNoob/lerna-release-workflow) - GitHub Template

### Migration for [Lerna](https://github.com/lerna/lerna) Users

If you are migrating from Lerna, it should be fairly easy to just replace Lerna with Lerna-Lite in your dependencies and that's about it, the CLI commands are the same, take a look at the quick steps shown below:

1. remove Lerna from your local & global dependencies

```sh
npm uninstall lerna -W   # OR yarn remove lerna -W
npm uninstall -g lerna   # OR yarn global remove lerna
```

2. install Lerna-Lite CLI to get access to `init`, `info`, `version` and `publish` commands

```sh
# Lerna CLI (includes `init`, `info`, `version` and `publish` commands)
npm install @lerna-lite/cli -D -W
```

3. optionally install `exec`, `list` and/or `run` commands (refer to [installation](#installation) table)

```sh
# optionally install `exec`, `list` and/or `run` command(s)
npm install @lerna-lite/run -D -W
```

## Contributions

Feel free to contribute any Pull Request, PRs are very welcome. 👷👷‍♀️

Also please note that I'm just a simple developer & user of this lib, the same as you are, my knowledge of the library is also probably similar to yours but together we can make it better (and lighter).

### Development / Contributions

If you wish to contribute to the project, please follow these steps

1. clone the lib:
   - `git clone https://github.com/ghiscoding/lerna-lite`
2. install with **NPM 8+**:
   - `npm install`
3. run a TypeScript (TSC) build
   - `npm run build`
4. add/run Jest unit tests (make sure to run the previous steps first):
   - `npm run jest # OR npm run jest:watch`
5. you can troubleshoot/debug the code via the VSCode debugger launch configs that were setup

## Troubleshooting

If you have problems running the lib and your problems are related to Git commands that were executed, then we suggest to first try with the `--git-dry-run` (or `--cmd-dry-run`) option to see if it helps in finding the error(s) you may have. Another great, and possibly much more useful suggestion, is to search in the original Lerna [issues](https://github.com/lerna/lerna/issues) list and see if any solution could help you (remember that Lerna-Lite is a fork of the original code from Lerna and it works the same way). Lastly, if that is not enough and you wish to troubleshoot yourself, then read this [Troubleshooting - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Troubleshooting) to possibly troubleshoot yourself in your own environment.

## Lerna-Lite Packages

| Package Name                                                                                                       | Version                                                                                                                                                                    | Description                                                 | Changes                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [@lerna-lite/cli](https://github.com/ghiscoding/lerna-lite/tree/main/packages/cli)                                 | [![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/cli)                                 | Lerna-Lite Init/Info/Version/Publish comands CLI            | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/cli/CHANGELOG.md)                 |
| [@lerna-lite/core](https://github.com/ghiscoding/lerna-lite/tree/main/packages/core)                               | [![npm](https://img.shields.io/npm/v/@lerna-lite/core.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/core)                               | Lerna-Lite core & shared methods                            | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/core/CHANGELOG.md)                |
| [@lerna-lite/info](https://github.com/ghiscoding/lerna-lite/tree/main/packages/info)                               | [![npm](https://img.shields.io/npm/v/@lerna-lite/info.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/info)                               | Print local environment information                         | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/info/CHANGELOG.md)                |
| [@lerna-lite/init](https://github.com/ghiscoding/lerna-lite/tree/main/packages/init)                               | [![npm](https://img.shields.io/npm/v/@lerna-lite/init.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/init)                               | create a new Lerna-Lite repo                                | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/init/CHANGELOG.md)                |
| [@lerna-lite/publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish)                         | [![npm](https://img.shields.io/npm/v/@lerna-lite/publish.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/publish)                         | Publish packages in the current workspace                   | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/publish/CHANGELOG.md)             |
| [@lerna-lite/version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version)                         | [![npm](https://img.shields.io/npm/v/@lerna-lite/version.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/version)                         | Bump Version & write Changelogs                             | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/version/CHANGELOG.md)             |
| [@lerna-lite/exec](https://github.com/ghiscoding/lerna-lite/tree/main/packages/exec)                               | [![npm](https://img.shields.io/npm/v/@lerna-lite/exec.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/exec)                               | Execute shell command in current workspace                  | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/exec/CHANGELOG.md)                |
| [@lerna-lite/list](https://github.com/ghiscoding/lerna-lite/tree/main/packages/list)                               | [![npm](https://img.shields.io/npm/v/@lerna-lite/list.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/list)                               | List local packages                                         | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/list/CHANGELOG.md)                |
| [@lerna-lite/run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run)                                 | [![npm](https://img.shields.io/npm/v/@lerna-lite/run.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/run)                                 | Run npm scripts in current workspace                        | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/run/CHANGELOG.md)                 |
| [@lerna-lite/optional-cmd-common](https://github.com/ghiscoding/lerna-lite/tree/main/packages/optional-cmd-common) | [![npm](https://img.shields.io/npm/v/@lerna-lite/optional-cmd-common.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/optional-cmd-common) | Lerna-Lite common utils for optional commands Exec/List/Run | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/optional-cmd-common/CHANGELOG.md) |
