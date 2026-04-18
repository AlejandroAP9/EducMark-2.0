/**
 * POST /api/evaluations/generate
 *
 * Genera items de evaluación sumativa multi-tipo usando OpenAI.
 * Análogo a /api/slides/generate-rich pero para evaluaciones.
 *
 * Soporta: Selección Múltiple, Verdadero o Falso, Doble Proceso, Ordenamiento,
 * Términos Pareados, Completación, Desarrollo, Respuesta Breve.
 *
 * Contract:
 *   Request:  { userId, evaluationId, testTitle, grade, subject, unit, blueprint[] }
 *   Response: { items[], evaluationId, slotsUsed: { tf, mc, manual } }
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { classifyBloomLevel } from '@/shared/lib/bloomClassifier';

const OPENAI_MODEL = 'gpt-4o-mini';

type ItemType =
    | 'Selección Múltiple'
    | 'Verdadero o Falso'
    | 'Doble Proceso'
    | 'Ordenamiento'
    | 'Términos Pareados'
    | 'Completación'
    | 'Desarrollo'
    | 'Respuesta Breve';

interface BlueprintRow {
    id: string;
    oa: string;
    oa_description?: string;
    topic: string;
    skill: string;
    itemType: ItemType;
    count: number;
    elementsPerItem?: number;
}

interface GeneratedItem {
    id?: string | number;
    type: 'mc' | 'tf';
    pedagogical_type: string;
    oa: string;
    topic: string;
    skill: string;
    difficulty: string;
    question: string;
    options: string[] | null;
    correctAnswer: string | null;
    explanation: string | null;
    group_id?: string;
    is_manual?: boolean;
    rubric?: string | null;
}

interface RawLLMItem {
    question?: string;
    options?: string[];
    correctAnswer?: string;
    correct_answer?: string;
    explanation?: string;
    rubric?: string;
    elements?: { label: string; text: string }[];
    correctOrder?: string[];
    columnA?: { label: string; text: string }[];
    columnB?: { label: string; text: string }[];
    pairings?: Record<string, string>;
    premise?: string;
    statementAffirmation?: string;
    statementTruthValue?: 'V' | 'F';
    justificationOptions?: string[];
    justificationCorrect?: string;
}

/**
 * Mapea el tipo pedagógico a su consumo de slots OMR.
 * Misma lógica que StepBlueprint.calculateOMRSlots().
 */
function calculateSlots(itemType: ItemType, count: number, elementsPerItem: number): { tf: number; mc: number; manual: number } {
    switch (itemType) {
        case 'Verdadero o Falso': return { tf: count, mc: 0, manual: 0 };
        case 'Selección Múltiple': return { tf: 0, mc: count, manual: 0 };
        case 'Doble Proceso': return { tf: count, mc: count, manual: 0 };
        case 'Ordenamiento':
        case 'Términos Pareados':
            return { tf: 0, mc: count * elementsPerItem, manual: 0 };
        case 'Completación':
            return { tf: 0, mc: count * Math.max(1, elementsPerItem), manual: 0 };
        case 'Desarrollo':
        case 'Respuesta Breve':
            return { tf: 0, mc: 0, manual: count };
        default:
            return { tf: 0, mc: 0, manual: 0 };
    }
}

/**
 * Prompt sistema: describe cada tipo con el schema de output esperado.
 * La IA devuelve un array items[] heterogéneo con estructura por tipo.
 */
