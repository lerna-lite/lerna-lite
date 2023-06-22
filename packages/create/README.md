[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/create?color=forest)](https://www.npmjs.com/package/@lerna-lite/create)
[![npm](https://img.shields.io/npm/v/@lerna-lite/create.svg?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@lerna-lite/create)

# @lerna-lite/create

## (`lerna create`) - Create command [optional] 📐

Create a new lerna-managed package

---

## Installation

```sh
npm install @lerna-lite/create -D

# then use it (see usage below)
lerna create <name>
```

## Usage

The `create` command will create a new lerna-managed package, a name is argument is required. The package name (including scope), which must be locally unique _and_ publicly available on the registry.

```sh
$ lerna create <name> 
$ lerna create @monorepo/pkg-1
```

A custom package location, defaulting to the first configured package

```sh
$ lerna create <name> [loc]
$ lerna create @monorepo/pkg-1 my-location
```

## Options

- [`--access`](#--access)
- [`--bin`](#--bin)
- [`--description`](#--description)
- [`--dependencies`](#--dependencies)
- [`--es-module`](#--es-module)
- [`--homepage`](#--homepage)
- [`--keywords`](#--keywords)
- [`--license`](#--license)
- [`--private`](#--private)
- [`--registry`](#--registry)
- [`--tag`](#--tag)
- [`--yes`](#--yes)


### `--access`

 When using a scope, set `publishConfig.access` value (choices: `public`, `restricted`) defaults to `public`.

```sh
$ lerna create @monorepo/pkg-1 --access public
```

### `--bin`

Package has an executable. Customize with `--bin <executableName>`, defaults to package `<name>`.

```sh
$ lerna create @monorepo/pkg-1 --bin pkg-exec
```

### `--description`

Package description

```sh
$ lerna create @monorepo/pkg-1 --description "My package description"
```

### `--dependencies`

A list of package dependencies

```sh
$ lerna create @monorepo/pkg-1 --dependencies pkg-2 pkg-3
```

### `--es-module`

Initialize a transpiled ES Module

```sh
$ lerna create @monorepo/pkg-1 --es-module
```

### `--homepage`

The package homepage, defaulting to a subpath of the root

```sh
$ lerna create @monorepo/pkg-1 --homepage "http://my-website.com"
```

### `--keywords`

A list of package keywords

```sh
$ lerna create @monorepo/pkg-1 --keywords graphql vue
```

### `--license`

The desired package license (SPDX identifier), defaults to `ISC`

```sh
$ lerna create @monorepo/pkg-1 --license MIT
```

### `--private`

Make the new package private, never published

```sh
$ lerna create @monorepo/pkg-1 --private
```

### `--registry`

Configure the package's `publishConfig.registry`

```sh
$ lerna create @monorepo/pkg-1 --registry "https://www.npmjs.com/"
```

### `--tag`

Configure the package's publishConfig.tag             [string]

```sh
$ lerna create @monorepo/pkg-1 --tag tag1 tag2
```

### `--yes`

Skip all prompts, which equals to accepting all default values

```sh
$ lerna create @monorepo/pkg-1 --yes
```
