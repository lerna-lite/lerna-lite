import { expect, it, vi } from 'vitest';

import { add, remove } from '../lib/npm-dist-tag.js';
import { PublishCommand } from '../publish-command.js';

vi.mock('../lib/npm-dist-tag.js', () => ({ add: vi.fn(), remove: vi.fn() }));

it.each(['option', 'publishConfig'])('keeps lerna-temp when it is the destination tag from %s', async (source) => {
  const tracker = { addWork: vi.fn(), showProgress: vi.fn(), success: vi.fn(), completeWork: vi.fn(), finish: vi.fn() };
  const command = {
    logger: { newItem: () => tracker },
    packagesToPublish: [{ name: 'example', version: '1.2.3', get: () => ({ tag: 'lerna-temp' }) }],
    conf: { snapshot: { tag: source === 'option' ? 'lerna-temp' : 'latest' } },
    options: {},
    otpCache: {},
    getPreDistTag: vi.fn(),
  } as unknown as PublishCommand;

  await PublishCommand.prototype.npmUpdateAsLatest.call(command);

  expect(add).toHaveBeenCalledWith('example@1.2.3', 'lerna-temp', expect.anything(), expect.anything());
  expect(remove).not.toHaveBeenCalled();
});

it('keeps the temporary tag when promotion fails and can retry promotion', async () => {
  const error = new Error('registry unavailable');
  vi.mocked(add).mockRejectedValueOnce(error).mockResolvedValueOnce({});
  vi.mocked(remove).mockResolvedValue({});
  const tracker = { addWork: vi.fn(), showProgress: vi.fn(), success: vi.fn(), completeWork: vi.fn(), finish: vi.fn() };
  const pkg = { name: 'example', version: '1.2.3', get: vi.fn() };
  const command = {
    logger: { newItem: () => tracker },
    packagesToPublish: [pkg],
    conf: { snapshot: { tag: 'latest' } },
    options: {},
    otpCache: {},
    getPreDistTag: vi.fn(),
  } as unknown as PublishCommand;

  await expect(PublishCommand.prototype.npmUpdateAsLatest.call(command)).rejects.toBe(error);
  expect(remove).not.toHaveBeenCalled();

  await expect(PublishCommand.prototype.npmUpdateAsLatest.call(command)).resolves.toBeDefined();
  expect(add).toHaveBeenLastCalledWith('example@1.2.3', 'latest', expect.anything(), expect.anything());
  expect(remove).toHaveBeenLastCalledWith('example@1.2.3', 'lerna-temp', expect.anything(), expect.anything(), '1.2.3');
});
