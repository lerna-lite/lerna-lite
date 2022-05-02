[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@lerna-lite/info.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/info)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/info?color=forest)](https://www.npmjs.com/package/@lerna-lite/info)
[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)

# @lerna-lite/info
## (`lerna info`) - Info command 💻

Print local environment information

---

## Installation
```sh
npm install @lerna-lite/cli

# then use it (see usage below)
lerna info

# OR use npx
npx lerna info
```

## Usage

The `info` prints local environment information that proves to be useful especially while submitting bug reports.

`lerna info`

```bash
Environment Info:

  System:
    OS: Linux 4.18 Ubuntu 18.10 (Cosmic Cuttlefish)
    CPU: (4) x64 Intel(R) Core(TM) i5-7200U CPU @ 2.50GHz
  Binaries:
    Node: 8.11.4 - /usr/bin/node
    Yarn: 1.17.0-0 - /usr/local/bin/yarn
    npm: 6.9.0 - /usr/local/bin/npm
  Browsers:
    Chrome: 74.0.3729.157
    Firefox: 66.0.5
  npmPackages:
    lerna: 3.14.1
```