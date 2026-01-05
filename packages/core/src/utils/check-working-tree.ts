import { ValidationError } from '../validation-error.js';
import type { UncommittedConfig } from './collect-uncommitted.js';
import { collectUncommitted } from './collect-uncommitted.js';
import { describeRef } from './describe-ref.js';

export function checkWorkingTree({ cwd } = {} as UncommittedConfig, dryRun = false) {
  let chain: Promise<any> = Promise.resolve();

  chain = chain.then(() => describeRef({ cwd }, undefined, dryRun));

  // wrap each test separately to allow all applicable errors to be reported
  const tests = [
    // prevent duplicate versioning
    chain.then(throwIfReleased),
    // prevent publish of uncommitted changes
    chain.then(mkThrowIfUncommitted({ cwd }, dryRun) as any),
  ];

  // passes through result of describeRef() to aid composability
  return chain.then((result) => Promise.all(tests).then(() => result));
}

export function throwIfReleased({ refCount }: { refCount: number | string }) {
  if (refCount === '0') {
    throw new ValidationError(
      'ERELEASED',
      'The current commit has already been released. Please make new commits before continuing.'
    );
  }
}

const EUNCOMMIT_MSG = 'Working tree has uncommitted changes, please commit or remove the following changes before continuing:\n';

export function mkThrowIfUncommitted(options: Partial<UncommittedConfig> = {}, dryRun = false) {
  return function ({ isDirty }) {
    if (isDirty) {
      return collectUncommitted(options as UncommittedConfig, dryRun).then((uncommitted) => {
        console.log('Uncommitted changes detected:', `${EUNCOMMIT_MSG}${uncommitted.join('\n')}`);
        // throw new ValidationError('EUNCOMMIT', `${EUNCOMMIT_MSG}${uncommitted.join('\n')}`);
      });
    }
  };
}

export function throwIfUncommitted() {
  return mkThrowIfUncommitted();
}
