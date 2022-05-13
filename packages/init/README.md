[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/init?color=forest)](https://www.npmjs.com/package/@lerna-lite/init)
[![npm](https://img.shields.io/npm/v/@lerna-lite/init.svg?logo=npm&logoColor=fff&label=npm&color=limegreen)](https://www.npmjs.com/package/@lerna-lite/init)

# @lerna-lite/init
## (`lerna init`) - Init command 🏁

Create/initialize a new Lerna-Lite repo or upgrade an existing repo to the current version of Lerna-Lite CLI

---

## Installation
```sh
npm install @lerna-lite/cli -D -W

# then use it (see usage below)
lerna init

# OR use npx
npx lerna init
```

## Usage

```sh
$ lerna init
```

Create/initialize a new Lerna=Lite repo or upgrade an existing repo to the current version of Lerna-Lite.

> Lerna assumes the repo has already been initialized with `git init`.

When run, this command will:

1. Add `lerna` as a [`devDependency`](https://docs.npmjs.com/files/package.json#devdependencies) in `package.json` if it doesn't already exist.
2. Create a `lerna.json` config file to store the `version` number.

Example output on a new git repo:

```sh
$ lerna init
lerna info version v2.0.0
lerna info Updating package.json
lerna info Creating lerna.json
lerna success Initialized Lerna files
```

## Options

### `--independent`

```sh
$ lerna init --independent
```

This flag tells Lerna to use independent versioning mode.

### `--exact`

```sh
$ lerna init --exact
```

By default, `lerna init` will use a caret range when adding or updating
the local version of `lerna`, just like `npm install --save-dev lerna`.

To retain the `lerna` 1.x behavior of "exact" comparison, pass this flag.
It will configure `lerna.json` to enforce exact match for all subsequent executions.

```json
{
  "command": {
    "init": {
      "exact": true
    }
  },
  "version": "0.0.0"
}
```
