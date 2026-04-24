import { describe, it, expect } from 'vitest';
import { validateMapping } from './csvParser';

describe('validateMapping', () => {
  it('returns true when all required fields are present', () => {
    const mapping = { date: 'Date', revenue: 'Sales', spend: 'Cost' };
    expect(validateMapping(mapping, ['date', 'revenue', 'spend'])).toBe(true);
  });

  it('returns false when a required field is missing', () => {
    const mapping = { date: 'Date', revenue: 'Sales' };
    expect(validateMapping(mapping, ['date', 'revenue', 'spend'])).toBe(false);
  });

  it('returns false when a required field is empty string', () => {
    const mapping = { date: 'Date', revenue: '', spend: 'Cost' };
    expect(validateMapping(mapping, ['date', 'revenue', 'spend'])).toBe(false);
  });

  it('returns true for empty required array', () => {
    const mapping = { date: 'Date' };
    expect(validateMapping(mapping, [])).toBe(true);
  });

  it('returns true for an empty mapping when no fields are required', () => {
    expect(validateMapping({}, [])).toBe(true);
  });

  it('returns false for an empty mapping when fields are required', () => {
    expect(validateMapping({}, ['date'])).toBe(false);
  });

  it('ignores extra fields in mapping', () => {
    const mapping = { date: 'Date', revenue: 'Sales', extra: 'Bonus' };
    expect(validateMapping(mapping, ['date', 'revenue'])).toBe(true);
  });
});
