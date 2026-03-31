import { describe, it, expect } from 'vitest';
import { tools } from '../server/agent/tools/registry';

describe('Tool Registry Tests', () => {
  it('should have the get_user_data tool registered', () => {
    const tool = tools['get_user_data'];
    expect(tool).toBeDefined();
    expect(tool.name).toBe('get_user_data');
    expect(typeof tool.execute).toBe('function');
  });

  it('should have the search_documentation tool registered', () => {
    const tool = tools['search_documentation'];
    expect(tool).toBeDefined();
    expect(tool.name).toBe('search_documentation');
    expect(typeof tool.execute).toBe('function');
  });

  it('should have the analyze_meridian_results tool registered', () => {
    const tool = tools['analyze_meridian_results'];
    expect(tool).toBeDefined();
    expect(tool.name).toBe('analyze_meridian_results');
    expect(typeof tool.execute).toBe('function');
  });

  it('should handle casual_chat execution correctly', async () => {
    const tool = tools['casual_chat'];
    expect(tool).toBeDefined();
    const response = await tool.execute('hello');
    expect(response).toHaveProperty('answer');
    expect(response).toHaveProperty('isFinal', true);
  });
});
