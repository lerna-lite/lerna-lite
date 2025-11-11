import { describe, expect, it, vi, type Mock } from 'vitest';

import expand from '@inquirer/expand';
import input from '@inquirer/input';
import select from '@inquirer/select';
import { log } from '@lerna-lite/npmlog';

import { promptConfirmation, promptSelectOne, promptTextInput } from '../prompt.js';

vi.mock('@inquirer/expand');
vi.mock('@inquirer/input');
vi.mock('@inquirer/select');

describe('Prompt', () => {
  it('should prompt confirmation', async () => {
    (expand as Mock).mockResolvedValue(true);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptConfirmation('Choose something.');
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(expand).toHaveBeenCalledWith({
      message: 'Choose something.',
      default: 'h',
      choices: [
        { key: 'y', name: 'Yes', value: true },
        { key: 'n', name: 'No', value: false },
      ],
    });
    expect(output).toBeTruthy();
  });

  it('should prompt confirmation return false', async () => {
    (expand as Mock).mockResolvedValue(false);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptConfirmation('Choose something.');
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(expand).toHaveBeenCalled();
    expect(output).toBeFalsy();
  });

  it('should prompt confirmation with an ouput', async () => {
    (expand as Mock).mockResolvedValue(true);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptConfirmation('Choose something.');
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(expand).toHaveBeenCalled();
    expect(output).toBeTruthy();
  });

  it('should prompt select one', async () => {
    (select as Mock).mockResolvedValue(true);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptSelectOne('Choose something.', {
      choices: [
        { value: 'patch', name: 'Patch' },
        { value: 'minor', name: 'Minor' },
        { value: 'major', name: 'Major' },
      ],
    });
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(select).toHaveBeenCalledWith({
      choices: [
        {
          name: 'Patch',
          value: 'patch',
        },
        {
          name: 'Minor',
          value: 'minor',
        },
        {
          name: 'Major',
          value: 'major',
        },
      ],
      filter: undefined,
      message: 'Choose something.',
      pageSize: 3,
      validate: undefined,
    });
    expect(output).toBeTruthy();
  });

  it('should prompt select one return false', async () => {
    (select as Mock).mockResolvedValue(false);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptSelectOne('Choose something.', {
      choices: [
        { value: 'patch', name: 'Patch' },
        { value: 'minor', name: 'Minor' },
        { value: 'major', name: 'Major' },
      ],
    });
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(select).toHaveBeenCalled();
    expect(output).toBeFalsy();
  });

  it('should prompt text input', async () => {
    (input as Mock).mockResolvedValueOnce(true);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptTextInput('Choose something...', {
      filter: () => 'true',
      validate: () => false,
    });
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(input).toHaveBeenCalledWith({
      message: 'Choose something...',
      validate: expect.any(Function),
    });
    expect(output).toBeTruthy();
  });

  it('should prompt text input and return false when validation is invalid', async () => {
    const isValid = false;
    (input as Mock).mockResolvedValueOnce(isValid);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptTextInput('Choose something...', {
      filter: () => 'true',
      validate: () => isValid,
    });
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(input).toHaveBeenCalled();
    expect(output).toBe(false);
  });

  it('should prompt text input and return true when validation is valid', async () => {
    const isValid = true;
    (input as Mock).mockResolvedValueOnce(isValid);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptTextInput('Choose something...', {
      filter: () => 'true',
      validate: () => isValid,
    });
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(input).toHaveBeenCalled();
    expect(output).toBe('true');
  });

  it('should prompt text input and return false when filter is falsy', async () => {
    const filterOutput = false;
    (input as Mock).mockResolvedValueOnce(true);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptTextInput('Choose something...', {
      filter: () => `${filterOutput}`,
      validate: () => true,
    });
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(input).toHaveBeenCalled();
    expect(output).toBe('false');
  });

  it('should prompt text input and return true when filter is truthy', async () => {
    const filterOutput = true;
    (input as Mock).mockResolvedValueOnce(true);

    const logPauseSpy = vi.spyOn(log, 'pause');
    const logResumeSpy = vi.spyOn(log, 'resume');

    const output = await promptTextInput('Choose something...', {
      filter: () => `${filterOutput}`,
      validate: () => true,
    });
    expect(logPauseSpy).toHaveBeenCalled();
    expect(logResumeSpy).toHaveBeenCalled();
    expect(input).toHaveBeenCalled();
    expect(output).toBe('true');
  });
});
