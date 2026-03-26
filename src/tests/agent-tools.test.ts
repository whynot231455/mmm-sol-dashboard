import { describe, it, expect } from 'vitest';
import { executeTool } from '../../server/agent/tools';
import type { ToolCall } from '../../server/agent/types';

describe('Agent Tools', () => {
  describe('executeTool', () => {
    it('should correctly parse numeric strings in update_simulation', async () => {
      const toolCall: ToolCall = {
        tool: 'update_simulation',
        parameters: {
          spendChange: '10.5',
          seasonality: '2'
        }
      };

      const result = await executeTool(toolCall);
      expect(result.success).toBe(true);
      expect(result.result).toContain('spendChange=10.5');
      expect(result.result).toContain('seasonality=2');
    });

    it('should correctly handle already numeric values in update_simulation', async () => {
      // Even if types say unknown, they might be numbers at runtime from JSON.parse
      const toolCall: unknown = {
        tool: 'update_simulation',
        parameters: {
          spendChange: 15.7,
          seasonality: 3
        }
      };

      const result = await executeTool(toolCall as ToolCall);
      expect(result.success).toBe(true);
      expect(result.result).toContain('spendChange=15.7');
      expect(result.result).toContain('seasonality=3');
    });

    it('should handle missing parameters gracefully', async () => {
      const toolCall: ToolCall = {
        tool: 'update_simulation',
        parameters: {}
      };

      const result = await executeTool(toolCall);
      // It should fallback to 0 as implemented: String(undefined ?? '0') -> '0'
      expect(result.success).toBe(true);
      expect(result.result).toContain('spendChange=0');
      expect(result.result).toContain('seasonality=0');
    });

    it('should return error for unknown tool', async () => {
      const toolCall: ToolCall = {
        tool: 'non_existent_tool',
        parameters: {}
      };

      const result = await executeTool(toolCall);
      expect(result.success).toBe(false);
      expect(result.result).toContain('Unknown tool "non_existent_tool"');
    });
  });
});
