/**
 * Supabase self-hosted storage (en Easypanel).
 *
 * Usa DOS URLs distintas:
 * - NEXT_PUBLIC_RAG_SUPABASE_URL (ej: http://kong:8000) — DNS interno Docker, para uploads/queries
 * - NEXT_PUBLIC_SUPABASE_STORAGE_PUBLIC_URL (ej: https://educmark-supabase.vfuqpl.easypanel.host) —
 *   URL pública que funciona desde el browser del usuario. Fallback a la URL interna si no está configurada.
 */
import { createClient } from '@supabase/supabase-js';

let selfClient: ReturnType<typeof createClient> | null = null;

function getSelfClient() {
  if (selfClient) return selfClient;
  const url = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
  const key = process.env.RAG_SUPABASE_KEY;
  if (!url || !key) throw new Error('Self-hosted Supabase env vars not configured');
  selfClient = createClient(url, key);
  return selfClient;
}

/**
 * Construye la URL pública del archivo.
 *
 * Para HTMLs: usa el proxy /api/slides/view (Supabase fuerza text/plain para HTML por XSS).
 * Para imágenes: usa directamente la URL pública de Supabase Storage (se sirven con content-type correcto).
 *
 * La base de la app debe configurarse con NEXT_PUBLIC_APP_URL (ej: https://educmark.cl)
 * para que los HTML-links funcionen desde el email.
 */
function buildPublicUrl(path: string): string {
  const isHtml = path.endsWith('.html');

  if (isHtml) {
    const appBase = process.env.NEXT_PUBLIC_APP_URL || '';
    const base = appBase.replace(/\/$/, '');
    return `${base}/api/slides/view/${path}`;
  }

  // Para imágenes: URL pública directa del Supabase self-hosted
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_PUBLIC_URL
    || process.env.NEXT_PUBLIC_RAG_SUPABASE_URL!;
  const base = publicBase.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/generated-classes/${path}`;
}

export interface SelfUploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Sube un archivo al Supabase self-hosted bucket "generated-classes".
 *
 * IMPORTANTE: usa TextEncoder + Blob para forzar UTF-8 correcto. Pasar un
 * Buffer directamente causa double-encoding: los bytes UTF-8 (ej: 0xC3 0xA1 = 'á')
 * se interpretan como Latin-1 y se re-codifican como UTF-8, resultando en 'Ã¡'.
 *
 * @param content - String o Buffer (imágenes usan Buffer)
 * @param path - Ruta del archivo (ej: "user-id/class-id.html")
 * @param contentType - MIME type
 */
export async function uploadToSelfStorage(
  content: string | Buffer,
  path: string,
  contentType: string
): Promise<SelfUploadResult> {
  const client = getSelfClient();

  // Garantiza UTF-8 correcto: TextEncoder convierte strings JS (UTF-16 interno)
  // a bytes UTF-8 reales. Para buffers (imágenes), se usa tal cual.
  let body: Blob;
  if (typeof content === 'string') {
    const bytes = new TextEncoder().encode(content);
    body = new Blob([bytes], { type: contentType });
  } else {
    body = new Blob([new Uint8Array(content)], { type: contentType });
  }

  const { error } = await client.storage
    .from('generated-classes')
    .upload(path, body, { contentType, upsert: false });

  if (error) throw new Error(`Self-hosted upload failed: ${error.message}`);

  return { path, publicUrl: buildPublicUrl(path) };
}
