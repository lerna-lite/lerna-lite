/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */
import progressBar from './progress-bar.js';
import spin from './spin.js';

export function activityIndicator(values: any, theme: any, _width?: number) {
  if (values.spun == null) {
    return;
  }
  return spin(theme, values.spun);
}

export function progressbar(values: any, theme: any, width: number) {
  if (values.completed == null) {
    return;
  }
  return progressBar(theme, width, values.completed);
}

export default { activityIndicator, progressbar };