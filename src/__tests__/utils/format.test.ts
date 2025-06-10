import { describe, test, expect } from 'vitest';
import { formatDate, truncateText, getInitials } from '@/utils/format';

describe('Format Utils', () => {
  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/Jan 15, 2024/);
    });

    test('handles invalid date', () => {
      const formatted = formatDate(new Date('invalid'));
      
      expect(formatted).toBe('Invalid Date');
    });
  });

  describe('truncateText', () => {
    test('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const truncated = truncateText(longText, 20);
      
      expect(truncated).toBe('This is a very long...');
      expect(truncated.length).toBeLessThanOrEqual(23); // 20 + '...'
    });

    test('returns original text if shorter than max length', () => {
      const shortText = 'Short text';
      const truncated = truncateText(shortText, 20);
      
      expect(truncated).toBe('Short text');
    });
  });

  describe('getInitials', () => {
    test('gets initials from full name', () => {
      const initials = getInitials('John Doe');
      expect(initials).toBe('JD');
    });

    test('gets initial from single name', () => {
      const initials = getInitials('John');
      expect(initials).toBe('J');
    });

    test('handles empty name', () => {
      const initials = getInitials('');
      expect(initials).toBe('');
    });

    test('handles multiple names', () => {
      const initials = getInitials('John Michael Doe');
      expect(initials).toBe('JD'); // Should take first and last
    });
  });
});
