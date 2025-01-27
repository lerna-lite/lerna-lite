# Lerna-Lite <img class="avatar" src="https://avatars.githubusercontent.com/u/120162016?s=96&amp;v=4" alt="@lerna-lite" height="55" width="55">


<p>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
<a href="http://www.typescriptlang.org/"><img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" alt="TypeScript" /></a>
<a href="https://github.com/conventional-changelog/conventional-changelog"><img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-conventional--changelog-e10079.svg?style=flat" alt="Conventional Changelog" /></a>
<a href="https://github.com/lerna-lite/lerna-lite"><img src="https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff" alt="Maintained with Lerna-Lite" /></a>
<a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/@lerna-lite/cli.svg" alt="Node" /></a>
</P>

<p>
<a href="https://github.com/lerna-lite/lerna-lite/actions"><img src="https://github.com/lerna-lite/lerna-lite/workflows/CI/badge.svg" alt="Actions Status" /></a>
<a href="https://codecov.io/gh/lerna-lite/lerna-lite"><img src="https://codecov.io/gh/lerna-lite/lerna-lite/branch/main/graph/badge.svg" alt="codecov" /></a>
<a href="https://vitest.dev/"><img src="https://img.shields.io/badge/tested%20with-vitest-fcc72b.svg?logo=vitest" alt="Vitest" /></a>
<a href="https://www.npmjs.com/package/@lerna-lite/cli"><img src="https://img.shields.io/npm/dm/@lerna-lite/cli" alt="NPM downloads" /></a>
<a href="https://www.npmjs.com/package/@lerna-lite/cli"><img src="https://img.shields.io/npm/v/@lerna-lite/cli.svg?logo=npm&logoColor=fff&label=npm" alt="npm" /></a>
</P>

## Lerna-Lite is a super light version of the original [Lerna](https://github.com/lerna/lerna)

