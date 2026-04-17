/**
 * Proxy endpoint para servir HTMLs del bucket "generated-classes" con
 * Content-Type correcto.
 *
 * Supabase Storage fuerza text/plain para HTML por seguridad XSS. Este proxy
 * lee el archivo desde el storage self-hosted (via DNS interno) y lo re-sirve
 * con text/html para que el browser lo interprete.
 *
 * URL: /api/slides/view/{userId}/{classId}.html
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  if (!path || path.length < 2) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // Validación básica: formato userId/classId.(html|png|jpg)
  const storagePath = path.join('/');
  if (!/^[\w-]+\/[\w-]+(-planificacion)?\.(html|png|jpg|jpeg)$/.test(storagePath)) {
    return NextResponse.json({ error: 'Invalid path format' }, { status: 400 });
  }

  // Internal Docker URL (rápido, no hairpin NAT)
  const storageUrl = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
  if (!storageUrl) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  const fileUrl = `${storageUrl.replace(/\/$/, '')}/storage/v1/object/public/generated-classes/${storagePath}`;

  try {
    const res = await fetch(fileUrl);
    if (!res.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: res.status });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const isHtml = storagePath.endsWith('.html');
    const contentType = isHtml
      ? 'text/html; charset=utf-8'
      : res.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[Slides View] Error:', err);
    return NextResponse.json({ error: 'Error serving file' }, { status: 500 });
  }
}
