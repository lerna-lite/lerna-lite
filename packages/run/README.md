[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@ws-conventional-version-roller/run.svg?color=forest)](https://www.npmjs.com/package/@ws-conventional-version-roller/run)
[![npm](https://img.shields.io/npm/dy/@ws-conventional-version-roller/run?color=forest)](https://www.npmjs.com/package/@ws-conventional-version-roller/run)
[![Actions Status](https://github.com/ghiscoding/ws-conventional-version-roller/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/ws-conventional-version-roller/actions)

# @ws-conventional-version-roller/run
## (`ws-runner`) Run command CLI

**Optional package** extracted from Lerna [run command](https://github.com/lerna/lerna/tree/main/commands/run) that will give us the ability to run [npm script](https://docs.npmjs.com/misc/scripts) in each package of the workspace that contains that script. 

This package was added mainly because NPM Workspaces don't yet support running NPM scripts in parallel (they do have this [RFC](https://github.com/npm/rfcs/issues/190), so perhaps someday this package would become irrelevant :)).

### Internal Dependencies
- [@ws-conventional-version-roller/core](https://github.com/ghiscoding/ws-conventional-version-roller/tree/main/packages/core)

---

## Installation 
```sh
# install globally
npm install -g
# then use it (see usage below)
ws-roller run <script>

# OR use npx
npx ws-roller run <script>
```

## Usage

```sh
$ ws-runner run <script> -- [..args] # runs npm run my-script in all packages that have it
$ ws-runner run test
$ ws-runner run build

# watch all packages and transpile on change, streaming prefixed output
$ ws-runner run --parallel watch
```

Run an [npm script](https://docs.npmjs.com/misc/scripts) in each package of the workspace that contains that script. A double-dash (`--`) is necessary to pass dashed arguments to the script execution.

## Options

`ws-runner run` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options).

```sh
$ ws-runner run --scope my-component test
```

### `--npm-client <client>`

Must be an executable that knows how to run npm lifecycle scripts.
The default `--npm-client` is `npm`.

```sh
$ ws-runner run build --npm-client=yarn
```

May also be configured in `roller.json`:

```json
{
  "command": {
    "run": {
      "npmClient": "yarn"
    }
  }
}
```

### `--stream`

Stream output from child processes immediately, prefixed with the originating
package name. This allows output from different packages to be interleaved.

```sh
$ ws-runner run watch --stream
```

### `--parallel`

Similar to `--stream`, but completely disregards concurrency and topological sorting, running a given command or script immediately in all matching packages with prefixed streaming output. This is the preferred flag for long-running processes such as `npm run watch` run over many packages.

```sh
$ ws-runner run watch --parallel
```

> **Note:** It is advised to constrain the scope of this command when using
> the `--parallel` flag, as spawning dozens of subprocesses may be
> harmful to your shell's equanimity (or maximum file descriptor limit,
> for example). YMMV

### `--no-bail`

```sh
# Run an npm script in all packages that contain it, ignoring non-zero (error) exit codes
$ ws-runner run --no-bail test
```

By default, `ws-runner run` will exit with an error if _any_ script run returns a non-zero exit code.
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
$ ws-runner run build --profile
```

> **Note:** Roller will only profile when topological sorting is enabled (i.e. without `--parallel` and `--no-sort`).

### `--profile-location <location>`

You can provide a custom location for the performance profile output. The path provided will be resolved relative to the current working directory.

```sh
$ ws-runner run build --profile --profile-location=logs/profile/
```
