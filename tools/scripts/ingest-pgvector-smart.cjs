/**
 * EducMark RAG Ingestion SMART — Chunking por OA
 * Divide los programas MINEDUC por Objetivo de Aprendizaje
 * Cada OA + sus indicadores = 1 chunk
 *
 * Uso:
 *   node scripts/ingest-pgvector-smart.cjs
 *   node scripts/ingest-pgvector-smart.cjs --tipo texto_estudiante --dir /ruta/textos
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdf = require('pdf-parse');
const { readFileSync, readdirSync, statSync } = require('fs');
const { join, basename, resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.RAG_SUPABASE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const args = process.argv.slice(2);
const tipoArg = args.includes('--tipo') ? args[args.indexOf('--tipo') + 1] : 'programa';
const dirArg = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : '/Users/alejandro/Documents/Programas';
const clearFirst = args.includes('--clear');
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 20;
const MAX_CHUNK_CHARS = 6000; // Max chars per chunk

function extractMetadata(filePath) {
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
  if (filePath.includes('ELECTIVOS') || filePath.toLowerCase().includes('electivo')) nivel = nivel === 'general' ? 'electivo-3-4-medio' : nivel;

  let asignatura = 'general';
  const asigMatch = name.match(/Programa_(.+?)_\d/i) || name.match(/Programa_(.+?)_Electivo/i) || name.match(/Programa_(.+)/i) || name.match(/Texto_(.+?)_\d/i) || name.match(/(.+?)_\d/i);
  if (asigMatch) asignatura = asigMatch[1].toLowerCase().replace(/_/g, '-');
  if (name.includes('Bases_Curriculares')) asignatura = 'bases-curriculares';
  if (name === 'Programa_Biologia' || name === 'Programa_Fisica' || name === 'Programa_Quimica') {
    asignatura = name.replace('Programa_', '').toLowerCase();
    nivel = '1-medio';
  }
  if (name.startsWith('Biologia 2') || name.startsWith('Fisica 2') || name.startsWith('Quimica 2')) {
    asignatura = name.split(' ')[0].toLowerCase();
    nivel = '2-medio';
  }

  // Multi-level books
  let niveles = [nivel];
  const multiMatch = name.match(/_(\d)_y_(\d)\s*[Mm]edio/i);
  if (multiMatch) {
    niveles = [`${multiMatch[1]}-medio`, `${multiMatch[2]}-medio`];
    nivel = niveles[0];
  }

  return { asignatura, nivel, niveles, ciclo, displayName: name };
}

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

async function extractText(pdfPath) {
  try {
    const buffer = readFileSync(pdfPath);
    const data = await pdf(buffer);
    return data.text || '';
  } catch (err) {
    console.error(`  ⚠️ Error: ${err.message}`);
    return '';
  }
}

/**
 * SMART CHUNKING — Split by OA for programs, by section for textbooks
 */
function smartChunkPrograma(text, meta) {
  const chunks = [];
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  // Try to split by OA pattern
  // Pattern: "OA" followed by number, captures everything until next OA or end
  const oaRegex = /(?:^|\n)(OA\s*\d+[\s\S]*?)(?=\nOA\s*\d+|\n*$)/gi;
  let match;
  const oaSections = [];

  while ((match = oaRegex.exec(text)) !== null) {
    const section = match[1].trim();
    if (section.length > 50) {
      // Extract OA number
      const oaNumMatch = section.match(/OA\s*(\d+)/i);
      const oaNum = oaNumMatch ? oaNumMatch[1] : 'unknown';
      oaSections.push({ oaNum, text: section });
    }
  }

  if (oaSections.length > 0) {
    // Found OA sections — use them as chunks
    for (const section of oaSections) {
      let sectionText = section.text;
      // If section is too long, split it but keep OA header in each part
      if (sectionText.length > MAX_CHUNK_CHARS) {
        const header = sectionText.substring(0, sectionText.indexOf('\n', 100) || 200);
        let start = 0;
        let partIndex = 0;
        while (start < sectionText.length) {
          let end = Math.min(start + MAX_CHUNK_CHARS, sectionText.length);
          if (end < sectionText.length) {
            const breakPoint = sectionText.lastIndexOf('\n', end);
            if (breakPoint > start + MAX_CHUNK_CHARS * 0.5) end = breakPoint;
          }
          let chunk = sectionText.substring(start, end).trim();
          if (partIndex > 0) chunk = header + '\n\n[continuación]\n' + chunk;
          if (chunk.length > 50) {
            chunks.push({ text: chunk, oa: section.oaNum, part: partIndex });
          }
          start = end;
          partIndex++;
        }
      } else {
        chunks.push({ text: sectionText, oa: section.oaNum, part: 0 });
      }
    }
  }

  // If no OA sections found or very few, also add general content chunks
  if (oaSections.length < 3) {
    // Fallback: split by paragraphs/sections
    const generalChunks = splitBySize(text, 3000);
    for (let i = 0; i < generalChunks.length; i++) {
      chunks.push({ text: generalChunks[i], oa: 'general', part: i });
    }
  }

  return chunks;
}

