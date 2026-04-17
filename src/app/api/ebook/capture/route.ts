import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const FALLBACK_PDF_URL =
    'https://gjudfgpudbqdhclbmjjo.supabase.co/storage/v1/object/public/EducMark/Ebook%20EducMark.pdf';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function buildEmailHtml(nombre: string | null, pdfUrl: string) {
    const saludo = nombre ? `Hola ${nombre.split(' ')[0]},` : 'Hola,';
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f7; margin:0; padding:24px;">
  <table role="presentation" style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <tr>
      <td style="padding:32px 32px 16px 32px;">
        <p style="font-size:14px; color:#7C3AED; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin:0 0 12px 0;">EducMark</p>
        <h1 style="font-size:24px; color:#1A1528; margin:0 0 16px 0; line-height:1.3;">${saludo} ac&aacute; est&aacute; tu ebook gratis</h1>
        <p style="font-size:16px; color:#4a4458; line-height:1.6; margin:0 0 20px 0;">
          <strong>De 12 Horas a 5 Minutos</strong> &mdash; una gu&iacute;a honesta de 16 p&aacute;ginas
          que cuenta c&oacute;mo recuperar tus tardes usando IA bien aplicada a la docencia.
        </p>
        <p style="margin:24px 0;">
          <a href="${pdfUrl}" style="display:inline-block; background:linear-gradient(135deg, #7C3AED 0%, #0891B2 100%); color:#ffffff; text-decoration:none; font-weight:600; padding:14px 28px; border-radius:12px; font-size:15px;">Descargar ebook (PDF)</a>
        </p>
        <p style="font-size:14px; color:#6B6480; line-height:1.6; margin:16px 0 0 0;">
          Si quer&eacute;s ir un paso m&aacute;s, pod&eacute;s probar EducMark con 3 clases gratis en
          <a href="https://educmark.cl" style="color:#7C3AED; text-decoration:none;">educmark.cl</a>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 32px 32px; border-top:1px solid #E8E5F0;">
        <p style="font-size:12px; color:#6B6480; margin:0;">
          EducMark &mdash; Planifica clases con IA, alineadas al curr&iacute;culum chileno.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
    let body: { email?: string; nombre?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'JSON inv&aacute;lido' }, { status: 400 });
    }

    const email = (body.email || '').trim().toLowerCase();
    const nombre = body.nombre?.trim() || null;

    if (!email || !EMAIL_RE.test(email)) {
        return NextResponse.json({ error: 'Email inv&aacute;lido' }, { status: 400 });
    }

    const pdfUrl = process.env.NEXT_PUBLIC_EBOOK_URL || FALLBACK_PDF_URL;

    // Upsert en usuarios_crm (sin user_id — todavia no se registra)
    try {
        const admin = getAdminClient();
        const { data: existing } = await admin
            .from('usuarios_crm')
            .select('id, descarga_ebook')
            .eq('email', email)
            .is('user_id', null)
            .maybeSingle();

        if (existing) {
            await admin
                .from('usuarios_crm')
                .update({
                    nombre: nombre ?? undefined,
                    descarga_ebook: 'SI',
                    last_interaction: new Date().toISOString(),
                })
                .eq('id', existing.id);
        } else {
            await admin.from('usuarios_crm').insert({
                email,
                nombre,
                descarga_ebook: 'SI',
                source: 'landing_ebook',
                stage: 'lead_frio',
                last_interaction: new Date().toISOString(),
            });
        }
    } catch (err) {
        // CRM no crítico — seguimos con el email y la descarga
        console.warn('[ebook-capture] CRM upsert failed:', err);
    }

    // Email con Resend (no crítico — si falla, igualmente damos la descarga)
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    if (resendKey) {
        try {
            const resend = new Resend(resendKey);
            await resend.emails.send({
                from: 'EducMark <hola@educmark.cl>',
                to: email,
                subject: '📘 Tu ebook "De 12 Horas a 5 Minutos"',
                html: buildEmailHtml(nombre, pdfUrl),
            });
            emailSent = true;
        } catch (err) {
            console.warn('[ebook-capture] Resend failed:', err);
        }
    }

    return NextResponse.json({ pdfUrl, emailSent });
}
