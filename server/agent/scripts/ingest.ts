import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = 'mxbai-embed-large';

async function getEmbedding(text: string) {
  const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
    model: EMBEDDING_MODEL,
    prompt: text,
  });
  return response.data.embedding;
}

function chunkText(text: string, size = 1000): string[] {
  // Enhanced chunking: try to split by paragraphs or headers first
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk.length + para.length) > size && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }

    // If a single paragraph is larger than the chunk size, we must force-split it
    if (para.length > size) {
      let remaining = para;
      while (remaining.length > 0) {
        chunks.push(remaining.slice(0, size).trim());
        remaining = remaining.slice(size - 100); // 100 char overlap
        if (remaining.length <= 100) break; // Avoid tiny tail chunks
      }
    } else {
      currentChunk += para + "\n\n";
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function ingest() {
  const docPath = path.join(__dirname, '..', 'knowledge', 'documentation.json');
  const sections = JSON.parse(fs.readFileSync(docPath, 'utf-8'));

  // Use a unique batch ID for this ingestion run
  const batchId = crypto.randomUUID();

  console.log(`--- Starting Ingestion (${sections.length} sections found) ---`);
  console.log(`Batch ID: ${batchId}`);

  let success = true;

  try {
    for (const section of sections) {
      console.log(`Section: ${section.title}`);
      for (const article of section.articles) {
        if (!article.title || !article.content) {
          console.warn(`  Skipping incomplete article: ${article.sourceUrl || 'Unknown source'}`);
          continue;
        }

        console.log(`Processing: ${article.title}`);

        const rawHtml = article.content;
        const cleanText = rawHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

        const chunks = chunkText(`Title: ${article.title}\nContent: ${cleanText}`);

        console.log(`  Found ${chunks.length} chunks. Inserting...`);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await getEmbedding(chunk);

          const { error } = await supabase.from('doc_chunks').insert({
            content: chunk,
            embedding,
            batch_id: batchId,
            metadata: {
              title: article.title,
              section: section.title,
              article_id: article.id,
              chunk_index: i
            }
          });

          if (error) {
            console.error(`  Error inserting chunk ${i}:`, error.message);
            success = false;
          } else {
            process.stdout.write('.');
          }
        }
        console.log('\n  Article complete.');
      }
    }

    if (success) {
      console.log('--- Cleaning up old batches ---');
      const { error: deleteError } = await supabase
        .from('doc_chunks')
        .delete()
        .neq('batch_id', batchId);

      if (deleteError) {
        console.error('  Error during cleanup:', deleteError.message);
      } else {
        console.log('  Cleanup complete.');
      }
    } else {
      console.warn('--- Ingestion encountered errors. Skipping cleanup to preserve old data. ---');
    }

  } catch (err) {
    console.error('Fatal error during ingestion:', err);
    success = false;
  }

  console.log('--- Ingestion Process Finished ---');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('ingest.ts')) {
  ingest().catch(console.error);
}
