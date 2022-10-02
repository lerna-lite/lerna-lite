[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/run?color=forest)](https://www.npmjs.com/package/@lerna-lite/run)
[![npm](https://img.shields.io/npm/v/@lerna-lite/run.svg?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@lerna-lite/run)

# @lerna-lite/run

## (`lerna run`) - Run command [optional] 🏃

**Optional package** extracted from Lerna [run command](https://github.com/lerna/lerna/tree/main/commands/run) that will give us the ability to run [npm script](https://docs.npmjs.com/misc/scripts) in each package of the workspace that contains that script.

This package was added mainly because NPM Workspaces don't yet support running NPM scripts in parallel and in topological order (they do have this [RFC](https://github.com/npm/rfcs/issues/190), so perhaps someday this package would become irrelevant :)).

---

## Installation

```sh
npm install @lerna-lite/run -D -W

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

The name of the current package is available through the environment variable `LERNA_PACKAGE_NAME`:

```sh
$ lerna run build \$LERNA_PACKAGE_NAME
```

## Options

`lerna run` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options).

```sh
$ lerna run --scope my-component test
```

- [`@lerna/run`](#lernarun)
  - [Usage](#usage)
  - [Options](#options)
    - [`--npm-client <client>`](#--npm-client-client)
    - [`--cmd-dry-run`](#--cmd-dry-run) (new)
    - [`--stream`](#--stream)
    - [`--parallel`](#--parallel)
    - [`--no-bail`](#--no-bail)
    - [`--no-prefix`](#--no-prefix)
    - [`--profile`](#--profile)
    - [`--profile-location <location>`](#--profile-location-location)
  - Features
    - [`useNx` (experimental)](#usenx-experimental)

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

### `--cmd-dry-run`

Displays the process command that would be performed without actually executing it. This could be helpful for troubleshooting.

```sh
$ lerna run test:coverage --cmd-dry-run
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

### `useNx` (experimental)

Enables integration with [Nx](https://nx.dev). Setting `"useNx": true` in `lerna.json` will tell Lerna to delegate
running tasks to Nx instead of using `p-map` and `p-queue`. This only works if Nx is installed and `nx.json` is present. You can also skip cache by providing `--skip-nx-cache`

Example of `nx.json`:

```json
{
  "extends": "nx/presets/npm.json",
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build"]
      }
    }
  }
}
```

When [Nx](https://nx.dev/) is installed and `nx.json` is detected in the current workspace with `useNx` set to `true` in `lerna.json`, Lerna will respect `nx.json` configuration during `lerna run` and delegate to the Nx task runner.

Nx will run tasks in an order and with a concurrency that it determines appropriate based on the task graph that it creates. For more information, see [Nx Mental Model: The Task Graph](https://nx.dev/concepts/mental-model#the-task-graph).

**This behavior allows Nx to run tasks in the most efficient way possible, but it also means that some existing options for `lerna run` become obsolete as explained below.**

> **Note** when Lerna is set to use Nx and detects `nx.json` in the workspace, it will defer to Nx to detect task dependencies. Some options for `lerna run` will behave differently. See [Using Lerna (Powered by Nx) to Run Tasks](./recipes/using-lerna-powered-by-nx-to-run-tasks) for more details.

#### Obsolete Options when `useNx` is enabled

##### `--sort` and `--no-sort`

Nx will always run tasks in the order it deems is correct based on its knowledge of project and task dependencies, so `--sort` and `--no-sort` have no effect.

##### `--parallel`

Nx will use the task graph to determine which tasks can be run in parallel and do so automatically, so `--parallel` has no effect.

> **Note** if you want to limit the concurrency of tasks, you can still use the [concurrency global option](https://github.com/lerna/lerna/blob/6cb8ab2d4af7ce25c812e8fb05cd04650105705f/core/global-options/README.md#--concurrency) to accomplish this.


##### `--include-dependencies`

Lerna by itself does not have knowledge of which tasks depend on others, so it defaults to excluding tasks on dependent projects when using [filter options](https://github.com/lerna/lerna/tree/6cb8ab2d4af7ce25c812e8fb05cd04650105705f/core/filter-options#lernafilter-options) and relies on `--include-dependencies` to manually specify that dependent projects' tasks should be included.

This is no longer a problem when Lerna uses Nx to run tasks. Nx, utilizing its [task graph](https://nx.dev/concepts/mental-model#the-task-graph), will automatically run dependent tasks first when necessary, so `--include-dependencies` is obsolete. However, it can still be used to include project dependencies that Lerna detects but Nx does not deem necessary and would otherwise exclude.

### `--ignore`

When used with Nx, `--ignore` will never cause `lerna run` to exclude any tasks that are deemed to be required by the Nx [task graph](https://nx.dev/concepts/mental-model#the-task-graph).

> **Tip** the effects on the options above will only apply if `nx.json` exists in the root. If `nx.json` does not exist and `useNx` is `true`, then they will behave just as they would with Lerna's base task runner (if `useNx` is `false`).