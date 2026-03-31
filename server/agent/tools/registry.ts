import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! || process.env.SUPABASE_KEY!
);

export interface ToolContext {
  docs: string;
  metrics: string;
}

interface FinalToolResult {
  answer: string;
  isFinal: true;
  sources?: Array<{
    title: string;
    article_id: string;
    chunk_indices: number[];
  }>;
}

interface DashboardState {
  activePage?: string;
  settings?: {
    filters?: unknown;
  };
  metrics?: {
    measure?: {
      kpi?: {
        revenue?: number;
        spend?: number;
        roas?: number;
      };
    };
    predict?: {
      metrics?: {
        predictedROAS?: number;
        roas?: number;
      };
    };
    optimize?: {
      metrics?: {
        projectedRevenueLift?: number;
      };
    };
    validation?: {
      metrics?: {
        rSquared?: number;
      };
    };
  };
}

interface DocChunkMetadata {
  article_id: string;
  title: string;
  chunk_index?: number;
}

interface MatchedDocumentChunk {
  metadata: DocChunkMetadata;
}

interface StoredDocumentChunk {
  content: string;
  metadata: DocChunkMetadata;
}

interface MeridianAnalysisState {
  metrics?: {
    rSquared?: number;
    mape?: number;
  };
  variableStats?: Array<{
    variable?: string;
    coefficient?: number;
    pValue?: number;
  }>;
}

export interface Tool {
  name: string;
  description: string;
  execute: (input: string, context?: ToolContext) => Promise<string | FinalToolResult>;
}

