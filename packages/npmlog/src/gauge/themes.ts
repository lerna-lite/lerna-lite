/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

import { color } from 'console-control-strings';

import ThemeSet from './theme-set.js';

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
    preComplete: color('bgBrightWhite', 'brightWhite'),
    complete: '#',
    postComplete: color('reset'),
    preRemaining: color('bgBrightBlack', 'brightBlack'),
    remaining: '.',
    postRemaining: color('reset'),
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
    preComplete: color('bgBrightWhite', 'brightWhite'),
    complete: '#',
    postComplete: color('reset'),
    preRemaining: color('bgBrightBlack', 'brightBlack'),
    remaining: '⠂',
    postRemaining: color('reset'),
  },
});

themes.setDefault({}, 'ASCII');
themes.setDefault({ hasColor: true }, 'colorASCII');
themes.setDefault({ platform: 'darwin', hasUnicode: true }, 'brailleSpinner');
themes.setDefault({ platform: 'darwin', hasUnicode: true, hasColor: true }, 'colorBrailleSpinner');
themes.setDefault({ platform: 'linux', hasUnicode: true }, 'brailleSpinner');
themes.setDefault({ platform: 'linux', hasUnicode: true, hasColor: true }, 'colorBrailleSpinner');

export default themes;
