import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';

function getRagClient() {
  const url = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
  const key = process.env.RAG_SUPABASE_KEY;
  if (!url || !key) throw new Error('RAG Supabase env vars not configured');
  return createClient(url, key);
}

export async function queryRag(
  query: string,
  asignatura: string,
  nivel: string,
  tipo: string = 'programa',
  topK: number = 8
): Promise<RagChunk[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const embeddingRes = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });
  const queryEmbedding = embeddingRes.data[0].embedding;

  const rag = getRagClient();
  const { data, error } = await rag.rpc('buscar_rag', {
    query_embedding: queryEmbedding,
    filtro_tipo: tipo,
    filtro_asignatura: asignatura,
    filtro_nivel: nivel,
    top_k: topK,
  });

  if (error) {
    console.error('[RAG] buscar_rag error:', error.message);
    throw new Error(`RAG search failed: ${error.message}`);
  }

  return (data ?? []) as RagChunk[];
}

export interface RagChunk {
  id: number;
  contenido: string;
  tipo: string;
  asignatura: string;
  nivel: string;
  chunk_index: number;
  similarity: number;
  metadata?: Record<string, unknown>;
}
