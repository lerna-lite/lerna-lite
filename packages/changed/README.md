[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/changed?color=forest)](https://www.npmjs.com/package/@lerna-lite/changed)
[![npm](https://img.shields.io/npm/v/@lerna-lite/changed.svg?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@lerna-lite/changed)

# @lerna-lite/changed

## (`lerna changed`) - Changed command [optional] 🕜

List local packages that have changed since the last tagged release

---

## Installation

```sh
npm install @lerna-lite/changed -D

# then use it (see usage below)
lerna changed
```

## Usage

The output of `lerna changed` is a list of packages that would be the subjects of the next `lerna version` or `lerna publish` execution.

```sh
$ lerna changed
package-1
package-2
```

**Note:** `lerna.json` configuration for `lerna publish` _and_ `lerna version` also affects
`lerna changed`, e.g. `command.publish.ignoreChanges`.

## Options

`lerna changed` supports all of the flags supported by [`lerna ls`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#options):

- [`--json`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#--json)
- [`--ndjson`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#--ndjson)
- [`-a`, `--all`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#--all)
- [`-l`, `--long`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#--long)
- [`-p`, `--parseable`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#--parseable)
- [`--toposort`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#--toposort)
- [`--graph`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/list#--graph)

Unlike `lerna ls`, however, `lerna changed` **does not** support [filter options](https://www.npmjs.com/package/@lerna/filter-options), as filtering is not supported by `lerna version` or `lerna publish`.

`lerna changed` supports the following options of [`lerna version`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#options) (the others are irrelevant):

- [`--conventional-graduate`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--conventional-graduate).
- [`--force-conventional-graduate`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--force-conventional-graduate).
- [`--force-publish`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--force-publish).
- [`--ignore-changes`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--ignore-changes).
- [`--include-merged-tags`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--include-merged-tags).
