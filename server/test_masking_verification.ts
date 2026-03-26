import { runAgent } from './agent/runner.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function verifyMasking() {
  console.log('--- Verifying Tool Masking ---');
  const sessionId = 'masking-test-' + Date.now();
  await sb.from('chat_sessions').upsert({ id: sessionId, title: 'Masking Test' });

  const { data: task } = await sb.from('agent_tasks').insert([{
    goal: 'What is my current revenue and what does ROAS stand for?',
    status: 'pending',
    session_id: sessionId
  }]).select().single();

  console.log('Running agent taskId:', task.id);
  await runAgent(task.id, { docs: '', metrics: '' }, []);

  console.log('Done running agent. Checking agent_steps for taskId:', task.id);
  const { data: steps } = await sb.from('agent_steps').select('*').eq('task_id', task.id).order('order_index', { ascending: true });

  console.log('Steps in DB:');
  const toolNames = steps?.map(s => s.tool_name);
  console.log(toolNames);

  const duplicates = toolNames?.filter((item, index) => toolNames.indexOf(item) !== index);
  if (duplicates && duplicates.length > 0) {
    console.error('FAILED: Found duplicate tool names in agent_steps:', duplicates);
  } else {
    console.log('SUCCESS: No duplicate tool names in agent_steps.');
  }
}

verifyMasking().catch(console.error);
