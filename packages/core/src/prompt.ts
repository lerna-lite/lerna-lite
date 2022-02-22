import inquirer, { ListChoiceOptions, Question } from 'inquirer';
import log from 'npmlog';

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
export async function promptSelectOne(message: string, { choices, filter, validate } = {} as { choices: ListChoiceOptions[] } & Pick<Question, 'filter' | 'validate'>): Promise<string> {
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
export async function promptTextInput(message: string, { filter, validate } = {} as Pick<Question, 'filter' | 'validate'>): Promise<string> {
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
