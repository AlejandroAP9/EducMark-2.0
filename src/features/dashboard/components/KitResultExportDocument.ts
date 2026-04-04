import { toast } from 'sonner';
import type { PlanningBlocks, ExitTicket, GeneratedClassWorkflowRow } from './KitResultTypes';

export interface ExportDocumentParams {
    type: 'ticket' | 'guide';
    row: GeneratedClassWorkflowRow;
    planningBlocks: PlanningBlocks;
    exitTicket: ExitTicket;
}

function buildContentHtml(params: ExportDocumentParams): string {
    const { type, planningBlocks, exitTicket } = params;

    if (type === 'ticket') {
        return `
            <div class="instructions">${exitTicket.instructions || 'Responde al finalizar la clase.'}</div>
            <div class="questions">
                ${exitTicket.questions.map((q, idx) => `
                    <div class="question-block">
                        <div class="question-title"><strong>${idx + 1}.</strong> ${q.question || '(Sin enunciado)'}</div>
                        ${q.type === 'multiple_choice' ? `
                            <div class="options-grid">
                                ${(q.options || []).map(opt => `<div class="option-item"><div class="circle"></div> <span>${opt || '(opción)'}</span></div>`).join('')}
                            </div>
                        ` : ''}
                        ${q.type === 'true_false' ? `
                            <div class="options-inline">
                                <div class="option-item"><div class="circle"></div> <span>Verdadero</span></div>
                                <div class="option-item"><div class="circle"></div> <span>Falso</span></div>
                            </div>
                        ` : ''}
                        ${q.type === 'open' ? `
                            <div class="open-lines">
                                <div class="line"></div>
                                <div class="line"></div>
                                <div class="line"></div>
                                <div class="line"></div>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    return `
        <div class="instructions">Lee atentamente las instrucciones y desarrolla las siguientes actividades.</div>
        <div class="guide-content">
            <div class="section-title">Actividad Central</div>
            <div class="content-text">${planningBlocks.desarrollo.replace(/\n/g, '<br/>')}</div>

            <div class="section-title" style="margin-top: 30px;">Recursos Adicionales</div>
            <ul class="resources-list">
                ${planningBlocks.resources.length > 0 ? planningBlocks.resources.map(r => `<li>${r}</li>`).join('') : '<li>Ningún recurso adicional listado.</li>'}
            </ul>

            <div class="open-lines" style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px;">
                <h4 style="margin-bottom: 20px; color: #555;">Espacio para desarrollo:</h4>
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
            </div>
        </div>
    `;
}

const PRINT_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    @page {
        size: letter;
        margin: 20mm;
    }

    body {
        font-family: 'Inter', sans-serif;
        color: #111827;
        line-height: 1.5;
        margin: 0;
        padding: 0;
        background: #fff;
    }

    .header {
        border-bottom: 2px solid #111827;
        padding-bottom: 16px;
        margin-bottom: 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .header-left h1 {
        margin: 0 0 4px 0;
        font-size: 24px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.02em;
    }

    .header-left .subtitle {
        color: #4b5563;
        font-size: 14px;
        font-weight: 500;
    }

    .institution-box {
        text-align: right;
        font-size: 12px;
        color: #6b7280;
    }

    .student-data {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 32px;
        background: #f9fafb;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }

    .data-field {
        display: flex;
        font-size: 14px;
    }

    .data-field strong {
        margin-right: 8px;
        font-weight: 600;
        color: #374151;
        width: 60px;
    }

    .data-field .line-fill {
        flex: 1;
        border-bottom: 1px solid #9ca3af;
    }

    .instructions {
        background: #eff6ff;
        border-left: 4px solid #3b82f6;
        padding: 12px 16px;
        font-size: 14px;
        color: #1e3a8a;
        margin-bottom: 32px;
        border-radius: 0 8px 8px 0;
    }

    .section-title {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 16px 0;
        color: #111827;
        text-transform: uppercase;
        letter-spacing: -0.01em;
    }

    .content-text {
        font-size: 15px;
        color: #374151;
    }

    .resources-list {
        padding-left: 20px;
        margin: 0;
        font-size: 14px;
        color: #4b5563;
    }

    .resources-list li {
        margin-bottom: 6px;
    }

    .question-block {
        margin-bottom: 32px;
        page-break-inside: avoid;
    }

    .question-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
    }

    .options-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-left: 24px;
    }

    .options-inline {
        display: flex;
        gap: 40px;
        margin-left: 24px;
    }

    .option-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-size: 15px;
        color: #374151;
    }

    .circle {
        width: 16px;
        height: 16px;
        min-width: 16px;
        border: 1px solid #6b7280;
        border-radius: 50%;
        margin-top: 3px;
    }

    .open-lines {
        margin-top: 20px;
    }

    .line {
        border-bottom: 1px solid #d1d5db;
        height: 28px;
        margin-bottom: 8px;
    }

    @media print {
        body { margin: 0; }
        .student-data { background: transparent; border-color: #111; }
        .instructions { background: transparent; border: 1px solid #111; border-left: 4px solid #111; color: #111; }
    }
`;

export function exportDocument(params: ExportDocumentParams): void {
    const { type, row, exitTicket } = params;
    const classLabel = row.topic || row.objetivo_clase || 'Clase sin título';
    const contentHtml = buildContentHtml(params);

    const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${type === 'ticket' ? exitTicket.title : 'Guía de Trabajo'}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${type === 'ticket' ? exitTicket.title : 'GUÍA DE ACTIVIDADES'}</h1>
      <div class="subtitle">${row.asignatura || 'Asignatura'} · ${row.curso || 'Curso'}</div>
    </div>
    <div class="institution-box">
      <strong>EducMark</strong><br/>
      Documento Generado<br/>
      ${new Date().toLocaleDateString('es-CL')}
    </div>
  </div>

  <div class="student-data">
    <div class="data-field">
      <strong>Nombre:</strong>
      <div class="line-fill"></div>
    </div>
    <div class="data-field">
      <strong>Fecha:</strong>
      <div class="line-fill"></div>
    </div>
    <div class="data-field" style="grid-column: span 2;">
      <strong>Clase:</strong>
      <div style="padding-left: 8px; font-weight: 500; color: #1f2937;">${classLabel}</div>
    </div>
  </div>

  ${contentHtml}

  ${type === 'ticket' && row.id ? `
  <div style="margin-top: 24px; text-align: right; opacity: 0.6;">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`educmark://class/${row.id}`)}" alt="QR" width="80" height="80" style="display: inline-block;" />
    <div style="font-size: 8px; color: #9ca3af; margin-top: 4px;">ID: ${row.id.slice(0, 8)}</div>
  </div>
  ` : ''}
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!printWindow) {
        toast.error('No se pudo abrir la ventana de impresión.');
        return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 500);
}
