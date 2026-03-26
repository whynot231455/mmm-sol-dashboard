import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import { scrapeSite, ScrapedPage } from './scrape.js';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = 'mxbai-embed-large';

interface DocumentationArticle {
  id: string;
  title: string;
  readingTime: string;
  tags: string[];
  lastUpdated: string;
  abstract: string;
  content: string;
  onPageLinks: Array<{ title: string; id: string }>;
  sourceUrl?: string;
}

interface DocumentationSection {
  id: string;
  title: string;
  articles: DocumentationArticle[];
}

async function getEmbedding(text: string) {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: EMBEDDING_MODEL,
      prompt: text,
    });
    return response.data.embedding;
  } catch (err) {
    console.error(`Error getting embedding:`, (err as Error).message);
    return null;
  }
}

function chunkText(text: string, size = 1000): string[] {
  const chunks = [];
  let current = 0;
  while (current < text.length) {
    chunks.push(text.slice(current, current + size));
    current += size - 100; // 100 char overlap
  }
  return chunks;
}

async function reformatContent(page: ScrapedPage): Promise<DocumentationArticle> {
  const modelName = process.env.OLLAMA_MODEL || 'gemma3';
  const prompt = `
Task: Reformat the following raw scraped website content into a high-quality structured JSON article object.

Rules:
1. Clean the text: Remove fragments like "CONTINUE READING", "Enquire Now", navigation labels, and social media junk.
2. Structure with HTML: Use <p> for paragraphs, <h2 id="link-id"> for headers, and <ul>/<li> for lists.
3. Generate Metadata: 
   - "readingTime": Estimate based on word count (e.g., "4 min read").
   - "abstract": A 2-sentence summary.
   - "tags": Relevant keywords.
   - "onPageLinks": An array of { title: string, id: string } corresponding to the <h2> headers you create.

Raw Content:
URL: ${page.url}
Title: ${page.title}
Text: ${page.content}

Return ONLY a valid JSON object with these keys: 
{
  "id": "string (slug from URL)",
  "title": "string",
  "readingTime": "string",
  "tags": ["string"],
  "lastUpdated": "March 2026",
  "abstract": "string",
  "content": "html_string",
  "onPageLinks": [{"title": "string", "id": "string"}]
}
`;

  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: modelName,
      prompt,
      stream: false,
      format: 'json'
    });

    return JSON.parse(response.data.response);
  } catch (err) {
    console.error(`  Error reformatting ${page.url}:`, (err as Error).message);
    // Fallback to basic structure if LLM fails
    return {
      id: page.url.split('/').filter(Boolean).pop() || 'index',
      title: page.title,
      readingTime: '5 min read',
      tags: ['Website', 'Scraped'],
      lastUpdated: 'March 2026',
      abstract: page.content.substring(0, 150) + '...',
      content: `<p>${page.content}</p>`,
      onPageLinks: []
    };
  }
}

async function runIngestion() {
  const sitemaps = [
    'https://solanalytics.com/page-sitemap.xml',
    'https://solanalytics.com/post-sitemap.xml'
  ];

  console.log('--- Phase 1: Scraping Website ---');
  const pages = await scrapeSite(sitemaps);
  console.log(`Successfully scraped ${pages.length} pages.`);

  console.log('--- Phase 2: Updating documentation.json ---');
  const docsPath = path.join(__dirname, '..', 'knowledge', 'documentation.json');
  try {
    const currentDocs = JSON.parse(fs.readFileSync(docsPath, 'utf-8')) as DocumentationSection[];

    const websiteSectionId = 'website-content';
    let websiteSection = currentDocs.find((s) => s.id === websiteSectionId);

    if (!websiteSection) {
      websiteSection = {
        id: websiteSectionId,
        title: 'Website Knowledge Base',
        articles: []
      };
      currentDocs.push(websiteSection);
    }

    // Convert scraped pages to articles using LLM reformatting
    const reformattedArticles: DocumentationArticle[] = [];
    console.log(`--- Reformatting ${pages.length} pages with LLM (Ollama) ---`);
    for (const page of pages) {
      console.log(`  Reformatting: ${page.title}...`);
      const article = await reformatContent(page);
      article.sourceUrl = page.url; // Ensure sourceUrl is preserved
      reformattedArticles.push(article);
      // Wait a bit to not choke Ollama
      await new Promise(r => setTimeout(r, 1000));
    }

    websiteSection.articles = reformattedArticles;

    fs.writeFileSync(docsPath, JSON.stringify(currentDocs, null, 4));
    console.log(`Updated ${docsPath} with ${reformattedArticles.length} reformatted articles.`);
  } catch (err) {
    console.error(`Failed to update documentation.json:`, (err as Error).message);
  }

  console.log('--- Phase 3: Clearing Old Data ---');
  // Optional: only clear chunks from 'solanalytics.com' if we identify them via metadata
  // await supabase.from('doc_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('--- Phase 3: Ingesting Chunks ---');
  for (const page of pages) {
    console.log(`Processing: ${page.title} (${page.url})`);

    // Clean text: remove script and style artifacts that might have slipped through
    const cleanText = page.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    const chunks = chunkText(`Source: ${page.url}\nTitle: ${page.title}\nContent: ${cleanText}`);

    console.log(`  Splitting into ${chunks.length} chunks...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await getEmbedding(chunk);

      if (!embedding) continue;

      const { error } = await supabase.from('doc_chunks').insert({
        content: chunk,
        embedding,
        metadata: {
          source: 'solanalytics_website',
          url: page.url,
          title: page.title,
          chunk_index: i,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error(`  Error inserting chunk ${i}:`, error.message);
      } else {
        process.stdout.write('.');
      }
    }
    console.log('\n  Page ingestion complete.');
  }

  console.log('--- All Phases Complete ---');
}

runIngestion().catch(console.error);
