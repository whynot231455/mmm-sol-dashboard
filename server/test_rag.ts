import { tools } from './agent/tools/registry.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- Testing RAG Search ---');
  const query = 'What are the three core pillars of Sol Analytics?';
  console.log(`Query: ${query}`);
  const result = await tools.search_documentation.execute(query);
  console.log('\nResult:');
  console.log(result);
  console.log('--- Test Complete ---');
}

test().catch(console.error);
