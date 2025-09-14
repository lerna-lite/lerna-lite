[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/clean?color=forest)](https://www.npmjs.com/package/@lerna-lite/clean)
[![npm](https://img.shields.io/npm/v/@lerna-lite/clean.svg?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@lerna-lite/clean)

# @lerna-lite/clean

## (`lerna clean`) - Clean command [optional] 🚿

Remove the node_modules directory from all packages

---

## Installation

```sh
npm install @lerna-lite/clean -D

# then use it (see usage below)
lerna clean
```

## Usage

Remove the `node_modules` directory from all packages.

`lerna clean` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options), as well as `--yes`.


> `lerna clean` does not remove modules from the root `node_modules` directory, even if you have the `--hoist` option enabled.

### `--yes`

```sh
lerna clean --yes
# skips `Proceed?`
```

When run with this flag, `lerna clean` will skip all confirmation prompts.
