[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/cli?color=forest)](https://www.npmjs.com/package/@lerna-lite/cli)
[![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?logo=npm&logoColor=fff&label=npm&color=limegreen)](https://www.npmjs.com/package/@lerna-lite/cli)
[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)

## Lerna-Lite Version/Publish/[Exec]/[Run] commands CLI
#### @lerna-lite/cli

CLI for the `publish`, `version` and optional `exec`, `run` commands, the CLI must be called via `lerna <command>` (where command is any of the commands shown below). You can see some more usage samples below.

**Note:** Please note that the `exec` and `run` commands are optional packages and must be installed separately.

### Internal Dependencies
- [@lerna-lite/core](https://github.com/ghiscoding/lerna-lite/tree/main/packages/core)
- [@lerna-lite/publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish)
- [@lerna-lite/version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version)
- [@lerna-lite/exec](https://github.com/ghiscoding/lerna-lite/tree/main/packages/exec) (optional)
- [@lerna-lite/run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) (optional)

## Installation
```sh
# simple install or install it globally with -g
npm install @lerna-lite/cli -D -W

# then use it `lerna <command>`
lerna version
lerna publish

# OR use npx
npx lerna publish
npx lerna version
```

## Usage
For all available options, refer to each command below
- [version](https://github.com/ghiscoding/lerna-lite/blob/main/packages/version/README.md)
- [publish](https://github.com/ghiscoding/lerna-lite/blob/main/packages/publish/README.md)
- [exec](https://github.com/ghiscoding/lerna-lite/blob/main/packages/exec/README.md) (optional)
- [run](https://github.com/ghiscoding/lerna-lite/blob/main/packages/run/README.md) (optional)
