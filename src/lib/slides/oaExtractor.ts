/**
 * Extrae OAs e indicadores de evaluación directamente del RAG Supabase self-hosted.
 * Filtra por metadata.oa para obtener el texto literal del currículum MINEDUC,
 * sin pasar por LLM (que tiende a parafrasear).
 */
import { createClient } from '@supabase/supabase-js';

export interface OAFull {
  numero: string;
  texto: string;
  indicadores: string[];
}

const ASIGNATURA_MAP: Record<string, string> = {
  'Historia': 'historia-geografia-cs',
  'Lenguaje': 'lenguaje',
  'Ciencias Naturales': 'ciencias-naturales',
  'Ciencias': 'ciencias-naturales',
  'Matematicas': 'matematica',
  'Matematica': 'matematica',
  'Ingles': 'ingles',
  'Artes Visuales': 'artes-visuales',
  'Musica': 'musica',
  'Educacion Fisica': 'educacion-fisica',
  'Tecnologia': 'tecnologia',
  'Orientacion': 'orientacion',
  'Biologia': 'biologia',
  'Fisica': 'fisica',
  'Quimica': 'quimica',
  'Educacion Ciudadana': 'educacion-ciudadana',
  'Filosofia': 'filosofia',
};

const ROMAN_MAP: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };

function normalizarAsignatura(asig: string): string {
  const sinTildes = asig.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, val] of Object.entries(ASIGNATURA_MAP)) {
    if (key.toLowerCase() === sinTildes.toLowerCase()) return val;
  }
  return sinTildes.toLowerCase().replace(/ /g, '-');
}

function normalizarCurso(curso: string): string {
  const lower = curso.toLowerCase();
  let num = 1;
  const numMatch = lower.match(/(\d+)/);
  if (numMatch) {
    num = parseInt(numMatch[1]);
  } else {
    const romanMatch = lower.match(/\b(viii|vii|vi|iv|v|iii|ii|i)\b/i);
    if (romanMatch) num = ROMAN_MAP[romanMatch[1].toUpperCase()] || 1;
  }
  const esMedio = lower.includes('medio');
  return esMedio ? `${num}-medio` : `${num}-basico`;
}

function getRagClient() {
  const url = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
  const key = process.env.RAG_SUPABASE_KEY;
  if (!url || !key) throw new Error('RAG Supabase env vars not configured');
  return createClient(url, key);
}

/**
 * Parse un chunk de RAG formato MINEDUC y extrae el texto del OA + indicadores.
 * Formato típico:
 *   OA N
 *   [texto completo del OA]
 *   >Indicador 1
 *   >Indicador 2
 *   ...
 */
function parseOAChunk(contenido: string): { texto: string; indicadores: string[] } {
  // Limpieza inicial: elimina saltos excesivos y espacios dobles
  const clean = contenido
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Divide por el marcador de indicador ">"
  const parts = clean.split(/\s*>\s*/);
  const oaHeader = parts[0]; // "OA N [texto completo]"
  const indicadores = parts.slice(1)
    .map(s => s.trim())
    // Limpia pies de página del PDF (ej: "1 U1 85 historia, geografía y ciencias sociales | Programa de Estudio | 8° básico")
    .map(s => s.split(/\s+\d+\s+U\d+\s+\d+\s+/i)[0].trim())
    .map(s => s.split(/\s+\|\s+Programa de Estudio/i)[0].trim())
    .map(s => s.split(/\s+unidAd\s+\d+:/i)[0].trim())
    // Capitaliza la primera letra
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .filter(s => s.length > 20);

  // Quita el "OA N" inicial del texto del OA
  const texto = oaHeader
    .replace(/^OA\s+\d+\s*/i, '')
    .trim();

  return { texto, indicadores };
}

/**
 * Busca un OA específico en el RAG por su número.
 * Retorna el texto literal + indicadores, o null si no lo encuentra.
 */
export async function fetchOAFromRag(
  asignatura: string,
  nivel: string,
  oaNumero: string // ej: "3", "15", "OA 3"
): Promise<OAFull | null> {
  // Normaliza el número: "OA 3" → "3"
  const numeroLimpio = String(oaNumero).replace(/[^\d]/g, '');
  if (!numeroLimpio) return null;

  try {
    const client = getRagClient();
    // Filtra por metadata->>oa = numeroLimpio
    const { data, error } = await client
      .from('rag_documents')
      .select('contenido, metadata, chunk_index')
      .eq('tipo', 'programa')
      .eq('asignatura', asignatura)
      .eq('nivel', nivel)
      .filter('metadata->>oa', 'eq', numeroLimpio)
      .order('chunk_index', { ascending: true })
      .limit(3);

    if (error || !data || data.length === 0) {
      console.warn('[OA RAG] Not found:', asignatura, nivel, 'OA', numeroLimpio);
      return null;
    }

    // Toma el primer chunk (es el que inicia con "OA N")
    const parsed = parseOAChunk(data[0].contenido as string);

    // Si hay más chunks con el mismo OA (part > 0), agrega sus indicadores
    for (let i = 1; i < data.length; i++) {
      const extra = parseOAChunk(data[i].contenido as string);
      parsed.indicadores.push(...extra.indicadores);
    }

    return {
      numero: `OA ${numeroLimpio}`,
      texto: parsed.texto,
      indicadores: parsed.indicadores,
    };
  } catch (err) {
    console.warn('[OA RAG] Error fetching OA', oaNumero, err);
    return null;
  }
}

/**
 * Parsea el input del usuario "OA 3, OA 4" → ["3", "4"]
 */
export function parseOACodes(input: string): string[] {
  if (!input) return [];
  const matches = input.match(/\d+/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Obtiene todos los OAs solicitados desde el RAG en paralelo.
 * Acepta asignatura y curso en formato humano (ej: "Historia", "8° Básico")
 * y los normaliza al formato del RAG (ej: "historia-geografia-cs", "8-basico").
 */
export async function fetchAllOAsFromRag(
  asignatura: string,
  curso: string,
  oaInput: string
): Promise<OAFull[]> {
  const codes = parseOACodes(oaInput);
  if (codes.length === 0) return [];

  const asigNormalizada = normalizarAsignatura(asignatura);
  const nivelNormalizado = normalizarCurso(curso);

  const results = await Promise.all(
    codes.map(code => fetchOAFromRag(asigNormalizada, nivelNormalizado, code))
  );

  return results.filter((r): r is OAFull => r !== null);
}
