import { toCamelCase } from '../string-utils';

describe('toCamelCase method', () => {
  const sentence = 'the quick brown fox';

  it('should return empty string when input is empty', () => {
    const output = toCamelCase('');
    expect(output).toBe('');
  });

  it('should return empty string when input is null', () => {
    const input = null as any;
    const output = toCamelCase(input);
    expect(output).toBe(null as any);
  });

  it('should return a camelCase string when input is a sentence', () => {
    const output = toCamelCase(sentence);
    expect(output).toBe('theQuickBrownFox');
  });

  it('should return a camelCase string when input is a sentence that may include numbers with next char being uppercase', () => {
    const output = toCamelCase(sentence + ' 123 ' + ' apples');
    expect(output).toBe('theQuickBrownFox123Apples');
  });
});
