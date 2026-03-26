import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function checkSteps() {
  const { data: latestTask } = await sb
    .from('agent_tasks')
    .select('id, goal')
    .like('session_id', 'masking-test-%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!latestTask) {
    console.log('No masking-test task found.');
    return;
  }

  console.log(`Checking steps for task ID: ${latestTask.id} ("${latestTask.goal}")`);

  const { data: steps } = await sb
    .from('agent_steps')
    .select('tool_name, label, status')
    .eq('task_id', latestTask.id)
    .order('order_index', { ascending: true });

  console.log('--- Agent Steps ---');
  console.table(steps);

  const toolNames = steps?.map(s => s.tool_name).filter(n => n !== 'generate_response');
  const uniqueTools = new Set(toolNames);
  
  if (toolNames?.length !== uniqueTools.size) {
    console.log('FAILED: Found duplicates in agent_steps!');
  } else {
    console.log('PASSED: No duplicates found in agent_steps (excluding final synthesis).');
  }
}

checkSteps().catch(console.error);