function smartChunkTextoEstudiante(text, meta) {
  const chunks = [];
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  if (text.length > 300000) text = text.substring(0, 300000);

  // Split by sections/units if possible
  const sectionRegex = /(?:Unidad|Lección|Capítulo|Tema)\s*\d+/gi;
  const sectionPositions = [];
  let sMatch;
  while ((sMatch = sectionRegex.exec(text)) !== null) {
    sectionPositions.push(sMatch.index);
  }

  if (sectionPositions.length > 2) {
    // Split by detected sections
    for (let i = 0; i < sectionPositions.length; i++) {
      const start = sectionPositions[i];
      const end = sectionPositions[i + 1] || text.length;
      const section = text.substring(start, end).trim();
      if (section.length > 50) {
        const subChunks = splitBySize(section, 3000);
        subChunks.forEach((sc, j) => {
          chunks.push({ text: sc, oa: 'general', part: j });
        });
      }
    }
  } else {
    // Fallback: split by size
    const sizeChunks = splitBySize(text, 3000);
    sizeChunks.forEach((sc, j) => {
      chunks.push({ text: sc, oa: 'general', part: j });
    });
  }

  return chunks;
}

function splitBySize(text, maxChars) {
  const chunks = [];
  if (!text || text.length < 50) return chunks;
  if (text.length <= maxChars) { chunks.push(text); return chunks; }

  let start = 0;
  let safety = 0;
  const maxIter = Math.ceil(text.length / (maxChars * 0.5)) + 10;

  while (start < text.length && safety < maxIter) {
    safety++;
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const pb = text.lastIndexOf('\n\n', end);
      if (pb > start + maxChars * 0.5) end = pb;
      else {
        const sb = text.lastIndexOf('. ', end);
        if (sb > start + maxChars * 0.5) end = sb + 1;
      }
    }
    const chunk = text.substring(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    const nextStart = end;
    if (nextStart <= start) { start = end + 1; } else { start = nextStart; }
  }
  return chunks;
}

async function generateEmbeddings(texts) {
  const results = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL, input: batch, dimensions: EMBEDDING_DIMENSIONS,
      });
      for (const item of response.data) results.push(item.embedding);
    } catch (err) {
      console.error(`  ❌ Embedding error: ${err.message}`);
      for (let j = 0; j < batch.length; j++) results.push(null);
    }
    if (i + BATCH_SIZE < texts.length) await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