function buildSystemPrompt(): string {
    return `Eres un experto en diseño de evaluaciones sumativas para el currículum chileno MINEDUC. Generas ítems de distintos tipos pedagógicos con estructura JSON estricta.

REGLAS GLOBALES:
- Español neutro chileno, NUNCA voseo argentino (nada de "tenés", "vé", "querés").
- Cognitive skill mínimo: Aplicar (Bloom 3+). Favoreces Analizar/Evaluar/Crear.
- Contexto concreto chileno cuando aplique.
- Todo texto legible y denso; sin muletillas.

SCHEMA POR TIPO (cada ítem debe respetar su estructura):

1. "Selección Múltiple":
{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "..." }

2. "Verdadero o Falso":
{ "question": "Afirmación que se evalúa como V o F", "correctAnswer": "V" | "F", "explanation": "..." }

3. "Doble Proceso" (misma lógica que SM + afirmación V/F previa — se expande a 2 filas OMR):
{ "statementAffirmation": "...", "statementTruthValue": "V"|"F", "justificationOptions": ["A","B","C","D"], "justificationCorrect": "A", "explanation": "..." }

4. "Ordenamiento" (se expande a N items MC secuenciales, cada uno con options de posiciones):
{ "premise": "Ordena cronológicamente los siguientes eventos", "elements": [{"label":"A","text":"..."},{"label":"B","text":"..."}], "correctOrder": ["C","A","E","B","D"], "explanation": "..." }

5. "Términos Pareados" (se expande a M items MC, uno por cada item de columna A):
{ "premise": "Relaciona columna A con columna B", "columnA": [{"label":"1","text":"..."}], "columnB": [{"label":"A","text":"..."}], "pairings": {"1":"A","2":"C"}, "explanation": "..." }

6. "Completación":
{ "question": "En el año ____ ocurrió ____", "options": ["1810","1818","1850","1910"], "correctAnswer": "A", "explanation": "..." }

7. "Desarrollo":
{ "question": "Enunciado abierto que pide argumentación/análisis", "rubric": "Rúbrica sugerida: ...", "explanation": "..." }

8. "Respuesta Breve":
{ "question": "Pregunta específica que espera respuesta en 1-3 oraciones", "rubric": "Rúbrica: ...", "explanation": "..." }

FORMATO GLOBAL DE RESPUESTA:
{
  "items": [
    {
      "itemType": "Selección Múltiple",
      "blueprint_id": "row-xyz",
      "oa": "...",
      "topic": "...",
      "skill": "Analizar",
      "data": { ... según schema del tipo ... }
    }
  ]
}

No agregues items extra. Genera EXACTAMENTE la cantidad pedida por cada row del blueprint.`;
}

function buildUserPrompt(
    subject: string,
    grade: string,
    unit: string,
    blueprint: BlueprintRow[]
): string {
    const rowsDesc = blueprint.map((row, i) => {
        const els = row.elementsPerItem ?? (row.itemType === 'Ordenamiento' ? 5 : row.itemType === 'Términos Pareados' ? 4 : 1);
        return `Row ${i + 1}:
  blueprint_id: ${row.id}
  itemType: ${row.itemType}
  count: ${row.count}${['Ordenamiento', 'Términos Pareados', 'Completación'].includes(row.itemType) ? `\n  elementsPerItem: ${els}` : ''}
  oa: ${row.oa} — ${row.oa_description || '(sin descripción)'}
  topic: ${row.topic || '(libre)'}
  skill: ${row.skill}`;
    }).join('\n\n');

    return `Asignatura: ${subject}
Curso: ${grade}
Unidad: ${unit}

Genera todos los ítems del blueprint:

${rowsDesc}

Retorna el JSON con items[] según el schema. Un item por cada count del blueprint row.`;
}

/**
 * Expande el output del LLM a filas individuales de evaluation_items.
 * Cada tipo pedagógico explota a N filas OMR según corresponda.
 */
