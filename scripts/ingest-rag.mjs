/**
 * EducMark RAG Ingestion Script
 * Sube programas MINEDUC a Gemini File Search Store
 *
 * Uso: node scripts/ingest-rag.mjs
 */

import { GoogleGenAI } from '@google/genai';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, resolve } from 'path';
import { config } from 'dotenv';

// Load env
config({ path: resolve(import.meta.dirname, '../.env.local') });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY no encontrada en .env.local');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const PROGRAMAS_DIR = '/Users/alejandro/Documents/Programas';
const STORE_NAME = 'educmark-programas';

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
  const asigMatch = name.match(/Programa_(.+?)_\d/i) || name.match(/Programa_(.+?)_Electivo/i) || name.match(/Programa_(.+)/i);
  if (asigMatch) {
    asignatura = asigMatch[1].toLowerCase().replace(/_/g, '-');
  }
  // Handle special cases
  if (name.includes('Bases_Curriculares')) {
    asignatura = 'bases-curriculares';
  }
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

// ── Main ──
async function main() {
  console.log('🚀 EducMark RAG Ingestion\n');

  // 1. Collect PDFs
  const pdfs = collectPDFs(PROGRAMAS_DIR);
  console.log(`📁 ${pdfs.length} PDFs encontrados\n`);

  // 2. Create File Search Store
  console.log('📦 Creando File Search Store...');
  const store = await ai.fileSearchStores.create({
    config: { displayName: STORE_NAME }
  });
  console.log(`✅ Store creado: ${store.name}\n`);

  // 3. Upload each PDF
  let uploaded = 0;
  let failed = 0;
  const operations = [];

  for (const pdfPath of pdfs) {
    const meta = extractMetadata(pdfPath);

    try {
      console.log(`📤 [${uploaded + failed + 1}/${pdfs.length}] ${meta.displayName} (${meta.asignatura}, ${meta.nivel})`);

      const operation = await ai.fileSearchStores.uploadToFileSearchStore({
        fileSearchStoreName: store.name,
        file: pdfPath,
        config: {
          displayName: meta.displayName,
          customMetadata: [
            { key: 'asignatura', stringValue: meta.asignatura },
            { key: 'nivel', stringValue: meta.nivel },
            { key: 'ciclo', stringValue: meta.ciclo },
          ]
        }
      });

      operations.push(operation);
      uploaded++;
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n📊 Resultado: ${uploaded} subidos, ${failed} fallidos\n`);

  // 4. Wait for indexing
  console.log('⏳ Esperando indexación (puede tomar unos minutos)...');
  for (const op of operations) {
    try {
      let current = op;
      let attempts = 0;
      while (!current.done && attempts < 60) {
        await new Promise(r => setTimeout(r, 5000));
        current = await ai.operations.get(current);
        attempts++;
      }
    } catch {
      // Some operations may already be done
    }
  }
  console.log('✅ Indexación completada\n');

  // 5. Test query
  console.log('🧪 Test: "¿Cuáles son los OA de Historia 7° básico?"');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: '¿Cuáles son los Objetivos de Aprendizaje de Historia, Geografía y Ciencias Sociales para 7° básico? Lista los OA principales.',
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [store.name],
              metadataFilter: 'asignatura="historia-geografia-cs" AND nivel="7-basico"'
            }
          }
        ]
      }
    });
    console.log('\n📝 Respuesta:\n');
    console.log(response.text);
  } catch (err) {
    console.error('❌ Error en test:', err.message);
  }

  // 6. Save store name
  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ FILE SEARCH STORE: ${store.name}`);
  console.log(`   Guarda este nombre en tu .env.local como:`);
  console.log(`   GEMINI_FILE_SEARCH_STORE=${store.name}`);
  console.log(`════════════════════════════════════════\n`);
}

main().catch(console.error);
