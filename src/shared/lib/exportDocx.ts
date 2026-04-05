/**
 * Export to Word (.docx) — PL-29
 * Converts planning blocks into a downloadable Word document.
 */
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle,
    ImageRun,
    Header,
} from 'docx';
import type { InstitutionBranding } from '@/shared/lib/institutionBranding';

interface PlanningBlocks {
    objective?: string;
    indicators?: string[];
    inicio?: string;
    desarrollo?: string;
    cierre?: string;
    resources?: string[];
    planningText?: string;
}

interface ExportDocxParams {
    subject: string;
    grade: string;
    topic: string;
    planningBlocks: PlanningBlocks;
    exitTicket?: {
        questions?: Array<{
            question: string;
            type?: string;
            options?: string[];
        }>;
    };
}

/**
 * Fetch a URL/data-URL and return an ArrayBuffer for docx ImageRun.
 */
async function fetchImageBuffer(src: string): Promise<ArrayBuffer | null> {
    try {
        const res = await fetch(src);
        if (!res.ok) return null;
        return await res.arrayBuffer();
    } catch {
        return null;
    }
}

export async function exportPlanningToDocx(params: ExportDocxParams, branding?: InstitutionBranding): Promise<void> {
    const { subject, grade, topic, planningBlocks, exitTicket } = params;

    const children: Paragraph[] = [];

    // ── Institution branding header (optional) ──
    const headerChildren: Paragraph[] = [];
    if (branding?.logo) {
        const imgBuf = await fetchImageBuffer(branding.logo);
        if (imgBuf) {
            headerChildren.push(
                new Paragraph({
                    children: [
                        new ImageRun({ data: imgBuf, transformation: { width: 80, height: 80 }, type: 'png' }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 80 },
                })
            );
        }
    }
    if (branding?.institutionName) {
        headerChildren.push(
            new Paragraph({
                children: [new TextRun({ text: branding.institutionName, bold: true, size: 24, font: 'Calibri' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
            })
        );
    }

    // Title
    children.push(
        new Paragraph({
            children: [new TextRun({ text: 'Planificaci\u00f3n de Clase', bold: true, size: 32, font: 'Calibri' })],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        })
    );

    // Metadata table
    const metaRows = [
        ['Asignatura', subject],
        ['Curso', grade],
        ['Tema', topic],
    ];

    const metaTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: metaRows.map(([label, value]) =>
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 22, font: 'Calibri' })] })],
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1 },
                            bottom: { style: BorderStyle.SINGLE, size: 1 },
                            left: { style: BorderStyle.SINGLE, size: 1 },
                            right: { style: BorderStyle.SINGLE, size: 1 },
                        },
                    }),
                    new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: value || '', size: 22, font: 'Calibri' })] })],
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1 },
                            bottom: { style: BorderStyle.SINGLE, size: 1 },
                            left: { style: BorderStyle.SINGLE, size: 1 },
                            right: { style: BorderStyle.SINGLE, size: 1 },
                        },
                    }),
                ],
            })
        ),
    });

    children.push(new Paragraph({ spacing: { after: 200 } }));

    // Objective
    if (planningBlocks.objective) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: 'Objetivo de la Clase', bold: true, size: 26, font: 'Calibri' })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
            }),
            new Paragraph({
                children: [new TextRun({ text: planningBlocks.objective, size: 22, font: 'Calibri' })],
                spacing: { after: 200 },
            })
        );
    }

    // Indicators
    if (planningBlocks.indicators && planningBlocks.indicators.length > 0) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: 'Indicadores de Evaluaci\u00f3n', bold: true, size: 26, font: 'Calibri' })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
            })
        );
        planningBlocks.indicators.forEach(ind => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `\u2022 ${ind}`, size: 22, font: 'Calibri' })],
                spacing: { after: 60 },
            }));
        });
    }

    // Moments: Inicio, Desarrollo, Cierre
    const moments = [
        { title: 'Inicio', content: planningBlocks.inicio },
        { title: 'Desarrollo', content: planningBlocks.desarrollo },
        { title: 'Cierre', content: planningBlocks.cierre },
    ];

    moments.forEach(({ title, content }) => {
        if (!content) return;
        children.push(
            new Paragraph({
                children: [new TextRun({ text: title, bold: true, size: 26, font: 'Calibri' })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
            }),
            new Paragraph({
                children: [new TextRun({ text: content, size: 22, font: 'Calibri' })],
                spacing: { after: 200 },
            })
        );
    });

    // Resources
    if (planningBlocks.resources && planningBlocks.resources.length > 0) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: 'Recursos', bold: true, size: 26, font: 'Calibri' })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
            })
        );
        planningBlocks.resources.forEach(res => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `\u2022 ${res}`, size: 22, font: 'Calibri' })],
                spacing: { after: 60 },
            }));
        });
    }

    // Exit Ticket
    if (exitTicket?.questions && exitTicket.questions.length > 0) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: 'Ticket de Salida', bold: true, size: 26, font: 'Calibri' })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 100 },
            })
        );
        exitTicket.questions.forEach((q, i) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${i + 1}. ${q.question}`, size: 22, font: 'Calibri' })],
                spacing: { after: 40 },
            }));
            if (q.options) {
                q.options.forEach((opt, j) => {
                    const letter = String.fromCharCode(65 + j);
                    children.push(new Paragraph({
                        children: [new TextRun({ text: `   ${letter}) ${opt}`, size: 20, font: 'Calibri' })],
                        spacing: { after: 20 },
                    }));
                });
            }
            children.push(new Paragraph({ spacing: { after: 100 } }));
        });
    }

    // Footer
    children.push(
        new Paragraph({
            children: [new TextRun({ text: `Generado por EducMark \u2022 ${new Date().toLocaleDateString('es-CL')}`, size: 18, font: 'Calibri', italics: true, color: '888888' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
        })
    );

    const sectionOptions: Record<string, unknown> = {
        children: [metaTable, ...children],
    };

    // Add institution branding as document header if provided
    if (headerChildren.length > 0) {
        sectionOptions.headers = {
            default: new Header({ children: headerChildren }),
        };
    }

    const doc = new Document({
        sections: [sectionOptions as { children: Paragraph[]; headers?: { default: Header } }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanSubject = subject.replace(/[^a-zA-Z0-9\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1]/g, '_');
    link.href = url;
    link.download = `Planificacion_${cleanSubject}_${grade.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 3000);
}
