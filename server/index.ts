import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createTask } from './agent/planner.js';
import { runAgent } from './agent/runner.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Create a task (Planning Phase)
app.post('/api/agent/create', async (req, res) => {
  const { goal, sessionId } = req.body;
  if (!goal) return res.status(400).json({ error: 'Goal is required' });

  try {
    const task = await createTask(goal, sessionId);
    res.json(task);
  } catch (err) {
    console.error('Failed to create task:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// 2. Run a task (Execution Phase)
app.post('/api/agent/run', async (req, res) => {
  const { taskId, context, chatHistory } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });

  try {
    // We run this asynchronously so the client doesn't time out
    // The client can poll Supabase or use a socket to see progress
    runAgent(taskId, context || { docs: '', metrics: '' }, chatHistory)
      .catch(err => console.error(`Task ${taskId} background error:`, err));

    res.json({ success: true, message: 'Agent started' });
  } catch (err) {
    console.error('Failed to run agent:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// 3. Run a task with streaming (Execution Phase)
app.post('/api/agent/run-stream', async (req, res) => {
  const { taskId, context, chatHistory } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onStream = (chunk: string) => {
    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
  };

  try {
    await runAgent(taskId, context || { docs: '', metrics: '' }, chatHistory, onStream);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error(`Task ${taskId} streaming error:`, err);
    res.write(`data: ${JSON.stringify({ error: (err as Error).message })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Agent backend running at http://localhost:${port}`);
});
