[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@lerna-lite/cli.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/cli)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/cli?color=forest)](https://www.npmjs.com/package/@lerna-lite/cli)
[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)

## Lerna-Lite Version/Publish comands CLI
#### @lerna-lite/cli

CLI for the `publish` and `version` commands, the CLI must be called with `ws-roller <command>` (where command is either `publish` or `version`). You can see some more usage samples below.

### Internal Dependencies
- [@lerna-lite/core](https://github.com/ghiscoding/lerna-lite/tree/main/packages/core)
- [@lerna-lite/publish](https://github.com/ghiscoding/lerna-lite/tree/main/packages/publish)
- [@lerna-lite/version](https://github.com/ghiscoding/lerna-lite/tree/main/packages/version)

## Installation 
```sh
# install globally
npm install -g @lerna-lite/cli

# then use it `ws-roller <command>`
ws-roller publish
ws-roller version

# OR use npx
npx ws-roller publish
npx ws-roller version
```

## Usage
For all available options, refer to each command below
- [version](https://github.com/ghiscoding/lerna-lite/blob/main/packages/version/README.md)
- [publish](https://github.com/ghiscoding/lerna-lite/blob/main/packages/publish/README.md)
