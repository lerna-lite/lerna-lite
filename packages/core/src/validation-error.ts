import log from 'npmlog';

export class ValidationError extends Error {
  prefix = '';

  constructor(prefix: string, message: string, ...rest: string[]) {
    super(message);
    this.name = 'ValidationError';
    this.prefix = prefix;
    log.resume(); // might be paused, noop otherwise
    log.error(prefix, message, ...rest);
  }
}
