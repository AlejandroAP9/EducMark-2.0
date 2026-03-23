/**
 * EducMark RAG Ingestion — pgvector + OpenAI Embeddings
 *
 * Ingesta PDFs de programas MINEDUC y textos del estudiante
 * a Supabase pgvector con embeddings de OpenAI.
 *
 * Uso:
 *   node scripts/ingest-pgvector.mjs                    # Ingesta programas
 *   node scripts/ingest-pgvector.mjs --tipo texto_estudiante --dir /ruta/textos
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, resolve } from 'path';
import { config } from 'dotenv';
import { PDFParse } from 'pdf-parse';

// Load env
config({ path: resolve(import.meta.dirname, '../.env.local') });

// ── Config ──
// Usa Supabase SELF-HOSTED (Easypanel) para RAG
const SUPABASE_URL = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.RAG_SUPABASE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_RAG_SUPABASE_URL o RAG_SUPABASE_KEY no encontradas en .env.local');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY no encontrada en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ── Args ──
const args = process.argv.slice(2);
const tipoArg = args.includes('--tipo') ? args[args.indexOf('--tipo') + 1] : 'programa';
const dirArg = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : '/Users/alejandro/Documents/Programas';
const CHUNK_SIZE = 800;  // tokens aprox (chars / 4)
const CHUNK_OVERLAP = 100;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 20;  // embeddings por batch a OpenAI

// ── Extract metadata from file path ──
function extractMetadata(filePath) {
  const name = basename(filePath, '.pdf');
  const parts = filePath.split('/');

  // Detect ciclo
  let ciclo = 'general';
  if (filePath.includes('BÁSICA')) ciclo = 'basica';
  else if (filePath.includes('MEDIA')) ciclo = 'media';
  else if (filePath.includes('ELECTIVOS')) ciclo = 'electivo';

  // Detect nivel
  let nivel = 'general';
  const nivelMatch = filePath.match(/(\d)°\s*(BÁSICO|MEDIO)/i);
  if (nivelMatch) {
    const num = nivelMatch[1];
    const tipo = nivelMatch[2].toLowerCase();
    nivel = `${num}-${tipo === 'básico' ? 'basico' : 'medio'}`;
  }
  if (filePath.includes('ELECTIVOS')) nivel = 'electivo-3-4-medio';

  // Detect asignatura
  let asignatura = 'general';
  const asigMatch = name.match(/Programa_(.+?)_\d/i) || name.match(/Programa_(.+?)_Electivo/i) || name.match(/Programa_(.+)/i) || name.match(/Texto_(.+?)_\d/i) || name.match(/(.+?)_\d/i);
  if (asigMatch) {
    asignatura = asigMatch[1].toLowerCase().replace(/_/g, '-');
  }
  if (name.includes('Bases_Curriculares')) {
    asignatura = 'bases-curriculares';
  }
  // Handle special cases
  if (name === 'Programa_Biologia' || name === 'Programa_Fisica' || name === 'Programa_Quimica') {
    asignatura = name.replace('Programa_', '').toLowerCase();
    nivel = '1-medio';
  }
  if (name.startsWith('Biologia 2') || name.startsWith('Fisica 2') || name.startsWith('Quimica 2')) {
    asignatura = name.split(' ')[0].toLowerCase();
    nivel = '2-medio';
  }

  return { asignatura, nivel, ciclo, displayName: name };
}

// ── Collect all PDFs ──
function collectPDFs(dir) {
  const files = [];
  function walk(currentDir) {
    const entries = readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.pdf') && !entry.startsWith('.')) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}

// ── Extract text from PDF ──
async function extractText(pdfPath) {
  try {
    const buffer = readFileSync(pdfPath);
    const parser = new PDFParse();
    const data = await parser.loadPDF(buffer);
    return data.text || '';
  } catch (err) {
    console.error(`  ⚠️ Error extrayendo texto de ${basename(pdfPath)}: ${err.message}`);
    return '';
  }
}

// ── Split text into chunks ──
function splitIntoChunks(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const charSize = chunkSize * 4;  // aprox 4 chars per token
  const charOverlap = overlap * 4;
  const chunks = [];

  // Clean text
  text = text.replace(/\n{3,}/g, '\n\n').replace(/\s{3,}/g, ' ').trim();

  if (text.length <= charSize) {
    if (text.length > 50) chunks.push(text);
    return chunks;
  }

  let start = 0;
  while (start < text.length) {
    let end = start + charSize;

    // Try to break at paragraph or sentence boundary
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + charSize * 0.5) {
        end = paragraphBreak;
      } else {
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start + charSize * 0.5) {
          end = sentenceBreak + 1;
        }
      }
    } else {
      end = text.length;
    }

    const chunk = text.substring(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    start = end - charOverlap;
    if (start >= text.length) break;
  }

  return chunks;
}

// ── Generate embeddings in batch ──
async function generateEmbeddings(texts) {
  const results = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      for (const item of response.data) {
        results.push(item.embedding);
      }
    } catch (err) {
      console.error(`  ❌ Error generando embeddings (batch ${Math.floor(i/BATCH_SIZE) + 1}): ${err.message}`);
      // Fill with nulls for failed batch
      for (let j = 0; j < batch.length; j++) {
        results.push(null);
      }
    }

    // Rate limit: small delay between batches
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return results;
}

// ── Main ──
async function main() {
  console.log(`\n🚀 EducMark RAG Ingestion — pgvector + OpenAI\n`);
  console.log(`   Tipo: ${tipoArg}`);
  console.log(`   Directorio: ${dirArg}`);
  console.log(`   Modelo: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS}d)`);
  console.log(`   Chunk size: ~${CHUNK_SIZE} tokens\n`);

  // 1. Collect PDFs
  const pdfs = collectPDFs(dirArg);
  console.log(`📁 ${pdfs.length} PDFs encontrados\n`);

  if (pdfs.length === 0) {
    console.log('❌ No se encontraron PDFs en el directorio');
    process.exit(1);
  }

  // Stats
  let totalChunks = 0;
  let totalEmbeddings = 0;
  let totalErrors = 0;
  let totalTokensEstimate = 0;

  // 2. Process each PDF
  for (let i = 0; i < pdfs.length; i++) {
    const pdfPath = pdfs[i];
    const meta = extractMetadata(pdfPath);

    console.log(`📄 [${i + 1}/${pdfs.length}] ${meta.displayName}`);
    console.log(`   Asignatura: ${meta.asignatura} | Nivel: ${meta.nivel}`);

    // Check if already ingested
    const { count } = await supabase
      .from('rag_documents')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', tipoArg)
      .eq('asignatura', meta.asignatura)
      .eq('nivel', meta.nivel);

    if (count > 0) {
      console.log(`   ⏭️  Ya ingestado (${count} chunks). Saltando.\n`);
      continue;
    }

    // Extract text
    const text = await extractText(pdfPath);
    if (!text || text.length < 100) {
      console.log(`   ⚠️  Texto demasiado corto (${text.length} chars). Saltando.\n`);
      totalErrors++;
      continue;
    }
    console.log(`   📝 ${text.length} caracteres extraídos`);

    // Split into chunks
    const chunks = splitIntoChunks(text);
    console.log(`   🔪 ${chunks.length} chunks generados`);
    totalChunks += chunks.length;

    if (chunks.length === 0) {
      console.log(`   ⚠️  Sin chunks válidos. Saltando.\n`);
      continue;
    }

    // Generate embeddings
    console.log(`   🧠 Generando embeddings...`);
    const embeddings = await generateEmbeddings(chunks);

    // Prepare rows
    const rows = [];
    for (let j = 0; j < chunks.length; j++) {
      if (embeddings[j]) {
        rows.push({
          tipo: tipoArg,
          asignatura: meta.asignatura,
          nivel: meta.nivel,
          chunk_index: j,
          contenido: chunks[j],
          metadata: {
            nombre_archivo: meta.displayName,
            ciclo: meta.ciclo,
            chunk_total: chunks.length,
          },
          embedding: JSON.stringify(embeddings[j]),
        });
        totalEmbeddings++;
      }
    }

    // Insert into Supabase in batches
    const INSERT_BATCH = 50;
    for (let j = 0; j < rows.length; j += INSERT_BATCH) {
      const batch = rows.slice(j, j + INSERT_BATCH);
      const { error } = await supabase.from('rag_documents').insert(batch);
      if (error) {
        console.error(`   ❌ Error insertando batch: ${error.message}`);
        totalErrors++;
      }
    }

    totalTokensEstimate += chunks.reduce((sum, c) => sum + Math.ceil(c.length / 4), 0);
    console.log(`   ✅ ${rows.length} chunks insertados\n`);

    // Small delay between PDFs
    await new Promise(r => setTimeout(r, 300));
  }

  // 3. Summary
  const costEstimate = (totalTokensEstimate / 1000000) * 0.02;
  console.log(`\n════════════════════════════════════════`);
  console.log(`📊 RESUMEN DE INGESTA`);
  console.log(`════════════════════════════════════════`);
  console.log(`   PDFs procesados: ${pdfs.length}`);
  console.log(`   Chunks totales: ${totalChunks}`);
  console.log(`   Embeddings generados: ${totalEmbeddings}`);
  console.log(`   Errores: ${totalErrors}`);
  console.log(`   Tokens estimados: ~${totalTokensEstimate.toLocaleString()}`);
  console.log(`   Costo estimado: ~$${costEstimate.toFixed(4)}`);
  console.log(`════════════════════════════════════════\n`);
}

main().catch(console.error);
