# Workspace Conventional Changelog Version Roller

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

### License
[MIT License](LICENSE)

### Why and when to use this lib?
You would use this lib when your project is an NPM/Yarn Workspace monorepo structure and you wish to automate Versioning and Publishing of all your packages by following the [Conventional Commits](https://www.conventionalcommits.org/) and also automatically create [Conventional-Changelog](https://github.com/conventional-changelog/conventional-changelog) for each of your package (and also a main changelog in the root).

### Inspiration
The vast majority of the code come from [Lerna](https://github.com/lerna/lerna) and only 2 commands ([version](https://github.com/lerna/lerna/tree/main/commands/version#readme) and [publish](https://github.com/lerna/lerna/tree/main/commands/publish#readme)) were extracted from Lerna. This lib was mainly created to migrate Lerna projects to plain NPM/Yarn Workspace (also because Lerna is no longer maintained). Lerna is a fairly large library with lots of dependencies, however we no longer need all the features of Lerna especially so since NPM released their recent [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) directly in NPM. However NPM/Yarn Workspace will never provide ways to automate versioning & publishing and this lib was created for that purpose.

#### Questions & Answers
- [Q] Do I need a Lerna project to use this lib?
   - [A] Not at all, however if you do then it will be easy for you to get started
- [Q] What is the minimum that I need to get started
   - [A] see the [configurations](/ghiscoding/ws-conventional-version-roller#configuration) below, the short answer is you will need a `roller` config and that's about it
- [Q] Coming from Lerna, can I use my `lerna.json` file without any changes?
   - [A] Yes you can, the settings are the same but we still recommend to renaming the config file to `roller.json`

### Usage
Open a shell in the root of your monorepo workspace project and run the following NodeJS command
```bash
 node ./node_modules/@ws-conventional-version-roller/cli/dist/index.js --run-version
```
**NOTE** I wish to eventually add a CLI to make this easier, but for now that will do

### Configuration
This lib requires a config file in order to do its job properly. It could come from a separate file `roller.json` in the root of your project OR a `"roller": {}` property directly under your `package.json`. 

#### Command Options
- `version` same as Lerna [version options](https://github.com/lerna/lerna/tree/main/commands/version#readme)
- `publish` same as Lerna [publish options](https://github.com/lerna/lerna/tree/main/commands/publish#readme)
#### New Options
On top of Lerna's options, we added a few more options that might be useful
- `--git-dry-run` (shell) OR `"gitDryRun": true` (config file)
  - will run the version/publish command and log (info) all the git commands but without executing them
  - Note: it will still create the changelogs (if you have the option enabled), so it could be useful to see what get created (homewever, make sure to discard the changes after you're done)
- `--changelog-header-message "My Custom Header Message"` (shell) OR `"changelogHeaderMessage": "My Custom Header Message"`
   - this will be written, only once, at the top of all your changelog files (e.g.: a good example is to add reference to your website)
- `--changelog-version-message "My custom message for each version"` (shell) OR `"changelogHeaderMessage": "My custom message for each version"`
   - this will be written as a prefix to your version change (e.g.: for example, provide more info about the new version changes)

#### For Lerna Users
If you are migrating from Lerna, it will also work with a `lerna.json` but it is recommended to eventually rename that file to `roller.json` since Lerna config file might be deprecated in the future. However please note that `"lerna": {}` will **not** work.
