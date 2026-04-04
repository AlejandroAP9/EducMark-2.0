/**
 * EducMark RAG Ingestion — pgvector + OpenAI Embeddings
 * CommonJS version (pdf-parse requires CJS)
 *
 * Uso:
 *   node scripts/ingest-pgvector.cjs                    # Ingesta programas
 *   node scripts/ingest-pgvector.cjs --tipo texto_estudiante --dir /ruta/textos
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdf = require('pdf-parse');
const { readFileSync, readdirSync, statSync } = require('fs');
const { join, basename, resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../.env.local') });

// ── Config ──
const SUPABASE_URL = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.RAG_SUPABASE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_RAG_SUPABASE_URL o RAG_SUPABASE_KEY no encontradas');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY no encontrada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ── Args ──
const args = process.argv.slice(2);
const tipoArg = args.includes('--tipo') ? args[args.indexOf('--tipo') + 1] : 'programa';
const dirArg = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : '/Users/alejandro/Documents/Programas';
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 20;

// ── Extract metadata from file path ──
function extractMetadata(filePath) {
  // Normalize Unicode (macOS uses NFD decomposed, we need NFC precomposed)
  filePath = filePath.normalize('NFC');
  const name = basename(filePath, '.pdf');

  let ciclo = 'general';
  if (filePath.toLowerCase().includes('básica') || filePath.includes('BÁSICA')) ciclo = 'basica';
  else if (filePath.toLowerCase().includes('media') || filePath.includes('MEDIA')) ciclo = 'media';
  else if (filePath.toLowerCase().includes('electivo')) ciclo = 'electivo';

  let nivel = 'general';
  const nivelMatch = filePath.match(/(\d)°\s*(BÁSICO|MEDIO|básico|medio)/i);
  if (nivelMatch) {
    const num = nivelMatch[1];
    const tipo = nivelMatch[2].toLowerCase();
    nivel = `${num}-${tipo === 'básico' ? 'basico' : 'medio'}`;
  }
  if (filePath.includes('ELECTIVOS')) nivel = 'electivo-3-4-medio';

  let asignatura = 'general';
  const asigMatch = name.match(/Programa_(.+?)_\d/i) || name.match(/Programa_(.+?)_Electivo/i) || name.match(/Programa_(.+)/i) || name.match(/Texto_(.+?)_\d/i) || name.match(/(.+?)_\d/i);
  if (asigMatch) {
    asignatura = asigMatch[1].toLowerCase().replace(/_/g, '-');
  }
  if (name.includes('Bases_Curriculares')) asignatura = 'bases-curriculares';
  if (name === 'Programa_Biologia' || name === 'Programa_Fisica' || name === 'Programa_Quimica') {
    asignatura = name.replace('Programa_', '').toLowerCase();
    nivel = '1-medio';
  }
  if (name.startsWith('Biologia 2') || name.startsWith('Fisica 2') || name.startsWith('Quimica 2')) {
    asignatura = name.split(' ')[0].toLowerCase();
    nivel = '2-medio';
  }

  // Handle multi-level books (e.g. _1_y_2medio, _3_y_4Medio)
  let niveles = [nivel];
  const multiMatch = name.match(/_(\d)_y_(\d)\s*[Mm]edio/i);
  if (multiMatch) {
    niveles = [`${multiMatch[1]}-medio`, `${multiMatch[2]}-medio`];
    nivel = niveles[0]; // primary
  }

  return { asignatura, nivel, niveles, ciclo, displayName: name };
}

// ── Collect all PDFs ──
function collectPDFs(dir) {
  const files = [];
  function walk(currentDir) {
    const entries = readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) walk(fullPath);
      else if (entry.endsWith('.pdf') && !entry.startsWith('.')) files.push(fullPath);
    }
  }
  walk(dir);
  return files;
}

// ── Extract text from PDF ──
async function extractText(pdfPath) {
  try {
    const buffer = readFileSync(pdfPath);
    const data = await pdf(buffer);
    return data.text || '';
  } catch (err) {
    console.error(`  ⚠️ Error extrayendo texto: ${err.message}`);
    return '';
  }
}

// ── Split text into chunks ──
function splitIntoChunks(text) {
  const charSize = CHUNK_SIZE * 4;
  const charOverlap = CHUNK_OVERLAP * 4;
  const chunks = [];

  // Clean text safely
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  if (!text || text.length < 50) return chunks;

  if (text.length <= charSize) {
    chunks.push(text);
    return chunks;
  }

  let start = 0;
  let safety = 0;
  const maxChunks = Math.ceil(text.length / (charSize - charOverlap)) + 10;

  while (start < text.length && safety < maxChunks) {
    safety++;
    let end = Math.min(start + charSize, text.length);

    // Try to break at paragraph or sentence boundary
    if (end < text.length) {
      const searchFrom = Math.max(start + Math.floor(charSize * 0.5), start + 1);
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak >= searchFrom) {
        end = paragraphBreak;
      } else {
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak >= searchFrom) {
          end = sentenceBreak + 1;
        }
      }
    }

    const chunk = text.substring(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);

    // Move forward, ensuring progress
    const nextStart = end - charOverlap;
    if (nextStart <= start) {
      start = end;  // Force progress
    } else {
      start = nextStart;
    }
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
      console.error(`  ❌ Error embeddings batch ${Math.floor(i/BATCH_SIZE) + 1}: ${err.message}`);
      for (let j = 0; j < batch.length; j++) results.push(null);
    }

    if (i + BATCH_SIZE < texts.length) await new Promise(r => setTimeout(r, 200));
  }

  return results;
}

// ── Main ──
async function main() {
  console.log(`\n🚀 EducMark RAG Ingestion — pgvector + OpenAI\n`);
  console.log(`   Tipo: ${tipoArg}`);
  console.log(`   Directorio: ${dirArg}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Modelo: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS}d)`);
  console.log(`   Chunk size: ~${CHUNK_SIZE} tokens\n`);

  const pdfs = collectPDFs(dirArg);
  console.log(`📁 ${pdfs.length} PDFs encontrados\n`);

  if (pdfs.length === 0) {
    console.log('❌ No se encontraron PDFs');
    process.exit(1);
  }

  let totalChunks = 0, totalEmbeddings = 0, totalErrors = 0, totalTokensEstimate = 0;

  for (let i = 0; i < pdfs.length; i++) {
    const pdfPath = pdfs[i];
    const meta = extractMetadata(pdfPath);

    console.log(`📄 [${i + 1}/${pdfs.length}] ${meta.displayName}`);
    console.log(`   ${meta.asignatura} | ${meta.nivel}`);

    // Check if already ingested (check first nivel)
    const { count } = await supabase
      .from('rag_documents')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', tipoArg)
      .eq('asignatura', meta.asignatura)
      .eq('nivel', meta.niveles[0]);

    if (count > 0) {
      console.log(`   ⏭️  Ya ingestado (${count} chunks). Saltando.\n`);
      continue;
    }

    // Skip very large generic documents
    if (meta.asignatura === 'bases-curriculares') {
      console.log(`   ⏭️  Bases Curriculares (genérico). Saltando.\n`);
      continue;
    }

    let text = await extractText(pdfPath);
    if (!text || text.length < 100) {
      console.log(`   ⚠️  Texto corto (${text.length} chars). Saltando.\n`);
      totalErrors++;
      continue;
    }
    // Truncate extremely large texts to avoid memory issues
    if (text.length > 300000) {
      text = text.substring(0, 300000);
      console.log(`   ⚠️  Texto truncado a 300K chars`);
    }
    console.log(`   📝 ${text.length} chars`);

    const chunks = splitIntoChunks(text);
    console.log(`   🔪 ${chunks.length} chunks`);
    totalChunks += chunks.length;

    if (chunks.length === 0) continue;

    console.log(`   🧠 Generando embeddings...`);
    const embeddings = await generateEmbeddings(chunks);

    // Insert for each nivel (handles multi-level books like _1_y_2medio)
    const rows = [];
    for (const niv of meta.niveles) {
      for (let j = 0; j < chunks.length; j++) {
        if (embeddings[j]) {
          rows.push({
            tipo: tipoArg,
            asignatura: meta.asignatura,
            nivel: niv,
            chunk_index: j,
            contenido: chunks[j],
            metadata: { nombre_archivo: meta.displayName, ciclo: meta.ciclo, chunk_total: chunks.length, niveles: meta.niveles },
            embedding: JSON.stringify(embeddings[j]),
          });
          totalEmbeddings++;
        }
      }
    }
    if (meta.niveles.length > 1) {
      console.log(`   📚 Multi-nivel: ${meta.niveles.join(', ')} (${rows.length} chunks total)`);
    }

    const INSERT_BATCH = 50;
    for (let j = 0; j < rows.length; j += INSERT_BATCH) {
      const batch = rows.slice(j, j + INSERT_BATCH);
      const { error } = await supabase.from('rag_documents').insert(batch);
      if (error) {
        console.error(`   ❌ Insert error: ${error.message}`);
        totalErrors++;
      }
    }

    totalTokensEstimate += chunks.reduce((sum, c) => sum + Math.ceil(c.length / 4), 0);
    console.log(`   ✅ ${rows.length} chunks insertados\n`);

    await new Promise(r => setTimeout(r, 300));
  }

  const costEstimate = (totalTokensEstimate / 1000000) * 0.02;
  console.log(`\n════════════════════════════════════════`);
  console.log(`📊 RESUMEN`);
  console.log(`════════════════════════════════════════`);
  console.log(`   PDFs: ${pdfs.length}`);
  console.log(`   Chunks: ${totalChunks}`);
  console.log(`   Embeddings: ${totalEmbeddings}`);
  console.log(`   Errores: ${totalErrors}`);
  console.log(`   Tokens: ~${totalTokensEstimate.toLocaleString()}`);
  console.log(`   Costo: ~$${costEstimate.toFixed(4)}`);
  console.log(`════════════════════════════════════════\n`);
}

main().catch(console.error);
