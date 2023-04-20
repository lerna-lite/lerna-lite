# Lerna-Lite 🐉

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Conventional Changelog](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-conventional--changelog-e10079.svg?style=flat)](https://github.com/conventional-changelog/conventional-changelog)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/lerna-lite/lerna-lite)

[![Actions Status](https://github.com/lerna-lite/lerna-lite/workflows/CI/badge.svg)](https://github.com/lerna-lite/lerna-lite/actions)
[![codecov](https://codecov.io/gh/lerna-lite/lerna-lite/branch/main/graph/badge.svg)](https://codecov.io/gh/lerna-lite/lerna-lite)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-fcc72b.svg?logo=vitest)](https://vitest.dev/)
[![NPM downloads](https://img.shields.io/npm/dm/@lerna-lite/cli)](https://www.npmjs.com/package/@lerna-lite/cli)
[![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/cli)

## Lerna-Lite is a super light version of the original [Lerna](https://github.com/lerna/lerna)

- [About Lerna-Lite](#about-lerna-lite)
  - [Why create this lib/fork?](#why-create-this-libfork)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [JSON Schema](#json-schema)
  - [Migration for existing Lerna users](#migration-for-existing-lerna-users)
- [Project Demo - See it in Action](https://github.com/lerna-lite/lerna-lite/wiki/Release-Demo)
- [README Badge](#readme-badge)
- [`lerna.json` config file](https://github.com/lerna-lite/lerna-lite/wiki/lerna.json)
- [Contributions](#contributions)
- [Troubleshooting](https://github.com/lerna-lite/lerna-lite/wiki/Troubleshooting)
- Available Commands, they are **all optional**, refer to the **[Installation table](#separate--optional-installs)** shown below
  - 🛠️ [`init`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init#readme) - creates a new Lerna-Lite workspace structure and adds `lerna.json`
     - _the only command included with the CLI is `init`_
  - 📑 [`version`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#readme) - create new version for each workspace packages
  - ☁️ [`publish`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish#readme) - publish every workspace packages that changed
  - 🕜 [`changed`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/changed#readme) - list local packages that changed since last tagged release
  - 🌓 [`diff`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/diff#readme) - git diff all packages or a single package since the last release
  - 👷 [`exec`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/exec#readme) - execute shell command in each workspace package
  - 📖 [`list`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#readme) - list local packages
  - 🏃 [`run`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run#readme) - run npm script, in topological order, in each workspace package
  - 👓 [`watch`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch#readme) - watch for changes within packages and execute commands

---

## 📢 Lerna-Lite has a new [`lerna watch`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch#readme) command

Watch for file changes within packages and execute commands from the root of the repository. This solves a common problem for package-based monorepos, which is to trigger rebuilds of packages when their files changed. Head over to the [`lerna watch`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch#readme) documentation for more details.

## 📢 Lerna-Lite now supports pnpm/yarn `workspace:` protocol

Take 30sec. to complete this 1 question [poll survey 🔘](https://github.com/lerna-lite/lerna-lite/discussions/156) if you are using this feature. It's a simple poll to find out which package manager is the most popular with this new `workspace:` protocol feature. Thanks

Lerna-Lite itself is now also using [pnpm workspaces](https://pnpm.io/workspaces) with the `workspace:` protocol as well  🎉

---

## Who is using Lerna-Lite

Here are some of the largest projects using the Lerna-Lite fork

<a href="https://github.com/facebook/jest">
  <img src="https://jestjs.io/img/jest.png" width="25" height="25">
  Jest
</a>&nbsp; | &nbsp;
<a href="https://github.com/react-navigation/react-navigation">
  <img src="https://avatars.githubusercontent.com/u/29647600?s=64&v=4" width="25" height="25">
  React Navigation
</a>&nbsp; | &nbsp;
<a href="https://github.com/formatjs/formatjs">
  <img src="https://formatjs.io/img/logo.svg" width="25" height="25">
  Format.JS
</a>&nbsp; | &nbsp;
<a href="https://github.com/johnsoncodehk/volar">
  <img src="https://vue.gallerycdn.vsassets.io/extensions/vue/volar/1.3.16/1681622004073/Microsoft.VisualStudio.Services.Icons.Default" width="25" height="25">
  Volar
</a>&nbsp; | &nbsp;
<a href="https://github.com/standardnotes/app">
  <img src="https://avatars.githubusercontent.com/u/24537496?s=200&amp;v=4" width="25" height="25">
  Standard Notes
</a>

## License

[MIT License](LICENSE)

## About Lerna-Lite

Lerna-Lite differs from the original [Lerna](https://github.com/lerna/lerna) since it only has a limited subset of Lerna's list of commands (which itself has 15 commands), while Lerna-Lite only includes half of them and all commands are optional. Lerna was originally built as an all-in-one tool, however nowadays Workspaces are available in all package managers and the need for an all-in-one tool, which includes built-in workspaces functionalities, is no longer needed. Lerna-Lite is built around this new reality and only provides commands that package managers do not include. To summarize, Lerna-Lite is more modular than the original Lerna and you'll end up installing a lot less dependencies, this also makes it more versatile to use with other tools like Turborepo, pnpm and others...

Lerna-Lite assumes, and requires you to pre-setup your Workspace through your favorite package manager (npm, pnpm, yarn) that will take care of the symlinks (Lerna-Lite does **not include** the `bootstrap`, `add`, `create` and `link` commands hence the need for a workspace pre-setup), so make sure that your workspace is properly setup **before** adding Lerna-Lite.

For more info on how to setup a workspace, choose the best option for you: [npm 7+](https://docs.npmjs.com/cli/v8/using-npm/workspaces) / [Yarn classic](https://classic.yarnpkg.com/en/docs/workspaces) / [Yarn 2+](https://yarnpkg.com/features/workspaces) / [pnpm](https://pnpm.io/workspaces)

## Why create this lib/fork?

Below are the main reasons as to why this fork was created:

1. Lerna repo was unmaintained for nearly 2 years (in early 2022, dependencies were really out of date)
    - this is no longer the case since Nrwl, the company behind Nx, took over stewardship of Lerna
        - please note that Lerna-Lite fork was created couple months **before** Nrwl took over Lerna
        - since then we try to replicate Lerna's PRs into Lerna-Lite when possible
2. Desire to create a smaller and more modular project that is lighter than the original all-in-one Lerna
    - Lerna-Lite is now entirely modular, all commands are optional (install only what you use)
3. Rewrite the lib in TypeScript and build the project as ESM only (you can still use it in a CommonJS environment)
4. Replicate a few opened PRs from Lerna and add a few extra features into Lerna-Lite (see below)
5. Lerna is becoming another Nx product (Lerna >=5.5 now requires **[Nx](https://nx.dev/)** while it's not required in Lerna-Lite)
   - if you use Nx then it's probably better to use Lerna, but if you are not then Lerna-Lite is preferred
6. Lastly a few extra features were added, and only exist, into Lerna-Lite:
   - [`workspace:` protocol support](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#workspace-protocol) (Lerna added support for it six months later in v6)
   - [--dry-run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--dry-run) to preview version/publish
changes and changelogs
   - [lerna version --changelog-header-message "msg"](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--changelog-header-message-msg) it could be used to add sponsor badges in changelogs
   - [lerna version --changelog-include-commits-client-login](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--changelog-include-commits-client-login-msg) to add PR contributors
   - [lerna version --allow-peer-dependencies-update](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--allow-peer-dependencies-update) if you want your peer deps to also be updated
   - [lerna version --skip-bump-only-release](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--skip-bump-only-release) to avoid cluttering your GitHub releases in `independent` mode
   - [lerna publish --remove-package-fields](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish#--remove-package-fields-fields) (empty certain fields from `package.json` before publishing, ie: Lerna-Lite uses it to remove `scripts` and `devDependencies`)

On a final note, the best feature of Lerna-Lite (versus Lerna) has to be its modularity. A large portion of the users are only interested in version/publish commands but on the other hand, a small minority are only interested in run/exec commands. Lerna-Lite offers you that flexibility by allowing you to install only the commands you choose to use (see [installation](#cli-installation) below).

### This lib will help you with

> **Note** all commands are optional in Lerna-Lite, refer to the [Installation table](#separate--optional-installs) for more info

#### [Version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version) and [Publish](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish) commands

- Automate the creation of new Versions (`independent` or fixed version) of all your workspace packages.
  - it will automatically Commit/Tag your new Version & create new GitHub/GitLab Release (when enabled).
- Automate, when enabled, the creation of Changelogs for all your packages by reading all [Conventional Commits](https://www.conventionalcommits.org/).
- Automate, the repository Publishing of your new version(s) for all your packages (on NPM or other platforms).

#### Other optional commands

- [Changed](https://github.com/lerna-lite/lerna-lite/tree/main/packages/changed#readme) command, when installed, will list all local packages that have changed since the last tagged release
- [Diff](https://github.com/lerna-lite/lerna-lite/tree/main/packages/diff#readme) command, when installed, will show git diff of all packages or a single package since the last release
- [Exec](https://github.com/lerna-lite/lerna-lite/tree/main/packages/exec#readme) command, when installed, will help you execute shell commands in parallel and in topological order.
- [List](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#readme) command, when installed, will list all workspace local packages
- [Run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run#readme) command, when installed, will help you run npm script in parallel and in topological order.
- [Watch](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch#readme) command, when installed, will watch for changes within all packages and execute certain commands

### README Badge

[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/lerna-lite/lerna-lite)

```sh
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/lerna-lite/lerna-lite)
```

## Getting Started

Let's start by installing the Lerna-Lite CLI as a dev dependency to your project and then run the `init` command to get started (see [init#readme](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init#readme) for all options). Note that the CLI must be installed at all time and then other commands must be installed separately (the CLI only includes the `init` command), refer to the **[Installation table](#separate--optional-installs)** for more info.

```sh
# install Lerna-Lite CLI locally or globally (only includes `init` command)
$ npm install -g @lerna-lite/cli # pnpm add -g @lerna-lite/cli

# create your monorepo and initialize lerna-lite
$ mkdir lerna-repo
$ cd lerna-repo
$ lerna init

# for npm/yarn (only) workspaces add --use-workspaces
$ lerna init --use-workspaces
```

This will create a `lerna.json` configuration file as well as a `packages` folder, so your folder should now look like this:

```
lerna-repo/
  packages/
    package-a
  package.json
  lerna.json
```

Note that `package-a` will not be created, it is only shown here to help clarify the structure. For more info and full details about the `lerna.json` file, you can read the [lerna.json](https://github.com/lerna-lite/lerna-lite/wiki/lerna.json) Wiki.

Finally install the commands that are of interest to you (`publish`, `version`, `run`, `exec`, ...)
```sh
$ npm i @lerna-lite/publish -D -W
```

## Installation

> Lerna-Lite is entirely modular, as opposed to Lerna, and installing the CLI locally or globally will only provide you the `init` command. Please make sure to install that are of interest (see table below).

If you are new to Lerna-Lite, you could also run the [lerna init](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init#readme) command which will create the `lerna.json` for you with a minimal setup. If you are using a different client other than npm, then make sure to update the `npmClient` property in `lerna.json` (for example: `"npmClient": "yarn"` or `"pnpm"`).

> **Note** please make sure that you have a `lerna.json` config file created and a `version` property defined with either a fixed or `independent` mode. An error will be thrown if you're missing any of them.

### JSON Schema
You can add the `$schema` property into your `lerna.json` to take advantage of Lerna-Lite [JSON Schema](https://json-schema.org/) (`lerna init` will automatically configure this for you). This will help with the developer experience, users will be able to see what properties are valid with their types and a brief description of what they do (each description are pulled from their associated lerna command options documentation).

##### `lerna.json`
```js
{
  "$schema": "node_modules/@lerna-lite/cli/schemas/lerna-schema.json",
  // ...
}
```

or from a CDN

```js
{
  "$schema": "https://raw.githubusercontent.com/lerna-lite/lerna-lite/main/packages/cli/schemas/lerna-schema.json",
}
```

### Separate / Optional Installs

| Command | Install | Description |
| --------| --------| ----------- |
| ☁️ [publish](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish#readme) | `npm i @lerna-lite/publish -D -W` | publish each workspace package |
| 📑 [version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#readme) | `npm i @lerna-lite/version -D -W` | create new version for each workspace package |
| 🕜 [changed](https://github.com/lerna-lite/lerna-lite/tree/main/packages/changed#readme) | `npm i @lerna-lite/changed -D -W` | list local packages changed since last release |
| 🌓 [diff](https://github.com/lerna-lite/lerna-lite/tree/main/packages/diff#readme)       | `npm i @lerna-lite/diff -D -W`    | git diff all packages since the last release   |
| 👷 [exec](https://github.com/lerna-lite/lerna-lite/tree/main/packages/exec#readme)       | `npm i @lerna-lite/exec -D -W`    | execute an command in each workspace package       |
| 📖 [list](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#readme)       | `npm i @lerna-lite/list -D -W`    | list local packages                            |
| 🏃 [run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run#readme)         | `npm i @lerna-lite/run -D -W`      | run npm script in each workspace package           |
| 👓 [watch](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch#readme)     | `npm i @lerna-lite/watch -D -W`    | watch for changes & execute commands when fired |

> **Note** since the `publish` package depends on the `version` package, you could simply install `@lerna-lite/publish` to automatically give you access to the `version` command.

### Usage

Add custom NPM Scripts or simply run the commands in your shell with the Lerna-Lite CLI, you can see some very basic script samples below.

```js
// package.json / npm scripts
"scripts": {
  "new-version": "lerna version",
  "new-publish": "lerna publish from-package",
  "run-tests": "lerna run test",        // optional `run` command
}
```

### Migration for existing [Lerna](https://github.com/lerna/lerna) Users

If you are migrating from Lerna, it should be fairly easy to just replace Lerna with Lerna-Lite in your dependencies and install necessary commands and that's about it. The CLI commands and options are the same, but all commands are optional installs, take a look at the quick steps shown below:

1. remove Lerna from your local & global dependencies

```sh
npm uninstall lerna -W   # OR yarn remove lerna -W
npm uninstall -g lerna   # OR yarn global remove lerna
```

2. install Lerna-Lite CLI which will provide you the `init` command (only)

```sh
# Lerna CLI (includes `init`)
npm install @lerna-lite/cli -D -W
```

3. finally install the Lerna-Lite command(s) that you wish to use (`changed`, `diff`, `exec`, `list`, `run`, `publish`, `version` and/or `watch`)
_refer to [installation](#installation) table above_

```sh
# install any of the optional commands (refer to installation table)
npm install @lerna-lite/publish -D -W
```
> **Note** you might see a lot of diff changes across your `changelog.md` files after switching to Lerna-Lite and that is totally expected since Lerna-Lite has code in place to remove empty lines that were added by Lerna for no real reason.

## Project Demo?

You want to see a project demo? Sure... you're looking at it 😉

Yes indeed, this project was originally created as an NPM Workspace and later migrated to a [pnpm workspaces](https://pnpm.io/workspaces) for the sole purpose of demoing and testing its own code. All changelogs and versions are created and published by the lib itself, how sweet is that? You can also see that Lerna-Lite project has its own [`lerna.json`](https://github.com/lerna-lite/lerna-lite/blob/main/lerna.json) config file as well to run properly (take a look to see how it works).

### See it in Action 🎦

You can see a small video of a new version release on this [Release Demo - Wiki](https://github.com/lerna-lite/lerna-lite/wiki/Release-Demo) to demonstrate its usage. Confused with all these options? Perhaps taking a look at some of the references shown below might help you get started.

### Good Lerna Tutorials / References

- [Release Demo - Wiki](https://github.com/lerna-lite/lerna-lite/wiki/Release-Demo) - Lerna-Lite demo (animated gif)
- [How to Use Lerna](https://www.youtube.com/watch?v=p6qoJ4apCjA) - YouTube video
- [Lerna Release Workflow](https://github.com/curiousNoob/lerna-release-workflow) - GitHub Template

## Contributions

[![PR](https://img.shields.io/badge/PR-Welcome-1abc9c)](https://github.com/lerna-lite/lerna-lite/pulls)

Feel free to contribute any Pull Request. Also please note that I'm just a simple developer & user of this lib, the same as you are, my knowledge of the library is also limited in some areas of the project, but together we can make it better.

### Development / Contributions

If you wish to contribute to the project, please follow these steps:

**Note**: this project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by following their [installation](https://pnpm.io/installation) or simply run `npx pnpm` to run any of the pnpm scripts shown below:

1. clone the lib:
   - `git clone https://github.com/lerna-lite/lerna-lite`
2. install with **pnpm** from the root:
   - `pnpm install` OR `npx pnpm install`
3. run a full TypeScript (TSC) build
   - `pnpm build` OR `npx pnpm build`
4. add/run Vitest unit tests (make sure to run the previous steps first):
   - `pnpm test` (watch mode)
   - `pnpm test:coverage` (full test coverage)
5. you can also troubleshoot/debug via the VSCode debugger launch configs that were setup for each command

## Troubleshooting

If you have problems running the lib and your problems are related to Git commands that were executed, then we suggest to first try with the `--dry-run` option to see if it helps in finding the error(s) you may have. Another great, and possibly much more useful suggestion, is to search in the original Lerna [issues](https://github.com/lerna/lerna/issues) list and see if any solution could help you (remember that Lerna-Lite is a fork of the original code from Lerna and it works the same way). Lastly, if that is not enough and you wish to troubleshoot yourself, then read this [Troubleshooting - Wiki](https://github.com/lerna-lite/lerna-lite/wiki/Troubleshooting) to possibly troubleshoot yourself the execution in your own environment.

## Lerna-Lite Full List of Packages

| Package Name | Version | Description | Changes |
| ------------ | ------- | ----------- | ------- |
| [@lerna-lite/cli](https://github.com/lerna-lite/lerna-lite/tree/main/packages/cli) | [![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg)](https://www.npmjs.com/package/@lerna-lite/cli) | Lerna-Lite CLI required to execute any command | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/cli/CHANGELOG.md) |
| [@lerna-lite/core](https://github.com/lerna-lite/lerna-lite/tree/main/packages/core) | [![npm](https://img.shields.io/npm/v/@lerna-lite/core.svg)](https://www.npmjs.com/package/@lerna-lite/core) | Lerna-Lite core & shared methods (internal use) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/core/CHANGELOG.md) |
| [@lerna-lite/init](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init) | [![npm](https://img.shields.io/npm/v/@lerna-lite/init.svg)](https://www.npmjs.com/package/@lerna-lite/init) | Setup your monorepo to use Lerna-Lite | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/init/CHANGELOG.md) |
| [@lerna-lite/publish](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish) | [![npm](https://img.shields.io/npm/v/@lerna-lite/publish.svg)](https://www.npmjs.com/package/@lerna-lite/publish) | Publish packages in the current workspace | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/publish/CHANGELOG.md)             |
| [@lerna-lite/version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version) | [![npm](https://img.shields.io/npm/v/@lerna-lite/version.svg)](https://www.npmjs.com/package/@lerna-lite/version) | Bump Version & write Changelogs | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/version/CHANGELOG.md) |
| [@lerna-lite/exec](https://github.com/lerna-lite/lerna-lite/tree/main/packages/exec) | [![npm](https://img.shields.io/npm/v/@lerna-lite/exec.svg)](https://www.npmjs.com/package/@lerna-lite/exec) | Execute shell command in current workspace   | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/exec/CHANGELOG.md) |
| [@lerna-lite/changed](https://github.com/lerna-lite/lerna-lite/tree/main/packages/changed) | [![npm](https://img.shields.io/npm/v/@lerna-lite/changed.svg)](https://www.npmjs.com/package/@lerna-lite/changed) | List local packages that changed since last release | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/changed/CHANGELOG.md) |
| [@lerna-lite/diff](https://github.com/lerna-lite/lerna-lite/tree/main/packages/diff) | [![npm](https://img.shields.io/npm/v/@lerna-lite/diff.svg)](https://www.npmjs.com/package/@lerna-lite/diff) | Diff all packages or a single package since last release| [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/diff/CHANGELOG.md) |
| [@lerna-lite/list](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list) | [![npm](https://img.shields.io/npm/v/@lerna-lite/list.svg)](https://www.npmjs.com/package/@lerna-lite/list) | List local packages | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/list/CHANGELOG.md) |
| [@lerna-lite/listable](https://github.com/lerna-lite/lerna-lite/tree/main/packages/listable) | [![npm](https://img.shields.io/npm/v/@lerna-lite/listable.svg)](https://www.npmjs.com/package/@lerna-lite/listable) | Listable utils used by `list` and `changed` commands (internal use) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/listable/CHANGELOG.md) |
| [@lerna-lite/filter-packages](https://github.com/lerna-lite/lerna-lite/tree/main/packages/filter-packages) | [![npm](https://img.shields.io/npm/v/@lerna-lite/filter-packages.svg)](https://www.npmjs.com/package/@lerna-lite/filter-packages) | Lerna-Lite filtering package utils used by optional commands (internal use) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/filter-packages/CHANGELOG.md) |
| [@lerna-lite/profiler](https://github.com/lerna-lite/lerna-lite/tree/main/packages/profiler) | [![npm](https://img.shields.io/npm/v/@lerna-lite/profiler.svg)](https://www.npmjs.com/package/@lerna-lite/profiler) | Lerna-Lite Profiler used by some optional commands (internal use) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/profiler/CHANGELOG.md) |
| [@lerna-lite/run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run) | [![npm](https://img.shields.io/npm/v/@lerna-lite/run.svg)](https://www.npmjs.com/package/@lerna-lite/run) | Run npm scripts in current workspace | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/run/CHANGELOG.md) |
| [@lerna-lite/watch](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch) | [![npm](https://img.shields.io/npm/v/@lerna-lite/watch.svg)](https://www.npmjs.com/package/@lerna-lite/watch) | Watch for changes within packages and execute commands | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/watch/CHANGELOG.md) |
