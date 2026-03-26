import type { ToolCall, ToolResult } from './types.js';

/**
 * Executes a tool on the server.
 */
export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
  try {
    switch (toolCall.tool) {
      case 'update_simulation':
      case 'predict': {
        const spendChange = parseFloat(String(toolCall.parameters.spendChange ?? '0'));
        const seasonality = parseInt(String(toolCall.parameters.seasonality ?? '0'), 10);

        if (!isNaN(spendChange) || !isNaN(seasonality)) {
          // In a real app, this might update a row in a 'simulations' table
          return {
            tool: 'update_simulation',
            result: `Simulation parameters updated: spendChange=${spendChange}, seasonality=${seasonality}.`,
            success: true,
          };
        }
        return {
          tool: 'update_simulation',
          result: 'Error: Invalid simulation parameters.',
          success: false,
        };
      }

      default:
        return {
          tool: toolCall.tool,
          result: `Error: Unknown tool "${toolCall.tool}".`,
          success: false,
        };
    }
  } catch (err) {
    return {
      tool: toolCall.tool,
      result: `Error executing tool: ${(err as Error).message}`,
      success: false,
    };
  }
}

export function parseLLMToolCall(content: string): ToolCall | null {
  const jsonRegex = /\{[\s\S]*?\}/g;
  const matches = content.match(jsonRegex);

  if (!matches) return null;

  for (const match of matches) {
    try {
      const cleaned = match.replace(/[*`]|```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.tool && parsed.parameters) {
        return parsed as ToolCall;
      }

      if (parsed.spendChange !== undefined || parsed.seasonality !== undefined) {
        return { tool: 'update_simulation', parameters: parsed };
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  return null;
}

export function stripJSON(content: string): string {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/^(?:Assistant used tool:|Tool:|Parameters:|Action:).*$/gm, '')
    .replace(/`[\s\S]*?`/g, (match) => {
      if (match.includes('{') || match.includes('tool') || match.includes(':')) return '';
      return match;
    })
    .replace(/(?:[*`\s]*)?\{[\s\S]*?\}(?:[*`\s]*)?/g, '')
    .replace(/Tool:\s*\w+/gi, '')
    .replace(/Parameters:\s*/gi, '')
    .trim();
}
