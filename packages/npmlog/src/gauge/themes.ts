/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

import { styleText } from 'node:util';

import ThemeSet from './theme-set.js';

export function createThemes() {
  const themes = ThemeSet();

  themes.addTheme('ASCII', {
    preProgressbar: '[',
    postProgressbar: ']',
    progressbarTheme: {
      complete: '#',
      remaining: '.',
    },
    activityIndicatorTheme: '-\\|/',
    preSubsection: '>',
  });

  themes.addTheme('colorASCII', themes.getTheme('ASCII'), {
    progressbarTheme: {
      preComplete: styleText(['bgWhite', 'white'], ''),
      complete: '#',
      postComplete: styleText('reset', ''),
      preRemaining: styleText(['bgBlack', 'black'], ''),
      remaining: '.',
      postRemaining: styleText('reset', ''),
    },
  });

  themes.addTheme('brailleSpinner', {
    preProgressbar: '(',
    postProgressbar: ')',
    progressbarTheme: {
      complete: '#',
      remaining: '⠂',
    },
    activityIndicatorTheme: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    preSubsection: '>',
  });

  themes.addTheme('colorBrailleSpinner', themes.getTheme('brailleSpinner'), {
    progressbarTheme: {
      preComplete: styleText(['bgWhite', 'white'], ''),
      complete: '#',
      postComplete: styleText('reset', ''),
      preRemaining: styleText(['bgBlack', 'black'], ''),
      remaining: '⠂',
      postRemaining: styleText('reset', ''),
    },
  });

  themes.setDefault({}, 'ASCII');
  themes.setDefault({ hasColor: true }, 'colorASCII');
  themes.setDefault({ platform: 'darwin', hasUnicode: true }, 'brailleSpinner');
  themes.setDefault({ platform: 'darwin', hasUnicode: true, hasColor: true }, 'colorBrailleSpinner');
  themes.setDefault({ platform: 'linux', hasUnicode: true }, 'brailleSpinner');
  themes.setDefault({ platform: 'linux', hasUnicode: true, hasColor: true }, 'colorBrailleSpinner');

  return themes;
}

// Default export: singleton instance for legacy/test compatibility
const themes = createThemes();
export default themes;
