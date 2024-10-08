import { describe, expect, it } from 'vitest';

import { Tracker } from '../tracker.js';
import testEvent from './test-event.js';

const name = 'test';

describe('Tracker', () => {
  it('initialization', () => {
    const simple = new Tracker(name);
    expect(simple.completed()).toBe(0);
  });

  let track: Tracker;
  const todo = 100;

  it('completion', () => {
    track = new Tracker(name, todo);
    expect(track.completed()).toBe(0);

    const promise = new Promise<void>((resolve) => {
      testEvent(track, 'change', afterCompleteWork);

      track.completeWork(todo);
      expect(track.completed()).toBe(1);

      function afterCompleteWork(err: any, onChangeName: string) {
        expect(err).toBe(null);
        expect(onChangeName).toBe(name);
        resolve();
      }
    });

    // eslint-disable-next-line vitest/no-test-return-statement
    return promise;
  });

  it('add more work', () => {
    const promise = new Promise<void>((resolve) => {
      testEvent(track, 'change', afterAddWork);
      track.addWork(todo);
      expect(track.completed()).toBe(0.5);

      function afterAddWork(err: any, onChangeName: string) {
        expect(err).toBe(null);
        expect(onChangeName).toBe(name);
        resolve();
      }
    });

    // eslint-disable-next-line vitest/no-test-return-statement
    return promise;
  });

  it('complete more work', () => {
    track.completeWork(200);
    expect(track.completed()).toBe(1);
  });

  it('finish is always 100%', () => {
    const finishtest = new Tracker(name, todo);
    finishtest.completeWork(50);
    finishtest.finish();
    expect(finishtest.completed()).toBe(1);
  });
});
