import inquirer from 'inquirer';
import log from 'npmlog';

export class PromptUtilities {
  static async confirm(message): Promise<string> {
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

  static select(message, { choices, filter, validate } = {} as any): Promise<string> {
    log.pause();

    return inquirer
      .prompt([
        {
          type: 'list',
          name: 'prompt',
          message,
          choices,
          pageSize: choices.length,
          filter,
          validate,
        },
      ])
      .then(answers => {
        log.resume();

        return answers.prompt;
      });
  }

  static input(message, { filter, validate } = {} as any): Promise<string> {
    log.pause();

    return inquirer
      .prompt([
        {
          type: 'input',
          name: 'input',
          message,
          filter,
          validate,
        },
      ])
      .then(answers => {
        log.resume();

        return answers.input;
      });
  }
}
