# E2E Testing for Lerna-Lite

This directory contains end-to-end (e2e) tests for lerna-lite, inspired by [Lerna's e2e test infrastructure](https://github.com/lerna/lerna/tree/main/e2e) but adapted for Vitest.

## Overview

E2E tests verify the complete functionality of lerna-lite commands by:
- Creating temporary test workspaces
- Executing real lerna commands (list, version, run, watch, exec, diff, changed, publish)
- Testing against a local Verdaccio registry for publish operations
- Validating outputs and file system changes

## Test Suites

- ✅ List command (5 tests)
- ✅ Version command (6 tests)  
- ✅ Run command (12 tests)
- ✅ Watch command (11 tests)
- ✅ Exec command (11 tests)
- ✅ Diff command (2 tests)
- ✅ Changed command (14 tests)
- ✅ Publish dry-run (2 tests)
- ✅ Publish Verdaccio (3 tests)
- ✅ Publish .npmrc authentication (4 tests)

All tests run automatically in CI with Verdaccio.

## Architecture

### Key Components

1. **Fixture Class** (`e2e-utils/src/fixture.ts`)
   - Creates isolated test workspaces with git repositories
   - Manages package manager operations (npm/pnpm)
   - Provides helpers for common operations (lerna commands, file manipulation)
   - Automatically cleans up after tests

2. **Utility Functions** (`e2e-utils/src/utils.ts`)
   - `getE2eRoot()` - Sets up the temporary e2e directory
   - `normalizeEnvironment()` - Normalizes paths and timestamps for snapshots
   - `normalizeCommandOutput()` - Prepares command output for assertions
   - `normalizeCommitSHAs()` - Replaces git SHAs for consistent snapshots

3. **Test Configuration** (`e2e/vitest.config.ts`)
   - Configures Vitest for e2e testing
   - Sets longer timeouts for npm operations
   - Runs tests sequentially to avoid conflicts
   - Enables retry for flaky tests in CI

## Directory Structure

```
e2e/
├── vitest.config.ts         # Vitest configuration for e2e tests
├── setup.ts                 # Global test setup
├── tsconfig.json            # TypeScript config for e2e tests
├── publish/                 # E2E tests for publish command
│   ├── publish-verdaccio.spec.ts
│   ├── publish-dry-run.spec.ts
│   └── publish-npmrc-auth.spec.ts
├── version/                 # E2E tests for version command
│   └── version.spec.ts
├── exec/                    # E2E tests for exec command
│   └── exec.spec.ts
├── diff/                    # E2E tests for diff command
│   └── diff.spec.ts
├── changed/                 # E2E tests for changed command
│   └── changed.spec.ts
├── run/                     # E2E tests for run command
│   └── run.spec.ts
├── watch/                   # E2E tests for watch command
│   └── watch.spec.ts
└── list/                    # E2E tests for list command
    └── list.spec.ts

e2e-utils/
├── src/
│   ├── fixture.ts           # Main Fixture class
│   ├── utils.ts             # Utility functions
│   └── index.ts             # Exports
├── package.json
└── tsconfig.json
```

## Running E2E Tests

### Run All Tests

```bash
pnpm test:e2e
```

This will:
1. Build the project
2. Start Verdaccio automatically
3. Run all e2e tests
4. Stop Verdaccio when done

### Run Tests in Watch Mode

```bash
pnpm test:e2e:watch
```

### Run Specific Test Suite

```bash
# Run only publish tests
vitest run --config ./e2e/vitest.config.ts e2e/publish

# Run only version tests
vitest run --config ./e2e/vitest.config.ts e2e/version
```

### Debug Mode

Enable debug mode to keep test fixtures and see detailed logs:

```bash
export LERNA_E2E_DEBUG=true  # Linux/macOS
# or
$env:LERNA_E2E_DEBUG = "true"  # PowerShell

pnpm test:e2e
```

This will:
- Keep the temporary test directories after tests complete
- Write detailed debug logs to `debug.log` in each fixture directory
- Show full command output

Test fixtures are created in:
- **Windows:** `%TEMP%\lerna-lite-e2e`
- **Linux/macOS:** `/tmp/lerna-lite-e2e`

## Writing E2E Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Fixture } from '../../e2e-utils/src/index.js';

describe('my-feature', () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'my-feature-test',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
    });
  });

  afterAll(async () => {
    await fixture.destroy();
  });

  it('should do something', async () => {
    // Create packages
    await fixture.createPackage({ name: 'my-package' });
    
    // Run lerna commands
    const output = await fixture.lerna('list');
    
    // Make assertions
    expect(output.combinedOutput).toContain('my-package');
  });
});
```

### Common Fixture Operations

```typescript
// Create a new package
await fixture.createPackage({ name: 'package-name' });

