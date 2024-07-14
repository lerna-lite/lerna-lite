import expand from '@inquirer/expand';
import input from '@inquirer/input';
import select from '@inquirer/select';
import { log } from '@lerna-lite/npmlog';

interface ListChoiceOptions {
  value: string;
  name?: string;
  description?: string;
  disabled?: boolean | string;
}

interface Question {
  choices: ListChoiceOptions[];
  filter?: (args: any) => any;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
}

/**
 * Prompt for confirmation
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export async function promptConfirmation(message: string): Promise<boolean> {
  log.pause();
  const answers = await expand({
    message,
    default: 'h', // default to help in order to avoid clicking straight through
    choices: [
      { key: 'y', name: 'Yes', value: true },
      { key: 'n', name: 'No', value: false },
    ],
  });
  log.resume();

  return answers;
}

/**
 * Prompt for selection
 * @param {string} message
 * @param {Question} [options]
 * @returns {Promise<string>}
 */
export async function promptSelectOne(message: string, { choices }: Question = {} as Question): Promise<string> {
  log.pause();

  const answers = await select({
    message,
    choices,
    pageSize: choices.length,
  });
  log.resume();

  return answers;
}

/**
 * Prompt for input
 * @param {string} message
 * @param {Omit<Question, 'choices'>} [options]
 * @returns {Promise<string>}
 */
export async function promptTextInput(message: string, { filter, validate }: Omit<Question, 'choices'> = {}): Promise<string> {
  log.pause();

  const promptResult = await input({
    message,
    validate,
  });

  const finalResult = promptResult && typeof filter === 'function' ? filter(promptResult) : promptResult;
  log.resume();

  return finalResult;
}