- [About Lerna-Lite](#about-lerna-lite)
  - [Why create this lib/fork?](#why-create-this-libfork)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Installation](#installation)
  - [JSON Schema](#json-schema)
  - [Migration for existing Lerna users](#migration-for-existing-lerna-users)
- [Project Demo - See it in Action](https://github.com/lerna-lite/lerna-lite/wiki/Release-Demo)
- [README Badge](#readme-badge)
- [`lerna.json` config file](https://github.com/lerna-lite/lerna-lite/wiki/lerna.json)
- [Contributions](#contributions)
- [Troubleshooting](https://github.com/lerna-lite/lerna-lite/wiki/Troubleshooting)
- **Available Commands** (they are **all optional**, refer to the **[Installation table](#separate--optional-installs)** shown below)
  - _click on any of the command link below to see dedicated documentation and available options_
  - 🛠️ [`init`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init#readme) - creates a new Lerna-Lite workspace structure and adds `lerna.json`
     - _this is the only command (`init`) included with the CLI_  
  - 🕜 [`changed`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/changed#readme) - list local packages that changed since last tagged release
  - 🌓 [`diff`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/diff#readme) - git diff all packages or a single package since the last release
  - 👷 [`exec`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/exec#readme) - execute shell command in each workspace package
  - 📖 [`list`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#readme) - list local packages
  - ☁️ [`publish`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish#readme) - publish every workspace packages that changed
  - 📑 [`version`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#readme) - create new version for each workspace packages
  - 🏃 [`run`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run#readme) - run npm script, in topological order, in each workspace package
  - 👓 [`watch`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch#readme) - watch for changes within packages and execute commands

---

## 📢 Lerna-Lite supports pnpm/yarn `workspace:` protocol and pnpm `catalog:` protocol

Take 30sec. to complete this 1 question [poll survey 🔘](https://github.com/lerna-lite/lerna-lite/discussions/156) if you are using this feature. It's a simple poll to find out which package manager is the most popular with `workspace:` protocol feature (so far, about 60% pnpm and 40% yarn).

Lerna-Lite itself is also using [pnpm workspaces](https://pnpm.io/workspaces) with the `workspace:` protocol 🎉

---

## Who is using Lerna-Lite

Here are some of the largest projects using Lerna-Lite

<a href="https://github.com/facebook/jest">
  <img src="https://jestjs.io/img/jest.png" width="25" height="25">
  Jest
</a>&nbsp; | &nbsp;
<a href="https://github.com/react-navigation/react-navigation">
  <img src="https://avatars.githubusercontent.com/u/29647600?s=64&v=4" width="25" height="25">
  React Navigation
</a>&nbsp; | &nbsp;
<a href="https://github.com/formatjs/formatjs">
  <img src="https://avatars.githubusercontent.com/u/50559490" width="25" height="25">
  Format.JS
</a>&nbsp; | &nbsp;
<a href="https://github.com/johnsoncodehk/volar">
  <img src="https://raw.githubusercontent.com/johnsoncodehk/sponsors/master/logos/Vue.svg" width="25" height="25">
  Volar
</a>&nbsp; | &nbsp;
<a href="https://github.com/palantir/blueprint">
  <img src="https://avatars.githubusercontent.com/u/303157?s=48&v=4" width="25" height="25">
  Blueprint
</a>&nbsp; | &nbsp;
<a href="https://github.com/nativescript-community" title="NativeScript Community">
  <img src="https://avatars.githubusercontent.com/u/50633791?s=200&v=4" width="25" height="25">
   NativeScript
</a>

## License

[MIT License](LICENSE)

## About Lerna-Lite

Lerna-Lite differs from the original [Lerna](https://github.com/lerna/lerna) since it only has a limited subset of its original commands (which itself has 15 commands) and they are **all optional** in Lerna-Lite making its install footprint a lot smaller. Lerna was originally built as an all-in-one tool, however nowadays Workspaces are available in all package managers and the need for an all-in-one tool, which includes built-in workspaces functionalities (like `bootstrap`), is no longer needed. Lerna-Lite is built around this new reality and is only providing commands that package managers do not include. To summarize, Lerna-Lite is more modular than the original Lerna and you'll end up installing a lot less dependencies while also making it more versatile to use with other tools like TurboRepo, pnpm and others...

Lerna-Lite assumes, and requires you to pre-setup your Workspace through your favorite package manager (npm, pnpm, yarn) that will take care of the symlinks. Lerna-Lite does **not include** the `bootstrap`, `add`, `create` neither `link` commands hence the need for you to properly setup your workspace prior to installing Lerna-Lite.

According to your needs, choose the best option to setup a workspace: [npm 7+](https://docs.npmjs.com/cli/v8/using-npm/workspaces) | [Yarn classic](https://classic.yarnpkg.com/en/docs/workspaces) | [Yarn 2+](https://yarnpkg.com/features/workspaces) | [pnpm](https://pnpm.io/workspaces)

## Why create this lib/fork?

Below are the main reasons as to why this fork was created:

1. Lerna's repo was unmaintained for nearly 2 years (in early 2022, Lerna's dependencies were really out of date)
    - Lerna is now maintained again since Nrwl, the company behind Nx, took over stewardship of Lerna
        - please note that Lerna-Lite fork was created couple months **before** Nrwl took over Lerna
        - we also replicate Lerna's PRs whenever possible (except for `Nx` specific changes which are skipped)
2. A desire to create a smaller and lighter alternative compared to the original all-in-one Lerna tool
    - Lerna-Lite is entirely modular, all commands are totally optional (install only what you really need).
3. The project was rewritten in TypeScript and also built as ESM only since v2.0 (you can still use it in a CJS environment)
4. Newer Lerna versions v5.5+ are now requiring and installing **[Nx](https://nx.dev/)**, however not the case in Lerna-Lite
   - note, if you already use `Nx` then it's probably better to use Lerna, otherwise Lerna-Lite is the real alternative
   - if you use other tools like TurboRepo and install the original Lerna, you end up with 2 similar tools (not good)
5. Lerna-Lite added a few unique features (not available in Lerna itself):
   - [`workspace:` protocol support](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#workspace-protocol)
     * _Lerna added support for the same feature 6 months later in their v6.0 release_
   - [--dry-run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--dry-run) to preview version/publish & changelogs locally (will show git changes without committing them)
   - [lerna version --changelog-header-message "msg"](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--changelog-header-message-msg) for showing banner or sponsors in your changelogs
   - [lerna version --changelog-include-commits-client-login](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--changelog-include-commits-client-login-msg) to add PR contributors in GitHub releases
   - [lerna version --allow-peer-dependencies-update](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--allow-peer-dependencies-update) to also updated your peer dependencies
   - [lerna version --skip-bump-only-releases](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--skip-bump-only-releases) to avoid cluttering your GitHub releases with `independent` mode
   - [lerna version --sync-workspace-lock](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--sync-workspace-lock) to sync lock file before publishing (not needed w/`workspace:` protocol)
   - [lerna publish --remove-package-fields](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish#--remove-package-fields-fields) (remove certain fields from `package.json` before publishing)
      - ie: Lerna-Lite itself uses it to remove `scripts` and `devDependencies`

On a final note, the best feature of Lerna-Lite (versus Lerna) has to be its modularity. A large portion of the users are only interested in version/publish commands but on the other hand, a small minority are only interested in other commands like `lerna run`/`exec`. Lerna-Lite offers this kind of flexibility by allowing the user to choose what to install (see [installation](#cli-installation) below) which help to keep your download to the bare minimum.

### Lerna-Lite will help you with the following:

> **Note** all commands are optional in Lerna-Lite, refer to the [Installation table](#separate--optional-installs) for more info

#### [Version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version) and [Publish](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish) commands

- Automate the creation of new Versions (`independent` or fixed version) of all your workspace packages.
  - it will automatically Commit/Tag your new Version & create new GitHub/GitLab Release (when enabled).
- Automate, when enabled, the creation of Changelogs for all your packages by reading your [Conventional Commits](https://www.conventionalcommits.org/).
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

Let's start by installing Lerna-Lite CLI as a dev dependency to your project and then run the `init` command to get started (see [init#readme](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init#readme) for all options). Note that the CLI must be installed at all time, then proceed by installing any other optional commands (the CLI is only including the `init` command), refer to the **[Installation table](#separate--optional-installs)** for more info.

```sh
# install Lerna-Lite CLI locally or globally (`init` is the only command installed)
$ npm install -g @lerna-lite/cli # pnpm add -g @lerna-lite/cli

# create your monorepo and initialize lerna-lite
$ mkdir lerna-repo
$ cd lerna-repo
$ npx lerna init # OR pnpm exec lerna init

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

**Note** Lerna-Lite now supports 3 file extension types (`.json`, `.jsonc` and `.json5`), however not all code editors support [JSON Schema](https://json-schema.org/) with `.json5`, so `lerna.json` might still be the preferred extension (all formats support inline comments, even `.json`). 

Note that `package-a` will not be created, it is only shown here to help clarify the structure. For more info and full details about the `lerna.json` file, you can read the [lerna.json](https://github.com/lerna-lite/lerna-lite/wiki/lerna.json) Wiki. Also note that you can optionally add comments to your `lerna.json` config file since it is also able to parse JSON5 file format.

The final step will be to install the commands that are of interest to you (`publish`, `version`, `run`, `exec`, ...)

```sh
$ npm i @lerna-lite/publish -D
```

## How It Works

Lerna allows you to manage your project using one of two modes: Fixed or Independent.

### Fixed/Locked mode (default)

Fixed mode Lerna projects operate on a single version line. The version is kept in the `lerna.json` file at the root of your project under the `version` key. When you run `lerna publish`, if a module has been updated since the last time a release was made, it will be updated to the new version you're releasing. This means that you only publish a new version of a package when you need to.

> Note: If you have a major version zero, all updates are [considered breaking](https://semver.org/#spec-item-4). Because of that, running `lerna publish` with a major version zero and choosing any non-prerelease version number will cause new versions to be published for all packages, even if not all packages have changed since the last release.

This is the mode that [Jest](https://github.com/jestjs/jest)) is currently using. Use this if you want to automatically tie all package versions together. One issue with this approach is that a major change in any package will result in all packages having a new major version.

### Independent mode

`lerna init --independent`

Independent mode Lerna projects allows maintainers to increment package versions independently of each other. Each time you publish, you will get a prompt for each package that has changed to specify if it's a patch, minor, major or custom change.

Independent mode allows you to more specifically update versions for each package and makes sense for a group of components. Combining this mode with something like [semantic-release](https://github.com/semantic-release/semantic-release) would make it less painful. (There is work on this already at [atlassian/lerna-semantic-release](https://github.com/atlassian/lerna-semantic-release)).

> Set the `version` key in `lerna.json` to `independent` to run in independent mode.

## Installation

> Lerna-Lite is entirely modular, as opposed to Lerna, and installing the CLI locally or globally will only provide you the `init` command. Please make sure to install other commands that you are interested in (see table below).

If you are new to Lerna-Lite, you could also run the [lerna init](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init#readme) command which will create the `lerna.json` for you with a minimal structure setup. If you are using a client other than npm, then make sure to update the `npmClient` property in `lerna.json` (for example: `"npmClient": "yarn"` or `"pnpm"`).

> **Note** please make sure that you have a `lerna.json` config file created and a `version` property defined with either a fixed or `independent` mode. An error will be thrown if you're missing any of them.

### JSON Schema
You can add the `$schema` property into your `lerna.json` to take advantage of Lerna-Lite [JSON Schema](https://json-schema.org/) (`lerna init` can help setting it up for you). This will help with the developer experience, users will be able to see what properties are valid with their types and a brief description of what each option does (descriptions are pulled from their associated lerna command options documentation).


##### `lerna.json`
```js
{
  "$schema": "node_modules/@lerna-lite/cli/schemas/lerna-schema.json",
  // ...

  // or from GitHub CDN
  "$schema": "https://raw.githubusercontent.com/lerna-lite/lerna-lite/main/packages/cli/schemas/lerna-schema.json",
}
```

> **Note** JSON Schema might not be well supported by all code editors with `.json5`, use `lerna.json` if that is a problem for you.

### Separate / Optional Installs

| Command | Install | Description |
| --------| --------| ----------- |
| ☁️ [publish](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish#readme) | `npm i @lerna-lite/publish -D` | publish each workspace package |
| 📑 [version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#readme) | `npm i @lerna-lite/version -D` | create new version for each workspace package |
| 🕜 [changed](https://github.com/lerna-lite/lerna-lite/tree/main/packages/changed#readme) | `npm i @lerna-lite/changed -D` | list local packages changed since last release |
| 🌓 [diff](https://github.com/lerna-lite/lerna-lite/tree/main/packages/diff#readme)       | `npm i @lerna-lite/diff -D`    | git diff all packages since the last release   |
| 👷 [exec](https://github.com/lerna-lite/lerna-lite/tree/main/packages/exec#readme)       | `npm i @lerna-lite/exec -D`    | execute an command in each workspace package       |
| 📖 [list](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#readme)       | `npm i @lerna-lite/list -D`    | list local packages                            |
| 🏃 [run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run#readme)         | `npm i @lerna-lite/run -D`      | run npm script in each workspace package           |
| 👓 [watch](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch#readme)     | `npm i @lerna-lite/watch -D`    | watch for changes & execute commands when fired |

> **Note** since the `publish` package depends on the `version` package, you could simply install `@lerna-lite/publish` to automatically gain access to both commands.

### Usage

Add custom NPM scripts or simply run the commands in your shell with the Lerna-Lite CLI, you can see below some very basic Lerna npm script samples.

```js
// package.json / npm scripts
"scripts": {
  "new-version": "lerna version",
  "new-publish": "lerna publish from-package",
  "preview:new-version": "lerna version --dry-run",
  "run-tests": "lerna run test",
}
```

### Migration for existing [Lerna](https://github.com/lerna/lerna) users

Migrating from the original Lerna, should be fairly easy since you simply need to replace your Lerna dependency with Lerna-Lite `@lerna-lite/cli`, and you will need to manually install the command(s) that you are interested in and that's about it. The CLI commands and options are nearly the same. The biggest difference compared to Lerna is that you need to install the commands that you are interested in, for that take a look at the steps shown below:

> **Note** as opposed to Lerna v7 and higher, the `useWorkspace` is **not** enabled by default in Lerna-Lite and we still recommend to use either `useWorkspaces` for Yarn/NPM or use the default `packages` in `lerna.json` for pnpm users. The `useWorkspaces` has some drawback since some of the packages could be unrelated to the project releases (ie: website, examples) and for this use case the `packages/*` defined in `lerna.json` is a better approach (i.e. [Jest](https://github.com/facebook/jest) uses this approach).

1. remove Lerna from your local & global dependencies

```sh
npm uninstall lerna      # OR yarn remove lerna -W
npm uninstall -g lerna   # OR yarn global remove lerna
```

2. install Lerna-Lite CLI, note this **only** provides you the `init` command

```sh
# Lerna CLI (includes `init`)
npm install @lerna-lite/cli -D
```

3. then install any of the optional Lerna-Lite command(s) that you wish to use (`changed`, `diff`, `exec`, `list`, `run`, `publish`, `version` and/or `watch`)
_refer to [installation](#installation) table above_

```sh
# for example, let's install publish (note publish will automatically give you version since it's a dependency)
npm install @lerna-lite/publish -D
```

4. review your `lerna.json` config file and remove any unrelated command options, for example `bootstrap` does not exist in Lerna-Lite so there's no need to keep that config
```diff
{
    "npmClient": "yarn",
    "command": {
        "version": {
            "conventionalCommits": true
        },
-       "bootstrap": {
-           "npmClientArgs": ["--no-package-lock"]
-       }
    }
}
```
> **Note** after switching to Lerna-Lite and publishing your next release with conventional-changelog, you will probably see a lot of diff changes across your `changelog.md` files, a lot of empty lines will be deleted, and that is totally expected since Lerna-Lite has code in place to remove these unnecessary empty lines.

## Project Demo?

You want to see a project demo? Sure... you're looking at it 😉

Yes indeed, this project was originally created as an NPM Workspace and later migrated to a [pnpm workspaces](https://pnpm.io/workspaces) for the sole purpose of demoing and testing its own code. All changelogs and versions are created and published by the lib itself, how sweet is that? You can also see that this project has its own [`lerna.json`](https://github.com/lerna-lite/lerna-lite/blob/main/lerna.json) config file as well to run properly (take a look to see how it works).

### See it in Action 🎦

You can see a small video of a new version release on this [Release Demo - Wiki](https://github.com/lerna-lite/lerna-lite/wiki/Release-Demo) to demonstrate its usage. Are you confused with all these options? Perhaps taking a look at some of the references shown below might help you get started.

### Good Lerna Tutorials / References

- [Release Demo - Wiki](https://github.com/lerna-lite/lerna-lite/wiki/Release-Demo) - Lerna-Lite demo (animated gif)
- [How to Use Lerna](https://www.youtube.com/watch?v=p6qoJ4apCjA) - YouTube video
- [Lerna Release Workflow](https://github.com/curiousNoob/lerna-release-workflow) - GitHub Template

## Contributions

[![PR](https://img.shields.io/badge/PR-Welcome-1abc9c)](https://github.com/lerna-lite/lerna-lite/pulls)

Contributions are very well encouraged. Also please note that the original code was created by much smarter persons that myself and my knowledge of the project might still lack in some areas of the project. The main goal of this fork was to make it more modular and keep dependencies up to date (Renovate was put in place and is running weekly). 

### Development / Contributions

To contribute to the project, please follow the steps shown in the [Contributing Guide](https://github.com/lerna-lite/lerna-lite/blob/main/CONTRIBUTING.md)

## Troubleshooting

If you have problems running the project and your problems are related to Git commands that were executed, we then suggest to first try with the `--dry-run` option to see if it helps in finding the error(s) that you may have. Another great, and possibly much more useful suggestion, is to search in the original Lerna [issues](https://github.com/lerna/lerna/issues) list and see if any solution could help you (remember that Lerna-Lite is a fork of the original code from Lerna and it works the same way). Lastly, if that is not enough and you wish to troubleshoot yourself, then read this [Troubleshooting - Wiki](https://github.com/lerna-lite/lerna-lite/wiki/Troubleshooting) to possibly troubleshoot yourself the execution in your own environment.

## Published Packages

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
| [@lerna-lite/npmlog](https://github.com/lerna-lite/lerna-lite/tree/main/packages/npmlog) | [![npm](https://img.shields.io/npm/v/@lerna-lite/npmlog.svg)](https://www.npmjs.com/package/@lerna-lite/npmlog) | inline version of `npmlog` util (mostly for internal usage) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/npmlog/CHANGELOG.md) |
| [@lerna-lite/profiler](https://github.com/lerna-lite/lerna-lite/tree/main/packages/profiler) | [![npm](https://img.shields.io/npm/v/@lerna-lite/profiler.svg)](https://www.npmjs.com/package/@lerna-lite/profiler) | Lerna-Lite Profiler used by some optional commands (internal use) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/profiler/CHANGELOG.md) |
| [@lerna-lite/run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run) | [![npm](https://img.shields.io/npm/v/@lerna-lite/run.svg)](https://www.npmjs.com/package/@lerna-lite/run) | Run npm scripts in current workspace | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/run/CHANGELOG.md) |
| [@lerna-lite/watch](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch) | [![npm](https://img.shields.io/npm/v/@lerna-lite/watch.svg)](https://www.npmjs.com/package/@lerna-lite/watch) | Watch for pkg changes and execute callback commands | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/watch/CHANGELOG.md) |

## Sponsors

<div>
  <span>
    <a href="https://github.com/wundergraph" class="Link" title="Wundergraph" target="_blank"><img src="https://avatars.githubusercontent.com/u/64281914" width="50" height="50" valign="middle" /></a>
  </span>
  &nbsp;
  <span>
    <a href="https://github.com/johnsoncodehk" class="Link" title="johnsoncodehk (Volar)" target="_blank"><img src="https://avatars.githubusercontent.com/u/16279759" width="50" height="50" valign="middle" /></a>
  </span>
   &nbsp;
  <span>
    <a href="https://github.com/kevinburkett" class="Link" title="kevinburkett" target="_blank"><img class="circle avatar-user" src="https://avatars.githubusercontent.com/u/48218815?s=52&amp;v=4" width="45" height="45" valign="middle" /></a>
  </span>
  &nbsp;
  <span>
    <a href="https://github.com/anton-gustafsson" class="Link" title="anton-gustafsson" target="_blank"><img src="https://avatars.githubusercontent.com/u/22906905?s=52&v=4" width="50" height="50" valign="middle" /></a>
  </span>
  &nbsp;
  <span>
    <a href="https://github.com/gibson552" class="Link" title="gibson552" target="_blank"><img src="https://avatars.githubusercontent.com/u/84058359?s=52&v=4" width="50" height="50" valign="middle" /></a>
  </span>
</div>