async function main() {
  console.log(`\n🚀 EducMark RAG Smart Ingestion — pgvector + OpenAI\n`);
  console.log(`   Tipo: ${tipoArg}`);
  console.log(`   Dir: ${dirArg}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Modelo: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS}d)`);
  console.log(`   Chunking: SMART (por OA para programas)\n`);

  if (clearFirst) {
    console.log(`🗑️ Limpiando registros tipo=${tipoArg}...`);
    const { error } = await supabase.from('rag_documents').delete().eq('tipo', tipoArg);
    if (error) console.error('Error limpiando:', error.message);
    else console.log('   ✅ Limpiado\n');
  }

  const pdfs = collectPDFs(dirArg);
  console.log(`📁 ${pdfs.length} PDFs encontrados\n`);

  let totalChunks = 0, totalEmbeddings = 0, totalErrors = 0, totalTokens = 0;

  for (let i = 0; i < pdfs.length; i++) {
    const pdfPath = pdfs[i];
    const meta = extractMetadata(pdfPath);

    console.log(`📄 [${i + 1}/${pdfs.length}] ${meta.displayName}`);
    console.log(`   ${meta.asignatura} | ${meta.nivel}`);

    if (meta.asignatura === 'bases-curriculares') {
      console.log(`   ⏭️ Bases Curriculares. Saltando.\n`);
      continue;
    }

    const { count } = await supabase
      .from('rag_documents')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', tipoArg)
      .eq('asignatura', meta.asignatura)
      .eq('nivel', meta.niveles[0]);

    if (count > 0) {
      console.log(`   ⏭️ Ya ingestado (${count} chunks). Saltando.\n`);
      continue;
    }

    let text = await extractText(pdfPath);
    if (!text || text.length < 100) {
      console.log(`   ⚠️ Texto corto. Saltando.\n`);
      totalErrors++;
      continue;
    }
    console.log(`   📝 ${text.length} chars`);

    // Smart chunking based on type
    const smartChunks = tipoArg === 'programa'
      ? smartChunkPrograma(text, meta)
      : smartChunkTextoEstudiante(text, meta);

    console.log(`   🔪 ${smartChunks.length} chunks (smart)`);
    if (smartChunks.length === 0) continue;

    // Log OA distribution for programs
    if (tipoArg === 'programa') {
      const oaCounts = {};
      smartChunks.forEach(c => { oaCounts[c.oa] = (oaCounts[c.oa] || 0) + 1; });
      const oaList = Object.keys(oaCounts).filter(k => k !== 'general').sort((a, b) => parseInt(a) - parseInt(b));
      if (oaList.length > 0) {
        console.log(`   📋 OAs: ${oaList.map(k => 'OA' + k).join(', ')}`);
      }
    }

    totalChunks += smartChunks.length;

    const chunkTexts = smartChunks.map(c => c.text);
    console.log(`   🧠 Generando embeddings...`);
    const embeddings = await generateEmbeddings(chunkTexts);

    const rows = [];
    for (const niv of meta.niveles) {
      for (let j = 0; j < smartChunks.length; j++) {
        if (embeddings[j]) {
          rows.push({
            tipo: tipoArg,
            asignatura: meta.asignatura,
            nivel: niv,
            chunk_index: j,
            contenido: smartChunks[j].text,
            metadata: {
              nombre_archivo: meta.displayName,
              ciclo: meta.ciclo,
              oa: smartChunks[j].oa,
              part: smartChunks[j].part,
              chunk_total: smartChunks.length,
              niveles: meta.niveles.length > 1 ? meta.niveles : undefined,
            },
            embedding: JSON.stringify(embeddings[j]),
          });
          totalEmbeddings++;
        }
      }
    }

    if (meta.niveles.length > 1) {
      console.log(`   📚 Multi-nivel: ${meta.niveles.join(', ')}`);
    }

    const INSERT_BATCH = 50;
    for (let j = 0; j < rows.length; j += INSERT_BATCH) {
      const batch = rows.slice(j, j + INSERT_BATCH);
      const { error } = await supabase.from('rag_documents').insert(batch);
      if (error) { console.error(`   ❌ Insert: ${error.message}`); totalErrors++; }
    }

    totalTokens += chunkTexts.reduce((sum, c) => sum + Math.ceil(c.length / 4), 0);
    console.log(`   ✅ ${rows.length} chunks insertados\n`);
    await new Promise(r => setTimeout(r, 300));
  }

  const cost = (totalTokens / 1000000) * 0.02;
  console.log(`\n════════════════════════════════════════`);
  console.log(`📊 RESUMEN`);
  console.log(`════════════════════════════════════════`);
  console.log(`   PDFs: ${pdfs.length}`);
  console.log(`   Chunks: ${totalChunks}`);
  console.log(`   Embeddings: ${totalEmbeddings}`);
  console.log(`   Errores: ${totalErrors}`);
  console.log(`   Tokens: ~${totalTokens.toLocaleString()}`);
  console.log(`   Costo: ~$${cost.toFixed(4)}`);
  console.log(`════════════════════════════════════════\n`);
}

main().catch(console.error);
