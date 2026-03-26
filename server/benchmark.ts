console.log('DEBUG: Script started');
import { createTask } from './agent/planner.js';
import { runAgent } from './agent/runner.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const TEST_CASES = [
  {
    name: "Metric Accuracy",
    goal: "What is my total revenue and total spend?",
    expected: "Revenue: $14,470,606,969.75, Spend: $96,798,651.84"
  },
  {
    name: "RAG Synthesis",
    goal: "What are Base Sales and Incremental Sales?",
    expected: "Base Sales: inherent demand; Incremental Sales: marketing driven."
  },
  {
    name: "Instruction Following",
    goal: "Give a 3-word summary of ROAS in French. Wait, NO - ONLY ENGLISH, JSON ONLY.",
    expected: "Must be in English and potentially JSON (depending on planner state)."
  }
];

const MODELS = ['qwen2.5vl:7b', 'gemma3', 'qwen2.5:7b', 'llama3:latest'];

interface BenchmarkResult {
  model: string;
  test: string;
  goal: string;
  response: string;
  latency: number;
  pass: boolean;
}

async function runBenchmark() {
  const results: BenchmarkResult[] = [];
  const sessionId = `benchmark-${Date.now()}`;

  // Ensure session exists
  await supabase.from('chat_sessions').upsert({ id: sessionId, title: 'Model Benchmark' });

  for (const model of MODELS) {
    console.log(`\n--- Benchmarking Model: ${model} ---`);
    process.env.OLLAMA_MODEL = model;

    for (const test of TEST_CASES) {
      console.log(`Running Test: ${test.name}...`);
      
      const startTime = Date.now();
      
      // 1. Planning Phase
      const task = await createTask(test.goal, sessionId);
      
      // 2. Execution Phase
      await runAgent(task.id, { docs: '', metrics: '' }, []);
      
      const endTime = Date.now();
      const latency = (endTime - startTime) / 1000;

      // 3. Retrieve Result
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('content')
        .eq('session_id', sessionId)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1);

      const response = messages?.[0]?.content || "No response found.";

      // 4. Basic Evaluation
      let pass = false;
      const r = response.toLowerCase();
      if (test.name === "Metric Accuracy") {
        // High-level check for correct numbers
        pass = r.includes("14.4") && r.includes("96.");
      } else if (test.name === "RAG Synthesis") {
        // Check for core concepts
        pass = r.includes("base") && r.includes("incremental");
      } else if (test.name === "Instruction Following") {
        // Check for English-only and JSON-like structure
        const isJsonLike = r.includes("{") || r.includes("}");
        const isEnglish = !r.includes("en français") && !r.includes("résumé");
        pass = isJsonLike && isEnglish;
      }

      results.push({
        model,
        test: test.name,
        goal: test.goal,
        response: response.substring(0, 150).replace(/\n/g, ' ') + (response.length > 150 ? '...' : ''),
        latency,
        pass,
      });

      console.log(`Completed in ${latency.toFixed(2)}s - [${pass ? 'PASS' : 'FAIL'}]`);
    }
  }

  // Generate Report
  let report = `# 3-Way Model Benchmark: Gemma 3 vs. Qwen 2.5 vs. Llama 3\n\n`;
  report += `| Model | Test Case | Latency (s) | Pass/Fail | Question | Response |\n`;
  report += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  
  for (const res of results) {
    const status = res.pass ? "✅" : "❌";
    report += `| ${res.model} | ${res.test} | ${res.latency.toFixed(2)} | ${status} | ${res.goal} | ${res.response} |\n`;
  }

  fs.writeFileSync('./benchmark_results.md', report);
  console.log('\nBenchmark complete. Results saved to benchmark_results.md');
}

runBenchmark().catch(console.error);
