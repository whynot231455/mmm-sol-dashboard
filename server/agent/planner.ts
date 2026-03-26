import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const plannerPrompt = `
You are an AI agent planner for Sol Analytics and Your Name is Sol Bot.
Your job is to determine the SINGLE NEXT STEP to help fulfill the user's goal based on the current Agent Memory.

Available Tools:
- get_user_data(query): Best for retrieving live metrics, performance data (Revenue, ROAS, Spend), and dashboard settings. Use when the user wants to know "how much" or "what is the current value of...".
- search_documentation(query): Best for explaining concepts, providing definitions, or understanding the "why" and "how" behind platform logic and MMM methodologies. Use when the user asks "What is [Concept]...", "How does...", or "Explain...".
- casual_chat(input): Use this explicitly for basic greetings, small talk, and casual conversation. Provide the user's phrase as input.
- llm_reason(prompt): Use for specialized reasoning, analysis, or final synthesis of gathered data.
- finish(output): Use this when you have gathered enough information and are ready to provide the final answer to the user. The \`output\` should just be "ready".

Rules:
- Speak only in English , dont speak in any other languages.
- Return ONLY JSON.
- STRICT ADHERENCE: If the user provides negative constraints (e.g., "don't tell X", "no Y", "without Z"), you MUST respect them in your thoughts and tool selection.
- Intent Mapping: Correctly distinguish between quantitative (data) and qualitative (knowledge) intents.
  * Phrased as "What is my revenue?" or "Revenue in dashboard?" -> get_user_data.
  * Phrased as "What is [Concept]...", "Who is the CEO?", "Who founded this?", or "Tell me about the team" -> search_documentation.
- No explanations in the JSON. Just the JSON object.

Constraint: Use the Agent Memory to understand what has already been done. Resolve vague references like "it" or "the previous one" in the User Goal using the history.

Agent Memory (Past Steps & Observations):
${'${agentMemoryStr}'}

Format Example for Next Step:
{
  "thought": "I need to fetch revenue trends first before doing analysis.",
  "tool": "get_user_data",
  "input": "Fetch revenue trends"
}

Format Example for Finishing condition:
{
  "thought": "I have retrieved the revenue data and understand the user's question. I can now generate a response.",
  "tool": "finish",
  "input": "ready"
}

User Goal:
${'${goal}'}
`;

interface NextAction {
  thought: string;
  tool: string;
  input: string;
}

function validateNextStep(step: unknown): NextAction {
  if (
    typeof step !== 'object' ||
    step === null ||
    !('tool' in step) ||
    !('input' in step) ||
    typeof step.tool !== 'string' ||
    typeof step.input !== 'string'
  ) {
    return { thought: "Fallback", tool: 'llm_reason', input: 'Analyze the request' };
  }

  return {
    thought: 'thought' in step && typeof step.thought === 'string' ? step.thought : 'Fallback',
    tool: step.tool,
    input: step.input,
  };
}

export async function planNextStep(goal: string, agentMemory: string = ''): Promise<NextAction> {
  const modelName = process.env.OLLAMA_MODEL || 'gemma3';
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  // --- FAST PATH: Simple greetings and basic chat ---
  const lowerGoal = goal.toLowerCase().trim();
  const greetingRegex = /^(hi|hello|hey|greetings|morning|afternoon|evening|thanks|thank you|bye|goodbye|who are you|what is your name)/i;

  if (greetingRegex.test(lowerGoal) && (!agentMemory || agentMemory.split('\n').length < 5)) {
    console.log('Backend Planner: Fast Path triggered for greeting.');
    return {
      thought: "User is initiating or ending a casual conversation. Using casual_chat directly.",
      tool: "casual_chat",
      input: goal
    };
  }
  // --- END FAST PATH ---

  try {
    const finalPrompt = plannerPrompt
      .replace('${agentMemoryStr}', agentMemory || 'No previous steps.')
      .replace('${goal}', goal);

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: modelName,
      prompt: finalPrompt,
      stream: false,
    });

    const content = response.data.response.trim();
    // More robust regex to catch JSON even if LLM adds preamble/postamble
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn('Backend Planner: No JSON found in response. Raw content:', content);
      throw new Error('No JSON found in LLM response');
    }

    // Clean common LLM garbage (backticks, markdown blocks)
    const cleanedJson = jsonMatch[0]
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);
    return validateNextStep(parsed);
  } catch (err) {
    console.error('Failed to plan next step:', err);
    return { thought: "Error generating plan", tool: 'llm_reason', input: 'Generate fallback response based on connection error' };
  }
}

export async function createTask(goal: string, sessionId?: string) {
  // We no longer pre-plan steps here. We simply register the task.
  // The ReAct dynamic loop will handle steps as they execute.

  // 1. Create task in DB
  const { data: task, error: taskError } = await supabase
    .from('agent_tasks')
    .insert([{ goal, status: 'running', session_id: sessionId }])
    .select()
    .single();

  if (taskError) throw taskError;

  return { ...task, steps: [] };
}
