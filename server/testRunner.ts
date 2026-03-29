import { runAgent } from './agent/runner.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY! || process.env.SUPABASE_KEY!);

async function test() {
  const sessionId = Date.now().toString();
  await sb.from('chat_sessions').upsert({ id: sessionId, title: 'Test 2' });

  const { data: task, error: insertError } = await sb.from('agent_tasks').insert([{
    goal: 'Test chat message insert',
    status: 'running',
    session_id: sessionId
  }]).select().single();

  if (insertError || !task) {
    console.error('Failed to create test task:', insertError);
    return;
  }

  console.log('Running agent with task id:', task.id);
  await runAgent(task.id, { docs: '', metrics: '' }, []);
  console.log('Done running agent. Checking DB...');

  const { data: msgs } = await sb.from('chat_messages').select('*').eq('session_id', sessionId);
  console.log('Messages in DB:', msgs);
}
test().catch(console.error);
