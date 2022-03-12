[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/cli)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/cli?color=forest)](https://www.npmjs.com/package/@lerna-lite/cli)
[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)

## Lerna-Lite Version/Publish/[Run] commands CLI
#### @lerna-lite/cli

CLI for the `publish`, `version` and `run` commands, the CLI must be called with `lerna <command>` (where command is either `publish`, `version` or `run`). You can see some more usage samples below.

**Note:** Please note that the `run` command is an optional package and must be installed separately.

### Internal Dependencies
- [@lerna-lite/core](https://github.com/ghiscoding/lerna-lite/tree/main/packages/core)
- [@lerna-lite/publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish)
- [@lerna-lite/version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version)
- [@lerna-lite/run](https://github.com/ghiscoding/lerna-lite/tree/main/packages/run) (optional)

## Installation 
```sh
# install globally
npm install -g @lerna-lite/cli

# then use it `lerna <command>`
lerna publish
lerna version

# OR use npx
npx lerna publish
npx lerna version
```

## Usage
For all available options, refer to each command below
- [version](https://github.com/ghiscoding/lerna-lite/blob/main/packages/version/README.md)
- [publish](https://github.com/ghiscoding/lerna-lite/blob/main/packages/publish/README.md)
- [run](https://github.com/ghiscoding/lerna-lite/blob/main/packages/run/README.md) (optional)
