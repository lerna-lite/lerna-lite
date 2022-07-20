# Lerna-Lite 🐉

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PR](https://img.shields.io/badge/PR-Welcome-1abc9c)](https://github.com/ghiscoding/lerna-lite/pulls)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)

[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)
[![codecov](https://codecov.io/gh/ghiscoding/lerna-lite/branch/main/graph/badge.svg)](https://codecov.io/gh/ghiscoding/lerna-lite)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![NPM downloads](https://img.shields.io/npm/dm/@lerna-lite/cli.svg)](https://www.npmjs.com/package/@lerna-lite/cli)
[![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/cli)

## Lerna-Lite is a super light version of the original [Lerna](https://github.com/lerna/lerna)

- [About Lerna-Lite](#about-lerna-lite)
  - [Why create this lib/fork?](#why-create-this-libfork)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Migration for existing Lerna users](#migration-for-existing-lerna-users)
- [Project Demo - See it in Action](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo)
- [README Badge](#readme-badge)
- [`lerna.json` config file](https://github.com/ghiscoding/lerna-lite/wiki/lerna.json)
- [Contributions](#contributions)
- [Troubleshooting](https://github.com/ghiscoding/lerna-lite/wiki/Troubleshooting)
- Commands
  - included with CLI
    - 🛠️ [`init`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/init#readme) - creates a new Lerna-Lite repo (creates `lerna.json` and a workspace structure)
    - 💻 [`info`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/info#readme) - print local environment information (useful when opening new issue)
    - ☁️ [`publish`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish#readme) - publish every workspace packages that changed
    - 📑 [`version`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version#readme) - create new version for each workspace packages
  - optional commands (requires **separate install**, refer to the [installation](#installation) table shown below)
    - 🕜 [`changed`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/changed#readme) - list local packages that changed since last tagged release
    - 🌓 [`diff`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/diff#readme) - git diff all packages or a single package since the last release
    - 👷 [`exec`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/exec#readme) - execute shell command in each workspace package
    - 📖 [`list`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/list#readme) - list local packages
    - 🏃 [`run`](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run#readme) - run npm script in each workspace packages

---

## 📢 Lerna-Lite now supports pnpm/yarn `workspace:` protocol

Are you using this new feature? Please take 30sec. to fill in this 1 question [poll survey 🔘](https://github.com/ghiscoding/lerna-lite/discussions/156) to see which package manager is the most popular and how many of you are taking advantage of this new `workspace:` protocol. Thanks

Lerna-Lite itself is now also using [pnpm workspaces](https://pnpm.io/workspaces) with the `workspace:` protocol as well, woohoo 🎉

We strongly suggest the use of the new opt-in flag [--sync-workspace-lock](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version#--sync-workspace-lock) to automatically update your lock file 🔒

---

## License

[MIT License](LICENSE)

## About Lerna-Lite

Lerna-Lite differs from the original [Lerna](https://github.com/lerna/lerna) in the sense that it only has a limited subset of commands from Lerna which itself has 15 commands, while Lerna-Lite only includes half of them (and a few are optional). Lerna was originally built as an all-in-one tool, however nowadays Workspaces are available in all package managers and the need for an all-in-one tool which includes built-in workspaces functionalities is no longer necessary. Lerna-Lite is built around this new reality and its CLI only includes the minimum commands which are `init`, `info`, `publish` and `version`, while other commands are available (`exec`, `list`, `run`, ...) they are totally optional and you won't download them unless you choose to do so. In summary, Lerna-Lite is more modular than the original Lerna and with this small change, you'll end up with less dependencies to download and install, this also make it more versatile to use with other tools like Turborepo, pnpm and others...

As a summary, Lerna-Lite assumes, and requires to pre-setup a Workspace through your favorite package manager (npm, pnpm, yarn) that will take care of the symlinks (Lerna-Lite does **not include** the `bootstrap`, neither `link` commands hence the need for a workspace pre-setup), so make sure that your workspace is properly setup **before** installing Lerna-Lite.

For more info on how to setup a workspace, choose the best option for you: [Yarn classic](https://classic.yarnpkg.com/en/docs/workspaces) / [Yarn 2+](https://yarnpkg.com/features/workspaces) / [pnpm](https://pnpm.io/workspaces) / [npm 7+](https://docs.npmjs.com/cli/v8/using-npm/workspaces)

## Why create this lib/fork?

Mainly for the following reasons:

1. original Lerna repo was unmaintained for nearly 2 years (dependencies were out of date)
   - this is no longer true since Nrwl took over stewardship of Lerna, but the next few points are still valid
   - keep PRs in sync with original Lerna
2. desire to create a smaller lib that is more modular and smaller than the original Lerna
   - it's smaller since we only copied half of Lerna's commands and a few are totally optional.
   - we don't need all of Lerna's packages anymore since Workspaces are supported by all package managers.
   - the main starting goal of this fork was to keep only `version` and `publish` commands in the core and make everything else optional (install and use only what you really need).
3. rewrite the lib in TypeScript
4. replicate a few opened PRs (fixes and features) from Lerna and also add extra features in Lerna-Lite
   - for example we now support the `workspace:` protocol and some `dry-run` options

### This lib will help you with

#### [Version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version) and [Publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish) commands (included with the CLI)

- Automate the rolling of new Versions (`independent` or `fixed`) of all your workspace packages.
  - it will automatically Commit/Tag your new Version & create new GitHub/GitLab Release (when enabled).
- Automate the creation of Changelogs for all your packages by reading all [Conventional Commits](https://www.conventionalcommits.org/).
  - each package will get its own Changelog and a merged Changelog will also be created in the root.
- Automate the repository Publishing of your new version for all your packages (NPM or other platform).

#### Other useful, **but optional**, commands

- [Changed](https://github.com/ghiscoding/lerna-lite/tree/main/packages/changed#readme) command, when installed, will list all local packages that have changed since the last tagged release
- [Diff](https://github.com/ghiscoding/lerna-lite/tree/main/packages/diff#readme) command, when installed, will show git diff of all packages or a single package since the last release
- [Exec](https://github.com/ghiscoding/lerna-lite/tree/main/packages/exec#readme) command, when installed, will help you execute shell commands in parallel and in topological order.
- [List](https://github.com/ghiscoding/lerna-lite/tree/main/packages/list#readme) command, when installed, will list all workspace local packages
- [Run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run#readme) command, when installed, will help you run npm script in parallel and in topological order.

### README Badge

Using Lerna-Lite? Add a README badge to show it off: [![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)

```sh
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
```

## Getting Started

Let's start by installing Lerna as a dev dependency of your project and run the `init` command to get started (see [init#readme](https://github.com/ghiscoding/lerna-lite/tree/main/packages/init#readme) for all options).

```sh
$ mkdir lerna-repo
$ cd lerna-repo
$ npx lerna init # with pnpm

# for npm/yarn (only) workspaces add --use-workspaces
$ npx lerna init --use-workspaces
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

### CLI Installation

```sh
npm i @lerna-lite/cli -D -W
```

Minimum CLI install to get started with Lerna-Lite, that will give you access to the following list of commands:

| Command | Description |
| ------- | ----------- |
| 🛠️ [init](https://github.com/ghiscoding/lerna-lite/tree/main/packages/init#readme) | create/initialize a new Lerna-Lite repo |
| 💻 [info](https://github.com/ghiscoding/lerna-lite/tree/main/packages/info#readme) | print local environment information |
| 📑 [version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version#readme) | create new version for each workspace package |
| ☁️ [publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish#readme) | publish each workspace package |

**Note:** Lerna-Lite CLI is only including 4 commands by default (shown in previous table), all other commands are **optional commands** and must be installed separately as shown in the table below.

### Separate / Optional Installs

| Command | Install | Description |
| --------| --------| ----------- |
| 🕜 [changed](https://github.com/ghiscoding/lerna-lite/tree/main/packages/changed#readme) | `npm i @lerna-lite/changed -D -W` | list local packages changed since last release |
| 🌓 [diff](https://github.com/ghiscoding/lerna-lite/tree/main/packages/diff#readme)       | `npm i @lerna-lite/diff -D -W`    | git diff all packages since the last release   |
| 👷 [exec](https://github.com/ghiscoding/lerna-lite/tree/main/packages/exec#readme)       | `npm i @lerna-lite/exec -D -W`    | execute an command in each workspace package       |
| 📖 [list](https://github.com/ghiscoding/lerna-lite/tree/main/packages/list#readme)       | `npm i @lerna-lite/list -D -W`    | list local packages                            |
| 🏃 [run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run#readme)         | `npm i @lerna-lite/run -D -W`     | run npm script in each workspace package           |

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

### Migration for existing [Lerna](https://github.com/lerna/lerna) Users

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

3. optionally install `changed`, `diff`, `exec`, `list` and/or `run` commands (refer to [installation](#installation) table)

```sh
# install any of the optional commands (refer to installation table)
npm install @lerna-lite/run -D -W
```

## Project Demo?

You want to see a project demo? Sure, you're looking at it 😉

Yes indeed, this lib was originally created as an NPM Workspace and later changed to a [pnpm workspaces](https://pnpm.io/workspaces) for the sole purpose of demoing and testing its own code. All changelogs and published versions are created and published by the lib itself, how sweet is that? You will also find that Lerna-Lite project has its own [lerna.json](https://github.com/ghiscoding/lerna-lite/blob/main/lerna.json) config file to run properly (take a look to see how it works).

### See it in Action 🎦

You can see a small video of a new version release on this [Release Demo - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo) to demonstrate its usage. Confused with all these options? Perhaps taking a look at some of the references shown below might help you get started.

### Good Lerna Tutorials / References

- [Release Demo - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Release-Demo) - Lerna-Lite demo (animated gif)
- [How to Use Lerna](https://www.youtube.com/watch?v=p6qoJ4apCjA) - YouTube video
- [Lerna Release Workflow](https://github.com/curiousNoob/lerna-release-workflow) - GitHub Template

## Contributions

Feel free to contribute any Pull Request, PRs are very welcome. 👷👷‍♀️

Also please note that I'm just a simple developer & user of this lib, the same as you are, my knowledge of the library is also probably similar to yours but together we can make it better (and lighter).

### Development / Contributions

If you wish to contribute to the project, please follow these steps:

**Note**: this project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by following their [installation](https://pnpm.io/installation) or simply run `npx pnpm` to run any of the pnpm scripts shown below:

1. clone the lib:
   - `git clone https://github.com/ghiscoding/lerna-lite`
2. install with **pnpm**:
   - `pnpm install` OR `npx pnpm install`
3. run a full TypeScript (TSC) build
   - `pnpm build` OR `npx pnpm build`
4. add/run Jest unit tests (make sure to run the previous steps first):
   - `pnpm jest` (full test coverage)
   - `pnpm jest:watch` (watch mode)
5. you can also troubleshoot/debug via the VSCode debugger launch configs that were setup for each command

## Troubleshooting

If you have problems running the lib and your problems are related to Git commands that were executed, then we suggest to first try with the `--git-dry-run` (or `--cmd-dry-run`) option to see if it helps in finding the error(s) you may have. Another great, and possibly much more useful suggestion, is to search in the original Lerna [issues](https://github.com/lerna/lerna/issues) list and see if any solution could help you (remember that Lerna-Lite is a fork of the original code from Lerna and it works the same way). Lastly, if that is not enough and you wish to troubleshoot yourself, then read this [Troubleshooting - Wiki](https://github.com/ghiscoding/lerna-lite/wiki/Troubleshooting) to possibly troubleshoot yourself in your own environment.

## Lerna-Lite Full List of Packages

| Package Name | Version | Description | Changes |
| ------------ | ------- | ----------- | ------- |
| [@lerna-lite/cli](https://github.com/ghiscoding/lerna-lite/tree/main/packages/cli) | [![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/cli) | Lerna-Lite Init/Info/Version/Publish comands CLI | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/cli/CHANGELOG.md) |
| [@lerna-lite/core](https://github.com/ghiscoding/lerna-lite/tree/main/packages/core) | [![npm](https://img.shields.io/npm/v/@lerna-lite/core.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/core) | Lerna-Lite core & shared methods (internal use) | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/core/CHANGELOG.md) |
| [@lerna-lite/info](https://github.com/ghiscoding/lerna-lite/tree/main/packages/info) | [![npm](https://img.shields.io/npm/v/@lerna-lite/info.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/info) | Print local environment information | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/info/CHANGELOG.md) |
| [@lerna-lite/init](https://github.com/ghiscoding/lerna-lite/tree/main/packages/init) | [![npm](https://img.shields.io/npm/v/@lerna-lite/init.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/init) | create a new Lerna-Lite repo | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/init/CHANGELOG.md) |
| [@lerna-lite/publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish) | [![npm](https://img.shields.io/npm/v/@lerna-lite/publish.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/publish) | Publish packages in the current workspace | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/publish/CHANGELOG.md)             |
| [@lerna-lite/version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version) | [![npm](https://img.shields.io/npm/v/@lerna-lite/version.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/version) | Bump Version & write Changelogs | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/version/CHANGELOG.md) |
| [@lerna-lite/exec](https://github.com/ghiscoding/lerna-lite/tree/main/packages/exec) | [![npm](https://img.shields.io/npm/v/@lerna-lite/exec.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/exec) | Execute shell command in current workspace   | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/exec/CHANGELOG.md) |
| [@lerna-lite/changed](https://github.com/ghiscoding/lerna-lite/tree/main/packages/changed) | [![npm](https://img.shields.io/npm/v/@lerna-lite/changed.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/changed) | List local packages that changed since last release | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/changed/CHANGELOG.md) |
| [@lerna-lite/diff](https://github.com/ghiscoding/lerna-lite/tree/main/packages/diff) | [![npm](https://img.shields.io/npm/v/@lerna-lite/diff.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/diff) | Diff all packages or a single package since last release| [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/diff/CHANGELOG.md) |
| [@lerna-lite/list](https://github.com/ghiscoding/lerna-lite/tree/main/packages/list) | [![npm](https://img.shields.io/npm/v/@lerna-lite/list.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/list) | List local packages | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/list/CHANGELOG.md) |
| [@lerna-lite/listable](https://github.com/ghiscoding/lerna-lite/tree/main/packages/listable) | [![npm](https://img.shields.io/npm/v/@lerna-lite/listable.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/listable) | Listable utils used by `list` and `changed` commands (internal use) | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/listable/CHANGELOG.md) |
| [@lerna-lite/run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) | [![npm](https://img.shields.io/npm/v/@lerna-lite/run.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/run) | Run npm scripts in current workspace | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/run/CHANGELOG.md) |
| [@lerna-lite/optional-cmd-common](https://github.com/ghiscoding/lerna-lite/tree/main/packages/optional-cmd-common) | [![npm](https://img.shields.io/npm/v/@lerna-lite/optional-cmd-common.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/optional-cmd-common) | Lerna-Lite common utils for optional commands Exec/List/Run (internal use) | [changelog](https://github.com/ghiscoding/lerna-lite/blob/main/packages/optional-cmd-common/CHANGELOG.md) |
