import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { tools } from './tools/registry.js';
import { stripJSON } from './tools.js';
import { planNextStep } from './planner.js';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url!);
const __dirname = path.dirname(__filename);
const companyKnowledge = JSON.parse(fs.readFileSync(path.join(__dirname, 'knowledge', 'company.json'), 'utf-8'));

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! || process.env.SUPABASE_KEY!
);

interface OllamaStreamChunk {
  response?: string;
  done?: boolean;
}

interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

async function callLLM(prompt: string): Promise<string> {
  const modelName = process.env.OLLAMA_MODEL || 'gemma3';
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  const response = await axios.post(`${ollamaUrl}/api/generate`, {
    model: modelName,
    prompt,
    stream: false,
  });

  return response.data.response.trim();
}

/**
 * Calls Ollama LLM with streaming enabled.
 * Returns an async generator that yields chunks of the response.
 */
async function* callLLMStream(prompt: string) {
  const modelName = process.env.OLLAMA_MODEL || 'gemma3';
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  try {
    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: modelName,
      prompt,
      stream: true,
    }, { responseType: 'stream' });

    // Node.js axial response.data is a Readable stream
    for await (const chunk of response.data) {
      const lines = chunk.toString().split('\n').filter((l: string) => l.trim());
      for (const line of lines) {
        try {
          const data = JSON.parse(line) as OllamaStreamChunk;
          if (data.response) yield data.response;
          if (data.done) return;
        } catch {
          console.debug('Failed to parse Ollama stream line:', line);
        }
      }
    }
  } catch (err) {
    console.error('Ollama stream request failed:', err);
    throw err;
  }
}

function formatChatHistory(history: ChatHistoryEntry[]): string {
  if (!history || history.length === 0) return 'No previous conversation.';
  return history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
}


