import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { expect, it } from 'vitest';

import { isRegistryPublishVersionConflict } from '../lib/is-registry-publish-version-conflict.js';

it('verifies exact versions and scoped authentication against the configured registry', async () => {
  const requests: { url?: string; authorization?: string }[] = [];
  let status = 200;
  const manifest = { name: '@scope/conflict-test', version: '1.2.3' };
  const server = createServer((req, res) => {
    requests.push({ url: req.url, authorization: req.headers.authorization });
    res.setHeader('content-type', 'application/json');
    res.writeHead(status);
    res.end(JSON.stringify(status === 200 ? { versions: { '1.2.3': manifest } } : { error: 'Unauthorized' }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = `127.0.0.1:${(server.address() as AddressInfo).port}`;
  const options = {
    registry: `http://${address}/wrong-registry/`,
    '@scope:registry': `http://${address}/publish/`,
    [`//${address}/publish/:_authToken`]: 'test-token',
  };
  const error = Object.assign(new Error('An arbitrary registry conflict'), { code: 'E409', method: 'PUT' });

  try {
    await expect(isRegistryPublishVersionConflict(error, manifest, options)).resolves.toBe(true);
    await expect(isRegistryPublishVersionConflict(error, { ...manifest, version: '1.2.4' }, options)).resolves.toBe(false);
    status = 401;
    await expect(isRegistryPublishVersionConflict(error, manifest, options)).resolves.toBe(false);
    expect(requests).toEqual(
      Array.from({ length: 3 }, () => ({
        url: '/publish/@scope%2fconflict-test',
        authorization: 'Bearer test-token',
      }))
    );
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
