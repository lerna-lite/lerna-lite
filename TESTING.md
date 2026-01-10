# Testing Guide for Lerna-Lite

This document provides an overview of the testing infrastructure in Lerna-Lite.

## Testing Strategy

Lerna-lite uses a **two-tier testing approach**:

1. **Unit Tests** (`packages/*/src/**/__tests__/*.spec.ts`) - Fast, isolated tests for individual functions and classes
2. **E2E Tests** (`e2e/**/*.spec.ts`) - Complete CLI workflow tests that verify the actual user experience

This follows [Lerna's recommendation](https://github.com/lerna/lerna/blob/main/integration/README.md) to prefer E2E tests over integration tests for CLI tools, as they provide the highest value by testing what users actually interact with.

## Quick Start

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:watch
```

### E2E Tests

```bash
# Run e2e tests (builds first, starts Verdaccio automatically)
pnpm test:e2e

# Or run in watch mode (assumes you've built already)
pnpm test:e2e:watch
```

See [e2e/README.md](./e2e/README.md) for comprehensive e2e testing documentation.

## Project Structure

```
packages/*/src/**/__tests__/*.spec.ts    # Unit tests (co-located with source)
e2e/                                     # E2E tests
e2e-utils/                               # E2E testing utilities
```

## NPM Scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest watch",
  "test:e2e": "node scripts/run-e2e-with-verdaccio.mjs",
  "test:e2e:watch": "vitest watch --config ./e2e/vitest.config.ts"
}
```

## Additional Resources

- [e2e/README.md](./e2e/README.md) - Comprehensive e2e testing guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines including testing practices
- [Lerna's E2E Tests](https://github.com/lerna/lerna/tree/main/e2e) - Original inspiration for this infrastructure
