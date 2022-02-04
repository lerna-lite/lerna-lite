# Workspace Conventional Changelog Version Roller 🎱

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@ws-conventional-version-roller/core.svg?color=forest)](https://www.npmjs.com/package/@ws-conventional-version-roller/core)
[![NPM downloads](https://img.shields.io/npm/dy/@ws-conventional-version-roller/core.svg)](https://www.npmjs.com/package/@ws-conventional-version-roller/core)
[![Actions Status](https://github.com/ghiscoding/ws-conventional-version-roller/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/ws-conventional-version-roller/actions)

### License
[MIT License](LICENSE)

### Why and when to use this lib?
You would use this lib when your project is an NPM/Yarn Workspace monorepo structure and you wish to automate Versioning and Publishing of all your packages by following the [Conventional Commits](https://www.conventionalcommits.org/) and also automatically create [Conventional-Changelog](https://github.com/conventional-changelog/conventional-changelog) for each of your package (and also a main changelog in the root).

This lib will help you to
- Automate the rolling of new Versions (independent or fixed) for all your packages
  - it will automatically add Commit & Tag your new Version in Git & create new Release in GitHub when enabled
- Automate the creation of Changelogs for all your packages by reading all [Conventional Commits](https://www.conventionalcommits.org/)
  - each package will get its own changelog and a combined changelog will also be created in the root
- Automate the repository Publish of your new versions for all your packages
  - it could push to NPM or any other repository platform

### Project Demo?
You want to see a demo project? Well, you're looking at it 😉

Yes indeed, this lib was created as an NPM Workspace specifically for the purpose of demoing and testing of its own code. All changelogs and published versions were created by the lib itself, how sweet is that? You will also find that it has its own [roller.json](https://github.com/ghiscoding/ws-conventional-version-roller/blob/main/roller.json) config file just as well as you would when using the lib.

### See it in Action 🎦
You can see a small video of a new version release on this [Release Demo - Wiki](https://github.com/ghiscoding/ws-conventional-version-roller/wiki/Release-Demo) - Confused with all the options? You can watch this great YouTube video [How to Use Lerna](https://www.youtube.com/watch?v=p6qoJ4apCjA), the Roller Options are all the same as Lerna + extras as shown below.

### Inspiration
The vast majority of the code comes from [Lerna](https://github.com/lerna/lerna), however only 2 of these commands were of interest ([version](https://github.com/lerna/lerna/tree/main/commands/version#readme) and [publish](https://github.com/lerna/lerna/tree/main/commands/publish#readme)) and all related code were extracted from Lerna (thanks to the [Lerna](https://github.com/lerna/lerna) maintainers for all their great work).

The creation of this lib came from a desire of migrating Lerna projects to plain NPM/Yarn Workspace (also because Lerna is no longer maintained). Lerna is a fairly large library with lots of outdated dependencies, however with the recent addition of [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) we no longer need all the features that Lerna provides however they will never provide commands for automating the process of versioning & publishing and that is what this lib will help you with.

### FAQ
- [Q] Coming from Lerna, can I use my `lerna.json` config file without any changes?
   - [A] Yes you can, the settings are the same but we still recommend to eventually rename to `roller.json`
- [Q] Why do I see Lerna mentioned so many times? Do I need a Lerna project to use this lib?
   - [A] Not at all, however the code originally came from that project and if you used Lerna before then it will be extremely easy for you to get started
- [Q] What is the minimum that I need to get started
   - [A] read the [configurations](https://github.com/ghiscoding/ws-conventional-version-roller#configuration) below, the short answer is that you will need a `roller.json` config file, some NPM scripts and that's about it

## Installation
```bash
npm install @ws-conventional-version-roller/cli
```
**Note:** the `cli` name might be confusing since that is not really a CLI (well not yet) but should come very soon and it will be located under the same package but for now it is still the lib entry point.

### Usage
Add the following NPM Scripts or simply run the following NodeJS command in your shell.
```js
// package.json / npm scripts
"scripts": {
  "roll-version": "node ./node_modules/@ws-conventional-version-roller/cli/dist/index.js --roll-version",
  "roll-publish": "node ./node_modules/@ws-conventional-version-roller/cli/dist/index.js --roll-publish"
}
```

### Configuration
This lib requires a config file in order to do its job properly. It could come from a separate file (read [`roller.json` - Wiki](https://github.com/ghiscoding/ws-conventional-version-roller/wiki/Roller.json), recommended approach) in the root of your project OR a `"roller": {}` property directly under your `package.json`.

**Note:** make sure to reference your workspace packages via the `packages: []` in the [roller.json](https://github.com/ghiscoding/ws-conventional-version-roller/blob/main/roller.json) config file, because at the moment the lib will **not** read the `workspaces` property yet (it might, probably will, in the future).

#### Command Options
- `version` same as Lerna [version options](https://github.com/lerna/lerna/tree/main/commands/version#readme)
- `publish` same as Lerna [publish options](https://github.com/lerna/lerna/tree/main/commands/publish#readme)
   - make sure to double-check your [publishConfig](https://docs.npmjs.com/cli/v6/configuring-npm/package-json#publishconfig) access of each package before publishing

**Note:** I did not personally try all options, Lerna added so many options over the years that it would be impossible to test them all but they should all work just the same. For any problems, please first take a look at Lerna's [issues](https://github.com/lerna/lerna/issues) and you might find what you need (since all the code originally came from that lib).

#### For [Lerna](https://github.com/lerna/lerna) Users
If you are migrating from Lerna, it will also work with a `lerna.json` config file **but** it is strongly recommended to eventually rename your config file to `roller.json` since that might get deprecated in the future. However please note that `"lerna": {}` defined in the `package.json` will **not** work.

#### New Options
On top of Lerna's existing options, we added a few more options that might be useful
- `--git-dry-run`
  - will run the version/publish commands and log (info) all the git commands without actually executing them
  - Note: it will still create the changelogs (when enabled), so it could be useful to see what gets created (however, make sure to discard the changes and roll back your version in `roller.json` once you're done)
- "Version" command only options
  - `--changelog-header-message "My Custom Header Message"`
    - only writes to the root changelog (sub-packages will not receive this text)
    - this will be written, only once, at the top of all your changelog files (e.g.: a good example is to add reference to your website)
    - you can see a live example from our very own [changelog](https://github.com/ghiscoding/ws-conventional-version-roller/blob/main/CHANGELOG.md)
  - `--changelog-version-message "My custom version message"`
    - only writes to the root changelog (sub-packages will not receive this text)
    - this will be written as a prefix to your version change (e.g.: for example, provide more info about the new version changes)

### Troubleshooting
If you have problems running the lib and your problems are with Git then you should first try the `--git-dry-run` option to see if that helps in finding the error. Another great, and possibly much more useful suggestion, is to search in the Lerna [issues](https://github.com/lerna/lerna/issues) because most of the code came from that library. Lastly if it that is not enough and you wish to troubleshoot yourself, then read this [Troubleshooting - Wiki](https://github.com/ghiscoding/ws-conventional-version-roller/wiki/Troubleshooting)
