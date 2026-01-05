# Verdaccio Test Setup

This directory contains a script to help test lerna-lite with a local Verdaccio registry.

## Quick Start

```powershell
node scripts/test-verdaccio.mjs
```

This will:
1. Set up a local Verdaccio instance on `http://localhost:4873`
2. Create temporary storage for packages
3. Provide instructions for testing

## Manual Testing Steps

After Verdaccio is running:

1. **Create a test user** (in a new terminal):
   ```powershell
   npm adduser --registry http://localhost:4873
   ```
   Use test credentials: `test` / `test` / `test@example.com`

2. **Create `.npmrc` in project root**:
   ```
   registry=http://localhost:4873/
   //localhost:4873/:_authToken=your-token-from-adduser
   ```

3. **Test publishing**:
   ```powershell
   lerna publish --canary --no-git-tag-version --no-push --yes
   ```

4. **View packages**:
   Open http://localhost:4873 in your browser

## Troubleshooting

- If port 4873 is in use, kill the process: `Stop-Process -Name "node" -Force`
- Verdaccio data is stored in temp directory and cleaned up on exit
- Check the console output for any error messages

## What This Tests

This setup verifies that:
- Custom registry URLs are properly read from `.npmrc`
- Authentication tokens for custom registries work correctly
- The fix for the config-chain issue resolves the E401/E404 errors

## Clean Up

Press `Ctrl+C` in the terminal running the script to stop Verdaccio.
