/**
 * Supabase self-hosted storage (en Easypanel).
 * Usa las mismas envs NEXT_PUBLIC_RAG_SUPABASE_URL y RAG_SUPABASE_KEY
 * que ya están configuradas para el RAG.
 *
 * Ventajas vs Supabase Cloud:
 * - Cuota = capacidad del VPS (no los 1GB gratis del cloud)
 * - Costo = cero adicional (ya lo pagamos en Easypanel)
 * - Mismas APIs de Supabase Storage
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

export interface SelfUploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Sube un archivo al Supabase self-hosted bucket "generated-classes".
 *
 * @param content - String o Buffer
 * @param path - Ruta del archivo (ej: "user-id/class-id.html")
 * @param contentType - MIME type
 * @returns URL pública + path
 */
export async function uploadToSelfStorage(
  content: string | Buffer,
  path: string,
  contentType: string
): Promise<SelfUploadResult> {
  const client = getSelfClient();
  const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;

  const { error } = await client.storage
    .from('generated-classes')
    .upload(path, buffer, { contentType, upsert: false });

  if (error) throw new Error(`Self-hosted upload failed: ${error.message}`);

  const { data } = client.storage.from('generated-classes').getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