// Execute arbitrary commands
await fixture.exec('git add .');
await fixture.exec('git commit -m "test"');

// Update package.json
await fixture.updateJson('packages/my-pkg/package.json', (json) => ({
  ...json,
  version: '1.0.0',
}));

// Add scripts to a package
await fixture.addScriptsToPackage({
  packagePath: 'packages/my-pkg',
  scripts: {
    'build': 'echo building',
  },
});

// Create initial git commit
await fixture.createInitialGitCommit();

// Read files
const content = await fixture.readWorkspaceFile('package.json');

// Get workspace path
const path = fixture.getWorkspacePath('packages/my-pkg');
```

### Testing with Verdaccio

```typescript
it('should publish to verdaccio', async () => {
  await fixture.createPackage({ name: 'test-pkg', version: '1.0.0' });
  await fixture.createInitialGitCommit();
  await fixture.exec('git tag test-pkg@1.0.0 -m "test-pkg@1.0.0"');

  // Configure npm to use Verdaccio
  await fixture.exec('echo "registry=http://localhost:4873/" > .npmrc');

  const output = await fixture.lerna(
    'publish from-git --registry=http://localhost:4873/ -y'
  );

  expect(output.combinedOutput).toContain('Successfully published');
});
```

### Normalizing Output for Snapshots

```typescript
import { normalizeEnvironment, normalizeCommandOutput, normalizeCommitSHAs } from '../../e2e-utils/src/index.js';

it('should match snapshot', async () => {
  const output = await fixture.lerna('list');
  
  expect(
    normalizeCommandOutput(output.combinedOutput)
  ).toMatchSnapshot();
});
```

## Troubleshooting

### Tests Failing with Timeout

If tests timeout, the default timeout is 2 minutes per test. For slower systems, you can increase the timeout in `e2e/vitest.config.ts`.

### Fixture Cleanup Issues

If fixtures aren't being cleaned up properly:

```bash
# Linux/macOS
rm -rf /tmp/lerna-lite-e2e

# Windows PowerShell
Remove-Item -Recurse -Force "$env:TEMP\lerna-lite-e2e"
```

## CI/CD Integration

E2E tests are designed to run in CI environments and will automatically:
- Start and stop Verdaccio
- Use temporary directories that are cleaned up automatically
- Retry flaky tests (2 retries by default)

Example GitHub Actions workflow:

```yaml
- name: Run E2E Tests
  run: pnpm test:e2e
  env:
    CI: true
```

## Contributing

When adding new e2e tests:

1. Create a new directory under `e2e/` for the command being tested
2. Write tests using the Fixture class
3. Use meaningful test names that describe the behavior
4. Normalize output for assertions to avoid platform-specific issues
5. Use `beforeAll`/`afterAll` for fixture setup/teardown
6. Add appropriate assertions - verify the actual behavior, not just absence of errors

## Resources

- [Lerna E2E Tests](https://github.com/lerna/lerna/tree/main/e2e) - Original inspiration
- [Vitest Documentation](https://vitest.dev/) - Testing framework
- [Verdaccio](https://verdaccio.org/) - Local npm registry for testing
