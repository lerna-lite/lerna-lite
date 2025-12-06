# Contributing

We'd love for you to contribute and to make this project even better than it is today! If this interests you, please begin by reading the project [Wiki documentation](https://github.com/lerna-lite/lerna-lite/wiki). Once you consulted them and you believe that you can help us with new features, improvement, or even fixes, then go ahead and fork this repo and submit a Pull Request on a new branch.

## Initial Setup

### Setup Script

We have a setup script that will install necessary tooling for contributing to this project. You can run it by executing the following command in your terminal from the root of the repository:

```sh
cd lerna-lite
sh ./scripts/setup.sh
```

If you prefer, you may also follow the manual steps below.

### pnpm installation

This project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by following their [installation](https://pnpm.io/installation) or via `corepack enable` to run any of the pnpm scripts in this repo.

Install pnpm manually by picking 1 of these 2 choices:

1. following their [installation](https://pnpm.io/installation)

2. or install pnpm via Node corepack
```sh
corepack enable

# optionally update pnpm to latest
corepack prepare pnpm@latest --activate
```

### Manual Setup Steps

1. clone the lib:
   - `git clone https://github.com/lerna-lite/lerna-lite`

2. install with **pnpm** from the root:
   - `pnpm install` OR `npx pnpm install`

3. run Lint script
   - `pnpm lint`

4. run OXC Formatter script
   - `pnpm format`

5. run a full TypeScript (TSC) build
   - `pnpm build` OR `npx pnpm build`

6. run OXC lint type aware
   - `pnpm lint-type`

7. add/run Vitest unit tests (make sure to run the previous steps first):
   - `pnpm test:watch` (watch mode)
   - `pnpm test` (full test coverage)

**Note**: The Github CI runs the testing suite on Node 20, 22, and 24, so be sure to use one of those versions when running tests locally.

8. after executing steps 2 through 5 on your machine, you are ready to make changes and create a Pull Request...
