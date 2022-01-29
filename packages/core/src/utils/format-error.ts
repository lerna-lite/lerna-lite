import log from 'npmlog';

export function formatError(err: { code?: string; body?: any; message?: string; name?: string; errno?: number; }) {
  log.silly('', err.toString());
  log.error(err?.code ?? '', (err.body && err.body.error) || err.message);

  // avoid dumping logs, this isn't a lerna problem
  err.name = 'ValidationError';

  // ensure process exits non-zero
  process.exitCode = 'errno' in err ? err.errno : 1;

  // re-throw to break chain upstream
  throw err;
}
