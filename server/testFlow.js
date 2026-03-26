import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BACKEND_URL = 'http://localhost:3001';

async function testFlow() {
  const sessionId = Date.now().toString();

  // 1. Emulate frontend inserting the session BEFORE hitting backend
  await sb.from('chat_sessions').upsert({
    id: sessionId,
    title: 'Test Flow',
  });
  console.log('Inserted session', sessionId);

  // 2. Hit backend /api/agent/create
  const initRes = await axios.post(`${BACKEND_URL}/api/agent/create`, {
    goal: 'Hello',
    sessionId: sessionId,
    chatHistory: []
  });
  const task = initRes.data;
  console.log('Created task', task.id);

  // 3. Hit backend /api/agent/run
  const runRes = await axios.post(`${BACKEND_URL}/api/agent/run`, {
    taskId: task.id,
    context: { docs: '', metrics: '' }
  });
  console.log('Run response', runRes.data);

  // Wait a bit for the background process to finish
  console.log('Waiting for agent to finish (10s)...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Check messages
  const { data: msgs, error: msgErr } = await sb.from('chat_messages').select('*').eq('session_id', sessionId);
  console.log('Messages in DB:', msgs, msgErr);

  const { data: steps, error: stepErr } = await sb.from('agent_steps').select('id, tool_name, status, result').eq('task_id', task.id);
  console.log('Steps in DB:', steps, stepErr);
}
testFlow().catch(console.error);