function expandItems(
    rawItems: { itemType: ItemType; blueprint_id: string; oa: string; topic: string; skill: string; data: RawLLMItem }[]
): GeneratedItem[] {
    const result: GeneratedItem[] = [];

    for (const raw of rawItems) {
        const base = {
            oa: raw.oa,
            topic: raw.topic,
            skill: raw.skill,
            difficulty: 'medium',
        };

        switch (raw.itemType) {
            case 'Selección Múltiple': {
                result.push({
                    ...base,
                    type: 'mc',
                    pedagogical_type: 'mc',
                    question: raw.data.question || '',
                    options: raw.data.options || null,
                    correctAnswer: raw.data.correctAnswer || raw.data.correct_answer || null,
                    explanation: raw.data.explanation || null,
                });
                break;
            }

            case 'Verdadero o Falso': {
                result.push({
                    ...base,
                    type: 'tf',
                    pedagogical_type: 'tf',
                    question: raw.data.question || '',
                    options: ['V', 'F'],
                    correctAnswer: raw.data.correctAnswer || raw.data.correct_answer || null,
                    explanation: raw.data.explanation || null,
                });
                break;
            }

            case 'Doble Proceso': {
                // Se expande a 2 filas compartiendo group_id
                const groupId = crypto.randomUUID();
                result.push({
                    ...base,
                    type: 'tf',
                    pedagogical_type: 'doble_proceso',
                    question: raw.data.statementAffirmation || '',
                    options: ['V', 'F'],
                    correctAnswer: raw.data.statementTruthValue || null,
                    explanation: raw.data.explanation || null,
                    group_id: groupId,
                });
                result.push({
                    ...base,
                    type: 'mc',
                    pedagogical_type: 'doble_proceso',
                    question: `Justifica: ${raw.data.statementAffirmation || ''}`,
                    options: raw.data.justificationOptions || null,
                    correctAnswer: raw.data.justificationCorrect || null,
                    explanation: raw.data.explanation || null,
                    group_id: groupId,
                });
                break;
            }

            case 'Ordenamiento': {
                const elements = raw.data.elements || [];
                const correctOrder = raw.data.correctOrder || [];
                const groupId = crypto.randomUUID();
                const posOptions = elements.map((_, i) => `${i + 1}°`);

                // Para cada elemento, 1 item MC donde la respuesta correcta es su posición
                elements.forEach((el) => {
                    const positionIdx = correctOrder.indexOf(el.label);
                    const correctLetter = positionIdx >= 0 ? String.fromCharCode(65 + positionIdx) : null;
                    result.push({
                        ...base,
                        type: 'mc',
                        pedagogical_type: 'ordenamiento',
                        question: `${raw.data.premise || ''} — Elemento ${el.label}: "${el.text}"`,
                        options: posOptions,
                        correctAnswer: correctLetter,
                        explanation: raw.data.explanation || null,
                        group_id: groupId,
                    });
                });
                break;
            }

            case 'Términos Pareados': {
                const colA = raw.data.columnA || [];
                const colB = raw.data.columnB || [];
                const pairings = raw.data.pairings || {};
                const groupId = crypto.randomUUID();
                const optionsFromB = colB.map((b) => `${b.label}. ${b.text}`);

                colA.forEach((a) => {
                    const correctBLabel = pairings[a.label];
                    const correctIdx = colB.findIndex((b) => b.label === correctBLabel);
                    const correctLetter = correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : null;
                    result.push({
                        ...base,
                        type: 'mc',
                        pedagogical_type: 'pareados',
                        question: `${raw.data.premise || ''} — Ítem ${a.label}: "${a.text}"`,
                        options: optionsFromB,
                        correctAnswer: correctLetter,
                        explanation: raw.data.explanation || null,
                        group_id: groupId,
                    });
                });
                break;
            }

            case 'Completación': {
                result.push({
                    ...base,
                    type: 'mc',
                    pedagogical_type: 'completacion',
                    question: raw.data.question || '',
                    options: raw.data.options || null,
                    correctAnswer: raw.data.correctAnswer || raw.data.correct_answer || null,
                    explanation: raw.data.explanation || null,
                });
                break;
            }

            case 'Desarrollo':
            case 'Respuesta Breve': {
                result.push({
                    ...base,
                    type: 'mc', // type en BD genérico; is_manual indica que NO va por OMR
                    pedagogical_type: raw.itemType === 'Desarrollo' ? 'desarrollo' : 'respuesta_breve',
                    question: raw.data.question || '',
                    options: null,
                    correctAnswer: null,
                    explanation: raw.data.explanation || null,
                    rubric: raw.data.rubric || null,
                    is_manual: true,
                });
                break;
            }
        }
    }

    return result;
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 });
    }

    let body: {
        userId?: string;
        evaluationId?: string;
        testTitle?: string;
        grade?: string;
        subject?: string;
        unit?: string;
        blueprint?: BlueprintRow[];
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const { userId, evaluationId, testTitle, grade, subject, unit, blueprint } = body;

    if (!userId || !evaluationId || !blueprint || blueprint.length === 0) {
        return NextResponse.json(
            { error: 'Faltan campos requeridos: userId, evaluationId, blueprint' },
            { status: 400 }
        );
    }

    // --- Validar que no exceda los 60 slots OMR ---
    const totals = { tf: 0, mc: 0, manual: 0 };
    for (const row of blueprint) {
        const els = row.elementsPerItem ?? (row.itemType === 'Ordenamiento' ? 5 : row.itemType === 'Términos Pareados' ? 4 : 1);
        const slots = calculateSlots(row.itemType, row.count, els);
        totals.tf += slots.tf;
        totals.mc += slots.mc;
        totals.manual += slots.manual;
    }

    if (totals.tf > 15 || totals.mc > 45) {
        return NextResponse.json(
            {
                error: `Blueprint excede slots OMR: V/F ${totals.tf}/15, MC ${totals.mc}/45. Divide en dos hojas.`,
                slotsUsed: totals,
            },
            { status: 400 }
        );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    try {
        console.log('[Eval] Generating —', blueprint.length, 'rows, totals:', JSON.stringify(totals));

        // Estimación: cada ítem ~250 tokens. Blueprints grandes necesitan más budget.
        // gpt-4o-mini: hasta 16.384 tokens output. gpt-4o: 16.384. Si estimamos >12.000, usamos gpt-4o por calidad.
        const totalItems = blueprint.reduce((sum, r) => sum + r.count, 0);
        const estimatedTokens = totalItems * 280;
        const useBiggerModel = estimatedTokens > 10000;
        const model = useBiggerModel ? 'gpt-4o' : OPENAI_MODEL;
        const maxTokens = Math.min(16000, Math.max(estimatedTokens + 2000, 8000));

        console.log('[Eval] Model:', model, 'max_tokens:', maxTokens, 'items:', totalItems);

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: buildSystemPrompt() },
                { role: 'user', content: buildUserPrompt(subject || '', grade || '', unit || '', blueprint) },
            ],
            temperature: 0.7,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        const finishReason = completion.choices[0]?.finish_reason;
        if (!content) {
            console.error('[Eval] Empty response from OpenAI');
            return NextResponse.json({ error: 'Sin respuesta de la IA' }, { status: 500 });
        }
        if (finishReason === 'length') {
            console.error('[Eval] Truncated by max_tokens. Blueprint too big:', totalItems, 'items');
            return NextResponse.json(
                {
                    error: `La evaluación es muy grande (${totalItems} ítems). Por favor reduce la cantidad o divide en dos evaluaciones.`,
                    itemsRequested: totalItems,
                    finishReason,
                },
                { status: 413 }
            );
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (parseErr) {
            console.error('[Eval] JSON parse failed. Content length:', content.length, 'First 200:', content.substring(0, 200));
            return NextResponse.json(
                {
                    error: 'La IA devolvió un JSON inválido. Intenta con menos ítems o vuelve a intentar.',
                    details: parseErr instanceof Error ? parseErr.message : 'unknown',
                },
                { status: 500 }
            );
        }
        const rawItems = Array.isArray(parsed.items) ? parsed.items : [];

        if (rawItems.length === 0) {
            return NextResponse.json({ error: 'La IA no devolvió items' }, { status: 500 });
        }

        const expanded = expandItems(rawItems);

        // --- Validación Bloom post-LLM (mismo patrón que generate-rich) ---
        const bloomCounts: Record<string, number> = { '3+': 0, bajo: 0, sin_clasificar: 0 };
        for (const item of expanded) {
            if (item.is_manual) continue; // Desarrollo/Respuesta Breve no se validan Bloom
            const lvl = classifyBloomLevel(item.skill);
            if (lvl !== null && lvl >= 3) bloomCounts['3+']++;
            else if (lvl !== null) bloomCounts.bajo++;
            else bloomCounts.sin_clasificar++;
        }
        const omrTotal = bloomCounts['3+'] + bloomCounts.bajo + bloomCounts.sin_clasificar;
        const ratio = omrTotal > 0 ? bloomCounts['3+'] / omrTotal : 0;
        console.log('[Eval] Bloom check:', JSON.stringify(bloomCounts), 'ratio_3+:', ratio.toFixed(2));
        if (omrTotal > 0 && ratio < 0.6) {
            console.warn('[Eval] Evaluación bajo estándar Carrera Docente:', Math.round(ratio * 100), '% preguntas Bloom 3+');
        }

        // --- Opcional: persistir items directamente (lo hace el frontend actualmente en handleFinalizeAction) ---
        // Por ahora solo devolvemos items y dejamos que el frontend decida qué guardar.

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('[Eval] Done', elapsed, 's,', expanded.length, 'items expandidos');

        return NextResponse.json({
            success: true,
            evaluationId,
            testTitle,
            items: expanded.map((item, i) => ({
                id: Date.now() + i,
                type: item.type,
                pedagogical_type: item.pedagogical_type,
                oa: item.oa,
                topic: item.topic,
                skill: item.skill,
                difficulty: item.difficulty,
                question: item.question,
                options: item.options,
                correctAnswer: item.correctAnswer,
                explanation: item.explanation,
                group_id: item.group_id,
                is_manual: item.is_manual,
                rubric: item.rubric,
            })),
            slotsUsed: totals,
            bloomRatio: ratio,
        });
    } catch (error) {
        console.error('[Eval] Error:', error);
        return NextResponse.json(
            { error: 'Error generando evaluación con IA' },
            { status: 500 }
        );
    }
}

// Helper expuesto — permite reusar la lógica de slots en otros módulos sin duplicar
export { calculateSlots };
