export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskStep {
  id: string | number;
  task_id: string;
  label: string;
  action: string;
  status: TaskStatus;
  result?: string;
  order_index: number;
  tool_name?: string;
  tool_input?: string;
}

export interface AgentTask {
  id: string;
  goal: string;
  status: TaskStatus;
  intent?: string;
  steps: TaskStep[];
  created_at?: string;
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  result: string;
  success: boolean;
}
