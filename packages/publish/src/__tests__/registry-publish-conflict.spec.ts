import npmFetch from 'npm-registry-fetch';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isRegistryPublishVersionConflict } from '../lib/is-registry-publish-version-conflict.js';

describe('registry publish conflicts', () => {
  const manifest = { name: '@scope/example', version: '1.2.3' };
  const options = { registry: 'https://registry.example.test/', strictSSL: false };
  const conflict = Object.assign(new Error('Conflict'), { code: 'E409', method: 'PUT', body: null });

  beforeEach(() => {
    vi.spyOn(npmFetch, 'json').mockResolvedValue({ versions: { '1.2.3': manifest } });
  });
  afterEach(() => vi.restoreAllMocks());

  it('confirms the exact version without depending on the response message or body', async () => {
    await expect(isRegistryPublishVersionConflict(conflict, manifest, options)).resolves.toBe(true);
    expect(npmFetch.json).toHaveBeenCalledWith(
      '@scope%2fexample',
      expect.objectContaining({
        ...options,
        method: 'GET',
        body: undefined,
        cache: false,
        offline: false,
        preferOffline: false,
        preferOnline: true,
      })
    );
  });

  it('preserves scoped registry and authentication settings', async () => {
    const scoped = { ...options, '@scope:registry': 'https://scoped.example.test/', '//scoped.example.test/:_authToken': 'test-token' };
    await expect(isRegistryPublishVersionConflict(conflict, manifest, scoped)).resolves.toBe(true);
    expect(npmFetch.json).toHaveBeenCalledWith(
      '@scope%2fexample',
      expect.objectContaining({
        ...scoped,
        registry: 'https://scoped.example.test/',
      })
    );
  });

  it.each([
    { versions: { '1.0.0': { ...manifest, version: '1.0.0' } } },
    { versions: { '1.2.3': { ...manifest, name: 'another-package' } } },
    { versions: { '1.2.3': { ...manifest, version: '1.0.0' } } },
    {},
    null,
  ])('rejects a missing or mismatched version: %j', async (response) => {
    vi.mocked(npmFetch.json).mockResolvedValue(response);
    await expect(isRegistryPublishVersionConflict(conflict, manifest, options)).resolves.toBe(false);
  });

  it('preserves failure when verification cannot access the registry', async () => {
    vi.mocked(npmFetch.json).mockRejectedValue(new Error('registry unavailable'));
    await expect(isRegistryPublishVersionConflict(conflict, manifest, options)).resolves.toBe(false);
  });

  it.each([
    { code: 'E403' },
    { code: 'E500' },
    { code: 'TLOG_CREATE_ENTRY_ERROR', cause: { statusCode: 409 } },
    { code: 'E409', method: 'GET' },
    { code: 'E409', method: 'POST' },
  ])('does not check non-publish conflicts: %j', async (details) => {
    await expect(isRegistryPublishVersionConflict(Object.assign(new Error('failed'), details), manifest, options)).resolves.toBe(false);
    expect(npmFetch.json).not.toHaveBeenCalled();
  });

  it('does not use an existing version to infer that a staged upload succeeded', async () => {
    await expect(isRegistryPublishVersionConflict(conflict, manifest, { ...options, stage: true })).resolves.toBe(false);
    expect(npmFetch.json).not.toHaveBeenCalled();
  });
});
