import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatPercent, formatSmartCurrency } from '../lib/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats numbers as currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
    });

    it('formats numbers with compact notation', () => {
      expect(formatCurrency(1200000, true)).toBe('$1.2M');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1234.56)).toBe('1,235');
    });

    it('formats numbers with compact notation', () => {
      expect(formatNumber(1200000, true)).toBe('1.2M');
    });
  });

  describe('formatPercent', () => {
    it('formats numbers as percentage', () => {
      expect(formatPercent(12.5)).toBe('12.5%');
    });

    it('formats numbers with custom decimals', () => {
      expect(formatPercent(12.567, 2)).toBe('12.57%');
    });
  });

  describe('formatSmartCurrency', () => {
    it('uses standard notation for small numbers', () => {
      expect(formatSmartCurrency(500)).toBe('$500');
    });

    it('uses compact notation for numbers >= 1000', () => {
      expect(formatSmartCurrency(1500)).toBe('$1.5K');
    });

    it('uses compact notation for numbers >= 1000000', () => {
      expect(formatSmartCurrency(2500000)).toBe('$2.5M');
    });
  });
});
