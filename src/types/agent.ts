export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskStep {
  id: string | number;
  task_id: string;
  label: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  order_index?: number;
  tool_name?: string;
  tool_input?: string;
}

export interface AgentTask {
  id: string;
  goal: string;
  status: TaskStatus;
  intent?: string;
  steps: TaskStep[];
  context?: AgentContext;
  toolResults?: ToolResult[];
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

export interface AgentContext {
  docs: string;
  metrics: string;
  history: string[];
}

export interface AgentCallbacks {
  onStepUpdate: (step: TaskStep) => void;
  onMessage: (content: string) => void;
  onTaskUpdate: (task: AgentTask) => void;
}
