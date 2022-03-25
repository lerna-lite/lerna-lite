[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@lerna-lite/run.svg?color=forest)](https://www.npmjs.com/package/@lerna-lite/run)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/run?color=forest)](https://www.npmjs.com/package/@lerna-lite/run)
[![Actions Status](https://github.com/ghiscoding/lerna-lite/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/lerna-lite/actions)

# @lerna-lite/run
## (`lerna run`) - Run command CLI 🏃

**Optional package** extracted from Lerna [run command](https://github.com/lerna/lerna/tree/main/commands/run) that will give us the ability to run [npm script](https://docs.npmjs.com/misc/scripts) in each package of the workspace that contains that script. 

This package was added mainly because NPM Workspaces don't yet support running NPM scripts in parallel and in topological order (they do have this [RFC](https://github.com/npm/rfcs/issues/190), so perhaps someday this package would become irrelevant :)).

#### Internal Dependencies
- [@lerna-lite/core](https://github.com/ghiscoding/lerna-lite/tree/main/packages/core)

---

## Installation 
```sh
# install globally
npm install -g @lerna-lite/run

# then use it (see usage below)
lerna run <script>

# OR use npx
npx lerna run <script>
```

## Usage

```sh
$ lerna run <script> -- [..args]  # runs npm run my-script in all packages that have it
$ lerna run test
$ lerna run build

# watch all packages and transpile on change, streaming prefixed output
$ lerna run --parallel watch
```

Run an [npm script](https://docs.npmjs.com/misc/scripts) in each package of the workspace that contains that script. A double-dash (`--`) is necessary to pass dashed arguments to the script execution.

## Options

`lerna run` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options).

```sh
$ lerna run --scope my-component test
```

- [`@lerna/run`](#lernarun)
  - [Usage](#usage)
  - [Options](#options)
    - [`--npm-client <client>`](#--npm-client-client)
    - [`--run-dry-run`](#--run-dry-run) (new)
    - [`--stream`](#--stream)
    - [`--parallel`](#--parallel)
    - [`--no-bail`](#--no-bail)
    - [`--no-prefix`](#--no-prefix)
    - [`--profile`](#--profile)
    - [`--profile-location <location>`](#--profile-location-location)

### `--npm-client <client>`

Must be an executable that knows how to run npm lifecycle scripts.
The default `--npm-client` is `npm`.

```sh
$ lerna run build --npm-client=yarn
```

May also be configured in `lerna.json`:

```json
{
  "command": {
    "run": {
      "npmClient": "yarn"
    }
  }
}
```

### `--run-dry-run`

Displays the process command that would be performed without actually executing it. This could be helpful for troubleshooting.

```sh
$ lerna run watch --run-dry-run
```

### `--stream`

Stream output from child processes immediately, prefixed with the originating
package name. This allows output from different packages to be interleaved.

```sh
$ lerna run watch --stream
```

### `--parallel`

Similar to `--stream`, but completely disregards concurrency and topological sorting, running a given command or script immediately in all matching packages with prefixed streaming output. This is the preferred flag for long-running processes such as `npm run watch` run over many packages.

```sh
$ lerna run watch --parallel
```

> **Note:** It is advised to constrain the scope of this command when using
> the `--parallel` flag, as spawning dozens of subprocesses may be
> harmful to your shell's equanimity (or maximum file descriptor limit,
> for example). YMMV

### `--no-bail`

```sh
# Run an npm script in all packages that contain it, ignoring non-zero (error) exit codes
$ lerna run --no-bail test
```

By default, `lerna run` will exit with an error if _any_ script run returns a non-zero exit code.
Pass `--no-bail` to disable this behavior, running the script in _all_ packages that contain it regardless of exit code.

### `--no-prefix`

Disable package name prefixing when output is streaming (`--stream` _or_ `--parallel`).
This option can be useful when piping results to other processes, such as editor plugins.

### `--profile`

Profiles the script executions and produces a performance profile which can be analyzed using DevTools in a
Chromium-based browser (direct url: `devtools://devtools/bundled/devtools_app.html`). The profile shows a timeline of
the script executions where each execution is assigned to an open slot. The number of slots is determined by the
`--concurrency` option and the number of open slots is determined by `--concurrency` minus the number of ongoing
operations. The end result is a visualization of the parallel execution of your scripts.

The default location of the performance profile output is at the root of your project.

```sh
$ lerna run build --profile
```

> **Note:** Lerna-Lite will only profile when topological sorting is enabled (i.e. without `--parallel` and `--no-sort`).

### `--profile-location <location>`

You can provide a custom location for the performance profile output. The path provided will be resolved relative to the current working directory.

```sh
$ lerna run build --profile --profile-location=logs/profile/
```
