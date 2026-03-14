/**
 * Inlined from deprecated package https://github.com/iarna/wide-align
 */

import stringWidth from 'fast-string-width';

export function alignLeft(str: string, width: number): string {
  var trimmed = str.trimEnd();
  if (trimmed.length === 0 && str.length >= width) return str;
  var strWidth = stringWidth(trimmed);

  if (strWidth < width) {
    return trimmed + ' '.repeat(width - strWidth);
  }

  return trimmed;
}

export function alignRight(str: string, width: number): string {
  var trimmed = str.trimStart();
  if (trimmed.length === 0 && str.length >= width) return str;
  var strWidth = stringWidth(trimmed);

  if (strWidth < width) {
    return ' '.repeat(width - strWidth) + trimmed;
  }

  return trimmed;
}

export function alignCenter(str: string, width: number): string {
  var trimmed = str.trim();
  if (trimmed.length === 0 && str.length >= width) return str;
  var strWidth = stringWidth(trimmed);

  if (strWidth < width) {
    var padLeftBy = Math.floor((width - strWidth) / 2);
    var padRightBy = width - strWidth - padLeftBy;
    return ' '.repeat(padLeftBy) + trimmed + ' '.repeat(padRightBy);
  }

  return trimmed;
}

export default { left: alignLeft, center: alignCenter, right: alignRight };
