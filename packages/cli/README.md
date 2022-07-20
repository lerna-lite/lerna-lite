[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/cli?color=forest)](https://www.npmjs.com/package/@lerna-lite/cli)
[![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/cli)

## Lerna-Lite commands CLI

### Available commands are shown below

---

#### @lerna-lite/cli

CLI for the `init`, `info`, `publish`, `version` and optional commands, the CLI must be called via `lerna <command>` (where command is any of the commands shown below). You can see some more usage samples below.

**Note:** Please note that the `changed`, `diff`, `exec`, `list` and `run` commands are optional packages and must be installed separately.

## Installation

```sh
# simple install or install it globally with -g
npm install @lerna-lite/cli -D -W

# then use it `lerna <command>`
lerna info
lerna version
lerna publish

# OR use npx
npx lerna publish
npx lerna version
```

## Usage

For all available options of each command, follow any of the command link shown below:

- included with CLI
  - [lerna init](https://github.com/ghiscoding/lerna-lite/blob/main/packages/init/README.md)
  - [lerna info](https://github.com/ghiscoding/lerna-lite/blob/main/packages/info/README.md)
  - [lerna publish](https://github.com/ghiscoding/lerna-lite/blob/main/packages/publish/README.md)
  - [lerna version](https://github.com/ghiscoding/lerna-lite/blob/main/packages/version/README.md)
- **optional commands** (requires a separate install, refer to the [installation](https://github.com/ghiscoding/lerna-lite#installation) table)
  - [lerna changed](https://github.com/ghiscoding/lerna-lite/blob/main/packages/changed/README.md)
  - [lerna diff](https://github.com/ghiscoding/lerna-lite/blob/main/packages/diff/README.md)
  - [lerna exec](https://github.com/ghiscoding/lerna-lite/blob/main/packages/exec/README.md)
  - [lerna list](https://github.com/ghiscoding/lerna-lite/blob/main/packages/list/README.md)
  - [lerna run](https://github.com/ghiscoding/lerna-lite/blob/main/packages/run/README.md)
