/**
 * TEMPORARY TEST ENDPOINT - NO AUTH
 * Para validar pipeline completa (planificación + eval + NEE + slides + quiz + imágenes).
 * ELIMINAR ANTES DE PROD (o agregar guard por env).
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { queryRag } from '@/lib/slides/ragQuery';
import { renderSlide } from '@/lib/slides/slideRenderer';
import { wrapSlidesHtml, type SlideBlock } from '@/lib/slides/htmlWrapper';
import { renderPlanificacionHtml } from '@/lib/slides/planificacionRenderer';
import { fetchAllOAsFromRag, type OAFull } from '@/lib/slides/oaExtractor';

const PLANIFICACION_PROMPT = `# ROL: ARQUITECTO PEDAGÓGICO EDUCMARK
Identifica OA REALES del currículum MINEDUC chileno, construye objetivo TRIDIMENSIONAL y secuencia cerebro-compatible.

JSON:
{
  "oas": [
    { "numero": "OA 3", "texto": "Texto COMPLETO y LITERAL del OA 3 (40+ palabras del MINEDUC, sin resumir)" },
    { "numero": "OA 4", "texto": "Texto COMPLETO del OA 4 (distinto al anterior)" }
  ],
  "conceptos_clave": "Conceptos separados por coma",
  "habilidades": "Verbos infinitivo: 'Explicar, Relacionar, Argumentar'",
  "nivel_taxonomico": "Bloom numerado: 'Analizar - Nivel 4'",
  "actitud": "Actitud/OAT concreta: 'Pensamiento crítico', 'Valorar la diversidad'",
  "objetivo_clase": "Objetivo TRIDIMENSIONAL obligatorio con 3 partes:\\n  1. HABILIDAD (verbo infinitivo): Caracterizar/Analizar/Explicar\\n  2. CONTENIDO (qué): tema específico con detalles\\n  3. ACTITUD: 'valorando/apreciando/demostrando [actitud]'\\n  VÁLIDO: 'Caracterizar el Estado moderno del siglo XVI, analizando sus rasgos, valorando el pensamiento crítico histórico.'\\n  INVÁLIDO (sin actitud): 'Caracterizar el Estado moderno.'\\n  UNA oración, 30-50 palabras.",
  "indicadores": ["al menos 3 indicadores REALES del currículum"],
  "fase_inicio": "Disonancia cognitiva + pregunta provocadora (3-4 oraciones)",
  "fase_desarrollo": "Micro-ciclos 15+5+15, pausa activa, colaborativo (5-6 oraciones)",
  "fase_cierre": "Metacognición + ticket de salida (3-4 oraciones)"
}

VALIDACIÓN objetivo_clase: debe tener verbo inicial + contenido específico + 'valorando/apreciando/demostrando' con actitud. Si falta una parte, reescribe.`;

const EVALUACION_PROMPT = `# TAREA: Rúbrica Analítica formativa
2-3 criterios basados en los indicadores proporcionados. Descriptores con verbos específicos.
4 niveles: DESTACADO (4), LOGRADO (3), EN DESARROLLO (2), INICIAL (1).

JSON:
{
  "evaluacion": {
    "tipo_evaluacion": "Formativa",
    "instrumento": "Rúbrica Analítica",
    "rubrica": [
      { "criterio": "...", "destacado": "...", "logrado": "...", "en_desarrollo": "...", "inicial": "..." }
    ]
  }
}`;

const NEE_DUA_PROMPT = `# ROL: Arquitecto NEE/DUA
Experto DUA según Decreto 83/2015. Si NEE=Ninguna, genera estrategias UNIVERSALES.

JSON:
{
  "nee_enriched": {
    "diagnostico": "Diagnóstico o 'Grupo Curso (DUA Universal)'",
    "perfil_neurocognitivo": "Descripción breve",
    "principio_dua_prioritario": "Representación / Acción y Expresión / Implicación",
    "barrera_identificada": "Barrera específica en ESTA clase",
    "adaptaciones": {
      "acceso": { "descripcion": "Vinculada a actividad real" },
      "metodologia": { "descripcion": "Vinculada a actividad real" },
      "evaluacion": { "descripcion": "Adaptación evaluativa concreta" }
    },
    "co_docencia": {
      "profesor_aula": "Qué hace durante la actividad",
      "educador_diferencial": "Qué hace el educador diferencial"
    },
    "estrategia_dua_universal": "Estrategia que beneficia a TODO el grupo"
  }
}`;

const IMAGE_SYSTEM_PROMPT = `EXPERTO EN PROMPTS FLUX. Fotorrealistas, sin texto ni personas, coherencia geográfica.
FORMAT: "Professional educational photography: [desc]. Documentary, National Geographic, no text, no people, [lighting]."
JSON: { "prompts": [{ "image_prompt": "...", "negative_prompt": "..." }] }`;

const CONTENT_SYSTEM_PROMPT = `Generador de contenido MINEDUC. 10-12 slides + 6 quiz.
JSON: { "metadata": {...}, "slides": [...], "quiz": [...] }
Slides: title, content.main_text, content.chilean_example, content.key_vocabulary, content.activation_questions.
Quiz: question_text, options [{key,text}], correct_answer, explanation.`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  if (!process.env.OPENAI_API_KEY || !process.env.KIE_API_KEY) {
    return NextResponse.json({ error: 'envs missing' }, { status: 500 });
  }

  const body = await req.json();
  const { asignatura, curso, oa, profesor = 'Alejandro Álvarez', objetivo_clase, nee = 'Ninguna', duracion_clase = '90 minutos' } = body;
  const objetivoFull = objetivo_clase || oa;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // RAG + OA Extractor
    let ragPrograma = '';
    let ragTexto = '';
    let oasLiterales: OAFull[] = [];
    try {
      const [p, t, oasFromRag] = await Promise.all([
        queryRag(objetivoFull, asignatura, curso, 'programa', 5),
        queryRag(objetivoFull, asignatura, curso, 'texto_estudiante', 5),
        fetchAllOAsFromRag(asignatura, curso, oa),
      ]);
      ragPrograma = p.map(c => c.contenido).join('\n\n');
      ragTexto = t.map(c => c.contenido).join('\n\n');
      oasLiterales = oasFromRag;
      console.log('[Test] OAs literales:', oasLiterales.length);
    } catch (err) { console.warn('[Test] RAG:', err); }

    // Plan
    const planRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PLANIFICACION_PROMPT },
        { role: 'user', content: `OA: ${oa}\nObjetivo: ${objetivoFull}\nAsig: ${asignatura}\nCurso: ${curso}\nDuración: ${duracion_clase}\nNEE: ${nee}\nRAG MINEDUC: ${ragPrograma || '(none)'}` },
      ],
    });
    const plan = JSON.parse(planRes.choices[0]?.message?.content || '{}');

    // Parallel: Content + Evaluación + NEE/DUA
    const [contentRes, evalRes, neeRes] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 6000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CONTENT_SYSTEM_PROMPT },
          { role: 'user', content: `Asig: ${asignatura} | Curso: ${curso}\nObjetivo: ${plan.objetivo_clase}\nInicio: ${plan.fase_inicio}\nDesarrollo: ${plan.fase_desarrollo}\nCierre: ${plan.fase_cierre}\nRAG: ${ragPrograma}\nTexto: ${(ragTexto || '').substring(0, 1500)}` },
        ],
      }),
      openai.chat.completions.create({
        model: 'gpt-4o-mini', temperature: 0.5, max_tokens: 2500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: EVALUACION_PROMPT },
          { role: 'user', content: `Objetivo: ${plan.objetivo_clase}\nDesarrollo: ${plan.fase_desarrollo}\nIndicadores: ${JSON.stringify(plan.indicadores || [])}\nNEE: ${nee}` },
        ],
      }),
      openai.chat.completions.create({
        model: 'gpt-4o-mini', temperature: 0.6, max_tokens: 2500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: NEE_DUA_PROMPT },
          { role: 'user', content: `OA: ${plan.objetivo_clase}\nNEE: ${nee}\nInicio: ${plan.fase_inicio}\nDesarrollo: ${plan.fase_desarrollo}\nCierre: ${plan.fase_cierre}` },
        ],
      }),
    ]);

    const content = JSON.parse(contentRes.choices[0]?.message?.content || '{}');
    const evaluacion = JSON.parse(evalRes.choices[0]?.message?.content || '{}').evaluacion || {};
    const neeData = JSON.parse(neeRes.choices[0]?.message?.content || '{}').nee_enriched || {};
    const slides = content.slides || [];
    const quiz = content.quiz || [];
    const topic = content.metadata?.topic || asignatura;

    // Image prompts
    const imgPromptRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini', temperature: 0.6, max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: IMAGE_SYSTEM_PROMPT },
        { role: 'user', content: `Tema: ${topic}\n${slides.map((s: { title: string; content: { main_text?: string } }, i: number) => `Slide ${i+1}: ${s.title} — ${s.content?.main_text?.substring(0,100) || ''}`).join('\n')}` },
      ],
    });
    const imgPrompts = (JSON.parse(imgPromptRes.choices[0]?.message?.content || '{}').prompts || []) as { image_prompt: string }[];

    // Nano Banana (temp URLs for test)
    const settled = await Promise.allSettled(imgPrompts.map(p => generateNanoBananaTempUrl(process.env.KIE_API_KEY!, p.image_prompt)));
    const imageUrls = settled.map(r => r.status === 'fulfilled' ? r.value : null);

    // Build deck
    const today = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const allSlides: SlideBlock[] = [];
    const cover = renderSlide({ slide_number: 1, type: 'cover', title: topic, content: today, grade: curso, teacher: profesor });
    allSlides.push({ innerHTML: cover.innerHTML, bgStyle: cover.bgStyle });
    const goal = renderSlide({ slide_number: 2, type: 'goal', title: 'Objetivo de la Clase', content: plan.objetivo_clase || objetivoFull, grade: curso, teacher: profesor });
    allSlides.push({ innerHTML: goal.innerHTML, bgStyle: goal.bgStyle });
    for (let i = 0; i < slides.length; i++) {
      const r = renderSlide({ slide_number: i + 3, type: 'content', title: slides[i].title, content: slides[i].content, grade: curso, teacher: profesor, imageUrl: imageUrls[i] || '' });
      allSlides.push({ innerHTML: r.innerHTML, bgStyle: r.bgStyle });
    }
    for (const q of quiz) {
      const r = renderSlide({
        slide_number: allSlides.length + 1, type: 'quiz', title: q.question_text,
        options: (q.options || []).map((o: { key?: string; option?: string; text?: string; content?: string }) => ({ key: o.key || o.option || '', text: o.text || o.content || '' })),
        correct_key: q.correct_answer, explanation: q.explanation || q.feedback || '',
      });
      allSlides.push({ innerHTML: r.innerHTML, bgStyle: r.bgStyle });
    }
    allSlides.push({
      innerHTML: `<div class="final-slide-content"><div class="final-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div><h1 style="font-size:5.5rem!important;margin-bottom:20px;">Nos vemos en la siguiente clase</h1><p style="font-size:2.2rem;color:#a5b4fc;font-style:italic;">"El conocimiento es poder"</p><div style="margin-top:50px;padding:15px 40px;background:rgba(255,255,255,0.1);border-radius:50px;font-size:1.4rem;font-weight:600;">${today}</div></div>`,
      bgStyle: 'background: radial-gradient(circle at center, #1e1e2f 0%, #0f111a 100%);', id: 'final-slide',
    });

    const presentacionHtml = wrapSlidesHtml(topic, allSlides);

    // Prioridad: OAs literales del RAG > LLM plan.oas > fallback legacy
    let oas: { numero: string; texto: string }[] = [];
    if (oasLiterales.length > 0) {
      oas = oasLiterales.map(o => ({ numero: o.numero, texto: o.texto }));
    } else if (Array.isArray(plan.oas) && plan.oas.length > 0) {
      oas = plan.oas.filter((o: { numero?: string; texto?: string }) => o.numero && o.texto) as { numero: string; texto: string }[];
    } else {
      const oaNumbers = (plan.oa_number || oa).split(/[/,]/).map((s: string) => s.trim()).filter(Boolean);
      const oaTexts = (plan.oa_text || objetivoFull).split('|||').map((s: string) => s.trim()).filter(Boolean);
      oas = oaNumbers.map((num: string, i: number) => ({ numero: num, texto: oaTexts[i] || oaTexts[0] || '' }));
    }

    const todosLosIndicadores = oasLiterales.length > 0
      ? oasLiterales.flatMap(o => o.indicadores)
      : (plan.indicadores || []);

    let indicadoresFinales: string[] = todosLosIndicadores;
    if (todosLosIndicadores.length > 3) {
      try {
        const selectRes = await openai.chat.completions.create({
          model: 'gpt-4o-mini', temperature: 0.3, max_tokens: 600,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: `Eres experto curricular chileno. Selecciona SOLO 2-3 indicadores que se trabajan en ESTA clase según su secuencia. JSON: { "indices": [0, 2] }` },
            { role: 'user', content: `OBJETIVO: ${plan.objetivo_clase || objetivoFull}\nInicio: ${plan.fase_inicio}\nDesarrollo: ${plan.fase_desarrollo}\nCierre: ${plan.fase_cierre}\n\nINDICADORES:\n${todosLosIndicadores.map((ind: string, i: number) => `[${i}] ${ind}`).join('\n')}` },
          ],
        });
        const parsed = JSON.parse(selectRes.choices[0]?.message?.content || '{}');
        const indices: number[] = Array.isArray(parsed.indices) ? parsed.indices : [];
        if (indices.length > 0) {
          indicadoresFinales = indices.filter(i => i >= 0 && i < todosLosIndicadores.length).slice(0, 3).map(i => todosLosIndicadores[i]);
        }
      } catch { /* ignore */ }
    }

    const planificacionHtml = renderPlanificacionHtml({
      asignatura, profesor, curso, duracion: duracion_clase, fecha: today,
      oas,
      habilidades: plan.habilidades,
      nivel_taxonomico: plan.nivel_taxonomico,
      actitud: plan.actitud,
      objetivo_clase: plan.objetivo_clase || objetivoFull,
      fase_inicio: plan.fase_inicio,
      fase_desarrollo: plan.fase_desarrollo,
      fase_cierre: plan.fase_cierre,
      indicadores: indicadoresFinales,
      rubrica: evaluacion.rubrica || [],
      nee_data: neeData,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const format = req.nextUrl.searchParams.get('format');
    if (format === 'planificacion') {
      return new NextResponse(planificacionHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new NextResponse(presentacionHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Generation-Time': `${elapsed}s`,
        'X-Slides-Count': String(allSlides.length),
        'X-Images-Generated': String(imageUrls.filter(Boolean).length),
      },
    });
  } catch (err) {
    console.error('[Test] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function generateNanoBananaTempUrl(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/nano-banana', input: { prompt: `${prompt} Photorealistic, cinematic, sharp focus, no text, no people, 16:9 landscape.` } }),
    });
    if (!createRes.ok) return null;
    const createData = await createRes.json() as { data?: { taskId: string } };
    const taskId = createData?.data?.taskId;
    if (!taskId) return null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json() as { data?: { state: string; resultJson?: string } };
      if (pollData?.data?.state === 'success' && pollData.data.resultJson) {
        return (JSON.parse(pollData.data.resultJson) as { resultUrls?: string[] }).resultUrls?.[0] ?? null;
      }
      if (pollData?.data?.state === 'fail') return null;
    }
    return null;
  } catch { return null; }
}
