# Contributing

We'd love for you to contribute and to make this project even better than it is today! If this interests you, please begin by reading the project [Wiki documentation](https://github.com/lerna-lite/lerna-lite/wiki). Once you consulted them and you believe that you can help us with new features, improvement or even fixes then go ahead and submit a Pull Request.

**Note**: this project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by following their [installation](https://pnpm.io/installation) or simply run `npx pnpm` to run any of the pnpm scripts shown below:

1. clone the lib:
   - `git clone https://github.com/lerna-lite/lerna-lite`
2. install with **pnpm** from the root:
   - `pnpm install` OR `npx pnpm install`
3. run Lint script
  - `pnpm prettier:write`
4. run a full TypeScript (TSC) build
   - `pnpm build` OR `npx pnpm build`
5. add/run Vitest unit tests (make sure to run the previous steps first):
   - `pnpm test` (watch mode)
   - `pnpm test:coverage` (full test coverage)
6. If you did step 2 up to 5, then the final step would be the Pull Request... but wait! For readability purposes, we would like you to only submit the relevant pieces of code that you changed. We are basically asking you to do a Build and make sure there's no errors (Yes please) but to not include the produced `dist` folder. We just want to see the real changes, nothing else (but we still want to make sure it Builds before creating a PR).

> **Note** running the unit tests might failed when run one at a time because of this Vitest [bug](https://github.com/vitest-dev/vitest/issues/3129), the issue is with quote escaping in snapshot (sometime it uses single quote, sometime double, sometime none). The only known fix is to ignore snapshot escaping when running single tests, however when running "all tests" then it should always pass. It doesn't look like Vitest will fix it any time soon, so it's unfortunately a bug we have to live with for now. Again just make sure that when running "all tests" it passes successfully. 
