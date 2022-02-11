[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@ws-conventional-version-roller/cli.svg?color=forest)](https://www.npmjs.com/package/@ws-conventional-version-roller/cli)
[![npm](https://img.shields.io/npm/dy/@ws-conventional-version-roller/cli?color=forest)](https://www.npmjs.com/package/@ws-conventional-version-roller/cli)
[![Actions Status](https://github.com/ghiscoding/ws-conventional-version-roller/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/ws-conventional-version-roller/actions)

## Roller Version/Publish comands CLI
#### @ws-conventional-version-roller/cli

This will eventually be a real CLI but for now it is the library main entry point to roll a new Version or Publish.

### Internal Dependencies
- [@ws-conventional-version-roller/core](https://github.com/ghiscoding/ws-conventional-version-roller/tree/main/packages/core)
- [@ws-conventional-version-roller/publish](https://github.com/ghiscoding/ws-conventional-version-roller/tree/main/packages/publish)
- [@ws-conventional-version-roller/version](https://github.com/ghiscoding/ws-conventional-version-roller/tree/main/packages/version)

## Installation 
```sh
# install globally
npm install -g @ws-conventional-version-roller/cli

# then use it `ws-roller <command>`
ws-roller publish
ws-roller version

# OR use npx
npx ws-roller publish
npx ws-roller version
```
