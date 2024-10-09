# Contributing

We'd love for you to contribute and to make this project even better than it is today! If this interests you, please begin by reading the project [Wiki documentation](https://github.com/lerna-lite/lerna-lite/wiki). Once you consulted them and you believe that you can help us with new features, improvement or even fixes then go ahead and submit a Pull Request.

**Note**: this project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by following their [installation](https://pnpm.io/installation) or via `corepack enable` to run any of the pnpm scripts shown below:

### pnpm installation

This project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by picking 1 of these 2 choices: 

1. following their [installation](https://pnpm.io/installation)

2. or install pnpm via Node corepack
```sh
corepack enable

# optionally update pnpm to latest
corepack prepare pnpm@latest --activate
```

### Steps

1. clone the lib:
   - `git clone https://github.com/lerna-lite/lerna-lite`
2. install with **pnpm** from the root:
   - `pnpm install` OR `npx pnpm install`
3. run Lint script
  - `pnpm prettier:write`
4. run a full TypeScript (TSC) build
   - `pnpm build` OR `npx pnpm build`
5. add/run Vitest unit tests (make sure to run the previous steps first):
   - `pnpm test:watch` (watch mode)
   - `pnpm test` (full test coverage)
6. after achieving step 2 to 5, then the final step would be to create the Pull Request...
