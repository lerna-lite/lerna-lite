[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/diff?color=forest)](https://www.npmjs.com/package/@lerna-lite/diff)
[![npm](https://img.shields.io/npm/v/@lerna-lite/diff.svg?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@lerna-lite/diff)

# @lerna-lite/diff

## (`lerna diff`) - Diff command [optional] 🌓

Diff all packages or a single package since the last release

---

## Installation

```sh
npm install @lerna-lite/diff -D -W

# then use it (see usage below)
lerna diff

# OR use npx
npx lerna diff
```

## Usage

```sh
$ lerna diff [package]

$ lerna diff

# diff a specific package
$ lerna diff package-name
```

Diff all packages or a single package since the last release.

> Similar to `lerna changed`. This command runs `git diff`.