export async function runAgent(
  taskId: string,
  context: { docs: string; metrics: string },
  chatHistory: ChatHistoryEntry[] = [],
  onStream?: (chunk: string) => void
) {
  // 1. Fetch task
  const { data: task, error: taskError } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (taskError) throw taskError;

  // Fetch the latest dashboard state to provide as context
  const { data: globalState } = await supabase
    .from('dashboard_state')
    .select('data')
    .eq('key', 'current_dashboard')
    .single();

  // Initialize Agent Memory with company identity and provided context
  let agentMemory = `Agent Identity: You are a Sol Analytics Assistant.\n`;
  agentMemory += `Company Mission: ${companyKnowledge.mission}\n`;
  agentMemory += `Company Solutions: ${JSON.stringify(companyKnowledge.solutions)}\n\n`;
  agentMemory += `Initial Context (System):\n${context.docs}\n${context.metrics}\n`;

  if (globalState && globalState.data) {
    agentMemory += `\nInitial Context (Dashboard State):\n${JSON.stringify(globalState.data)}\n`;
  }
  agentMemory += `\n`;

  // Update task status to running
  await supabase.from('agent_tasks').update({ status: 'running' }).eq('id', taskId);

  let directSynthesisAnswer: string | null = null;

  let finished = false;
  let stepCount = 0;
  const MAX_STEPS = 7;
  const usedTools = new Set<string>();

  while (!finished && stepCount < MAX_STEPS) {
    try {
      // Periodic cancellation check
      const { data: currentTask } = await supabase
        .from('agent_tasks')
        .select('status')
        .eq('id', taskId)
        .single();

      if (currentTask?.status === 'cancelled') {
        console.log(`Task ${taskId} was cancelled by the user.`);
        return { success: false, error: 'Task cancelled' };
      }

      const nextAction = await planNextStep(task.goal, agentMemory);

      if (nextAction.tool === 'finish' || nextAction.tool === 'generate_response') {
        finished = true;
        break;
      }

      const toolName = nextAction.tool;
      let toolInput: string | Record<string, unknown> = nextAction.input;
      const humanLabels: Record<string, string> = {
        'get_user_data': 'Analyzing marketing performance & metrics...',
        'search_documentation': 'Searching internal knowledge base...',
        'casual_chat': 'Preparing a friendly response...',
        'llm_reason': 'Reasoning through the gathered information...'
      };

      const displayLabel = humanLabels[toolName] || toolName;
      const isDuplicate = usedTools.has(toolName);
      let stepId: string | null = null;

      if (!isDuplicate) {
        const { data: insertedStep, error: stepError } = await supabase.from('agent_steps').insert({
          task_id: taskId,
          label: displayLabel,
          action: toolName,
          tool_name: toolName,
          tool_input: typeof toolInput === 'object' ? JSON.stringify(toolInput) : (toolInput || ''),
          status: 'running',
          order_index: stepCount
        }).select().single();

        if (stepError) {
          console.error("Failed to insert dynamic step", stepError);
          break;
        }
        stepId = insertedStep.id;
        usedTools.add(toolName);
      }

      if (typeof toolInput === 'string') {
        try {
          toolInput = JSON.parse(toolInput);
        } catch {
          // Silent fallback for non-JSON tool input
        }
      }

      let stepResult = '';
      const tool = tools[toolName];
      if (tool) {
        console.log(`Executing tool: ${toolName}`);
        const result = await tool.execute(
          toolInput && typeof toolInput === 'object'
            ? ('query' in toolInput && typeof toolInput.query === 'string'
              ? toolInput.query
              : JSON.stringify(toolInput))
            : toolInput,
          context
        );

        // --- LATENCY OPTIMIZATION: Direct Synthesis ---
        if (result && typeof result === 'object' && result.isFinal) {
          stepResult = result.answer;
          directSynthesisAnswer = result.answer;
          finished = true; // Early exit
        } else {
          stepResult = typeof result === 'object' ? JSON.stringify(result) : String(result);
        }
        // --- END OPTIMIZATION ---

        // Log tool result to legacy table for compatibility, only if not a duplicate
        if (!isDuplicate) {
          await supabase.from('agent_tool_results').insert({
            task_id: taskId,
            tool_name: toolName,
            output: stepResult
          });
        }
      } else {
        stepResult = `Tool ${toolName} not found or implemented.`;
      }


      agentMemory += `Step Executed: ${displayLabel}\nThought: ${nextAction.thought || 'N/A'}\nTool: ${toolName}\nInput: ${typeof toolInput === 'object' ? JSON.stringify(toolInput) : toolInput}\nResult: ${stepResult}\n\n`;

      if (stepId) {
        await supabase.from('agent_steps').update({
          status: 'completed',
          result: stepResult
        }).eq('id', stepId);
      }

      if (finished) break; // Exit loop if tool provided final answer
      stepCount++;
    } catch (err) {
      console.error(`Dynamic step iteration failed:`, err);
      const errorMsg = (err as Error).message;
      await supabase.from('agent_tasks').update({ status: 'failed' }).eq('id', taskId);
      return { success: false, error: errorMsg };
    }
  }

  // Final Synthesis: Check for cancellation one last time before starting LLM synthesis
  const { data: finalCheck } = await supabase
    .from('agent_tasks')
    .select('status')
    .eq('id', taskId)
    .single();

  if (finalCheck?.status === 'cancelled') {
    console.log(`Task ${taskId} was cancelled before synthesis.`);
    return { success: false, error: 'Task cancelled' };
  }

  // Final Synthesis: Use Agent Memory to generate a complete answer
  try {
    let combinedHistory = [...chatHistory];
    if (task.session_id) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', task.session_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (messages && messages.length > 0) {
        combinedHistory = messages.reverse();
      }
    }

    let finalAnswer = '';

    if (directSynthesisAnswer) {
      // --- LATENCY OPTIMIZATION: Bypassing redundant synthesis pass ---
      console.log('Backend Runner: Bypassing synthesis pass for final tool result.');
      finalAnswer = directSynthesisAnswer;
      if (onStream) {
        onStream('SSE_RESERVED_START_SYNTHESIS');
        onStream(finalAnswer);
      }
    } else {
      const chatHistoryStr = formatChatHistory(combinedHistory);

      // Dynamic extraction of negative constraints to reinforce adherence
      const goalLower = task.goal.toLowerCase();
      const negativeKeywords = ['dont', "don't", 'no', 'without', 'avoid', 'stop'];
      const hasNegativeConstraint = negativeKeywords.some(kw => goalLower.includes(kw));
      const negativeConstraintsWarning = hasNegativeConstraint
        ? `\nCRITICAL: The user goal contains negative constraints (e.g., "${task.goal}"). You MUST NOT include any information the user asked to exclude.\n`
        : "";

      const synthesisPrompt = `You are a helpful and conversational AI Assistant for Sol Analytics.
Based on the following execution log and accumulated data (if any), provide a final, polished answer to the user's goal: "${task.goal}"

${negativeConstraintsWarning}

Response Guidelines (STRICT):
- LANGUAGE: Speak only in English. Do not use any other languages.
- USER'S ORIGINAL GOAL IS PARAMOUNT: If the user said "don't tell the spend", do NOT mention spend, even if it is in the context logs.
- DIRECT ANSWER FIRST: If the user asks for a specific metric (e.g., "What is my revenue?"), provide that number in the VERY FIRST line.
- NO ONE-WORD ANSWERS: Never just say "ok", "sure", or "done". Always provide a helpful sentence or explanation.
- OFF-TOPIC HANDLING: If the user asks something completely unrelated to Sol Analytics, Marketing Mix Modeling, or business data (e.g., weather, sports scores, personal advice), politely explain that you are a Sol Analytics specialist and your expertise is limited to marketing performance and business insights.
- CONCISENESS: For a direct question, the total response should ideally be under 3 sentences.
- Accuracy Priority: Use "Initial Context (System)" as the ground truth for historical totals (Revenue: $14.47B, Spend: $96.8M, ROAS: 149.49). Use "Dashboard State" only for current filter settings or simulated projections.
- Formatting: Use bold for numbers and key metrics. Format large numbers for readability (e.g., $14.47B instead of $14,470,000,000; $96.8M instead of $96,800,000).
- Conversational Tone: Be brief and professional. No "Step 1" or "Here is what I found" filler.
- ROAS vs ROI: ROAS is a ratio (Revenue / Spend), e.g., 5.4. ROI is a percentage (e.g., 540%).
- If data is missing or a tool failed, say "I don't have that data for [Metric/Subject Name] yet". 
- NEVER guess or hallucinate names of people, companies, or metrics. If you don't find it in the provided context, state that you don't know politely.

Source Guidelines (CRITICAL):
- Appending sources MUST only happen if you actually used a tool (like search_documentation or get_user_data) to find specific information.
- DO NOT append sources for simple greetings, casual chat, or if you couldn't find any relevant data.
- The sources format MUST be EXACTLY: Sources: [{"name": "Display Name", "link": "Route or URL"}]
- Valid Navigation Links: /measure, /predict, /optimize, /validate, /connect, /pipelines, /knowledge
- Example Sources array: [{"name": "Insights Knowledge Base", "link": "/knowledge"}]

Recent Conversation History (For Context Retention):
${chatHistoryStr}

Agent Execution Log & Memory (What you just did):
${agentMemory}

Final Polished Answer:
`;

      if (onStream) {
        // Stream the response back to the client
        onStream('SSE_RESERVED_START_SYNTHESIS'); // Signal that synthesis has started
        for await (const chunk of callLLMStream(synthesisPrompt)) {
          finalAnswer += chunk;
          onStream(chunk);
        }
      } else {
        finalAnswer = await callLLM(synthesisPrompt);
      }
    }

    const cleanedAnswer = stripJSON(finalAnswer);

    // --- CRITICAL: Mark task as completed IMMEDIATELY after synthesis is done ---
    // This ensures the UI "Thinking..." state disappears as soon as the answer is ready.
    await supabase.from('agent_tasks').update({
      status: 'completed',
    }).eq('id', taskId);

    // Insert synthesis step for audit trail
    await supabase.from('agent_steps').insert({
      task_id: taskId,
      action: 'synthesis',
      tool_name: 'generate_response',
      tool_input: 'Synthesizing final answer...',
      status: 'completed',
      result: cleanedAnswer,
      label: 'Generating response',
      order_index: stepCount
    });

    return { success: true };
  } catch (err) {
    console.error('Final synthesis failed:', err);
    await supabase.from('agent_tasks').update({ status: 'failed' }).eq('id', taskId);
    return { success: false, error: 'Final synthesis failed' };
  }
}
