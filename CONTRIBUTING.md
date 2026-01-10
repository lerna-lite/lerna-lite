# Contributing

We'd love for you to contribute and to make this project even better than it is today! If this interests you, please begin by reading the project [Wiki documentation](https://github.com/lerna-lite/lerna-lite/wiki). Once you consulted them and you believe that you can help us with new features, improvement, or even fixes, then go ahead and fork this repo and submit a Pull Request on a new branch.

## Initial Setup

### Setup Script

We have a setup script that will check for necessary tooling before contributing to this project. You can run it by executing the following command in your terminal from the root of the repository:

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

### <a name="submit-pr"></a> Submitting a PR

This project follows [GitHub's standard forking model](https://guides.github.com/activities/forking/). Please fork the project to submit pull requests.

### Manual Setup Steps

1. clone the lib (or your own fork copy):
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

8. optionally, run E2E tests (end-to-end tests, requires build first):
   - `pnpm test:e2e` (run all e2e tests)
   - `pnpm test:e2e:watch` (watch mode for e2e tests)

9. after executing steps 2 through 5 on your machine, you are ready to make changes and create a Pull Request...

> **Note**: The Github CI runs the testing suite on the 3 most recent NodeJS stable versions (LTS and Actives), so make sure to use one of those versions when running tests locally.

## Local CLI Testing with Verdaccio

If you want to test Lerna-Lite commands against a local npm registry, you can use Verdaccio. This is useful for testing publish workflows and custom registry configurations without affecting the real npm registry.

You will need two terminal windows:

### Terminal 1 - Start Verdaccio

```sh
node scripts/test-verdaccio.mjs
```

This will start a local npm registry on `http://localhost:4873/`. Keep this terminal running.

### Terminal 2 - Publish and Test

The Verdaccio instance is pre-configured with a test user (`test/test`). You can publish packages using either:

**Option 1: Using the `--registry` flag (recommended)**

```sh
# Build the project first
pnpm build

# Publish to local registry
pnpm run test-verdaccio
```

**Option 2: Using a custom `.npmrc` file**

Create a `.npmrc` file in the project root:

```
registry=http://localhost:4873/
//localhost:4873/:_auth=dGVzdDp0ZXN0
//localhost:4873/:always-auth=true
```

Then run:

```sh
pnpm build
lerna publish from-package --yes --no-git-tag-version --no-push
```

### Testing Published Packages

After publishing, you can install and test your local packages:

```sh
cd /some/path/to/test-project
npm --registry=http://localhost:4873/ install @lerna-lite/cli
npx lerna --version
```

### Cleanup

When finished testing:
1. Stop Verdaccio (Ctrl+C in Terminal 1)
2. Remove the custom `.npmrc` if you created one
3. The local registry storage is in `.verdaccio/storage/` and is git-ignored

**NOTE:** The Verdaccio configuration is stored in `.verdaccio/config.yaml`. The storage folder and credentials file are git-ignored, but the config file is tracked so all contributors can use the same setup.

## Testing Strategy

Lerna-lite uses a **two-tier testing approach**:

1. **Unit Tests** (`packages/*/src/**/__tests__/*.spec.ts`) - Fast, isolated tests for individual functions and classes. These run on every change and provide quick feedback.

2. **E2E Tests** (`e2e/**/*.spec.ts`) - End-to-end tests that run the actual `lerna` CLI commands as close to how a user would as possible. These are the most valuable tests because they verify the complete user experience.

### Why E2E Tests?

Following [Lerna's own recommendation](https://github.com/lerna/lerna/tree/main/integration#readme), we prefer e2e tests over integration tests for CLI tools because:

- They test the actual user interface (CLI commands)
- They catch issues that unit tests miss (e.g., argument parsing, command composition)
- They provide higher confidence that features work as users expect
- They are more resilient to internal refactoring

### Running E2E Tests

E2E tests are slower than unit tests because they:
- Build the entire project
- Create temporary git repositories
- Install npm packages
- Run actual CLI commands

```sh
# Run all e2e tests (builds first)
pnpm test:e2e

# Run e2e tests in watch mode (assumes you've built already)
pnpm test:e2e:watch

# Run a specific e2e test file
pnpm exec vitest run --config ./e2e/vitest.config.ts e2e/list/list.spec.ts
```

### Writing E2E Tests

E2E tests use the `Fixture` class from `e2e-utils` to create isolated test workspaces:

```typescript
import { Fixture } from 'e2e-utils';

describe('lerna my-command', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      name: 'my-command',
      packageManager: 'npm',
      lernaInit: true,
      installDependencies: true,
    });
    
    // Customize the workspace
    await fixture.updateJson('lerna.json', { packages: ['packages/*'] });
  });

  afterEach(() => fixture.destroy());

  it('should do something', async () => {
    const result = await fixture.lerna('my-command --some-flag');
    expect(result.combinedOutput).toMatch(/expected output/);
  });
});
```

See [e2e/README.md](e2e/README.md) for comprehensive documentation on writing e2e tests.

