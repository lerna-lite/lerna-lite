import { describe, expect, it } from 'vitest';

import { alignCenter, alignLeft, alignRight } from '../wide-align.js';

describe('wide-align', () => {
  describe('alignLeft', () => {
    it('should pad a narrow string to the target width', () => {
      expect(alignLeft('abc', 6)).toBe('abc   ');
    });

    it('should handle wide (CJK) characters', () => {
      // "古" is 2 columns wide, so "古古" = 4 columns, needs 2 more to reach 6
      expect(alignLeft('古古', 6)).toBe('古古  ');
    });

    it('should handle emoji characters', () => {
      // emoji are typically 2 columns wide
      const result = alignLeft('😀', 4);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result).toMatch(/^😀/);
    });

    it('should return trimmed string when wider than target width', () => {
      expect(alignLeft('abcdef', 3)).toBe('abcdef');
    });

    it('should return trimmed string when equal to target width', () => {
      expect(alignLeft('abc', 3)).toBe('abc');
    });

    it('should handle empty string', () => {
      expect(alignLeft('', 5)).toBe('     ');
    });

    it('should trim trailing whitespace before padding', () => {
      expect(alignLeft('abc   ', 6)).toBe('abc   ');
    });

    it('should return original string when all whitespace and length >= width', () => {
      expect(alignLeft('      ', 4)).toBe('      ');
    });
  });

  describe('alignRight', () => {
    it('should pad a narrow string to the target width', () => {
      expect(alignRight('abc', 6)).toBe('   abc');
    });

    it('should handle wide (CJK) characters', () => {
      expect(alignRight('古古', 6)).toBe('  古古');
    });

    it('should return trimmed string when wider than target width', () => {
      expect(alignRight('abcdef', 3)).toBe('abcdef');
    });

    it('should return trimmed string when equal to target width', () => {
      expect(alignRight('abc', 3)).toBe('abc');
    });

    it('should handle empty string', () => {
      expect(alignRight('', 5)).toBe('     ');
    });

    it('should trim leading whitespace before padding', () => {
      expect(alignRight('   abc', 6)).toBe('   abc');
    });

    it('should return original string when all whitespace and length >= width', () => {
      expect(alignRight('      ', 4)).toBe('      ');
    });
  });

  describe('alignCenter', () => {
    it('should center a narrow string within the target width', () => {
      expect(alignCenter('abc', 7)).toBe('  abc  ');
    });

    it('should handle odd padding by putting extra space on the right', () => {
      expect(alignCenter('abc', 6)).toBe(' abc  ');
    });

    it('should handle wide (CJK) characters', () => {
      // "古" = 2 columns, need 4 more padding for width 6: 2 left + 2 right
      expect(alignCenter('古', 6)).toBe('  古  ');
    });

    it('should return trimmed string when wider than target width', () => {
      expect(alignCenter('abcdef', 3)).toBe('abcdef');
    });

    it('should return trimmed string when equal to target width', () => {
      expect(alignCenter('abc', 3)).toBe('abc');
    });

    it('should handle empty string', () => {
      expect(alignCenter('', 5)).toBe('     ');
    });

    it('should trim both sides before padding', () => {
      expect(alignCenter('  abc  ', 7)).toBe('  abc  ');
    });

    it('should return original string when all whitespace and length >= width', () => {
      expect(alignCenter('      ', 4)).toBe('      ');
      6;
    });
  });
});
