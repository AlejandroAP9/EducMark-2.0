'use client';

/**
 * HTML -> PDF conversion utility for EducMark documents.
 *
 * Two entry points:
 *  - downloadHtmlAsPdf(html, filename)  -> for client-side HTML (answer sheet, pauta)
 *  - downloadUrlAsPdf(url, filename)    -> for Google Drive URLs (proxied through assessment-api)
 */
import html2pdf from 'html2pdf.js';
import { getAssessmentApiUrl, assessmentFetch } from '@/shared/lib/apiConfig';

/* ── Shared html2pdf options ─────────────────────────────────────────── */

interface PdfExportOptions {
    /** Page format: 'letter' (default) or 'legal' */
    format?: 'letter' | 'legal' | 'a4';
    /** 'portrait' (default) or 'landscape' */
    orientation?: 'portrait' | 'landscape';
    /** Margins in mm [top, left, bottom, right] */
    margin?: [number, number, number, number];
    /** Render scale (default 2 for crisp text) */
    scale?: number;
}

function buildOptions(filename: string, opts: PdfExportOptions = {}) {
    return {
        margin: (opts.margin ?? [8, 8, 8, 8]) as [number, number, number, number],
        filename,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: {
            scale: opts.scale ?? 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
        },
        jsPDF: {
            unit: 'mm' as const,
            format: opts.format ?? 'letter',
            orientation: opts.orientation ?? 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const },
    };
}

/* ── Core: render HTML string inside a hidden container and convert ─── */

export async function downloadHtmlAsPdf(
    html: string,
    filename: string,
    opts: PdfExportOptions = {},
): Promise<void> {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '215.9mm'; // Letter width
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
        await html2pdf().set(buildOptions(filename, opts)).from(container).save();
    } finally {
        document.body.removeChild(container);
    }
}

/* ── Fetch HTML from Google Drive via assessment-api proxy ──────────── */

async function fetchHtmlViaProxy(url: string): Promise<string> {
    const apiBase = getAssessmentApiUrl();
    const proxyUrl = `${apiBase}/api/v1/proxy/html?url=${encodeURIComponent(url)}`;
    const res = await assessmentFetch(proxyUrl, {
        headers: { Accept: 'text/html' },
    });
    if (!res.ok) {
        throw new Error(`Error al obtener el documento: ${res.status}`);
    }
    return res.text();
}

export async function downloadUrlAsPdf(
    url: string,
    filename: string,
    opts: PdfExportOptions = {},
): Promise<void> {
    const html = await fetchHtmlViaProxy(url);
    return downloadHtmlAsPdf(html, filename, opts);
}

/* ── Download as HTML with embedded PDF button ───────────────────── */

const PDF_BUTTON_SNIPPET = `
<style media="print">.educmark-pdf-bar{display:none!important}</style>
<div class="educmark-pdf-bar" style="position:fixed;top:0;left:0;right:0;z-index:99999;display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#1e293b;color:#fff;font-family:system-ui,sans-serif;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.3)">
  <span style="opacity:.8">EducMark \u2014 Documento editable</span>
  <button onclick="window.print()" style="padding:6px 16px;background:#6366f1;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">Descargar como PDF</button>
</div>
<div style="height:44px"></div>
`;

/**
 * Inject a "Download as PDF" toolbar into raw HTML and trigger a .html download.
 */
function injectPdfBarAndDownload(html: string, filename: string): void {
    let enriched: string;
    const bodyIdx = html.search(/<body[^>]*>/i);
    if (bodyIdx !== -1) {
        const closeTag = html.indexOf('>', bodyIdx) + 1;
        enriched = html.slice(0, closeTag) + PDF_BUTTON_SNIPPET + html.slice(closeTag);
    } else {
        enriched = PDF_BUTTON_SNIPPET + html;
    }

    const blob = new Blob([enriched], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

/**
 * Download an HTML document from a URL (Google Drive or other).
 *
 * Strategy:
 *  1. Try assessment-api proxy -> inject PDF bar -> blob download
 *  2. Fallback: navigate directly to URL (Google Drive uc?export=download triggers download)
 */
export async function downloadUrlAsHtml(
    url: string,
    filename: string,
): Promise<void> {
    // Strategy 1: proxy fetch -> inject PDF button -> blob download
    try {
        const html = await fetchHtmlViaProxy(url);
        injectPdfBarAndDownload(html, filename);
        return;
    } catch (proxyErr) {
        console.warn('Proxy fetch failed, trying direct download:', proxyErr);
    }

    // Strategy 2: direct navigation (Google Drive uc?export=download)
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* ── Convenience: filename generators ────────────────────────────── */

export function buildHtmlFilename(
    type: 'planificacion' | 'presentacion' | 'evaluacion' | 'hoja_respuestas' | 'pauta',
    meta?: { subject?: string; grade?: string },
): string {
    const labels: Record<string, string> = {
        planificacion: 'Planificacion',
        presentacion: 'Presentacion',
        evaluacion: 'Evaluacion',
        hoja_respuestas: 'HojaRespuestas',
        pauta: 'PautaCorreccion',
    };
    const parts = [labels[type] || type];
    if (meta?.subject) parts.push(meta.subject.replace(/\s+/g, '_'));
    if (meta?.grade) parts.push(meta.grade.replace(/\s+/g, '_'));
    return parts.join('_') + '.html';
}

/* ── Convenience: PDF filename generator ─────────────────────────── */

export function buildPdfFilename(
    type: 'planificacion' | 'presentacion' | 'evaluacion' | 'hoja_respuestas' | 'pauta',
    meta?: { subject?: string; grade?: string },
): string {
    const labels: Record<string, string> = {
        planificacion: 'Planificacion',
        presentacion: 'Presentacion',
        evaluacion: 'Evaluacion',
        hoja_respuestas: 'HojaRespuestas',
        pauta: 'PautaCorreccion',
    };
    const parts = [labels[type] || type];
    if (meta?.subject) parts.push(meta.subject.replace(/\s+/g, '_'));
    if (meta?.grade) parts.push(meta.grade.replace(/\s+/g, '_'));
    return parts.join('_') + '.pdf';
}
