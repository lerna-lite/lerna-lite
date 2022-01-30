# Workspace Conventional Changelog Version Roller

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![NPM downloads](https://img.shields.io/npm/dy/@ws-conventional-version-roller/core.svg)](https://www.npmjs.com/package/@ws-conventional-version-roller/core)

### License
[MIT License](LICENSE)

### Why and when to use this lib?
You would use this lib when your project is an NPM/Yarn Workspace monorepo structure and you wish to automate Versioning and Publishing of all your packages by following the [Conventional Commits](https://www.conventionalcommits.org/) and also automatically create [Conventional-Changelog](https://github.com/conventional-changelog/conventional-changelog) for each of your package (and also a main changelog in the root).

This lib will help to
- Automate rolling new Versions for all your packages
- Automate the creations of Changelog by reading all [Conventional Commits](https://www.conventionalcommits.org/)
- Automate the Publish of your new versions for all your packages

### Demo?
You want to see a demo project? Well, you're looking at it ;) Yes indeed, this lib was created specifically as an NPM Workspace for the exact purpose of testing and demoing its own code. How sweet is that? You will also find that it has its own [roller.json](/ghiscoding/ws-conventional-version-roller/blob/main/roller.json) config file as well (the same as you).

### Inspiration
The vast majority of the code come from [Lerna](https://github.com/lerna/lerna) and only 2 commands ([version](https://github.com/lerna/lerna/tree/main/commands/version#readme) and [publish](https://github.com/lerna/lerna/tree/main/commands/publish#readme)) were extracted from Lerna (thanks to the Lerna maintainers for all their great work). 

This lib was mainly created to migrate Lerna projects to plain NPM/Yarn Workspace (also because Lerna is no longer maintained). Lerna is a fairly large library with lots of dependencies, however we no longer need all the features of Lerna especially so since NPM released their recent [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) directly in NPM. However NPM/Yarn Workspace will never provide ways to automate versioning & publishing and this lib was created for that purpose.

#### Questions & Answers
- [Q] Do I need a Lerna project to use this lib?
   - [A] Not at all, however if you do then it will be easy for you to get started
- [Q] What is the minimum that I need to get started
   - [A] see the [configurations](/ghiscoding/ws-conventional-version-roller#configuration) below, the short answer is you will need a `roller` config and that's about it
- [Q] Coming from Lerna, can I use my `lerna.json` file without any changes?
   - [A] Yes you can, the settings are the same but we still recommend to renaming the config file to `roller.json`

### Installation
```bash
npm install @ws-conventional-version-roller/cli
```
**NOTE** the `cli` name might be confusing since that is not really a CLI (not yet) but that should come very soon and it will be located under the same package, for now it is still the lib entry point.

### Usage
Add the following NPM Scripts or simply run the following NodeJS command in a shell.
```js
// package.json / npm scripts
"scripts": {
  "roll-version": "node ./node_modules/@ws-conventional-version-roller/cli/dist/index.js --roll-version",
  "roll-publish": "node ./node_modules/@ws-conventional-version-roller/cli/dist/index.js --roll-publish"
}
```

### Configuration
This lib requires a config file in order to do its job properly. It could come from a separate file `roller.json` (recommended) in the root of your project OR a `"roller": {}` property directly under your `package.json`. 

#### Command Options
- `version` same as Lerna [version options](https://github.com/lerna/lerna/tree/main/commands/version#readme)
- `publish` same as Lerna [publish options](https://github.com/lerna/lerna/tree/main/commands/publish#readme)
   - if it's your first time publishing your monorepo, you might want to double-check your [publishConfig](https://docs.npmjs.com/cli/v6/configuring-npm/package-json#publishconfig) access

#### For Lerna Users
If you are migrating from Lerna, it will also work with a `lerna.json` but it is recommended to eventually rename that file to `roller.json` since Lerna config file might be deprecated in the future. However please note that `"lerna": {}` will **not** work.

#### New Options
On top of Lerna's existing options, we added a few more options that might be useful
- `--git-dry-run` (shell) OR `"gitDryRun": true` (config file)
  - will run the version/publish command and log (info) all the git commands but without executing them
  - Note: it will still create the changelogs (if you have the option enabled), so it could be useful to see what get created (homewever, make sure to discard the changes after you're done)
- Version onlyy options
  - `--changelog-header-message "My Custom Header Message"` (shell) OR `"changelogHeaderMessage": "My Custom Header Message"`
    - this will be written, only once, at the top of all your changelog files (e.g.: a good example is to add reference to your website)
  - `--changelog-version-message "My custom message for each version"` (shell) OR `"changelogHeaderMessage": "My custom message for each version"`
    - this will be written as a prefix to your version change (e.g.: for example, provide more info about the new version changes)

### Troubleshooting
If you have problems running the lib, you should first look at the `--git-dry-run` option to see if that helps in finding the error. Another great, and possibly much more useful suggestion, is to search in the Lerna [issues](https://github.com/lerna/lerna/issues) because most of the code came originally from that library. Lastly if it that is not enough and you wish to troubleshoot yourself, then read this [Troubleshooting - Wiki](https://github.com/ghiscoding/ws-conventional-version-roller/wiki/Troubleshooting)
