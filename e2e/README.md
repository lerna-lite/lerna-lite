# E2E Testing for Lerna-Lite

This directory contains end-to-end (e2e) tests for lerna-lite, inspired by [Lerna's e2e test infrastructure](https://github.com/lerna/lerna/tree/main/e2e) but adapted for Vitest instead of Jest.

## Current Test Status

✅ **25 tests passing** when Verdaccio is not running | ✅ **28 tests passing** with Verdaccio

### Test Suites
- ✅ List command (5 tests) - All passing
- ✅ Version command (6 tests) - All passing  
- ✅ Run command (12 tests) - All passing
- ✅ Publish tests (2 tests) - All passing
  - Publish from-git --dry-run
  - Publish with --canary flag

### Verdaccio-Dependent Tests (3 tests)
These tests require Verdaccio registry running on `http://localhost:4873`:
- `publish from-git` - Publishes tagged packages to Verdaccio
- `publish from-package` - Publishes packages with updated versions
- `publish --canary` - Publishes canary versions with commit SHA

**To run these tests:** Start Verdaccio first with `npx verdaccio`

## Overview

E2E tests verify the complete functionality of lerna-lite commands by:
- Creating temporary test workspaces
- Executing real lerna commands
- Testing against a local Verdaccio registry for publish operations
- Validating outputs and file system changes

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
│   └── publish-dry-run.spec.ts
├── version/                 # E2E tests for version command
│   └── version.spec.ts
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

### Quick Start

Run all e2e tests including Verdaccio-dependent tests (recommended):

```powershell
pnpm test:e2e
```

This will:
1. Build the project
2. Start Verdaccio automatically
3. Wait for Verdaccio to be ready
4. Run all e2e tests
5. Stop Verdaccio when done

**Current test status: 25/39 passing** (watch tests are experimental and need refinement)

### Alternative: Without Verdaccio

To run tests without Verdaccio (3 publish tests will fail):

```powershell
pnpm test:e2e:no-verdaccio
```

### Prerequisites (for Manual Runs)

1. **Build the project first:**
   ```powershell
   pnpm build
   ```

2. **(Optional) Start Verdaccio for publish tests:**
   
   If you're running tests manually with `vitest`, you can start Verdaccio:
   
   ```powershell
   pnpm verdaccio:start
   ```

### Run E2E Tests in Watch Mode

```powershell
pnpm test:e2e:watch
```

Note: In watch mode, you need to start Verdaccio manually if you want to run publish tests:

```powershell
# In one terminal:
pnpm verdaccio:start

# In another terminal:
pnpm test:e2e:watch
```

### Run Specific Test Suites

```powershell
# Run only publish tests
vitest run --config ./e2e/vitest.config.ts e2e/publish

# Run only version tests
vitest run --config ./e2e/vitest.config.ts e2e/version
```

### Debug E2E Tests

Enable debug mode to keep test fixtures and see detailed logs:

```powershell
$env:LERNA_E2E_DEBUG = "true"
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
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Fixture, normalizeEnvironment } from '../../e2e-utils/src/index.js';

describe('my-feature', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'my-feature-test',
      packageManager: 'npm', // or 'pnpm'
      initializeGit: true,
      lernaInit: { args: ['--packages="packages/*"'] },
      installDependencies: true,
    });
  });

  afterEach(async () => {
    await fixture.destroy();
  });

  it('should do something', async () => {
    // Create packages
    await fixture.lerna('create my-package -y');
    
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
await fixture.lerna('create package-name -y');

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
  await fixture.lerna('create test-pkg -y');
  await fixture.createInitialGitCommit();
  await fixture.exec('git push origin main');

  const version = '1.0.0';
  await fixture.lerna(`version ${version} -y`);

  // Configure npm to use verdaccio
  await fixture.exec('echo "registry=http://localhost:4873" > .npmrc');

  const output = await fixture.lerna(
    'publish from-git --registry=http://localhost:4873 -y'
  );

  expect(output.combinedOutput).toContain('Successfully published');

  // Clean up
  await fixture.exec(
    `npm unpublish --force test-pkg@${version} --registry=http://localhost:4873`,
    { silenceError: true }
  );
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

## Differences from Lerna's E2E Tests

Our implementation differs from Lerna's in several ways:

1. **Vitest instead of Jest**
   - Uses Vitest's native test runner and assertions
   - No Jest-specific matchers or configuration

2. **Simplified Approach**
   - We don't use bash scripts (exec.sh/utils.sh) for test initialization
   - Everything is written in TypeScript for better type safety

3. **Local CLI Usage**
   - Tests use the locally built CLI directly instead of publishing to a registry first
   - Faster test execution and easier debugging

4. **Windows-Friendly**
   - All operations use Node.js APIs rather than shell commands where possible
   - PowerShell-compatible scripts

5. **No Nx Integration**
   - Lerna-lite doesn't include Nx, so we don't test Nx-specific features

## Troubleshooting

### Tests Failing with Timeout

Increase the timeout in `e2e/vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 180000, // 3 minutes
  },
});
```

### Verdaccio Connection Errors

1. Make sure Verdaccio is running: `pnpm verdaccio:start`
2. Check if port 4873 is available: `netstat -ano | findstr :4873`
3. Authenticate with Verdaccio: `npm adduser --registry http://localhost:4873`

### Fixture Cleanup Issues

If fixtures aren't being cleaned up:

```powershell
# Manually remove old fixtures
Remove-Item -Recurse -Force "$env:TEMP\lerna-lite-e2e"
```

### Debug Mode Not Working

Make sure to set the environment variable before running tests:

```powershell
$env:LERNA_E2E_DEBUG = "true"
pnpm test:e2e
```

## CI/CD Integration

For CI environments, e2e tests will:
- Use temporary directories that are cleaned up automatically
- Retry flaky tests (2 retries by default)
- Run without Verdaccio (only dry-run tests)

Example GitHub Actions workflow:

```yaml
- name: Build Project
  run: pnpm build

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
4. Normalize output for snapshots to avoid flaky tests
5. Clean up resources (e.g., unpublish from Verdaccio)
6. Add appropriate assertions - don't just check for absence of errors

## Resources

- [Lerna E2E Tests](https://github.com/lerna/lerna/tree/main/e2e) - Original inspiration
- [Vitest Documentation](https://vitest.dev/) - Testing framework docs
- [Verdaccio](https://verdaccio.org/) - Local npm registry for testing
