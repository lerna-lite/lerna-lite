/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

import { format } from 'node:util';

const User = (msg) => {
  const err: any = new Error(msg);
  Error.captureStackTrace(err, User);
  err.code = 'EGAUGE';
  return err;
};

export function MissingTemplateValue(item, values) {
  const err = User(format('Missing template value "%s"', item.type));
  Error.captureStackTrace(err, MissingTemplateValue);
  err.template = item;
  err.values = values;
  return err;
}

export function Internal(msg) {
  const err: any = new Error(msg);
  Error.captureStackTrace(err, Internal);
  err.code = 'EGAUGEINTERNAL';
  return err;
}

export default { User, MissingTemplateValue, Internal };