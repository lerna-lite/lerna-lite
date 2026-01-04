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

## Lerna-Lite is a lighter version of the original [Lerna](https://github.com/lerna/lerna)

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
- [Sponsors](#sponsors)

### Available Commands

_Click on any command shown below to see their associated documentations_

- 🛠️ **[`init`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init#readme)** - creates a new Lerna-Lite workspace structure and adds `lerna.json`
- 🕜 **[changed](https://github.com/lerna-lite/lerna-lite/tree/main/packages/changed#readme)** - list local packages changed since last release | `npm i @lerna-lite/changed -D`
- 🌓 **[diff](https://github.com/lerna-lite/lerna-lite/tree/main/packages/diff#readme)** - git diff all packages since the last release | `npm i @lerna-lite/diff -D`
- 👷 **[exec](https://github.com/lerna-lite/lerna-lite/tree/main/packages/exec#readme)** - execute shell commands in each workspace package | `npm i @lerna-lite/exec -D`
- 📖 **[list](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#readme)** - list local packages | `npm i @lerna-lite/list -D`
- ☁️ **[publish](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish#readme)** - publish workspace packages | `npm i @lerna-lite/publish -D`
- 📑 **[version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#readme)** - bump workspace package versions | `npm i @lerna-lite/version -D`
- 🏃 **[run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run#readme)** - run npm script in each workspace package | `npm i @lerna-lite/run -D`
- 👓 **[watch](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch#readme)** - watch for changes & execute commands when fired | `npm i @lerna-lite/watch -D`

> **Note** since the `publish` package depends on the `version` package, you could install `@lerna-lite/publish` to get access to both commands.

## License

[MIT License](LICENSE)

---

## 📢 Lerna-Lite supports `catalog:` and `workspace:` protocols for all clients that support them (pnpm/bun/yarn).

Take 30sec. to complete this 1 question [poll survey 🔘](https://github.com/lerna-lite/lerna-lite/discussions/156) if you are using this feature. It's a simple poll to find out which package manager is the most popular with `workspace:` protocol (so far, about 65% pnpm and 35% yarn).

Lerna-Lite itself is also using both [pnpm catalogs](https://pnpm.io/catalogs) and [pnpm workspaces](https://pnpm.io/workspaces) internally. 🎉

## OIDC Trusted Publishing
OIDC Trusted Publishing is now supported as of [v4.9.0](https://github.com/lerna-lite/lerna-lite/releases/tag/v4.9.0). GitHub and GitLab CI workflows can now use npm's [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) OpenID Connect (OIDC) integration for secure, token-free publishing from CI/CD. This eliminates long-lived tokens and automatically generates [Provenance](https://github.blog/security/supply-chain-security/introducing-npm-package-provenance/) attestations. A basic test repo is available here: https://github.com/lerna-lite-test/oidc

---

## Who is using Lerna-Lite

Here are some of the largest projects using Lerna-Lite

<a href="https://github.com/facebook/jest">
  <img src="https://jestjs.io/img/jest.png" width="28" height="28">
  Jest
</a>&nbsp; | &nbsp;
<a href="https://github.com/vuetifyjs/vuetify">
  <img src="https://avatars.githubusercontent.com/u/22138497?s=28&v=4" width="28" height="28">
  Vuetify
</a>&nbsp; | &nbsp;
<a href="https://github.com/react-navigation/react-navigation">
  <img src="https://avatars.githubusercontent.com/u/29647600?s=64&v=4" width="28" height="28">
  React Nav
</a>&nbsp; | &nbsp;
<a href="https://github.com/formatjs/formatjs">
  <img src="https://avatars.githubusercontent.com/u/50559490" width="28" height="28">
  Format.JS
</a>&nbsp; | &nbsp;
<a href="https://github.com/SBoudrias/Inquirer.js" title="Inquirer.js">
  <img src="https://raw.githubusercontent.com/SBoudrias/Inquirer.js/main/assets/inquirer_readme.svg" width="28" height="28">
   Inquirer
</a>&nbsp; | &nbsp;
<a href="https://github.com/johnsoncodehk/volar">
  <img src="https://raw.githubusercontent.com/johnsoncodehk/sponsors/master/logos/Vue.svg" width="28" height="28">
  Volar
</a>&nbsp; | &nbsp;
<a href="https://github.com/palantir/blueprint">
  <img src="https://avatars.githubusercontent.com/u/303157?s=48&v=4" width="28" height="28">
  Blueprint
</a>
<br><br>
<a href="https://github.com/wundergraph" title="Wundergraph">
  <img src="https://avatars.githubusercontent.com/u/64281914" width="28" height="28">
   Wundergraph
</a>&nbsp; | &nbsp;
<a href="https://github.com/sanity-io/sanity" title="Sanity">
  <img src="https://avatars.githubusercontent.com/u/17177659?s=48&v=4" width="28" height="28">
   Sanity
</a>&nbsp; | &nbsp;
<a href="https://github.com/nativescript-community" title="NativeScript Community">
  <img src="https://avatars.githubusercontent.com/u/50633791?s=200&v=4" width="25" height="25">
   NativeScript
</a>

## About Lerna-Lite

Lerna-Lite differs from the original [Lerna](https://github.com/lerna/lerna) which itself is now installing & requiring [Nx](https://github.com/nrwl/nx) (which is large) and it has 15 buit-in commands. On the other hand, Lerna-Lite (this project) doesn't require Nx and has a limited subset of the original commands (9 out of 15 commands). The biggest difference is that commands in Lerna-Lite are **all optional** making its install footprint a lot smaller. Lerna was originally built as an all-in-one tool, however nowadays, Workspaces are available in all package managers and the need for an all-in-one tool, which includes built-in workspaces functionalities (like `bootstrap`), is no longer necessary. Lerna-Lite was updated around this new reality and is now only providing commands that package managers do not yet provide or are less efficient. To summarize, Lerna-Lite is much more modular than the original Lerna and you'll end up installing much less dependencies while also making it more versatile to use with other tools like TurboRepo, pnpm and any other tools...

Lerna-Lite assumes, and requires that you pre-setup your Workspace through your favorite package manager (npm, pnpm, yarn, bun) which will take care of all symlinks. Lerna-Lite does **not include** Lerna's `bootstrap`, `add`, `create` or `link` commands hence the need for you to properly set up your workspace prior to installing Lerna-Lite.

According to your needs, choose the best option to set up a Workspace: [npm 7+](https://docs.npmjs.com/cli/v8/using-npm/workspaces) | [Yarn classic](https://classic.yarnpkg.com/en/docs/workspaces) | [Yarn 2+](https://yarnpkg.com/features/workspaces) | [pnpm](https://pnpm.io/workspaces) | [Bun](https://bun.com/docs/install/workspaces)

## Why create this lib/fork?

Below are the main reasons as to why this fork was created:

1. Lerna's repo was unmaintained for nearly 2 years (in early 2022, Lerna's dependencies were really out of date)
    - Lerna (original) was later transferred to the Nx Team and are now the current maintainers
        - please note that Lerna-Lite fork was created couple months **before** Nx took over Lerna
        - most of Lerna's PRs are also replicated here when possible (except for `Nx` changes, which are ignored)
2. A desire to create a smaller and lighter alternative compared to the original all-in-one (large) Lerna tool
    - Lerna-Lite is entirely modular, each command are totally optional (install only what you want).
3. The project was rewritten in TypeScript with ESM-only since v2.0 (you can still use it in a CJS environment)
4. The original Lerna version v5.5+ now requires **[Nx](https://nx.dev/)** (want it or not), but that is not the case in Lerna-Lite
   - note, if you already use `Nx` then it's probably better to use Lerna, otherwise Lerna-Lite is a better alternative
   - if you use tools like TurboRepo and install the original Lerna, you end up installing 2 similar tools (not good)
5. in Lerna-Lite a few unique features were also added which are not available in the original Lerna:
   - [`catalog:` protocol](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#catalog-protocol) support (pnpm/bun/yarn) for both `version` and `publish` commands
   - [`workspace:` protocol](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#workspace-protocol) support (Lerna also brought support in v6)
   - [--dry-run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--dry-run) to preview version/publish & changelogs locally (shows git changes without committing them)
   - [lerna version --allow-peer-dependencies-update](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--allow-peer-dependencies-update) to also update your peer dependencies
   - [lerna version --changelog-header-message "msg"](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--changelog-header-message-msg) for showing banner or sponsors in your changelogs
   - [lerna version --changelog-include-commits-client-login](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--changelog-include-commits-client-login-msg) to add PR contributors to GitHub releases
   - [lerna publish --strip-package-keys](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish#--strip-package-keys-keys) (strip certain keys from `package.json` before publishing)
     - e.g.: we use it in here to publish Lerna-Lite without any `scripts` or `devDependencies`
   - [lerna version --skip-bump-only-releases](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--skip-bump-only-releases), avoid cluttering your GitHub releases when using `independent`
   - [lerna version --sync-workspace-lock](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--sync-workspace-lock) to sync lock file before publishing (not needed w/`workspace:` protocol)
   - [lerna version --comment-issues/pull requests](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#comments-on-issuespull-requests), comment on issues/PRs resolved by a new release (new 🍬)
   - Bun is now mostly supported as well (including support for `syncWorkspaceLock` and `catalog:` protocol)

On a final note, I would imagine that the best feature of Lerna-Lite (versus Lerna) would be its modularity. A large portion of the users are only interested in `version`/`publish` commands, but on the other hand, a small minority might want other commands like `lerna run`/`exec`. Lerna-Lite offers this kind of flexibility by allowing the user to choose and install the minimal (see [installation](#cli-installation) below) which helps keep your download to the bare minimum.

### Lerna-Lite will help you with the following:

> **Note** all commands are optional in Lerna-Lite, refer to the [Available Commands](#available-commands) table for more info

#### [Version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version) and [Publish](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish) commands

- Automate the creation of new Versions (`independent` or `fixed` version) of all your workspace packages.
  - it will automatically Commit/Tag your new Version & create new GitHub/GitLab Releases (when enabled).
- Automate, when enabled, will create Changelogs for all packages by reading your [Conventional Commits](https://www.conventionalcommits.org/).
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

Let's start by installing Lerna-Lite CLI as a dev dependency in your project and then run the `init` command to get started (see [init#readme](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init#readme) for all options). Note that the CLI must be installed at all time, then proceed by installing any other optional commands (the CLI is only including the `init` command), refer to the **[Available Commands](#available-commands) table** for more info.

> [!NOTE]
> You can see and clone a very basic [Lerna-Lite boilerplate](https://github.com/lerna-lite/lerna-lite-boilerplate) project repository.

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

**Note** Lerna-Lite now supports 3 config extensions (`.json`, `.jsonc` or `.json5`), however please note that not all code editors support [JSON Schema](https://json-schema.org/) (e.g. `.json5`), so `lerna.json` might still be the preferred file extension. Also note that all formats support inline comments, even the default `lerna.json`.

Note that `package-a` shown above will not be created, it is only shown here to help clarify the structure. For more info and full details about the `lerna.json` config file, please read the [lerna.json](https://github.com/lerna-lite/lerna-lite/wiki/lerna.json) Wiki. Also note that you can optionally add comments to your `lerna.json` file since all formats are parsed as a JSON5 file format.

The final step is to install the commands that are of interest to you (`publish`, `version`, `run`, `exec`, ...)

```sh
$ npm i @lerna-lite/publish -D
```

## How It Works

Lerna allows you to manage your project using one of two modes: Fixed or Independent.

### Fixed/Locked mode (default)

Fixed mode Lerna projects operate on a single version line. The version is kept in the `lerna.json` config file at the root of your project under the `version` key. When you run `lerna publish`, if a module has been updated since the last time a release was made, it will be updated to the new version you're releasing. This means that you only publish a new version of a package when you need to.

> Note: If you have a major version zero, all updates are [considered breaking](https://semver.org/#spec-item-4). Because of that, running `lerna publish` with a major version zero and choosing any non-prerelease version number will cause new versions to be published for all packages, even if not all packages have changed since the last release.

This is the mode that [Jest](https://github.com/jestjs/jest), for example, is currently using. Use this if you want to automatically tie all package versions together. One issue with this approach is that a major change in any package will result in all packages having a new major version.

### Independent mode

`lerna init --independent`

Independent mode Lerna projects allows maintainers to increment package versions independently of each other. Each time you publish, you will get a prompt for each package that has changed to specify if it's a patch, minor, major or custom change.

Independent mode allows you to more specifically update versions for each package and makes sense for a group of components. Combining this mode with something like [semantic-release](https://github.com/semantic-release/semantic-release) would make it less painful. (There is work on this already at [atlassian/lerna-semantic-release](https://github.com/atlassian/lerna-semantic-release)).

> Set the `version` key in `lerna.json` to `independent` to run in independent mode.

## Installation

> Lerna-Lite is entirely modular, as opposed to Lerna, and installing the CLI locally or globally will only provide you the `init` command. Please make sure to install other commands that you are interested in (see table below).

If you are new to Lerna-Lite, you could also run the [lerna init](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init#readme) command, which will create the `lerna.json` for you with a minimal structure setup. If you are using a client other than npm, then make sure to update the `npmClient` property in `lerna.json` (for example: `"npmClient": "yarn"`, `"pnpm"` or `"bun"`).

> **Note** please make sure that you have a `lerna.json` config file in your project root and also make sure to have a `version` property defined with either a fixed or `independent` version. Otherwise, an error will be thrown if you're missing the minimal config.

### Usage

The basic usage is to add either custom NPM scripts or simply run the commands in your shell with the Lerna-Lite CLI. See below for basic Lerna npm script samples.

```js
// package.json / npm scripts
"scripts": {
  "new-version": "lerna version",
  "new-publish": "lerna publish from-package",
  "preview:new-version": "lerna version --dry-run",
  "run-tests": "lerna run test",
}
```

or use the CLI in your favorite shell and package manager:

```sh
$ npx lerna version
$ pnpm exec lerna version
$ yarn lerna version
$ bun x lerna version
```

### JSON Schema
You can add the `$schema` property into your `lerna.json` to take advantage of Lerna-Lite [JSON Schema](https://json-schema.org/) (`lerna init` can help to set it up for you). This will help with the developer experience, users will be able to see what properties are valid with their types and a brief description of what each option does (descriptions are pulled from their associated lerna command options documentation).

##### `lerna.json`
```js
{
  "$schema": "node_modules/@lerna-lite/cli/schemas/lerna-schema.json",
  // ...

  // or from GitHub CDN
  "$schema": "https://raw.githubusercontent.com/lerna-lite/lerna-lite/main/packages/cli/schemas/lerna-schema.json",
}
```

> **Note** JSON Schema might not be well supported by all code editors with `.json5`, just use `lerna.json` if that is a problem for you.

### Separate / Optional Installs

_Click on any command below to see documentation of all available options_

| Command | Install | Description |
| --------| --------| ----------- |
| 🕜 [changed](https://github.com/lerna-lite/lerna-lite/tree/main/packages/changed#readme) | `npm i @lerna-lite/changed -D` | list local packages changed since last release |
| 🌓 [diff](https://github.com/lerna-lite/lerna-lite/tree/main/packages/diff#readme)       | `npm i @lerna-lite/diff -D`    | git diff all packages since the last release   |
| 👷 [exec](https://github.com/lerna-lite/lerna-lite/tree/main/packages/exec#readme)       | `npm i @lerna-lite/exec -D`    | execute an command in each workspace package       |
| 📖 [list](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#readme)       | `npm i @lerna-lite/list -D`    | list local packages                            |
| ☁️ [publish](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish#readme) | `npm i @lerna-lite/publish -D` | publish each workspace package |
| 📑 [version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#readme) | `npm i @lerna-lite/version -D` | create new version for each workspace package |
| 🏃 [run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run#readme)         | `npm i @lerna-lite/run -D`      | run npm script in each workspace package           |
| 👓 [watch](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch#readme)     | `npm i @lerna-lite/watch -D`    | watch for changes & execute commands when fired |

> **Note** since the `publish` package depends on the `version` package, you could simply install `@lerna-lite/publish` to automatically gain access to both commands.

### Migration for existing [Lerna](https://github.com/lerna/lerna) users

Migrating from the original Lerna, should be fairly easy since you simply need to replace your Lerna dependency with Lerna-Lite `@lerna-lite/cli`, and also install the command(s) that you are interested in and that's about it. The CLI commands and options are nearly identical. The biggest difference compared to Lerna is that you need to manually choose and install the commands that you are interested in, as shown below:

> **Note** as opposed to Lerna v7 and higher, the `useWorkspace` is **not** enabled by default in Lerna-Lite and we still recommend to use either `useWorkspaces` for Yarn/NPM or use the default `packages` in `lerna.json` for pnpm users. The `useWorkspaces` has some drawback since some of the packages could be unrelated to the project releases (ie: website, examples) and for this use case the `packages/*` defined in `lerna.json` is a better approach (e.g. [Jest](https://github.com/facebook/jest) uses this approach).

1. remove Lerna from your local & global dependencies

```sh
npm uninstall lerna      # OR yarn remove lerna -W
npm uninstall -g lerna   # OR yarn global remove lerna
```

2. install Lerna-Lite CLI, note this will **only** provide you the `init` command

```sh
# Lerna CLI (only includes `init`)
npm install @lerna-lite/cli -D
```

3. then install any of the optional Lerna-Lite command(s) that you wish to use (`changed`, `diff`, `exec`, `list`, `run`, `publish`, `version` and/or `watch`)
_refer to [Available Commands](#available-commands) table above_

```sh
# for example, let's install publish (note publish will automatically provide you the `version` command since it's a dependency)
npm install @lerna-lite/publish -D
```

4. review your `lerna.json` config file and remove any unrelated old command options, for example `bootstrap` does not exist in Lerna-Lite so there's no need to keep any related config
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

### Great Lerna Tutorials / References

- [Release Demo - Wiki](https://github.com/lerna-lite/lerna-lite/wiki/Release-Demo) - Lerna-Lite demo (animated gif)
- [How to Use Lerna](https://www.youtube.com/watch?v=p6qoJ4apCjA) - YouTube video
- [Lerna Release Workflow](https://github.com/curiousNoob/lerna-release-workflow) - GitHub Template

## Contributions

[![PR](https://img.shields.io/badge/PR-Welcome-1abc9c)](https://github.com/lerna-lite/lerna-lite/pulls)

Contributions are very well encouraged. Also please note that the original code was created by much smarter persons than myself and so my knowledge of the project might still lack in some areas of the project. The main goal of this fork was mainly to make it more modular and keep dependencies up to date (Renovate was put in place and is running frequently). 

### Development / Contributions

To contribute to the project, please follow the steps shown in the [Contributing Guide](https://github.com/lerna-lite/lerna-lite/blob/main/CONTRIBUTING.md)

## Troubleshooting

If you have problems running the project and your problems are related to Git commands that were executed, we then suggest to first try with the `--dry-run` option to see if it helps in finding the error(s) that you may have. Another great, and possibly much more useful suggestion, is to search in the original Lerna [issues](https://github.com/lerna/lerna/issues) list and see if any solution could help you (remember that Lerna-Lite is a fork of the original code from Lerna and it works the same way). Lastly, if that is not enough and you wish to troubleshoot it yourself, then read this [Troubleshooting - Wiki](https://github.com/lerna-lite/lerna-lite/wiki/Troubleshooting) to possibly troubleshoot yourself the execution in your own environment.

## Published Packages

| Package Name | Description | Version | NPM Downloads | Changes |
| ------------ | ----------- | ------- | ------------- | ------- |
| [@lerna-lite/cli](https://github.com/lerna-lite/lerna-lite/tree/main/packages/cli) | Lerna-Lite CLI | [![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg)](https://www.npmjs.com/package/@lerna-lite/cli) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/cli?color=forest)](https://www.npmjs.com/package/@lerna-lite/cli) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/cli/CHANGELOG.md) |
| [@lerna-lite/core](https://github.com/lerna-lite/lerna-lite/tree/main/packages/core) | Lerna-Lite core functions | [![npm](https://img.shields.io/npm/v/@lerna-lite/core.svg)](https://www.npmjs.com/package/@lerna-lite/core) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/core?color=forest)](https://www.npmjs.com/package/@lerna-lite/core) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/core/CHANGELOG.md) |
| [@lerna-lite/init](https://github.com/lerna-lite/lerna-lite/tree/main/packages/init) | Lerna-Lite setup | [![npm](https://img.shields.io/npm/v/@lerna-lite/init.svg)](https://www.npmjs.com/package/@lerna-lite/init) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/init?color=forest)](https://www.npmjs.com/package/@lerna-lite/init) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/init/CHANGELOG.md) |
| [@lerna-lite/publish](https://github.com/lerna-lite/lerna-lite/tree/main/packages/publish) | Publish workspace packages | [![npm](https://img.shields.io/npm/v/@lerna-lite/publish.svg)](https://www.npmjs.com/package/@lerna-lite/publish) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/publish?color=forest)](https://www.npmjs.com/package/@lerna-lite/publish) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/publish/CHANGELOG.md)             |
| [@lerna-lite/version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version) | Bump Version & Changelogs | [![npm](https://img.shields.io/npm/v/@lerna-lite/version.svg)](https://www.npmjs.com/package/@lerna-lite/version) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/version?color=forest)](https://www.npmjs.com/package/@lerna-lite/version) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/version/CHANGELOG.md) |
| [@lerna-lite/exec](https://github.com/lerna-lite/lerna-lite/tree/main/packages/exec) | Execute shell commands in repo | [![npm](https://img.shields.io/npm/v/@lerna-lite/exec.svg)](https://www.npmjs.com/package/@lerna-lite/exec) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/exec?color=forest)](https://www.npmjs.com/package/@lerna-lite/exec) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/exec/CHANGELOG.md) |
| [@lerna-lite/changed](https://github.com/lerna-lite/lerna-lite/tree/main/packages/changed) | List changes since last release | [![npm](https://img.shields.io/npm/v/@lerna-lite/changed.svg)](https://www.npmjs.com/package/@lerna-lite/changed) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/changed?color=forest)](https://www.npmjs.com/package/@lerna-lite/changed) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/changed/CHANGELOG.md) |
| [@lerna-lite/diff](https://github.com/lerna-lite/lerna-lite/tree/main/packages/diff) | Diff changes since last release | [![npm](https://img.shields.io/npm/v/@lerna-lite/diff.svg)](https://www.npmjs.com/package/@lerna-lite/diff) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/diff?color=forest)](https://www.npmjs.com/package/@lerna-lite/diff) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/diff/CHANGELOG.md) |
| [@lerna-lite/list](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list) | List local packages | [![npm](https://img.shields.io/npm/v/@lerna-lite/list.svg)](https://www.npmjs.com/package/@lerna-lite/list) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/list?color=forest)](https://www.npmjs.com/package/@lerna-lite/list) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/list/CHANGELOG.md) |
| [@lerna-lite/listable](https://github.com/lerna-lite/lerna-lite/tree/main/packages/listable) | Listable utils for `list`, `changed` | [![npm](https://img.shields.io/npm/v/@lerna-lite/listable.svg)](https://www.npmjs.com/package/@lerna-lite/listable) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/listable?color=forest)](https://www.npmjs.com/package/@lerna-lite/listable) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/listable/CHANGELOG.md) |
| [@lerna-lite/npmlog](https://github.com/lerna-lite/lerna-lite/tree/main/packages/npmlog) | inline version of `npmlog` util | [![npm](https://img.shields.io/npm/v/@lerna-lite/npmlog.svg)](https://www.npmjs.com/package/@lerna-lite/npmlog) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/npmlog?color=forest)](https://www.npmjs.com/package/@lerna-lite/npmlog) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/npmlog/CHANGELOG.md) |
| [@lerna-lite/profiler](https://github.com/lerna-lite/lerna-lite/tree/main/packages/profiler) | internal profiler | [![npm](https://img.shields.io/npm/v/@lerna-lite/profiler.svg)](https://www.npmjs.com/package/@lerna-lite/profiler) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/profiler?color=forest)](https://www.npmjs.com/package/@lerna-lite/profiler) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/profiler/CHANGELOG.md) |
| [@lerna-lite/run](https://github.com/lerna-lite/lerna-lite/tree/main/packages/run) | Run npm scripts in workspace | [![npm](https://img.shields.io/npm/v/@lerna-lite/run.svg)](https://www.npmjs.com/package/@lerna-lite/run) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/run?color=forest)](https://www.npmjs.com/package/@lerna-lite/run) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/run/CHANGELOG.md) |
| [@lerna-lite/watch](https://github.com/lerna-lite/lerna-lite/tree/main/packages/watch) | Watch changes in workspace | [![npm](https://img.shields.io/npm/v/@lerna-lite/watch.svg)](https://www.npmjs.com/package/@lerna-lite/watch) | [![npm](https://img.shields.io/npm/dy/@lerna-lite/watch?color=forest)](https://www.npmjs.com/package/@lerna-lite/watch) | [changelog](https://github.com/lerna-lite/lerna-lite/blob/main/packages/watch/CHANGELOG.md) |

## Sponsors

Thanks to all my sponsors!

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
