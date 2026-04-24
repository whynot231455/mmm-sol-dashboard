import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatPercent, formatSmartCurrency } from './formatters';

describe('formatCurrency', () => {
  it('formats standard currency with commas and no decimals', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
  });

  it('formats zero as $0', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats negative values', () => {
    const result = formatCurrency(-5000);
    expect(result).toContain('5,000');
    expect(result).toContain('$');
  });

  it('formats compact notation for large numbers', () => {
    const result = formatCurrency(1500000, true);
    expect(result).toContain('$');
    expect(result).toMatch(/1\.5M/);
  });

  it('formats compact notation for thousands', () => {
    const result = formatCurrency(25000, true);
    expect(result).toContain('$');
    expect(result).toMatch(/25.*K/);
  });
});

describe('formatNumber', () => {
  it('formats with commas by default', () => {
    expect(formatNumber(123456)).toBe('123,456');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('uses compact notation', () => {
    const result = formatNumber(2500000, true);
    expect(result).toMatch(/2\.5M/);
  });

  it('handles small numbers without commas', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatPercent', () => {
  it('formats percentage with default 1 decimal place', () => {
    // Input of 50 → 50/100 = 0.5 → 50.0%
    expect(formatPercent(50)).toBe('50.0%');
  });

  it('formats zero percent', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formats with custom decimal places', () => {
    expect(formatPercent(33.333, 2)).toBe('33.33%');
  });

  it('formats 100 percent', () => {
    expect(formatPercent(100)).toBe('100.0%');
  });

  it('formats fractional percentages', () => {
    expect(formatPercent(0.5, 1)).toBe('0.5%');
  });
});

describe('formatSmartCurrency', () => {
  it('uses compact format for millions', () => {
    const result = formatSmartCurrency(1500000);
    expect(result).toContain('$');
    expect(result).toMatch(/1\.5M/);
  });

  it('uses compact format for thousands', () => {
    const result = formatSmartCurrency(5000);
    expect(result).toContain('$');
    expect(result).toMatch(/5.*K/);
  });

  it('uses standard format for small values', () => {
    const result = formatSmartCurrency(42);
    expect(result).toBe('$42');
  });

  it('handles negative millions', () => {
    const result = formatSmartCurrency(-2000000);
    expect(result).toContain('$');
    expect(result).toMatch(/2.*M/);
  });

  it('handles zero', () => {
    expect(formatSmartCurrency(0)).toBe('$0');
  });
});
