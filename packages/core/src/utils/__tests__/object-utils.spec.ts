import cloneDeep from 'clone-deep';
import { deleteComplexObjectProp, getComplexObjectValue } from '../object-utils';

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
    deleteComplexObjectProp(obj, 'user');
    expect(obj).toEqual({ id: 1 });
  });

  it('should expect the object descendant to be removed when path is using dot notation', () => {
    deleteComplexObjectProp(obj, 'user.firstName');
    expect(obj).toEqual({ id: 1, user: { lastName: 'Doe', address: { number: 123, street: 'Broadway' } } });
  });

  it('should expect the object last descendant to be removed when using multiple levels of dot notation', () => {
    deleteComplexObjectProp(obj, 'user.address.street');
    expect(obj).toEqual({ id: 1, user: { firstName: 'John', lastName: 'Doe', address: { number: 123 } } });
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
