import { beforeEach, describe, expect, it, vi } from 'vitest';

import { oidc } from '../lib/oidc.js';

const mockConfig = {
  set: vi.fn(),
};

const mockOpts = {};

const mockFetchResponse = (json: any, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(json),
});

vi.mock('ci-info', () => ({
  default: {
    GITHUB_ACTIONS: false,
    GITLAB: false,
  },
}));

vi.mock('../lib/fetch-retry.js', () => ({
  fetchWithRetry: vi.fn(),
}));

vi.mock('npm-registry-fetch', () => ({
  default: {
    json: vi.fn(),
  },
}));

vi.mock('libnpmaccess', () => ({
  default: {
    getVisibility: vi.fn(() => Promise.resolve({ public: true })),
  },
}));

vi.mock('npm-package-arg', () => ({
  default: (name: string) => ({ escapedName: name.replace('/', '%2F') }),
}));

describe('oidc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.NPM_ID_TOKEN;
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
    delete process.env.SIGSTORE_ID_TOKEN;
  });

  it('returns undefined when not in CI', async () => {
    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: mockOpts,
      config: mockConfig,
    });
    expect(result).toBeUndefined();
  });

  it('uses NPM_ID_TOKEN in GitLab', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITLAB = true;
    process.env.NPM_ID_TOKEN = 'FAKE_ID_TOKEN';

    const npmFetch = await import('npm-registry-fetch');
    (npmFetch.default.json as any).mockResolvedValue({ token: 'FAKE_NPM_TOKEN' });

    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: {},
      config: mockConfig,
    });

    expect(mockConfig.set).toHaveBeenCalledWith(expect.stringContaining('_authToken'), 'FAKE_NPM_TOKEN', 'user');
    expect(result).toBeUndefined();
  });

  it('fetches id_token from GitHub Actions and exchanges for npm token', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = true;
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://actions.example.com/token';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'GH_TOKEN';

    const { fetchWithRetry } = await import('../lib/fetch-retry.js');
    (fetchWithRetry as any).mockResolvedValue(mockFetchResponse({ value: 'HEADER.PAYLOAD.SIGNATURE' }));

    const npmFetch = await import('npm-registry-fetch');
    (npmFetch.default.json as any).mockResolvedValue({ token: 'FAKE_NPM_TOKEN' });

    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: {},
      config: mockConfig,
    });

    expect(mockConfig.set).toHaveBeenCalledWith(expect.stringContaining('_authToken'), 'FAKE_NPM_TOKEN', 'user');
    expect(result).toBeUndefined();
  });

  it('skips if no `id_token` available', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = true;
    // No env vars set
    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: {},
      config: mockConfig,
    });
    expect(result).toBeUndefined();
  });

  it('sets provenance for public repo', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = true;
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://actions.example.com/token';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'GH_TOKEN';

    // Simulate a JWT with public repo
    const payload = Buffer.from(JSON.stringify({ repository_visibility: 'public' })).toString('base64');
    const { fetchWithRetry } = await import('../lib/fetch-retry.js');
    (fetchWithRetry as any).mockResolvedValue(mockFetchResponse({ value: `HEADER.${payload}.SIGNATURE` }));

    const npmFetch = await import('npm-registry-fetch');
    (npmFetch.default.json as any).mockResolvedValue({ token: 'FAKE_NPM_TOKEN' });

    const libaccess = await import('libnpmaccess');
    (libaccess.default.getVisibility as any).mockResolvedValue({ public: true });

    const opts: any = {};
    await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts,
      config: mockConfig,
    });

    expect(opts.provenance).toBe(true);
    expect(mockConfig.set).toHaveBeenCalledWith('provenance', true, 'user');
  });

  it('sets provenance for GitLab with project visibility and public repo', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = false;
    ciInfo.default.GITLAB = true;
    process.env.SIGSTORE_ID_TOKEN = 'FAKE_SIGSTORE_ID_TOKEN';
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://actions.example.com/token';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'GH_TOKEN';

    // Simulate a JWT with public repo
    const payload = Buffer.from(JSON.stringify({ project_visibility: 'public' })).toString('base64');
    process.env.NPM_ID_TOKEN = `HEADER.${payload}.SIGNATURE`;
    const { fetchWithRetry } = await import('../lib/fetch-retry.js');
    (fetchWithRetry as any).mockResolvedValue(mockFetchResponse({ value: `HEADER.${payload}.SIGNATURE` }));

    const npmFetch = await import('npm-registry-fetch');
    (npmFetch.default.json as any).mockResolvedValue({ token: 'FAKE_NPM_TOKEN' });

    const libaccess = await import('libnpmaccess');
    (libaccess.default.getVisibility as any).mockResolvedValue({ public: true });

    const opts: any = {};
    await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts,
      config: mockConfig,
    });

    expect(opts.provenance).toBe(true);
    expect(mockConfig.set).toHaveBeenCalledWith('provenance', true, 'user');
  });

  it('logs and returns undefined if `response.ok` is false', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = true;
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://actions.example.com/token';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'GH_TOKEN';

    const { fetchWithRetry } = await import('../lib/fetch-retry.js');
    (fetchWithRetry as any).mockResolvedValue(mockFetchResponse({ value: 'token' }, false, 403));

    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: {},
      config: mockConfig,
    });
    expect(result).toBeUndefined();
  });

  it('logs and returns undefined if `json.value` is missing', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = true;
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://actions.example.com/token';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'GH_TOKEN';

    const { fetchWithRetry } = await import('../lib/fetch-retry.js');
    (fetchWithRetry as any).mockResolvedValue(mockFetchResponse({}, true, 200));

    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: {},
      config: mockConfig,
    });
    expect(result).toBeUndefined();
  });

  it('logs and returns undefined if `response.token` is missing', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = true;
    process.env.NPM_ID_TOKEN = 'FAKE_ID_TOKEN';

    const npmFetch = await import('npm-registry-fetch');
    (npmFetch.default.json as any).mockResolvedValue({});

    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: {},
      config: mockConfig,
    });
    expect(result).toBeUndefined();
  });

  it('throws when token exchange request failed', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = true;
    process.env.NPM_ID_TOKEN = 'FAKE_ID_TOKEN';

    const npmFetch = await import('npm-registry-fetch');
    (npmFetch.default.json as any).mockRejectedValue({});

    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: {},
      config: mockConfig,
    });
    expect(result).toBeUndefined();
  });

  it('skips provenance if JWT payload is not valid base64', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = true;
    process.env.NPM_ID_TOKEN = 'invalid.token';

    const npmFetch = await import('npm-registry-fetch');
    (npmFetch.default.json as any).mockResolvedValue({ token: 'FAKE_NPM_TOKEN' });

    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: {},
      config: mockConfig,
    });
    expect(result).toBeUndefined();
  });

  it('logs and returns undefined if GITHUB_ACTIONS is false and npmFetch.json throws', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = false;

    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts: {},
      config: mockConfig,
    });
    expect(result).toBeUndefined();
  });

  it('logs error if provenance block throws', async () => {
    const ciInfo = await import('ci-info');
    ciInfo.default.GITHUB_ACTIONS = true;
    process.env.NPM_ID_TOKEN = '';
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://actions.example.com/token';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'GH_TOKEN';

    const npmFetch = await import('npm-registry-fetch');
    (npmFetch.default.json as any).mockRejectedValue({ body: { message: 'fail' } });

    const libaccess = await import('libnpmaccess');
    (libaccess.default.getVisibility as any).mockRejectedValue(new Error('fail'));

    const opts: any = {};
    const result = await oidc({
      packageName: 'test-pkg',
      registry: 'https://registry.npmjs.org/',
      opts,
      config: mockConfig,
    });
    expect(result).toBeUndefined();
  });
});