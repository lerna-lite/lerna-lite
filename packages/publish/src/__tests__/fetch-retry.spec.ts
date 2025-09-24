import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithRetry } from '../lib/fetch-retry.js';

function createResponse(ok: boolean, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve({ ok, status }),
  } as Response;
}

describe('fetchWithRetry', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    // @ts-ignore
    global.fetch = fetchMock;
  });

  it('returns response on first success', async () => {
    fetchMock.mockResolvedValue(createResponse(true));
    const res = await fetchWithRetry('http://test');
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on response not ok and succeeds', async () => {
    fetchMock.mockResolvedValueOnce(createResponse(false)).mockResolvedValueOnce(createResponse(true));
    const res = await fetchWithRetry('http://test', { retry: 1 });
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries on response not ok', async () => {
    fetchMock.mockResolvedValue(createResponse(false));
    await expect(fetchWithRetry('http://test', { retry: 2 })).rejects.toThrow('Failed after 3 attempts');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries on network error and succeeds', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(createResponse(true));
    const res = await fetchWithRetry('http://test', { retry: 1 });
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries on network error', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    await expect(fetchWithRetry('http://test', { retry: 2 })).rejects.toThrow('network');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('supports custom retryCondition', async () => {
    fetchMock.mockResolvedValueOnce(createResponse(true, 500)).mockResolvedValueOnce(createResponse(true, 200));
    const res = await fetchWithRetry('http://test', {
      retry: 1,
      retryCondition: (response) => response.status === 500,
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws unexpected error if loop is exhausted (should never happen)', async () => {
    // This is just for coverage, not a real scenario
    // @ts-ignore
    global.fetch = () => {
      throw new Error('fail');
    };
    await expect(fetchWithRetry('http://test', { retry: 0 })).rejects.toThrow('fail');
  });

  it('throws Unexpected fetch failure if loop is never entered (covers line 69)', async () => {
    // @ts-ignore
    global.fetch = vi.fn();
    await expect(fetchWithRetry('http://test', { retry: -1 })).rejects.toThrow('Unexpected fetch failure');
  });
});
