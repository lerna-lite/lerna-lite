import fetch from 'npm-registry-fetch';
import { pulseTillDone } from '../pulse-till-done';

describe('pulse-till-done()', () => {
  it('should expect to execute a pulse and return the data when 1st input is a Promise', async () => {
    const promise = fetch.json('../../../package.json', { name: '@lerna-lite/core' });
    const data = await pulseTillDone(promise);
    expect(data.name).toBeTruthy();
  });

  it('should expect to execute a pulse and return the data when 1st input is a string prefix and 2nd argument is a Promise', async () => {
    const promise = fetch.json('../../../package.json', { name: '@lerna-lite/core' });
    const data = await pulseTillDone('some-prefix', promise);
    expect(data.name).toBeTruthy();
  });

  it('should expect to execute a pulse and return the data when 1st input is a string prefix and 2nd argument is a Promise', async () => {
    await expect(pulseTillDone(fetch.json('../../../invalid-file.json', { name: '@lerna-lite/core' }))).rejects.toThrow();
  });
});