export const tools: Record<string, Tool> = {
  get_user_data: {
    name: 'get_user_data',
    description: "Retrieve the user's current marketing dataset, metrics, and settings. Use this to get real numbers and configuration from any page (Optimization, Pipelines, etc.).",
    execute: async (query: string, context?: ToolContext) => {
      try {
        const { data: globalState, error } = await supabase
          .from('dashboard_state')
          .select('data')
          .eq('key', 'current_dashboard')
          .single();

        const metricsInfo = context?.metrics || "No real-time metrics provided.";
        let additionalContext = "";

        if (globalState && globalState.data) {
          const d = globalState.data as DashboardState;
          additionalContext = `\n--- GLOBAL DASHBOARD SNAPSHOT ---\n`;
          additionalContext += `Active Page: ${d.activePage}\n`;
          if (query.trim()) {
            additionalContext += `Requested Focus: ${query}\n`;
          }

          if (d.metrics) {
            additionalContext += `\n[KPI Summary]\n`;
            const measureKpi = d.metrics.measure?.kpi;
            if (measureKpi) {
              additionalContext += `- Measure: Revenue $${measureKpi.revenue?.toLocaleString() || 0}, Spend $${measureKpi.spend?.toLocaleString() || 0}, ROAS ${measureKpi.roas?.toFixed(2) ?? '0.00'}\n`;
            }

            const predictMetrics = d.metrics.predict?.metrics;
            if (predictMetrics) {
              const predictedROAS = predictMetrics.predictedROAS ?? predictMetrics.roas;
              additionalContext += `- Predict: Forecast ROAS ${predictedROAS?.toFixed(2) ?? '0.00'}\n`;
            }

            const optimizeMetrics = d.metrics.optimize?.metrics;
            if (optimizeMetrics) {
              additionalContext += `- Optimize: Project Revenue Lift ${optimizeMetrics.projectedRevenueLift?.toFixed(1) ?? '0.0'}\n`;
            }

            const validationMetrics = d.metrics.validation?.metrics;
            if (validationMetrics) {
              additionalContext += `- R-Squared: ${validationMetrics.rSquared?.toFixed(4) ?? '0.0000'}\n`;
            }
          }

          if (d.settings?.filters) {
            additionalContext += `\n[Settings]\n`;
            additionalContext += `- Filters: ${JSON.stringify(d.settings.filters)}\n`;
          }
        }

        if (error && !context) return "No user context or cached state available.";

        return `### 1. Historical Dataset (Ground Truth)
${metricsInfo}

### 2. Live Dashboard State (Filters & Projections)
${additionalContext}

### 3. Documentation Reference
Use search_documentation for detailed info.`;
      } catch (err) {
        return `Error fetching user data: ${(err as Error).message}`;
      }
    },
  },

  search_documentation: {
    name: 'search_documentation',
    description: 'Search the internal platform documentation to explain concepts, definitions, or algorithms (e.g., Marketing Mix Modeling, Adstock, Base vs Incremental Sales).',
    execute: async (query: string) => {
      try {
        const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
        const EMBEDDING_MODEL = 'mxbai-embed-large';
        const modelName = process.env.OLLAMA_MODEL || 'gemma3';

        // 1. Generate embedding for the query
        const embeddingRes = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
          model: EMBEDDING_MODEL,
          prompt: query,
        });
        const queryEmbedding = embeddingRes.data.embedding;

        // 2. Search Supabase for top relevant chunks
        const { data: topChunks, error: searchError } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.4,
          match_count: 5        // Find top 5 relevant articles
        });

        if (searchError) throw searchError;

        if (!topChunks || topChunks.length === 0) {
          return "No relevant documentation found for the query in the vector store.";
        }

        // 3. Article Reconstruction: Fetch ALL chunks for these specific articles
        const articleIds = Array.from(new Set((topChunks as MatchedDocumentChunk[]).map((c) => c.metadata.article_id)));

        const { data: allChunks, error: fetchError } = await supabase
          .from('doc_chunks')
          .select('content, metadata')
          .in('metadata->>article_id', articleIds)
          .order('metadata->chunk_index', { ascending: true });

        if (fetchError) throw fetchError;

        // Group by article
        const articles: Record<string, { title: string, content: string, article_id: string, chunk_indices: number[] }> = {};
        (allChunks as StoredDocumentChunk[]).forEach((c) => {
          const id = c.metadata.article_id;
          if (!articles[id]) {
            articles[id] = {
              title: c.metadata.title,
              content: '',
              article_id: id,
              chunk_indices: []
            };
          }
          articles[id].content += c.content + ' ';
          if (c.metadata.chunk_index !== undefined) {
            articles[id].chunk_indices.push(c.metadata.chunk_index);
          }
        });

        const contextText = Object.values(articles)
          .map((a) => `[Source: ${a.title}]\n${a.content.trim()}`)
          .join('\n\n---\n\n');

        // 4. Synthesis
        const prompt = `You are a documentation search tool for Sol Analytics.
Task: Using ONLY the provided documentation, provide a comprehensive answer to: "${query}"

Guidelines:
1. LANGUAGE: Speak only in English. Do not use any other languages.
2. IDENTIFY RELEVANCE: Focus on the sections that answer the query.
3. SYNTHESIZE: Provide a clear, technical response.
4. CITATION: Mention the source titles used.
5. REASONING: You may make logical, common-sense inferences from document titles, introduction headers, and signatures (e.g., if a "From the desk of CEO" article is signed by "Sudhir Nair", it is reasonable to conclude he is the CEO).
6. STRICTNESS: If the provided info truly doesn't contain the answer or any strong clues, say "The documentation does not contain enough information."
7. NO HALLUCINATION: Do not use outside knowledge.

Documentation:
${contextText}

Synthesized Answer:
`;

        const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
          model: modelName,
          prompt,
          stream: false,
          options: {
            temperature: 0.1
          }
        });

        const answer = res.data.response.trim();
        const sources = Object.values(articles).map(a => ({
          title: a.title,
          article_id: a.article_id,
          chunk_indices: a.chunk_indices.sort((x, y) => x - y)
        }));

        return {
          answer,
          sources,
          isFinal: true
        };
      } catch (err) {
        return `Error searching documentation: ${(err as Error).message}`;
      }
    },
  },

  casual_chat: {
    name: 'casual_chat',
    description: 'Use this tool to handle simple greetings, small talk, or casual conversation (e.g., hello, how are you, thanks). Do NOT use for data requests, platform documentation, or metrics.',
    execute: async (query: string) => {
      const normalizedQuery = query.toLowerCase();
      const answer = normalizedQuery.includes('thank')
        ? "You're welcome. I'm here if you want to dig into your Sol Analytics data."
        : "Hello! I'm Sol Bot, your Sol Analytics assistant. How can I help you today?";

      return {
        answer,
        isFinal: true
      };
    },
  },

  llm_reason: {
    name: 'llm_reason',
    description: 'Use the LLM for specialized reasoning, summarization, or chain-of-thought analysis within a step.',
    execute: async (prompt: string) => {
      try {
        const modelName = process.env.OLLAMA_MODEL || 'gemma3';
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const res = await axios.post(`${ollamaUrl}/api/generate`, {
          model: modelName,
          prompt: `You are an AI reasoning module. Analyze the following and provide a concise summary or conclusion in English ONLY. Do not use any other languages:\n\n${prompt}`,
          stream: false,
        });
        return res.data.response.trim();
      } catch (err) {
        return `Reasoning error: ${(err as Error).message}`;
      }
    },
  },
  analyze_meridian_results: {
    name: 'analyze_meridian_results',
    description: 'Perform a deep qualitative analysis of the latest Meridian MMM results. Use this when the user asks for insights, performance summaries, or budget recommendations based on the modeling data.',
    execute: async (query: string) => {
      try {
        // 1. Fetch latest results from Supabase
        const { data: meridianState, error } = await supabase
          .from('dashboard_state')
          .select('data')
          .eq('key', 'meridian_latest_results')
          .single();

        if (error || !meridianState || !meridianState.data) {
          return "I don't have any Meridian model results to analyze yet. Please import data and train the model first.";
        }

        const data = meridianState.data as MeridianAnalysisState;
        const metrics = data.metrics ?? {};
        const topChannels = (data.variableStats ?? [])
          .slice(0, 3)
          .map((s) => `${s.variable ?? 'Unknown'} (Coef: ${s.coefficient ?? 0}, p-Value: ${(s.pValue ?? 0).toFixed(4)})`)
          .join(", ");

        // 2. Synthesize analysis using LLM
        const modelName = process.env.OLLAMA_MODEL || 'gemma3';
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        
        const analysisPrompt = `You are a Senior Marketing Strategist. Analyze these Marketing Mix Model (MMM) results:
- Model Reliability (R-Squared): ${metrics.rSquared?.toFixed(4) || 'N/A'}
- Error Margin (MAPE): ${metrics.mape?.toFixed(2) || 'N/A'}%
- Primary Performance Drivers: ${topChannels}

User Inquiry: ${query}

Provide a high-level strategic executive summary (3-4 sentences):
1. Assess the business confidence in these results.
2. Highlight which channels are generating the strongest incremental lift.
3. Propose one specific budget reallocation to optimize overall ROI.

IMPORTANT: Maintain a professional, strategic tone. Do NOT discuss technical execution, software backends, or the underlying math (GPU/OLS). Focus only on marketing growth and efficiency. Speak in English only.`;

        const res = await axios.post(`${ollamaUrl}/api/generate`, {
          model: modelName,
          prompt: analysisPrompt,
          stream: false,
        });

        const analysis = res.data.response.trim();

        return {
          answer: `### Strategic Marketing Analysis
${analysis}

---
**Model Performance Summary:**
- **Confidence Score (R²):** ${metrics.rSquared?.toFixed(4) || 'N/A'}
- **Forecast Precision:** ${metrics.mape ? (100 - metrics.mape).toFixed(2) : 'N/A'}%`,
          isFinal: true
        };

      } catch (err) {
        return `Error analyzing Meridian results: ${(err as Error).message}`;
      }
    },
  },
};
