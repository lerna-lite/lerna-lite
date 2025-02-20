[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/core?color=forest)](https://www.npmjs.com/package/@lerna-lite/core)
[![npm](https://img.shields.io/npm/v/@lerna-lite/core.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/core)

## Lerna-Lite Core

#### @lerna-lite/core

The Lerna-Lite core & utils, basically the shared code used by all commands.

### Installation

Follow the instruction provided in the main [README](https://github.com/lerna-lite/lerna-lite#installation) page.


> Options for lerna sub-commands that need filtering

## Options

### `--scope <glob>`

Include only packages with names matching the given glob.

```sh
$ lerna exec --scope my-component -- ls -la
$ lerna run --scope "toolbar-*" test
$ lerna run --scope package-1 --scope "*-2" lint
```

**Note:** For certain globs, it may be necessary to quote the option argument to avoid premature shell expansion.

### **Running with `npx`**

When running `lerna` with `npx`, it is necessary to use an explicit "=" when passing glob arguments. This is to prevent `npx` from prematurely expanding the arguments.

For example:

```sh
$ npx lerna run --scope="toolbar-*" test
$ npx lerna run --scope="package-{1,2,5}" test
```

### `--ignore <glob>`

Exclude packages with names matching the given glob.

```sh
$ lerna exec --ignore "package-{1,2,5}"  -- ls -la
$ lerna run --ignore package-1 test
$ lerna run --ignore "package-@(1|2)" --ignore package-3 lint
```

More examples of filtering can be found [here](https://github.com/lerna/lerna/blob/c0a750e0f482c16dda2f922f235861283efbe94d/commands/list/__tests__/list-command.test.js#L305-L356).

### `--no-private`

Exclude private packages. They are included by default.

### `--since [ref]`

Only include packages that have been changed since the specified `ref`. If no ref is passed, it defaults to the most-recent tag.

```sh
# List the contents of packages that have changed since the latest tag
$ lerna exec --since -- ls -la

# Run the tests for all packages that have changed since `main`
$ lerna run test --since main

# List all packages that have changed since `some-branch`
$ lerna ls --since some-branch
```

_This can be particularly useful when used in CI, if you can obtain the target branch a PR will be going into, because you can use that as the `ref` to the `--since` option. This works well for PRs going into the default branch as well as feature branches._

### `--exclude-dependents`

Exclude all transitive dependents when running a command with `--since`, overriding the default "changed" algorithm.

This flag has no effect without `--since`, and will throw an error in that case.

### `--include-dependents`

Include all transitive dependents when running a command regardless of `--scope`, `--ignore`, or `--since`.

```sh
# example with lerna watch
$ lerna watch --scope=my-package-1 --include-dependents -- lerna run build --stream --scope=\$LERNA_PACKAGE_NAME --include-dependents
```

### `--include-dependencies`

Include all transitive dependencies when running a command regardless of `--scope`, `--ignore`, or `--since`.

Used in combination with any command that accepts `--scope` (`ls`, `run`, `exec`, `watch`).
Ensures that all dependencies (and dev dependencies) of any scoped packages (either through `--scope` or `--ignore`) are operated on as well.

> Note: This will override the `--scope` and `--ignore` flags.

This is useful for situations where you want to "set up" a single package that relies on other packages being set up.

```sh
# example with lerna watch, watch only package "package-4" and its dependencies and run the test script for the package that changed
$ lerna watch --scope="package-4" --include-dependencies -- lerna run test --scope=\$LERNA_PACKAGE_NAME
```


### `--include-merged-tags`

```sh
$ lerna exec --since --include-merged-tags -- ls -la
```

Include tags from merged branches when running a command with `--since`. This is only useful if you do a lot of publishing from feature branches, which is not generally recommended.
