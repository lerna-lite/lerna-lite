import { describe, expect, it } from 'vitest';

import { pluralize } from '../string-utils';

describe('String Utils', () => {
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
