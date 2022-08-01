# Contributing

We'd love for you to contribute and to make this project even better than it is today! If this interests you, please begin by reading the project [Wiki documentation](https://github.com/ghiscoding/lerna-lite/wiki). Once you consulted them and you believe that you can help us with new features, improvement or even fixes then go ahead and submit a Pull Request.

**Note**: this project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by following their [installation](https://pnpm.io/installation) or simply run `npx pnpm` to run any of the pnpm scripts shown below:

1. clone the lib:
   - `git clone https://github.com/ghiscoding/lerna-lite`
2. install with **pnpm** from the root:
   - `pnpm install` OR `npx pnpm install`
3. run Lint script
  - `pnpm format:write`
4. run a full TypeScript (TSC) build
   - `pnpm build` OR `npx pnpm build`
5. add/run Jest unit tests (make sure to run the previous steps first):
   - `pnpm jest` (full test coverage)
   - `pnpm jest:watch` (watch mode)
6. If you did step 2 up to 5, then the final step would be the Pull Request... but wait! For readability purposes, we would like you to only submit the relevant pieces of code that you changed. We are basically asking you to do a Build and make sure there's no errors (Yes please) but to not include the produced `dist` folder. We just want to see the real changes, nothing else (but we still want to make sure it Builds before creating a PR).

