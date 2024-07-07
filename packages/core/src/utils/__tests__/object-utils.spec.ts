import { log } from '@lerna-lite/npmlog';
import cloneDeep from 'clone-deep';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteComplexObjectProp, getComplexObjectValue, isEmpty } from '../object-utils';

describe('deleteComplexObjectProp method', () => {
  let obj = {};
  beforeEach(() => {
    obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', address: { number: 123, street: 'Broadway' } } };
  });

  it('should expect the same object as the original object when no path is provided', () => {
    const originalObj = cloneDeep(obj);
    deleteComplexObjectProp(obj, undefined as any);
    expect(originalObj).toEqual(obj);
  });

  it('should expect the same object as the original object when search argument is not part of the input object', () => {
    const originalObj = cloneDeep(obj);
    deleteComplexObjectProp(obj, 'users');
    expect(originalObj).toEqual(obj as any);
  });

  it('should expect the object to remove an entire property when path is a single string without dot notation', () => {
    const logSpy = vi.spyOn(log, 'verbose');
    deleteComplexObjectProp(obj, 'user', 'some object name');
    expect(obj).toEqual({ id: 1 });
    expect(logSpy).toHaveBeenCalledWith('pack', 'Removed "user" field from some object name.');
  });

  it('should expect the object descendant to be removed when path is using dot notation', () => {
    const logSpy = vi.spyOn(log, 'verbose');
    deleteComplexObjectProp(obj, 'user.firstName');
    expect(obj).toEqual({ id: 1, user: { lastName: 'Doe', address: { number: 123, street: 'Broadway' } } });
    expect(logSpy).toHaveBeenCalledWith('pack', 'Removed "user.firstName" field from n/a.');
  });

  it('should expect the object last descendant to be removed when using multiple levels of dot notation', () => {
    const logSpy = vi.spyOn(log, 'verbose');
    deleteComplexObjectProp(obj, 'user.address.street', '"@workspace/pkg-1" package');
    expect(obj).toEqual({ id: 1, user: { firstName: 'John', lastName: 'Doe', address: { number: 123 } } });
    expect(logSpy).toHaveBeenCalledWith('pack', 'Removed "user.address.street" field from "@workspace/pkg-1" package.');
  });
});

describe('getComplexObjectValue method', () => {
  let obj = {};
  beforeEach(() => {
    obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', address: { number: 123, street: 'Broadway' } } };
  });

  it('should return original object when no path is provided', () => {
    const output = getComplexObjectValue(obj, undefined as any);
    expect(output).toBe(obj);
  });

  it('should return undefined when search argument is not part of the input object', () => {
    const output = getComplexObjectValue(obj, 'users');
    expect(output).toBe(undefined as any);
  });

  it('should return the object descendant even when path given is not a dot notation', () => {
    const output = getComplexObjectValue(obj, 'user');
    expect(output).toEqual(obj['user']);
  });

  it('should return the object descendant when using dot notation', () => {
    const output = getComplexObjectValue(obj, 'user.firstName');
    expect(output).toEqual('John');
  });

  it('should return the object descendant when using multiple levels of dot notation', () => {
    const output = getComplexObjectValue(obj, 'user.address.street');
    expect(output).toEqual('Broadway');
  });
});

describe('isEmpty method', () => {
  it('should return true when input is an empty object', () => {
    const output = isEmpty({});
    expect(output).toBe(true);
  });

  it('should return true when input is null', () => {
    const output = isEmpty(null as any);
    expect(output).toBe(true);
  });

  it('should return true when input is undefined', () => {
    const output = isEmpty(undefined as any);
    expect(output).toBe(true);
  });

  it('should return false when input has at least one property', () => {
    const output = isEmpty({ hello: 'world' });
    expect(output).toBe(false);
  });
});
