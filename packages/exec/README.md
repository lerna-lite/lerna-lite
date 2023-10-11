[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/exec?color=forest)](https://www.npmjs.com/package/@lerna-lite/exec)
[![npm](https://img.shields.io/npm/v/@lerna-lite/exec.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/exec)

# @lerna-lite/exec

## (`lerna exec`) - Exec command [optional] 👷

**Optional package** extracted from Lerna `exec` command that will give us the ability to execute an arbitrary command in each package.

This package was added mainly because NPM Workspaces don't yet support executing commands in parallel and in topological order (they do have this [RFC](https://github.com/npm/rfcs/issues/190), so perhaps someday this package would become irrelevant :)).

---

## Installation

```sh
npm install @lerna-lite/exec -D

# then use it (see usage below)
lerna exec <command>
```

## Usage

```sh
$ lerna exec -- <command> [..args] # runs the command in all packages
$ lerna exec -- rm -rf ./node_modules
$ lerna exec -- protractor conf.js
```

Run an arbitrary command in each package.
A double-dash (`--`) is necessary to pass dashed flags to the spawned command, but is not necessary when all the arguments are positional.

The name of the current package is available through the environment variable `LERNA_PACKAGE_NAME`:

```sh
$ lerna exec -- npm view \$LERNA_PACKAGE_NAME
```

You may also run a script located in the root dir, in a complicated dir structure through the environment variable `LERNA_ROOT_PATH`:

```sh
$ lerna exec -- node \$LERNA_ROOT_PATH/scripts/some-script.js
```

## Options

`lerna exec` accepts all [filter flags](https://github.com/lerna-lite/lerna-lite/blob/main/packages/filter-packages/README.md#options).

```sh
$ lerna exec --scope my-component -- ls -la
```

> **Note** When executing the command in the shell, you will need to surround the command provided to `lerna exec` in quotes (what comes after double-dash ` -- `). Without this, the entire line is interpreted by your shell before lerna ever sees it and causes command flags to be returned as unknown. For example `lerna exec -- 'git log -p -2'`. This is not required when used as an npm script.

- [`@lerna/exec`](#lernaexec)
  - [Usage](#usage)
  - [Options](#options)
    - [`--dry-run`](#--dry-run)
    - [`--stream`](#--stream)
    - [`--parallel`](#--parallel)
    - [`--no-bail`](#--no-bail)
    - [`--no-prefix`](#--no-prefix)
    - [`--profile`](#--profile)
    - [`--profile-location <location>`](#--profile-location-location)

> The commands are spawned in parallel, using the concurrency given (except with `--parallel`).
> The output is piped through, so not deterministic.
> If you want to run the command in one package after another, use it like this:

```sh
$ lerna exec --concurrency 1 -- ls -la
```

### `--dry-run`

Displays the execution command that would be performed without actually executing it. This could be helpful for troubleshooting.

```sh
$ lerna exec echo hello world --dry-run
```

### `--stream`

Stream output from child processes immediately, prefixed with the originating
package name. This allows output from different packages to be interleaved.

```sh
$ lerna exec --stream -- babel src -d lib
```

### `--parallel`

Similar to `--stream`, but completely disregards concurrency and topological sorting, running a given command or script immediately in all matching packages with prefixed streaming output. This is the preferred flag for long-running processes such as `babel src -d lib -w` run over many packages.

```sh
$ lerna exec --parallel -- babel src -d lib -w
```

> **Note:** It is advised to constrain the scope of this command when using
> the `--parallel` flag, as spawning dozens of subprocesses may be
> harmful to your shell's equanimity (or maximum file descriptor limit,
> for example). YMMV

### `--no-bail`

```sh
# Run a command, ignoring non-zero (error) exit codes
$ lerna exec --no-bail <command>
```

By default, `lerna exec` will exit with an error if _any_ execution returns a non-zero exit code.
Pass `--no-bail` to disable this behavior, executing in _all_ packages regardless of exit code.

### `--no-prefix`

Disable package name prefixing when output is streaming (`--stream` _or_ `--parallel`).
This option can be useful when piping results to other processes, such as editor plugins.

### `--profile`

Profiles the command executions and produces a performance profile which can be analyzed using DevTools in a
Chromium-based browser (direct url: `devtools://devtools/bundled/devtools_app.html`). The profile shows a timeline of
the command executions where each execution is assigned to an open slot. The number of slots is determined by the
`--concurrency` option and the number of open slots is determined by `--concurrency` minus the number of ongoing
operations. The end result is a visualization of the parallel execution of your commands.

The default location of the performance profile output is at the root of your project.

```sh
$ lerna exec --profile -- <command>
```

> **Note:** Lerna will only profile when topological sorting is enabled (i.e. without `--parallel` and `--no-sort`).

### `--profile-location <location>`

You can provide a custom location for the performance profile output. The path provided will be resolved relative to the current working directory.

```sh
$ lerna exec --profile --profile-location=logs/profile/ -- <command>
```
