/**
 * Generador de Reporte PDF Ejecutivo — EducMark
 *
 * Genera un PDF profesional y sobrio con:
 * - Logo del colegio + encabezado institucional
 * - KPIs del curso
 * - Top errores con diagnosticos
 * - Evolucion por OA con barras comparativas
 * - Sugerencias pedagogicas
 * - Feedback del alumno
 *
 * Usa jsPDF + jspdf-autotable para maximo control.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InstitutionBranding } from '@/shared/lib/institutionBranding';

// ── Brand Colors ──
const COLORS = {
    primary: [79, 70, 229] as [number, number, number],       // Indigo
    primaryLight: [99, 102, 241] as [number, number, number],
    success: [16, 185, 129] as [number, number, number],       // Emerald
    danger: [239, 68, 68] as [number, number, number],         // Red
    warning: [245, 158, 11] as [number, number, number],       // Amber
    dark: [15, 23, 42] as [number, number, number],            // Slate-900
    muted: [100, 116, 139] as [number, number, number],        // Slate-500
    light: [241, 245, 249] as [number, number, number],        // Slate-100
    white: [255, 255, 255] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],       // Slate-200
};

interface InsightsData {
    analysis: {
        top_errors: unknown[];
        oa_gaps: unknown[];
        stats: {
            total_students: number;
            average_percentage: number;
            pass_count: number;
            pass_rate: number;
        };
    };
    action_plan: {
        diagnostics: unknown[];
        suggestions: unknown[];
        student_feedback: string;
        summary: string;
    };
}

interface EvolutionData {
    has_previous: boolean;
    current_evaluation?: Record<string, unknown>;
    previous_evaluation?: Record<string, unknown>;
    overall_delta?: number;
    evolution: unknown[];
    summary?: Record<string, unknown>;
    narrative?: string;
}

interface ReportData {
    evaluationTitle: string;
    subject: string;
    grade: string;
    date: string;
    insights?: InsightsData;
    evolution?: EvolutionData;
}

/**
 * AN-13: Export executive report as HTML slides for PPT-style presentations.
 * The output is a self-contained .html file that can be opened and presented in-browser.
 */
