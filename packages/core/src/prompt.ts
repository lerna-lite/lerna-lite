import inquirer from 'inquirer';
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
  const answers = await inquirer.prompt([
    {
      type: 'expand',
      name: 'confirm',
      message,
      default: 2, // default to help in order to avoid clicking straight through
      choices: [
        { key: 'y', name: 'Yes', value: true },
        { key: 'n', name: 'No', value: false },
      ],
    },
  ]);
  log.resume();

  return answers.confirm;
}

/**
 * Prompt for selection
 * @param {string} message
 * @param {{ choices: import("inquirer").ListChoiceOptions[] } & Pick<import("inquirer").Question, 'filter' | 'validate'>} [options]
 * @returns {Promise<string>}
 */
export async function promptSelectOne(message: string, { choices, filter, validate } = {} as Question): Promise<string> {
  log.pause();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'prompt',
      message,
      choices,
      pageSize: choices.length,
      filter,
      validate,
    },
  ]);
  log.resume();

  return answers.prompt;
}

/**
 * Prompt for input
 * @param {string} message
 * @param {Pick<import("inquirer").Question, 'filter' | 'validate'>} [options]
 * @returns {Promise<string>}
 */
export async function promptTextInput(message: string, { filter, validate } = {} as Omit<Question, 'choices'>): Promise<string> {
  log.pause();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message,
      filter,
      validate,
    },
  ]);
  log.resume();

  return answers.input;
}
