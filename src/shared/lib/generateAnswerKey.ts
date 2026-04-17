/**
 * Generate Answer Key / Pauta de Correcci\u00f3n — EV-25, EV-17
 * Creates a downloadable HTML document with all correct answers and rubrics.
 * Incluye clasificaci\u00f3n Bloom para alinear con rubricas Carrera Docente.
 */
import { classifyBloomLevel, BLOOM_LABELS, percentBloomThreeOrHigher } from './bloomClassifier';

export interface AnswerKeyItem {
    questionNumber: number;
    questionType: string;
    question: string;
    correctAnswer: string;
    oa?: string;
    cognitiveSkill?: string;
    rubric?: string;
    points?: number;
}

export interface AnswerKeyParams {
    evaluationTitle: string;
    subject: string;
    grade: string;
    items: AnswerKeyItem[];
    fila?: 'A' | 'B';
    date?: string;
}

export function generateAnswerKeyHTML(params: AnswerKeyParams): string {
    const { evaluationTitle, subject, grade, items, fila, date } = params;
    const dateStr = date || new Date().toLocaleDateString('es-CL');

    const rows = items.map((item) => {
        const lvl = classifyBloomLevel(item.cognitiveSkill);
        const bloomCell = lvl
            ? `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-weight:700;font-size:12px;${lvl >= 4 ? 'background:#dcfce7;color:#15803d;' : lvl >= 3 ? 'background:#ddd6fe;color:#6d28d9;' : 'background:#fef3c7;color:#92400e;'}">${lvl} · ${BLOOM_LABELS[lvl]}</span>`
            : '<span style="color:#94a3b8;">—</span>';
        return `
        <tr>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold;">${item.questionNumber}</td>
            <td style="padding:8px;border:1px solid #ddd;">${item.questionType}</td>
            <td style="padding:8px;border:1px solid #ddd;max-width:300px;">${item.question.substring(0, 100)}${item.question.length > 100 ? '...' : ''}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold;color:#16a34a;font-size:16px;">${item.correctAnswer}</td>
            <td style="padding:8px;border:1px solid #ddd;">${item.oa || '-'}</td>
            <td style="padding:8px;border:1px solid #ddd;">${item.cognitiveSkill || '-'}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${bloomCell}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.points ?? 1}</td>
        </tr>
    `;
    }).join('');

    const bloomCoverage = percentBloomThreeOrHigher(
        items.map((i) => ({ cognitive_skill: i.cognitiveSkill }))
    );

    const rubricSection = items.filter(i => i.rubric).length > 0 ? `
        <h2 style="color:#4f46e5;margin-top:30px;">R\u00fabricas de Desarrollo</h2>
        ${items.filter(i => i.rubric).map(item => `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:12px;">
                <p style="font-weight:bold;margin:0 0 4px 0;">Pregunta ${item.questionNumber}: ${item.question.substring(0, 80)}</p>
                <p style="margin:0;color:#475569;font-size:14px;">${item.rubric}</p>
            </div>
        `).join('')}
    ` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Pauta de Correcci\u00f3n${fila ? ` - Fila ${fila}` : ''}</title>
<style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #4f46e5; color: white; padding: 10px; border: 1px solid #4f46e5; text-align: left; }
    @media print { body { padding: 0; } }
</style>
</head>
<body>
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #4f46e5;padding-bottom:12px;margin-bottom:20px;">
        <div>
            <h1 style="margin:0;color:#4f46e5;">Pauta de Correcci\u00f3n${fila ? ` - Fila ${fila}` : ''}</h1>
            <p style="margin:4px 0 0;color:#64748b;">${evaluationTitle}</p>
        </div>
        <div style="text-align:right;color:#64748b;font-size:14px;">
            <p style="margin:0;">${subject} &bull; ${grade}</p>
            <p style="margin:0;">${dateStr}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:50px;">#</th>
                <th>Tipo</th>
                <th>Pregunta</th>
                <th style="width:80px;">Clave</th>
                <th>OA</th>
                <th>Habilidad</th>
                <th style="width:120px;">Bloom</th>
                <th style="width:60px;">Pts</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>

    <div style="margin-top:20px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
        <p style="margin:0;font-weight:bold;color:#16a34a;">Puntaje Total: ${items.reduce((sum, i) => sum + (i.points ?? 1), 0)} puntos</p>
        <p style="margin:4px 0 0;color:#64748b;font-size:14px;">${items.length} preguntas &bull; ${bloomCoverage}% en Bloom 3+ (Aplicar o superior)${bloomCoverage < 60 ? ' &mdash; bajo para el est&aacute;ndar de Carrera Docente' : ''}</p>
    </div>

    ${rubricSection}

    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:40px;">
        Generado por EducMark &bull; ${dateStr} &bull; Documento confidencial para uso del docente
    </p>
</body>
</html>`;
}

export function downloadAnswerKey(params: AnswerKeyParams): void {
    const html = generateAnswerKeyHTML(params);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filaLabel = params.fila ? `_Fila${params.fila}` : '';
    link.href = url;
    link.download = `Pauta_Correccion_${params.subject.replace(/[^a-zA-Z0-9]/g, '_')}${filaLabel}.html`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 3000);
}