export function downloadExecutivePresentationHTML(data: ReportData, branding?: InstitutionBranding): void {
    const safeTitle = (data.evaluationTitle || 'Reporte Ejecutivo').replace(/[<>]/g, '');
    const date = data.date || new Date().toLocaleDateString('es-CL');

    const stats = data.insights?.analysis?.stats || {
        average_percentage: 0,
        pass_rate: 0,
        pass_count: 0,
        total_students: 0,
    };

    const topErrors = data.insights?.analysis?.top_errors || [];
    const oaGaps = data.insights?.analysis?.oa_gaps || [];
    const summary = data.insights?.action_plan?.summary || 'Sin resumen disponible.';
    const narrative = data.evolution?.narrative || 'Sin narrativa de evolucion disponible.';

    const errorRows = topErrors.length > 0
        ? topErrors.slice(0, 8).map((e: unknown) => {
            const err = e as Record<string, unknown>;
            return `
            <tr>
                <td>P${err.question_number ?? '-'}</td>
                <td>${err.oa || '\u2014'}</td>
                <td>${err.topic || '\u2014'}</td>
                <td>${err.error_rate ?? 0}%</td>
            </tr>
        `;
        }).join('')
        : '<tr><td colspan="4">Sin datos de errores.</td></tr>';

    const oaRows = oaGaps.length > 0
        ? oaGaps.slice(0, 8).map((g: unknown) => {
            const gap = g as Record<string, unknown>;
            return `
            <tr>
                <td>${gap.oa || '\u2014'}</td>
                <td>${gap.topic || '\u2014'}</td>
                <td>${gap.achievement ?? 0}%</td>
                <td>${gap.expected ?? 0}%</td>
            </tr>
        `;
        }).join('')
        : '<tr><td colspan="4">Sin datos de brechas OA.</td></tr>';

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Presentacion - ${safeTitle}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #111827;
      --primary: #4f46e5;
      --accent: #22c55e;
      --muted: #94a3b8;
      --text: #f8fafc;
    }
    body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #020617; color: var(--text); }
    .controls { position: fixed; right: 12px; top: 12px; z-index: 50; display: flex; gap: 8px; }
    .controls button { background: #1f2937; color: #fff; border: 1px solid #334155; border-radius: 8px; padding: 8px 10px; cursor: pointer; }
    .slides { height: 100vh; overflow-y: auto; scroll-snap-type: y mandatory; }
    .slide {
      min-height: 100vh;
      padding: 56px 64px;
      box-sizing: border-box;
      scroll-snap-align: start;
      background: radial-gradient(1200px 600px at 20% 10%, #1e1b4b 0%, #020617 60%);
      border-bottom: 1px solid #1e293b;
    }
    h1, h2 { margin: 0 0 10px; }
    .subtitle { color: var(--muted); margin-bottom: 24px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 20px; }
    .kpi { background: rgba(15,23,42,0.7); border: 1px solid #334155; border-radius: 14px; padding: 18px; }
    .kpi .v { font-size: 34px; font-weight: 800; }
    .kpi .l { font-size: 12px; color: var(--muted); margin-top: 6px; text-transform: uppercase; letter-spacing: .04em; }
    .callout { margin-top: 24px; background: rgba(79,70,229,.15); border: 1px solid rgba(79,70,229,.4); border-radius: 12px; padding: 16px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; background: rgba(15,23,42,.7); border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
    th, td { padding: 10px; border-bottom: 1px solid #334155; text-align: left; font-size: 14px; }
    th { color: #cbd5e1; background: rgba(30,41,59,.7); }
    tr:last-child td { border-bottom: none; }
    .footer-note { margin-top: 20px; color: var(--muted); font-size: 13px; }
    @media (max-width: 900px) {
      .slide { padding: 28px 20px; }
      .kpis { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="controls">
    <button onclick="window.print()">Imprimir / PDF</button>
  </div>
  <div class="slides">
    <section class="slide">
      ${branding?.logo ? `<img src="${branding.logo}" alt="Logo" style="max-height:60px;margin-bottom:8px;" />` : ''}
      ${branding?.institutionName ? `<p style="color:var(--muted);font-size:16px;margin:0 0 6px;">${branding.institutionName.replace(/[<>]/g, '')}</p>` : ''}
      <h1>Reporte Ejecutivo de Resultados</h1>
      <p class="subtitle">${safeTitle} \u00b7 ${data.subject} \u00b7 ${data.grade} \u00b7 ${date}</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${stats.average_percentage}%</div><div class="l">Logro promedio</div></div>
        <div class="kpi"><div class="v">${stats.pass_rate}%</div><div class="l">Tasa de aprobacion</div></div>
        <div class="kpi"><div class="v">${stats.pass_count}</div><div class="l">Aprobados</div></div>
        <div class="kpi"><div class="v">${stats.total_students}</div><div class="l">Estudiantes</div></div>
      </div>
      <div class="callout">${summary}</div>
      <p class="footer-note">Navega con scroll para avanzar por las diapositivas.</p>
    </section>

    <section class="slide">
      <h2>Top Preguntas con Mayor Error</h2>
      <p class="subtitle">Foco de intervencion inmediata en clase.</p>
      <table>
        <thead><tr><th>Pregunta</th><th>OA</th><th>Tema</th><th>Error</th></tr></thead>
        <tbody>${errorRows}</tbody>
      </table>
    </section>

    <section class="slide">
      <h2>Brechas por OA</h2>
      <p class="subtitle">Comparacion de logro observado vs esperado.</p>
      <table>
        <thead><tr><th>OA</th><th>Tema</th><th>Logro</th><th>Esperado</th></tr></thead>
        <tbody>${oaRows}</tbody>
      </table>
    </section>

    <section class="slide">
      <h2>Evolucion y Recomendacion</h2>
      <p class="subtitle">Narrativa para jornada tecnica (UTP / Direccion).</p>
      <div class="callout">${narrative}</div>
      <div class="callout" style="margin-top:12px;border-color:rgba(34,197,94,.4);background:rgba(34,197,94,.12);">
        Proximo paso sugerido: definir plan de refuerzo por OA critico y monitorear resultados en la proxima aplicacion.
      </div>
    </section>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const datePart = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `Presentacion_Ejecutiva_${(data.subject || 'General').replace(/\s+/g, '_')}_${datePart}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Loads image as base64 data URL
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/**
 * Helper: Draw a horizontal colored bar
 */
function drawBar(doc: jsPDF, x: number, y: number, width: number, height: number, percentage: number, color: [number, number, number]) {
    // Background
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(x, y, width, height, 1, 1, 'F');
    // Filled portion
    if (percentage > 0) {
        const fillWidth = Math.max((percentage / 100) * width, 2);
        doc.setFillColor(...color);
        doc.roundedRect(x, y, fillWidth, height, 1, 1, 'F');
    }
}

/**
 * Helper: Draw a KPI card
 */
function drawKPICard(doc: jsPDF, x: number, y: number, width: number, label: string, value: string, sublabel: string, color: [number, number, number]) {
    const height = 30;

    // Card background
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');

    // Color accent bar at top
    doc.setFillColor(...color);
    doc.rect(x, y, width, 2, 'F');

    // Label
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), x + width / 2, y + 10, { align: 'center' });

    // Value
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + width / 2, y + 20, { align: 'center' });

    // Sublabel
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(sublabel, x + width / 2, y + 26, { align: 'center' });
}

/**
 * Helper: Parse hex color string to RGB tuple
 */
function hexToRgb(hex: string): [number, number, number] | null {
    const match = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!match) return null;
    return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

/**
 * Main PDF Generator
 */
export async function generateExecutiveReport(data: ReportData, branding?: InstitutionBranding): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Load logo — use branding logo if provided, otherwise default EducMark logo
    const logoSrc = branding?.logo || '/images/logo-full.png';
    const logoBase64 = await loadImageAsBase64(logoSrc);

    // ═══════════════════════════════════════════
    //  HEADER
    // ═══════════════════════════════════════════
    // Background bar — use branding primary color if available
    const headerColor: [number, number, number] = branding?.primaryColor
        ? hexToRgb(branding.primaryColor) ?? COLORS.primary
        : COLORS.primary;
    doc.setFillColor(...headerColor);
    doc.rect(0, 0, pageWidth, branding?.institutionName ? 42 : 36, 'F');

    // Logo
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', margin, 6, 30, 24);
        } catch {
            // Logo failed, skip
        }
    }

    // Title Block
    const titleX = logoBase64 ? margin + 35 : margin;
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text('Informe Ejecutivo de Resultados', titleX, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.subject} \u2014 ${data.grade}`, titleX, 22);
    doc.text(`${data.evaluationTitle}`, titleX, 28);

    // Institution name subtitle (if branding)
    if (branding?.institutionName) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(branding.institutionName, titleX, 34);
    }

    // Date on the right
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(data.date, pageWidth - margin, 15, { align: 'right' });
    doc.text('Generado por EducMark AI', pageWidth - margin, 21, { align: 'right' });

    y = branding?.institutionName ? 50 : 44;

    // ═══════════════════════════════════════════
    //  KPI CARDS
    // ═══════════════════════════════════════════
    if (data.insights) {
        const stats = data.insights.analysis.stats;
        const cardWidth = (contentWidth - 8) / 3;

        // Convert percentage to Chilean grade
        const pct = stats.average_percentage;
        let grade: string;
        if (pct <= 0) grade = '1.0';
        else if (pct >= 100) grade = '7.0';
        else if (pct < 60) grade = (1.0 + (pct / 60) * 3.0).toFixed(1);
        else grade = (4.0 + ((pct - 60) / 40) * 3.0).toFixed(1);

        drawKPICard(doc, margin, y, cardWidth, 'Promedio del Curso', grade, `${pct}% logro`, COLORS.primary);
        drawKPICard(doc, margin + cardWidth + 4, y, cardWidth, 'Tasa de Aprobacion', `${stats.pass_rate}%`, `${stats.pass_count}/${stats.total_students} aprobados`, COLORS.success);
        drawKPICard(doc, margin + (cardWidth + 4) * 2, y, cardWidth, 'Estudiantes Evaluados', `${stats.total_students}`, 'hojas procesadas', COLORS.primaryLight);

        y += 38;
    }

    // ═══════════════════════════════════════════
    //  RESUMEN EJECUTIVO (AI Summary)
    // ═══════════════════════════════════════════
    if (data.insights?.action_plan.summary) {
        doc.setFillColor(247, 248, 252);
        doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
        doc.setFillColor(...COLORS.primary);
        doc.rect(margin, y, 2, 14, 'F');

        doc.setFontSize(7);
        doc.setTextColor(...COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN EJECUTIVO', margin + 6, y + 5);

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.dark);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(data.insights.action_plan.summary, contentWidth - 12);
        doc.text(summaryLines, margin + 6, y + 10);

        y += 18;
    }

    // ═══════════════════════════════════════════
    //  TOP ERRORES TABLE
    // ═══════════════════════════════════════════
    if (data.insights && data.insights.analysis.top_errors.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(...COLORS.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('\u258c Preguntas con Mayor Indice de Error', margin, y + 5);
        y += 10;

        const errorData = data.insights.analysis.top_errors.map((e: unknown) => {
            const err = e as Record<string, unknown>;
            return [
                `P${err.question_number}`,
                (err.question_type as string).toUpperCase(),
                (err.oa as string) || '\u2014',
                (err.topic as string) || '\u2014',
                `${err.error_rate}%`,
                (err.most_common_wrong as string) || 'Blanco',
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Preg.', 'Tipo', 'OA', 'Tema', 'Error', 'Resp. Comun']],
            body: errorData,
            theme: 'grid',
            margin: { left: margin, right: margin },
            styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: COLORS.border, lineWidth: 0.2 },
            headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 7 },
            columnStyles: {
                0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: 12, halign: 'center' },
                4: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
                5: { cellWidth: 18, halign: 'center' },
            },
            didParseCell: (cellData: unknown) => {
                const d = cellData as { column: { index: number }; section: string; cell: { styles: { textColor: number[]; fontStyle: string }; text: string[] } };
                if (d.column.index === 4 && d.section === 'body') {
                    const val = parseFloat(d.cell.text[0]);
                    if (val >= 60) {
                        d.cell.styles.textColor = [...COLORS.danger];
                        d.cell.styles.fontStyle = 'bold';
                    } else if (val >= 40) {
                        d.cell.styles.textColor = [...COLORS.warning];
                    }
                }
            },
        });

        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    // ═══════════════════════════════════════════
    //  DIAGNOSTICOS
    // ═══════════════════════════════════════════
    if (data.insights && data.insights.action_plan.diagnostics.length > 0) {
        if (y > pageHeight - 80) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(11);
        doc.setTextColor(...COLORS.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('\u258c Diagnosticos Pedagogicos', margin, y + 5);
        y += 10;

        data.insights.action_plan.diagnostics.forEach((d: unknown, idx: number) => {
            const diag = d as Record<string, unknown>;
            if (y > pageHeight - 40) {
                doc.addPage();
                y = margin;
            }

            doc.setFillColor(idx % 2 === 0 ? 254 : 255, idx % 2 === 0 ? 242 : 255, idx % 2 === 0 ? 242 : 255);
            const diagText = doc.splitTextToSize(`${diag.diagnosis}`, contentWidth - 22);
            const rootText = diag.root_cause ? doc.splitTextToSize(`Causa: ${diag.root_cause}`, contentWidth - 22) : [];
            const cardH = 14 + diagText.length * 3.5 + rootText.length * 3;

            doc.roundedRect(margin, y, contentWidth, cardH, 2, 2, 'F');

            doc.setFillColor(...((diag.error_rate as number) > 60 ? COLORS.danger : COLORS.warning));
            doc.rect(margin, y, 2, cardH, 'F');

            doc.setFontSize(8);
            doc.setTextColor(...COLORS.dark);
            doc.setFont('helvetica', 'bold');
            doc.text(`Pregunta ${diag.question} \u2014 ${diag.oa} (${diag.topic}) \u00b7 ${diag.error_rate}% error`, margin + 6, y + 6);

            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text(diagText, margin + 6, y + 12);

            if (rootText.length > 0) {
                doc.setFontSize(7);
                doc.setTextColor(...COLORS.muted);
                doc.setFont('helvetica', 'italic');
                doc.text(rootText, margin + 6, y + 12 + diagText.length * 3.5 + 2);
            }

            y += cardH + 3;
        });

        y += 4;
    }

    // ═══════════════════════════════════════════
    //  SUGERENCIAS PEDAGOGICAS
    // ═══════════════════════════════════════════
    if (data.insights && data.insights.action_plan.suggestions.length > 0) {
        if (y > pageHeight - 60) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(11);
        doc.setTextColor(...COLORS.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('\u258c Plan de Accion Sugerido', margin, y + 5);
        y += 10;

        const sugData = data.insights.action_plan.suggestions.map((s: unknown) => {
            const sug = s as Record<string, unknown>;
            return [
                ((sug.priority as string) || '\u2014').toUpperCase(),
                (sug.oa as string) || '\u2014',
                (sug.activity as string) || '\u2014',
                (sug.duration as string) || '\u2014',
                (sug.description as string) || '\u2014',
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Prioridad', 'OA', 'Actividad', 'Duracion', 'Descripcion']],
            body: sugData,
            theme: 'grid',
            margin: { left: margin, right: margin },
            styles: { fontSize: 7, cellPadding: 3, lineColor: COLORS.border, lineWidth: 0.2, overflow: 'linebreak' },
            headStyles: { fillColor: COLORS.success, textColor: COLORS.white, fontStyle: 'bold', fontSize: 7 },
            columnStyles: {
                0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: 16 },
                2: { cellWidth: 35 },
                3: { cellWidth: 18, halign: 'center' },
                4: { cellWidth: 'auto' },
            },
            didParseCell: (cellData: unknown) => {
                const d = cellData as { column: { index: number }; section: string; cell: { styles: { textColor: number[] }; text: string[] } };
                if (d.column.index === 0 && d.section === 'body') {
                    const val = d.cell.text[0]?.toLowerCase();
                    if (val === 'alta') d.cell.styles.textColor = [...COLORS.danger];
                    else if (val === 'media') d.cell.styles.textColor = [...COLORS.warning];
                    else d.cell.styles.textColor = [...COLORS.success];
                }
            },
        });

        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    // ═══════════════════════════════════════════
    //  EVOLUCION POR OA
    // ═══════════════════════════════════════════
    if (data.evolution && data.evolution.has_previous && data.evolution.evolution.length > 0) {
        if (y > pageHeight - 70) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(11);
        doc.setTextColor(...COLORS.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('\u258c Evolucion por Objetivo de Aprendizaje', margin, y + 5);

        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.setFont('helvetica', 'normal');
        const prevTitle = (data.evolution.previous_evaluation?.title as string) || 'Anterior';
        const currTitle = (data.evolution.current_evaluation?.title as string) || 'Actual';
        doc.text(`Comparando: "${prevTitle}" \u2192 "${currTitle}"`, margin, y + 11);

        y += 16;

        const overallDelta = data.evolution.overall_delta ?? 0;
        const deltaColor = overallDelta > 0 ? COLORS.success : overallDelta < 0 ? COLORS.danger : COLORS.muted;

        doc.setFillColor(247, 248, 252);
        doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
        doc.setFillColor(...deltaColor);
        doc.rect(margin, y, 2, 12, 'F');

        doc.setFontSize(8);
        doc.setTextColor(...deltaColor);
        doc.setFont('helvetica', 'bold');
        doc.text(
            `Variacion general del promedio: ${overallDelta > 0 ? '+' : ''}${overallDelta} puntos porcentuales`,
            margin + 6, y + 7
        );

        const prevAvg = (data.evolution.previous_evaluation?.average as number) ?? 0;
        const currAvg = (data.evolution.current_evaluation?.average as number) ?? 0;
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.setFont('helvetica', 'normal');
        doc.text(`(${prevAvg}% \u2192 ${currAvg}%)`, margin + contentWidth - 4, y + 7, { align: 'right' });

        y += 16;

        data.evolution.evolution.forEach((it: unknown) => {
            const item = it as Record<string, unknown>;
            if (y > pageHeight - 25) {
                doc.addPage();
                y = margin;
            }

            const rowH = 10;
            const delta = (item.delta as number) ?? 0;
            const trendColor = delta > 0 ? COLORS.success : delta < 0 ? COLORS.danger : COLORS.muted;

            doc.setFontSize(7.5);
            doc.setTextColor(...COLORS.dark);
            doc.setFont('helvetica', 'bold');
            doc.text(`${item.oa}: ${item.topic}`, margin, y + 4);

            if (item.delta !== null) {
                doc.setFontSize(7);
                doc.setTextColor(...trendColor);
                doc.setFont('helvetica', 'bold');
                const deltaStr = `${delta > 0 ? '+' : ''}${delta}pp`;
                doc.text(deltaStr, pageWidth - margin, y + 4, { align: 'right' });
            }

            const barY = y + 5.5;
            const barWidth = contentWidth * 0.55;
            const barX = margin + contentWidth * 0.2;

            if (item.previous_percentage !== null) {
                drawBar(doc, barX, barY, barWidth, 1.8, item.previous_percentage as number, COLORS.muted);
                doc.setFontSize(5.5);
                doc.setTextColor(...COLORS.muted);
                doc.setFont('helvetica', 'normal');
                doc.text(`${item.previous_percentage}%`, barX - 1, barY + 1.5, { align: 'right' });
            }

            drawBar(doc, barX, barY + 2.5, barWidth, 1.8, (item.current_percentage as number) ?? 0, trendColor);
            doc.setFontSize(5.5);
            doc.setTextColor(...trendColor);
            doc.setFont('helvetica', 'bold');
            doc.text(`${item.current_percentage ?? 0}%`, barX - 1, barY + 4, { align: 'right' });

            y += rowH + 2;
        });

        y += 4;

        if (data.evolution.narrative) {
            if (y > pageHeight - 30) {
                doc.addPage();
                y = margin;
            }

            doc.setFillColor(247, 248, 252);
            const narrativeLines = doc.splitTextToSize(data.evolution.narrative, contentWidth - 12);
            const narrativeH = 10 + narrativeLines.length * 3.5;
            doc.roundedRect(margin, y, contentWidth, narrativeH, 2, 2, 'F');

            doc.setFontSize(7);
            doc.setTextColor(...COLORS.primary);
            doc.setFont('helvetica', 'bold');
            doc.text('ANALISIS DE LA IA', margin + 4, y + 5);

            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text(narrativeLines, margin + 4, y + 10);

            y += narrativeH + 6;
        }
    }

    // ═══════════════════════════════════════════
    //  FEEDBACK PARA ALUMNOS
    // ═══════════════════════════════════════════
    if (data.insights?.action_plan.student_feedback) {
        if (y > pageHeight - 35) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(11);
        doc.setTextColor(...COLORS.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('\u258c Mensaje para los Estudiantes', margin, y + 5);
        y += 10;

        const feedbackLines = doc.splitTextToSize(data.insights.action_plan.student_feedback, contentWidth - 12);
        const feedbackH = 8 + feedbackLines.length * 3.5;

        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(margin, y, contentWidth, feedbackH, 2, 2, 'FD');

        doc.setFontSize(7.5);
        doc.setTextColor(22, 101, 52);
        doc.setFont('helvetica', 'normal');
        doc.text(feedbackLines, margin + 6, y + 6);

        y += feedbackH + 6;
    }

    // ═══════════════════════════════════════════
    //  FOOTER (on every page)
    // ═══════════════════════════════════════════
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setDrawColor(...COLORS.border);
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

        doc.setFontSize(6);
        doc.setTextColor(...COLORS.muted);
        doc.setFont('helvetica', 'italic');
        doc.text('Documento generado automaticamente por EducMark \u00b7 Uso interno', margin, pageHeight - 10);

        doc.setFont('helvetica', 'normal');
        doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // ═══════════════════════════════════════════
    //  SAVE
    // ═══════════════════════════════════════════
    const filename = `Informe_${data.subject.replace(/\s/g, '_')}_${data.grade.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}

interface StudentQuestionRow {
    questionNumber: number;
    questionType: 'tf' | 'mc';
    oa: string;
    topic: string;
    studentAnswer: string | null;
    correctAnswer: string | null;
    status: 'correct' | 'incorrect' | 'blank';
}

interface StudentTrajectoryRow {
    evaluationTitle: string;
    date: string;
    percentage: number;
}

interface StudentReportData {
    studentName: string;
    studentId?: string | null;
    evaluationTitle: string;
    subject: string;
    grade: string;
    score: {
        percentage: number;
        correct: number;
        incorrect: number;
        blank: number;
        total: number;
    };
    questionRows: StudentQuestionRow[];
    trajectory: StudentTrajectoryRow[];
    consecutiveDropAlert?: string | null;
}

export function generateStudentReport(data: StudentReportData, branding?: InstitutionBranding): void {
    const doc = new jsPDF('p', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;

    const headerColor: [number, number, number] = branding?.primaryColor
        ? hexToRgb(branding.primaryColor) ?? COLORS.primary
        : COLORS.primary;
    const headerH = branding?.institutionName ? 34 : 28;

    doc.setFillColor(...headerColor);
    doc.rect(0, 0, pageWidth, headerH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.white);
    doc.text('Informe Individual de Estudiante', margin, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.studentName}${data.studentId ? ` \u00b7 ${data.studentId}` : ''}`, margin, 18);
    doc.text(`${data.subject} \u00b7 ${data.grade} \u00b7 ${data.evaluationTitle}`, margin, 23);

    if (branding?.institutionName) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(branding.institutionName, margin, 29);
    }

    let y = headerH + 8;
    const cardW = (pageWidth - margin * 2 - 6) / 3;
    drawKPICard(doc, margin, y, cardW, 'Logro', `${data.score.percentage}%`, `${data.score.correct}/${data.score.total} correctas`, COLORS.primary);
    drawKPICard(doc, margin + cardW + 3, y, cardW, 'Incorrectas', `${data.score.incorrect}`, 'items con error', COLORS.danger);
    drawKPICard(doc, margin + (cardW + 3) * 2, y, cardW, 'En Blanco', `${data.score.blank}`, 'items sin marcar', COLORS.warning);
    y += 38;

    if (data.consecutiveDropAlert) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(252, 165, 165);
        doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(153, 27, 27);
        doc.setFont('helvetica', 'bold');
        doc.text('Alerta de Descenso', margin + 4, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(data.consecutiveDropAlert, margin + 4, y + 9);
        y += 16;
    }

    if (data.trajectory.length > 0) {
        const trajectoryRows = data.trajectory.map((row) => [row.date, row.evaluationTitle, `${row.percentage}%`]);
        autoTable(doc, {
            startY: y,
            head: [['Fecha', 'Evaluacion', 'Logro']],
            body: trajectoryRows,
            margin: { left: margin, right: margin },
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 28 },
                2: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
            },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }

    const questionRows = data.questionRows.map((row) => [
        `${row.questionNumber}`,
        row.questionType.toUpperCase(),
        row.oa || '\u2014',
        row.topic || '\u2014',
        row.studentAnswer ?? '\u2014',
        row.correctAnswer ?? '\u2014',
        row.status === 'correct' ? 'Correcto' : row.status === 'incorrect' ? 'Incorrecto' : 'En blanco',
    ]);
    autoTable(doc, {
        startY: y,
        head: [['#', 'Tipo', 'OA', 'Tema', 'Respuesta', 'Clave', 'Estado']],
        body: questionRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 6.8, cellPadding: 1.8 },
        headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold' },
        didParseCell: (hook) => {
            if (hook.section === 'body' && hook.column.index === 6) {
                const value = String(hook.cell.text?.[0] || '');
                if (value === 'Correcto') hook.cell.styles.textColor = COLORS.success;
                if (value === 'Incorrecto') hook.cell.styles.textColor = COLORS.danger;
                if (value === 'En blanco') hook.cell.styles.textColor = COLORS.warning;
            }
        },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // ── AN-03: OA-level Strengths & Weaknesses Analysis ──
    if (data.questionRows.length > 0) {
        const oaMap = new Map<string, { topic: string; correct: number; total: number }>();
        data.questionRows.forEach((row) => {
            const oa = row.oa || 'Sin OA';
            if (!oaMap.has(oa)) oaMap.set(oa, { topic: row.topic || '', correct: 0, total: 0 });
            const entry = oaMap.get(oa)!;
            entry.total++;
            if (row.status === 'correct') entry.correct++;
        });

        const oaResults = Array.from(oaMap.entries()).map(([oa, oaData]) => ({
            oa,
            topic: oaData.topic,
            percentage: oaData.total > 0 ? Math.round((oaData.correct / oaData.total) * 100) : 0,
            correct: oaData.correct,
            total: oaData.total,
        }));

        const strongOAs = oaResults.filter(o => o.percentage >= 70).sort((a, b) => b.percentage - a.percentage);
        const weakOAs = oaResults.filter(o => o.percentage < 50).sort((a, b) => a.percentage - b.percentage);

        if (y > pageHeight - 70) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(11);
        doc.setTextColor(...COLORS.dark);
        doc.setFont('helvetica', 'bold');
        doc.text('Analisis por Objetivo de Aprendizaje', margin, y + 5);
        y += 10;

        if (strongOAs.length > 0) {
            doc.setFillColor(240, 253, 244);
            const strongH = 8 + strongOAs.length * 5;
            doc.roundedRect(margin, y, pageWidth - margin * 2, strongH, 2, 2, 'F');
            doc.setFillColor(...COLORS.success);
            doc.rect(margin, y, 2, strongH, 'F');

            doc.setFontSize(8);
            doc.setTextColor(...COLORS.success);
            doc.setFont('helvetica', 'bold');
            doc.text('Fortalezas (>70% logro)', margin + 6, y + 5);

            doc.setFontSize(7);
            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            strongOAs.forEach((oa, i) => {
                doc.text(`${oa.oa}: ${oa.topic} \u2014 ${oa.percentage}% (${oa.correct}/${oa.total})`, margin + 6, y + 10 + i * 5);
            });
            y += strongH + 4;
        }

        if (weakOAs.length > 0) {
            if (y > pageHeight - 50) {
                doc.addPage();
                y = margin;
            }

            const weakH = 8 + weakOAs.length * 10;
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(margin, y, pageWidth - margin * 2, weakH, 2, 2, 'F');
            doc.setFillColor(...COLORS.danger);
            doc.rect(margin, y, 2, weakH, 'F');

            doc.setFontSize(8);
            doc.setTextColor(...COLORS.danger);
            doc.setFont('helvetica', 'bold');
            doc.text('Brechas (<50% logro) \u2014 Requieren refuerzo', margin + 6, y + 5);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            weakOAs.forEach((oa, i) => {
                doc.setTextColor(71, 85, 105);
                doc.text(`${oa.oa}: ${oa.topic} \u2014 ${oa.percentage}% (${oa.correct}/${oa.total})`, margin + 6, y + 10 + i * 10);
                doc.setFontSize(6.5);
                doc.setTextColor(...COLORS.muted);
                doc.text(`Recomendacion: Reforzar ${oa.topic} con actividades diferenciadas y retroalimentacion formativa.`, margin + 6, y + 14 + i * 10);
                doc.setFontSize(7);
            });
            y += weakH + 4;
        }

        if (weakOAs.length === 0 && strongOAs.length > 0) {
            doc.setFillColor(240, 253, 244);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 10, 2, 2, 'F');
            doc.setFontSize(7.5);
            doc.setTextColor(...COLORS.success);
            doc.setFont('helvetica', 'bold');
            doc.text('El estudiante no presenta brechas criticas. Todos los OA estan sobre el 50% de logro.', margin + 6, y + 6);
            y += 14;
        }
    }

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.muted);
        doc.text(`EducMark \u00b7 Pagina ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    const filename = `Informe_Alumno_${data.studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
}

/**
 * PL-30: Consolidated Semester Coverage Report
 * Generates a PDF showing OA coverage by teacher for a semester.
 */
export interface CoverageEntry {
    fullName: string;
    subject: string;
    grade: string;
    plannedOAs: string[];
    totalClasses: number;
}

export function generateSemesterCoverageReport(
    institution: string,
    semester: string,
    coverage: CoverageEntry[],
    branding?: InstitutionBranding,
): void {
    const doc = new jsPDF('p', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;

    const headerColor: [number, number, number] = branding?.primaryColor
        ? hexToRgb(branding.primaryColor) ?? COLORS.primary
        : COLORS.primary;
    // Use branding institution name if available, otherwise fall back to the `institution` param
    const displayInstitution = branding?.institutionName || institution;

    doc.setFillColor(...headerColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.white);
    doc.text('Reporte Consolidado de Cobertura Curricular', margin, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${displayInstitution} \u2022 ${semester}`, margin, 20);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, margin, 25);

    let y = 38;

    const totalTeachers = new Set(coverage.map(c => c.fullName)).size;
    const totalOAs = coverage.reduce((sum, c) => sum + c.plannedOAs.length, 0);
    const totalClasses = coverage.reduce((sum, c) => sum + c.totalClasses, 0);
    const cardW = (pageWidth - margin * 2 - 6) / 3;
    drawKPICard(doc, margin, y, cardW, 'Profesores', `${totalTeachers}`, 'con planificaciones', COLORS.primary);
    drawKPICard(doc, margin + cardW + 3, y, cardW, 'OA Cubiertos', `${totalOAs}`, 'total acumulado', COLORS.success);
    drawKPICard(doc, margin + (cardW + 3) * 2, y, cardW, 'Clases', `${totalClasses}`, 'planificadas', COLORS.primaryLight);
    y += 38;

    const tableData = coverage.map(c => [
        c.fullName,
        c.subject,
        c.grade,
        `${c.plannedOAs.length}`,
        c.plannedOAs.join(', ') || 'Sin OA',
        `${c.totalClasses}`,
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Profesor', 'Asignatura', 'Curso', 'OA', 'Detalle OA', 'Clases']],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 2.5, lineColor: COLORS.border, lineWidth: 0.2, overflow: 'linebreak' },
        headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 7 },
        columnStyles: {
            0: { cellWidth: 32 },
            1: { cellWidth: 25 },
            2: { cellWidth: 20 },
            3: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 14, halign: 'center' },
        },
        didParseCell: (cellData: unknown) => {
            const d = cellData as { column: { index: number }; section: string; cell: { styles: { textColor: number[] }; text: string[] } };
            if (d.column.index === 3 && d.section === 'body') {
                const val = parseInt(d.cell.text[0]);
                if (val >= 5) d.cell.styles.textColor = [...COLORS.success];
                else if (val >= 3) d.cell.styles.textColor = [...COLORS.warning];
                else d.cell.styles.textColor = [...COLORS.danger];
            }
        },
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.muted);
        doc.text(`EducMark \u2022 Cobertura Curricular \u2022 Pagina ${i}/${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    doc.save(`Cobertura_Curricular_${semester.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
