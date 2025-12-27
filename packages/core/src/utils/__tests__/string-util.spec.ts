import { describe, expect, it } from 'vitest';

import { excludeValuesFromArray, pluralize } from '../string-utils.js';

describe('String Utils', () => {
  describe('pluralize() method', () => {
    it('should return a singular word when string length is below 1', () => {
      const str1 = pluralize('item', 0);
      const str2 = pluralize('item', 1);

      expect(str1).toBe('item');
      expect(str2).toBe('item');
    });

    it('should return a plural word when string length is greater than 1', () => {
      const str1 = pluralize('item', 2);

      expect(str1).toBe('items');
    });

    it('should return a custom plural word when string length is greater than 1 and a custom format is provided', () => {
      const str1 = pluralize('cheval', 1, 'chevaux');
      const str2 = pluralize('cheval', 2, 'chevaux');

      expect(str1).toBe('cheval');
      expect(str2).toBe('chevaux');
    });
  });

  describe('excludeValuesFromArray() method', () => {
    it('should return same input array when no exclusion found from input array', () => {
      const inArr = ['John', 'Jane', 'Doe'];
      const outArr = excludeValuesFromArray(inArr, ['banana', 'orange']);
      expect(outArr).toEqual(inArr);
    });

    it('should return input array minus exclusion', () => {
      const inArr = ['apple', 'raisin', 'orange', 'blueberry', 'banana'];
      const outArr = excludeValuesFromArray(inArr, ['banana', 'orange']);
      expect(outArr).toEqual(['apple', 'raisin', 'blueberry']);
    });
  });
});