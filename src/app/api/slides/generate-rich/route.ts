import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { queryRag } from '@/lib/slides/ragQuery';
import { renderSlide } from '@/lib/slides/slideRenderer';
import { wrapSlidesHtml, type SlideBlock } from '@/lib/slides/htmlWrapper';
import { renderPlanificacionHtml } from '@/lib/slides/planificacionRenderer';
import { fetchAllOAsFromRag, type OAFull } from '@/lib/slides/oaExtractor';
import { uploadToDrive } from '@/lib/slides/driveStorage';

const EVALUACION_PROMPT = `# TAREA: EVALUACIÓN FORMATIVA

Crea una Rúbrica Analítica con 2-3 criterios basados en los indicadores proporcionados.
Usa VERBOS ESPECÍFICOS en descriptores (no "lo hace bien" sino "identifica correctamente 3+").
4 niveles: DESTACADO (4), LOGRADO (3), EN DESARROLLO (2), INICIAL (1).
NO inventes indicadores — usa los proporcionados.
Si NEE no es "Ninguna", incluye un criterio adicional con adaptación DUA.

JSON ESTRICTO:
{
  "evaluacion": {
    "tipo_evaluacion": "Formativa",
    "instrumento": "Rúbrica Analítica",
    "rubrica": [
      { "criterio": "Nombre del criterio 1", "destacado": "...", "logrado": "...", "en_desarrollo": "...", "inicial": "..." },
      { "criterio": "Nombre del criterio 2", "destacado": "...", "logrado": "...", "en_desarrollo": "...", "inicial": "..." },
      { "criterio": "Nombre del criterio 3", "destacado": "...", "logrado": "...", "en_desarrollo": "...", "inicial": "..." }
    ]
  }
}

RESTRICCIONES: NO uses viñetas ni negritas dentro de celdas. Texto plano.`;

const NEE_DUA_PROMPT = `# ROL: ARQUITECTO NEE/DUA — Especialista en Inclusión Educativa Chilena
Experto en Diseño Universal para el Aprendizaje (DUA) y adecuaciones curriculares según Decreto 83/2015 y PIE Chile. Base teórica: neuroeducación de Amanda Céspedes y biología del conocimiento de Humberto Maturana.

FRAMEWORK:
- Céspedes → DUA: Cada cerebro tiene un perfil neurocognitivo único. Si presentas info por un solo canal, pierdes a los que procesan por otros.
- Maturana → Inclusión: "Amar es aceptar al otro como legítimo otro". NEE no es problema, es camino diferente.

INSTRUCCIONES:
1. Si NEE = "Ninguna": genera estrategias DUA UNIVERSALES para todo el grupo
2. Si NEE es específica: adaptaciones al perfil con vínculo EXPLÍCITO a actividades de la secuencia real
3. Lenguaje colega mentor, no clínico

JSON:
{
  "nee_enriched": {
    "diagnostico": "Diagnóstico o 'Grupo Curso (DUA Universal)'",
    "perfil_neurocognitivo": "Descripción 2-3 líneas según Céspedes",
    "principio_dua_prioritario": "Representación / Acción y Expresión / Implicación",
    "barrera_identificada": "Barrera específica en ESTA clase",
    "adaptaciones": {
      "acceso": { "descripcion": "Vinculada a actividad real de la secuencia" },
      "metodologia": { "descripcion": "Vinculada a actividad real" },
      "evaluacion": { "descripcion": "Adaptación evaluativa concreta" }
    },
    "co_docencia": {
      "profesor_aula": "Qué hace durante la actividad adaptada",
      "educador_diferencial": "Qué hace el educador diferencial"
    },
    "estrategia_dua_universal": "Estrategia que beneficia a TODO el grupo"
  }
}

Máximo 3 líneas por campo. No inventes datos clínicos.`;

const PLANIFICACION_PROMPT = `# ROL: ARQUITECTO PEDAGÓGICO EDUCMARK

# TAREAS (3 bloques en un solo JSON)

## BLOQUE 1: ANÁLISIS CURRICULAR
- IDENTIFICA los indicadores de evaluación oficiales del currículum MINEDUC para el OA dado
- Filtra solo los indicadores trabajables en la duración indicada
- Identifica habilidades con nivel Bloom NUMERADO (1=Recordar...6=Crear)
- Identifica actitud/OAT transversal

## BLOQUE 2: OBJETIVO TRIDIMENSIONAL
Transforma el objetivo en uno TRIDIMENSIONAL:
- Habilidad (procedimental): verbo en infinitivo
- Conocimiento (conceptual): contenido temático específico
- Actitud (actitudinal): valor o actitud esperada
Estructura: Iniciar con verbo en infinitivo, seguido del contenido temático, cerrando con la actitud.
Di "los estudiantes" SIN mencionar el curso.

## BLOQUE 3: SECUENCIA DIDÁCTICA CEREBRO-COMPATIBLE
### INICIO (15-20 min): Disonancia Cognitiva, pregunta provocadora, vínculo emocional.
### DESARROLLO (50-60 min): Micro-ciclos 15min+5min+15min, Pausa Activa, trabajo colaborativo, contexto chileno. Si NEE ≠ Ninguna, adaptaciones DUA.
### CIERRE (10-15 min): Metacognición, pregunta reflexiva, ticket de salida emocional.

# SALIDA JSON ESTRICTA:
{
  "oas": [
    { "numero": "OA 3", "texto": "Texto COMPLETO y LITERAL del OA 3 (40+ palabras exactas del currículum MINEDUC)" },
    { "numero": "OA 4", "texto": "Texto COMPLETO y LITERAL del OA 4 (distinto al anterior, 40+ palabras)" }
  ],
  "conceptos_clave": "Conceptos separados por comas",
  "habilidades": "Verbos en infinitivo separados por coma (ej: 'Explicar, Relacionar, Argumentar')",
  "nivel_taxonomico": "Nivel Bloom numerado. Si hay varios, separados por coma (ej: 'Comprender - Nivel 2, Analizar - Nivel 4')",
  "actitud": "Actitud/OAT transversal del currículum chileno (ej: 'Pensamiento crítico e informado', 'Valorar la diversidad')",
  "objetivo_clase": "Objetivo TRIDIMENSIONAL. DEBE tener 3 partes claramente identificables:\\n  PARTE 1 - HABILIDAD: Inicia con verbo en infinitivo (Caracterizar, Analizar, Explicar, Comparar).\\n  PARTE 2 - CONTENIDO: El qué específico del tema, con detalles concretos.\\n  PARTE 3 - ACTITUD: 'valorando/apreciando/demostrando [actitud concreta]'.\\n  Ejemplo VÁLIDO: 'Caracterizar el Estado moderno y la economía mercantilista del siglo XVI, analizando los cambios en el poder político y económico, valorando el pensamiento crítico frente a los procesos históricos.'\\n  Ejemplo INVÁLIDO (sin actitud): 'Caracterizar el Estado moderno del siglo XVI.'\\n  UNA sola oración fluida, 30-50 palabras.",
  "indicadores": ["Indicadores REALES del currículum MINEDUC, al menos 3"],
  "fase_inicio": "Descripción detallada, mínimo 3-4 oraciones con actividades específicas",
  "fase_desarrollo": "Descripción con micro-ciclos 15+5+15, pausas activas, colaborativo, contexto chileno. Mín 5-6 oraciones.",
  "fase_cierre": "Descripción con metacognición, pregunta reflexiva, ticket de salida. Mín 3-4 oraciones."
}

REGLA RAG CRÍTICA:
1. Si el campo "OA Oficial RAG" contiene el texto de un OA, COPIALO TEXTUALMENTE en oa_text. NO lo resumas.
2. Si hay múltiples OAs solicitados (ej: "OA 3, OA 4"), DEBES incluir el texto COMPLETO de CADA UNO separados por |||. Cada OA tiene 40+ palabras con sus detalles específicos.
3. Si el RAG no trae el texto, genera el texto oficial según tu conocimiento del currículum MINEDUC chileno — NUNCA inventes, NUNCA uses texto genérico.

VALIDACIÓN OBLIGATORIA del objetivo_clase antes de responder:
- ¿Empieza con verbo en infinitivo? ✓
- ¿Menciona contenido específico (no genérico)? ✓
- ¿Tiene palabra como "valorando/apreciando/demostrando" + actitud concreta? ✓
Si alguno falla, reescribe.`;

const IMAGE_SYSTEM_PROMPT = `# EXPERTO EN PROMPTS VISUALES EDUCATIVOS

Traduces contenido curricular en prompts para FLUX (IA generativa). SIN texto visible, SIN personas en las imágenes.

METODOLOGÍA:
PASO 1 - Identifica el ámbito temático GENERAL.
PASO 2 - Analiza CADA slide: tema específico, contexto geográfico real, período, conceptos visualizables.
PASO 3 - Valida: contexto geográfico correcto, sin personas, sin texto.

REGLAS DE CONTEXTUALIZACIÓN:
UNIVERSAL: Revolución Francesa -> París s.XVIII; Imperio Romano -> arquitectura romana; Mesopotamia -> ziggurats.
REGIONAL_AMERICAN: Incas -> Andes/Machu Picchu; Mayas -> Tikal/selva mesoamericana; Aztecas -> Teotihuacán.
LOCAL_CHILEAN: Independencia -> Santiago colonial 1810-1818; Mapuches -> sur de Chile.
COHERENCIA: Si Slide 1 es Incas, Slide 2 NO puede ser Mesopotamia.

ACTIVIDADES HUMANAS SIN PERSONAS:
- MAL: "marketplace with trading", "people working", "classroom scene"
- BIEN: "Display of trade goods: cacao, obsidian, textiles on stone platform"

PALABRAS QUE IMPLICAN TEXTO - EVITAR: "diagram", "infographic", "chart", "map", "labeled", "with inscriptions"

FORMATO: "Professional educational photography: [descripción 30-50 palabras]. Documentary style, National Geographic quality, 8k resolution, no text anywhere, no people visible, sharp focus, [iluminación]."

negative_prompt siempre: "text, words, letters, writing, typography, numbers, signs, labels, watermarks, logos, people, faces, portraits, human figures, low quality, blurry, cartoon, anime, CGI, 3D render"

JSON: { "prompts": [{ "image_prompt": "...", "negative_prompt": "..." }] }`;

const CONTENT_SYSTEM_PROMPT = `Eres un generador de contenido educativo para el curriculum chileno MINEDUC.
Genera contenido para slides basándote en la PLANIFICACIÓN.

JSON estructura exacta:
{
  "metadata": { "topic": "título del tema", "subject": "asignatura", "level": "curso" },
  "slides": [
    {
      "title": "Título específico (NO genérico)",
      "content": {
        "main_text": "Texto explicativo 3-5 oraciones denso, alineado con la secuencia didáctica",
        "chilean_example": "Ejemplo concreto y específico de Chile",
        "key_vocabulary": ["3-5 términos específicos"],
        "activation_questions": ["2 preguntas reflexivas concretas"]
      }
    }
  ],
  "quiz": [
    {
      "question_text": "Pregunta Bloom 3+",
      "options": [ { "key": "A", "text": "..." }, { "key": "B", "text": "..." }, { "key": "C", "text": "..." }, { "key": "D", "text": "..." } ],
      "correct_answer": "A",
      "explanation": "Retroalimentación 2-3 oraciones",
      "cognitive_skill": "Analizar",
      "bloom_level": 4
    }
  ]
}

ESTRUCTURA OBLIGATORIA (10-12 slides):
1. Gancho/Activación
2-3. Contexto
4-7. Desarrollo núcleo (1 concepto por slide)
8-9. Aplicación (ejemplos Chile)
10. Comparación/Análisis
11. Síntesis
12. Proyección (opcional)

REGLAS:
- MÍNIMO 10 slides, MÁXIMO 12
- Cada slide con chilean_example ESPECÍFICO
- 6 preguntas quiz, cada una con bloom_level numérico (3, 4, 5 o 6)
- cognitive_skill debe ser uno de: Aplicar (3), Analizar (4), Evaluar (5), Crear (6). NO uses Recordar o Comprender.
- Mínimo 4 de las 6 preguntas deben ser Bloom 4+ (Analizar o superior) para alinear con rúbricas de Carrera Docente
- Distractores plausibles
- Español neutro chileno, NO voseo
- Títulos específicos`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // --- 0. ENV & AUTH ---
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 });
  }

  const supabase = await createServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const userId = session.user.id;
  const userEmail = session.user.email || '';
  const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0] || 'Profesor';

  // --- 0.5. Body parsing ---
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const {
    asignatura,
    curso,
    oa,
    objetivo_clase,
    nee = 'Ninguna',
    duracion_clase = '90 minutos',
  } = body;

  if (!asignatura || !curso || !oa) {
    return NextResponse.json({ error: 'Faltan campos: asignatura, curso, oa' }, { status: 400 });
  }

  // --- 1. VALIDAR CRÉDITOS ---
  const admin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: sub } = await admin
    .from('user_subscriptions')
    .select('id, remaining_credits, total_generations')
    .eq('user_id', userId)
    .single();

  if (!sub) {
    return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 403 });
  }

  if ((sub.remaining_credits ?? 0) <= 0) {
    return NextResponse.json({ error: 'Sin créditos disponibles. Actualiza tu plan.' }, { status: 402 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const objetivoFull = objetivo_clase || oa;

  try {
    // --- 2. RAG + OA Extractor (paralelo) ---
    console.log('[Kit] RAG + OA extraction for user:', userId);
    let ragPrograma = '';
    let ragTexto = '';
    let oasLiterales: OAFull[] = [];
    try {
      const [programaChunks, textoChunks, oasFromRag] = await Promise.all([
        queryRag(objetivoFull, asignatura, curso, 'programa', 5),
        queryRag(objetivoFull, asignatura, curso, 'texto_estudiante', 5),
        fetchAllOAsFromRag(asignatura, curso, oa),
      ]);
      ragPrograma = programaChunks.map(c => c.contenido).join('\n\n---\n\n');
      ragTexto = textoChunks.map(c => c.contenido).join('\n\n');
      oasLiterales = oasFromRag;
      console.log('[Kit] OAs extraídos del RAG:', oasLiterales.length);
    } catch (err) {
      console.warn('[Kit] RAG failed:', err);
    }

    // Generate classId early (used in image storage paths)
    const classId = crypto.randomUUID();

    // --- 3. PLANIFICACIÓN ---
    const planRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PLANIFICACION_PROMPT },
        {
          role: 'user',
          content: `- Objetivo Original: ${objetivoFull}\n- Asignatura: ${asignatura}\n- Curso: ${curso}\n- Duración: ${duracion_clase}\n- OA: ${oa}\n- NEE: ${nee}\n- OA Oficial (RAG MINEDUC): ${ragPrograma || '(No disponible)'}`,
        },
      ],
    });
    const plan = JSON.parse(planRes.choices[0]?.message?.content || '{}') as PlanData;

    // --- 3b. EVALUACIÓN + NEE/DUA (paralelo con contenido) ---
    // Se dispara cuando ya tenemos la planificación

    // --- 4. CONTENIDO + EVALUACIÓN + NEE/DUA (paralelo) ---
    const [contentRes, evaluacionRes, neeRes] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CONTENT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Asignatura: ${asignatura} | Curso: ${curso}
Objetivo: ${plan.objetivo_clase || objetivoFull}

PLANIFICACIÓN:
- Conceptos: ${plan.conceptos_clave || ''}
- Habilidades: ${plan.habilidades || ''}
- Indicadores: ${(plan.indicadores || []).join('; ')}
- INICIO: ${plan.fase_inicio || ''}
- DESARROLLO: ${plan.fase_desarrollo || ''}
- CIERRE: ${plan.fase_cierre || ''}

RAG MINEDUC: ${ragPrograma || '(N/A)'}
TEXTO ESTUDIANTE: ${ragTexto ? ragTexto.substring(0, 1500) : '(N/A)'}`,
          },
        ],
      }),
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: EVALUACION_PROMPT },
          {
            role: 'user',
            content: `Objetivo: ${plan.objetivo_clase || objetivoFull}
Desarrollo: ${plan.fase_desarrollo || ''}
Indicadores: ${JSON.stringify(plan.indicadores || [])}
Habilidades: ${plan.habilidades || ''}
Asignatura/Curso: ${asignatura} - ${curso}
NEE: ${nee}`,
          },
        ],
      }),
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: NEE_DUA_PROMPT },
          {
            role: 'user',
            content: `OA/Objetivo: ${plan.objetivo_clase || objetivoFull}
Asignatura: ${asignatura} | Curso: ${curso} | Duración: ${duracion_clase}
NEE Reportada: ${nee}
Secuencia INICIO: ${plan.fase_inicio || ''}
Secuencia DESARROLLO: ${plan.fase_desarrollo || ''}
Secuencia CIERRE: ${plan.fase_cierre || ''}
Indicadores: ${(plan.indicadores || []).join('; ')}`,
          },
        ],
      }),
    ]);

    const contentData = JSON.parse(contentRes.choices[0]?.message?.content || '{}') as ContentData;
    const slides = contentData.slides || [];
    const quiz = contentData.quiz || [];
    const topic = contentData.metadata?.topic || asignatura;

    // --- Validación Bloom post-LLM (P0 #6 auditoría) ---
    // No re-genera, solo registra métrica para observabilidad.
    // Si el ratio es bajo de forma sistemática, se ajusta el prompt.
    const bloomCounts: Record<string, number> = { '3+': 0, 'bajo': 0, 'sin_clasificar': 0 };
    for (const q of quiz) {
      const raw = (q as { bloom_level?: unknown; cognitive_skill?: unknown }).bloom_level;
      const lvl = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : NaN;
      if (Number.isInteger(lvl) && lvl >= 3) bloomCounts['3+']++;
      else if (Number.isInteger(lvl) && lvl > 0) bloomCounts.bajo++;
      else bloomCounts.sin_clasificar++;
    }
    const highRatio = quiz.length > 0 ? bloomCounts['3+'] / quiz.length : 0;
    console.log('[Kit] Bloom check:', JSON.stringify(bloomCounts), 'ratio_3+:', highRatio.toFixed(2));
    if (quiz.length > 0 && highRatio < 0.6) {
      console.warn('[Kit] Quiz bajo estandar Carrera Docente: solo', Math.round(highRatio * 100), '% preguntas Bloom 3+');
    }

    let evaluacion: EvaluacionData = {};
    try {
      const parsed = JSON.parse(evaluacionRes.choices[0]?.message?.content || '{}');
      evaluacion = parsed.evaluacion || {};
    } catch { /* ignore */ }

    let neeData: NEEEnrichedData = {};
    try {
      const parsed = JSON.parse(neeRes.choices[0]?.message?.content || '{}');
      neeData = parsed.nee_enriched || {};
    } catch { /* ignore */ }

    console.log('[Kit] Plan+Eval+NEE OK. Rubrica rows:', (evaluacion.rubrica || []).length, '| NEE:', neeData.diagnostico);

    console.log('[Kit]', slides.length, 'slides,', quiz.length, 'quiz');

    // --- 5. IMÁGENES con Kie.ai Nano Banana (misma calidad que NotebookLM) ---
    let imageUrls: (string | null)[] = [];
    const kieKey = process.env.KIE_API_KEY;
    if (kieKey && slides.length > 0) {
      const imgPromptRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: IMAGE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `ÁMBITO: ${asignatura} | ${curso} | ${topic}
Conceptos: ${plan.conceptos_clave || ''}

Genera UN prompt fotorrealista por slide, manteniendo COHERENCIA geográfica/histórica:

${slides.map((s, i) => `SLIDE ${i + 1}: "${s.title}"
  - Contenido: ${s.content?.main_text || ''}
  - Conceptos: ${(s.content?.key_vocabulary || []).join(', ')}
  - Ejemplo Chile: ${s.content?.chilean_example || ''}`).join('\n')}`,
          },
        ],
      });

      let imgPrompts: { image_prompt: string; negative_prompt: string }[] = [];
      try {
        imgPrompts = (JSON.parse(imgPromptRes.choices[0]?.message?.content || '{}').prompts || []);
      } catch { /* ignore */ }

      if (imgPrompts.length > 0) {
        const settled = await Promise.allSettled(
          imgPrompts.map((p, i) => generateAndStoreImage(kieKey, p.image_prompt, admin, userId, classId, i, userEmail))
        );
        imageUrls = settled.map(r => r.status === 'fulfilled' ? r.value : null);
      }
    }

    // --- 6. BUILD DECK ---
    const today = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const allSlides: SlideBlock[] = [];

    const cover = renderSlide({ slide_number: 1, type: 'cover', title: topic, content: today, grade: curso, teacher: userName });
    allSlides.push({ innerHTML: cover.innerHTML, bgStyle: cover.bgStyle });

    const goal = renderSlide({ slide_number: 2, type: 'goal', title: 'Objetivo de la Clase', content: plan.objetivo_clase || objetivoFull, grade: curso, teacher: userName });
    allSlides.push({ innerHTML: goal.innerHTML, bgStyle: goal.bgStyle });

    for (let i = 0; i < slides.length; i++) {
      const r = renderSlide({
        slide_number: i + 3, type: 'content', title: slides[i].title,
        content: slides[i].content, grade: curso, teacher: userName,
        imageUrl: imageUrls[i] || '',
      });
      allSlides.push({ innerHTML: r.innerHTML, bgStyle: r.bgStyle });
    }

    for (const q of quiz) {
      const r = renderSlide({
        slide_number: allSlides.length + 1, type: 'quiz', title: q.question_text,
        options: (q.options || []).map((o: { key?: string; option?: string; text?: string; content?: string }) => ({
          key: o.key || o.option || '', text: o.text || o.content || '',
        })),
        correct_key: q.correct_answer,
        explanation: q.explanation || q.feedback || '',
      });
      allSlides.push({ innerHTML: r.innerHTML, bgStyle: r.bgStyle });
    }

    allSlides.push({
      innerHTML: `<div class="final-slide-content">
        <div class="final-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
        <h1 style="font-size:5.5rem!important;margin-bottom:20px;">Nos vemos en la siguiente clase</h1>
        <p style="font-size:2.2rem;color:#a5b4fc;font-style:italic;">"El conocimiento es poder"</p>
        <div style="margin-top:50px;padding:15px 40px;background:rgba(255,255,255,0.1);border-radius:50px;font-size:1.4rem;font-weight:600;">${today}</div>
      </div>`,
      bgStyle: 'background: radial-gradient(circle at center, #1e1e2f 0%, #0f111a 100%);',
      id: 'final-slide',
    });

    const fullHtml = wrapSlidesHtml(topic, allSlides);

    // --- 7. UPLOAD a Google Drive (o Supabase Storage si Drive no está configurado) ---
    const useDrive = !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_FOLDER_ID);
    let presentacionUrl: string;

    if (useDrive) {
      try {
        const safeTitle = topic.replace(/[^\w\s-]/g, '').substring(0, 50);
        const res = await uploadToDrive(
          fullHtml,
          `Presentacion_${safeTitle}_${classId.substring(0, 8)}.html`,
          'text/html; charset=utf-8',
          userEmail || userId
        );
        presentacionUrl = res.webViewLink;
      } catch (err) {
        console.error('[Kit] Drive upload failed, falling back to Supabase:', err);
        const storagePath = `${userId}/${classId}.html`;
        await admin.storage.from('generated-classes').upload(storagePath, fullHtml, { contentType: 'text/html; charset=utf-8', upsert: false });
        const { data } = admin.storage.from('generated-classes').getPublicUrl(storagePath);
        presentacionUrl = data.publicUrl;
      }
    } else {
      const storagePath = `${userId}/${classId}.html`;
      const { error: uploadErr } = await admin.storage
        .from('generated-classes')
        .upload(storagePath, fullHtml, { contentType: 'text/html; charset=utf-8', upsert: false });
      if (uploadErr) {
        console.error('[Kit] Upload error:', uploadErr);
        return NextResponse.json({ error: 'Error subiendo presentación' }, { status: 500 });
      }
      const { data: publicUrlData } = admin.storage.from('generated-classes').getPublicUrl(storagePath);
      presentacionUrl = publicUrlData.publicUrl;
    }

    // --- 7.5. Generar HTML de planificación y subir ---
    // Prioridad de fuentes para OAs:
    // 1. oasLiterales (extraídos DIRECTO del RAG, texto oficial MINEDUC)
    // 2. plan.oas del LLM (puede resumir)
    // 3. Fallback legacy
    let oas: { numero: string; texto: string }[] = [];
    if (oasLiterales.length > 0) {
      oas = oasLiterales.map(o => ({ numero: o.numero, texto: o.texto }));
    } else if (Array.isArray(plan.oas) && plan.oas.length > 0) {
      oas = plan.oas.filter(o => o.numero && o.texto);
    } else {
      const oaNumbers = (plan.oa_number || oa).split(/[/,]/).map((s: string) => s.trim()).filter(Boolean);
      const oaTexts = (plan.oa_text || objetivoFull).split('|||').map((s: string) => s.trim()).filter(Boolean);
      oas = oaNumbers.map((num: string, i: number) => ({
        numero: num,
        texto: oaTexts[i] || oaTexts[0] || '',
      }));
    }

    // Selección de indicadores: los del RAG son TODOS los del OA (4-7 por OA).
    // En una clase solo se trabajan 2-3. Pedimos al LLM que seleccione los que
    // realmente se abordan según la secuencia didáctica.
    const todosLosIndicadores = oasLiterales.length > 0
      ? oasLiterales.flatMap(o => o.indicadores)
      : (plan.indicadores || []);

    let indicadoresFinales: string[] = todosLosIndicadores;
    if (todosLosIndicadores.length > 3) {
      try {
        const selectRes = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          max_tokens: 600,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `Eres un experto curricular chileno. Dado un objetivo de clase, secuencia didáctica e indicadores oficiales del OA, selecciona SOLO los 2-3 indicadores que REALMENTE se trabajan en ESTA clase (no los que se trabajarían en el OA completo a lo largo de varias clases). Prioriza alineación con las actividades concretas de la secuencia. JSON: { "indices": [0, 2] } — indica los números de índice (0-based) de los indicadores seleccionados.`,
            },
            {
              role: 'user',
              content: `OBJETIVO CLASE: ${plan.objetivo_clase || objetivoFull}

SECUENCIA DIDÁCTICA:
- Inicio: ${plan.fase_inicio || ''}
- Desarrollo: ${plan.fase_desarrollo || ''}
- Cierre: ${plan.fase_cierre || ''}

INDICADORES OFICIALES DEL OA (${todosLosIndicadores.length} disponibles):
${todosLosIndicadores.map((ind, i) => `[${i}] ${ind}`).join('\n')}

Selecciona 2-3 índices (máximo).`,
            },
          ],
        });
        const parsed = JSON.parse(selectRes.choices[0]?.message?.content || '{}');
        const indices: number[] = Array.isArray(parsed.indices) ? parsed.indices : [];
        if (indices.length > 0) {
          indicadoresFinales = indices
            .filter((i: number) => i >= 0 && i < todosLosIndicadores.length)
            .slice(0, 3)
            .map((i: number) => todosLosIndicadores[i]);
          console.log('[Kit] Indicadores filtrados:', indicadoresFinales.length, 'de', todosLosIndicadores.length);
        }
      } catch (err) {
        console.warn('[Kit] Filtro de indicadores falló, usando todos:', err);
      }
    }

    // Extract rubrica with normalization (handles both our new format and legacy detalle_instrumento)
    let rubrica = evaluacion.rubrica || [];
    if (rubrica.length === 0 && evaluacion.detalle_instrumento) {
      rubrica = parseRubricaFromMarkdown(evaluacion.detalle_instrumento);
    }

    const planificacionHtml = renderPlanificacionHtml({
      asignatura,
      profesor: userName,
      curso,
      duracion: duracion_clase,
      fecha: today,
      oas,
      habilidades: plan.habilidades,
      nivel_taxonomico: plan.nivel_taxonomico,
      actitud: plan.actitud,
      objetivo_clase: plan.objetivo_clase || objetivoFull,
      fase_inicio: plan.fase_inicio,
      fase_desarrollo: plan.fase_desarrollo,
      fase_cierre: plan.fase_cierre,
      indicadores: indicadoresFinales,
      rubrica,
      nee_data: neeData,
    });

    let planificacionUrl: string | null = null;
    if (useDrive) {
      try {
        const safeTitle = topic.replace(/[^\w\s-]/g, '').substring(0, 50);
        const res = await uploadToDrive(
          planificacionHtml,
          `Planificacion_${safeTitle}_${classId.substring(0, 8)}.html`,
          'text/html; charset=utf-8',
          userEmail || userId
        );
        planificacionUrl = res.webViewLink;
      } catch (err) {
        console.warn('[Kit] Planificación Drive upload failed, fallback:', err);
      }
    }
    if (!planificacionUrl) {
      const planPath = `${userId}/${classId}-planificacion.html`;
      const { error: planUploadErr } = await admin.storage
        .from('generated-classes')
        .upload(planPath, planificacionHtml, { contentType: 'text/html; charset=utf-8', upsert: false });
      if (!planUploadErr) {
        const { data: planUrlData } = admin.storage.from('generated-classes').getPublicUrl(planPath);
        planificacionUrl = planUrlData.publicUrl;
      }
    }

    // --- 8. INSERT en generated_classes ---
    await admin.from('generated_classes').insert({
      id: classId,
      user_id: userId,
      email: userEmail,
      asignatura,
      curso,
      objetivo_clase: plan.objetivo_clase || objetivoFull,
      duracion_clase,
      link_presentacion: presentacionUrl,
      link_planificacion: planificacionUrl,
      status: 'completed',
      execution_id: `nextjs-${classId}`,
      timestamp: new Date().toISOString(),
      topic,
      nee,
      planning_blocks: {
        objetivo: plan.objetivo_clase,
        conceptos_clave: plan.conceptos_clave,
        habilidades: plan.habilidades,
        indicadores: plan.indicadores,
        inicio: plan.fase_inicio,
        desarrollo: plan.fase_desarrollo,
        cierre: plan.fase_cierre,
      },
      exit_ticket: {},
    });

    // --- 9. DESCONTAR CRÉDITO ---
    await admin
      .from('user_subscriptions')
      .update({
        remaining_credits: Math.max(0, (sub.remaining_credits || 0) - 1),
        total_generations: (sub.total_generations || 0) + 1,
        last_generation_at: new Date().toISOString(),
      })
      .eq('id', sub.id);

    // Update monthly_usage
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    await admin.rpc('increment_monthly_usage', { p_user_id: userId, p_year: year, p_month: month }).then(
      () => console.log('[Kit] monthly_usage incremented'),
      async () => {
        // Fallback: manual upsert si no existe el RPC
        const { data: existing } = await admin
          .from('monthly_usage')
          .select('id, classes_generated')
          .eq('user_id', userId).eq('year', year).eq('month', month)
          .maybeSingle();
        if (existing) {
          await admin.from('monthly_usage').update({ classes_generated: (existing.classes_generated || 0) + 1 }).eq('id', existing.id);
        }
      }
    );

    // --- 10. EMAIL con Resend ---
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    if (resendKey && userEmail) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: 'EducMark <hola@educmark.cl>',
          to: userEmail,
          subject: `📚 Tu clase "${topic}" está lista`,
          html: buildEmailHtml(userName, topic, asignatura, curso, presentacionUrl, planificacionUrl),
        });
        emailSent = true;
        console.log('[Kit] Email sent to', userEmail);
      } catch (err) {
        console.warn('[Kit] Email failed (no crítico):', err);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('[Kit] Done', elapsed, 's | class:', classId);

    return NextResponse.json({
      success: true,
      classId,
      presentacionUrl,
      planificacionUrl,
      metadata: { topic, subject: asignatura, level: curso, oa_text: plan.oa_text || oa, objetivo_clase: plan.objetivo_clase },
      planificacion: plan,
      slides_count: slides.length,
      quiz_count: quiz.length,
      images_generated: imageUrls.filter(Boolean).length,
      generation_time: `${elapsed}s`,
      email_sent: emailSent,
      remaining_credits: Math.max(0, (sub.remaining_credits || 0) - 1),
    });
  } catch (error) {
    console.error('[Kit] Error:', error);
    return NextResponse.json({ error: 'Error generando kit', details: error instanceof Error ? error.message : 'unknown' }, { status: 500 });
  }
}

// ===== Helpers =====

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateAndStoreImage(
  apiKey: string,
  prompt: string,
  admin: any,
  userId: string,
  classId: string,
  index: number,
  userEmail: string
): Promise<string | null> {
  const tempUrl = await generateNanoBananaTempUrl(apiKey, prompt);
  if (!tempUrl) return null;

  try {
    const imgRes = await fetch(tempUrl);
    if (!imgRes.ok) return tempUrl;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('jpeg') ? 'jpg' : 'png';

    // Prioridad: Drive > Supabase Storage
    const useDrive = !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_FOLDER_ID);
    if (useDrive) {
      try {
        const res = await uploadToDrive(
          buffer,
          `img-${classId.substring(0, 8)}-${index}.${ext}`,
          contentType,
          userEmail || userId
        );
        return res.directLink; // usa thumbnail high-res para <img>
      } catch (err) {
        console.warn('[Img->Drive] failed, falling back to Supabase:', err);
      }
    }

    // Fallback Supabase
    const path = `${userId}/${classId}-img-${index}.${ext}`;
    const { error } = await admin.storage.from('generated-classes').upload(path, buffer, { contentType, upsert: false });
    if (error) return tempUrl;
    const { data } = admin.storage.from('generated-classes').getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn('[Img->Storage] error:', err);
    return tempUrl;
  }
}

async function generateNanoBananaTempUrl(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/nano-banana',
        input: {
          prompt: `${prompt} Photorealistic, cinematic, sharp focus, no text, no people, 16:9 landscape.`,
        },
      }),
    });
    if (!createRes.ok) return null;
    const createData = await createRes.json() as { code: number; data?: { taskId: string } };
    const taskId = createData?.data?.taskId;
    if (!taskId) return null;

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json() as { code: number; data?: { state: string; resultJson?: string; failMsg?: string } };
      const state = pollData?.data?.state;
      if (state === 'success' && pollData.data?.resultJson) {
        const result = JSON.parse(pollData.data.resultJson) as { resultUrls?: string[] };
        return result.resultUrls?.[0] ?? null;
      }
      if (state === 'fail') {
        console.warn('[Kie NanoBanana] failed:', pollData.data?.failMsg);
        return null;
      }
    }
    return null;
  } catch (err) {
    console.warn('[Kie NanoBanana] error:', err);
    return null;
  }
}

function buildEmailHtml(nombre: string, topic: string, asignatura: string, curso: string, presentacionUrl: string, planificacionUrl: string | null): string {
  const planificacionBtn = planificacionUrl ? `
      <a href="${planificacionUrl}" style="display:inline-block;background:#fff;color:#6e56cf;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;border:2px solid #6e56cf;margin:6px;">📋 Ver Planificación</a>` : '';
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;padding:40px 20px;margin:0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
    <div style="background:linear-gradient(135deg,#6e56cf 0%,#f472b6 100%);padding:40px 30px;text-align:center;color:#fff;">
      <div style="font-size:48px;margin-bottom:12px;">📚</div>
      <h1 style="margin:0;font-size:28px;font-weight:800;">¡Tu clase está lista!</h1>
    </div>
    <div style="padding:40px 30px;color:#1a1a2e;line-height:1.6;">
      <p style="font-size:18px;margin:0 0 20px;">Hola <strong>${nombre}</strong>,</p>
      <p style="font-size:16px;margin:0 0 30px;">Generé tu kit completo para la clase de <strong>${asignatura}</strong> en <strong>${curso}</strong>.</p>
      <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin-bottom:30px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#6e56cf;font-weight:800;margin-bottom:8px;">TEMA</div>
        <div style="font-size:20px;font-weight:700;color:#1a1a2e;">${topic}</div>
      </div>
      <div style="text-align:center;margin:30px 0;">
        <a href="${presentacionUrl}" style="display:inline-block;background:linear-gradient(135deg,#6e56cf 0%,#f472b6 100%);color:#fff;padding:16px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:16px;margin:6px;">🎬 Ver Presentación</a>${planificacionBtn}
      </div>
      <div style="background:#f0eefc;border-left:4px solid #6e56cf;padding:16px 20px;border-radius:8px;margin:24px 0;">
        <div style="font-size:13px;color:#6e56cf;font-weight:700;margin-bottom:4px;">💡 Tu kit incluye:</div>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:#555;">
          <li>Presentación interactiva con menú de herramientas (edición, pizarra, notas, láser)</li>
          <li>Planificación formal descargable/imprimible (F11 o botón imprimir)</li>
          <li>Quiz interactivo integrado al final de las slides</li>
          <li>Imágenes fotorrealistas generadas con IA</li>
        </ul>
      </div>
    </div>
    <div style="background:#f5f5f7;padding:20px 30px;text-align:center;font-size:12px;color:#999;">
      <p style="margin:0;">Generado con EducMark · <a href="https://educmark.cl" style="color:#6e56cf;text-decoration:none;">educmark.cl</a></p>
    </div>
  </div>
</body></html>`;
}

// ===== Types =====
interface PlanData {
  oas?: { numero: string; texto: string }[];
  oa_number?: string;  // legacy fallback
  oa_text?: string;    // legacy fallback
  conceptos_clave?: string;
  habilidades?: string;
  nivel_taxonomico?: string;
  actitud?: string;
  objetivo_clase?: string;
  indicadores?: string[];
  fase_inicio?: string;
  fase_desarrollo?: string;
  fase_cierre?: string;
}

interface EvaluacionData {
  tipo_evaluacion?: string;
  instrumento?: string;
  detalle_instrumento?: string;
  rubrica?: { criterio: string; destacado: string; logrado: string; en_desarrollo: string; inicial: string }[];
}

interface NEEEnrichedData {
  diagnostico?: string;
  perfil_neurocognitivo?: string;
  principio_dua_prioritario?: string;
  barrera_identificada?: string;
  adaptaciones?: {
    acceso?: { descripcion?: string };
    metodologia?: { descripcion?: string };
    evaluacion?: { descripcion?: string };
  };
  co_docencia?: { profesor_aula?: string; educador_diferencial?: string };
  estrategia_dua_universal?: string;
}

function parseRubricaFromMarkdown(md: string): { criterio: string; destacado: string; logrado: string; en_desarrollo: string; inicial: string }[] {
  // Handles "| col1 | col2 | col3 | col4 | col5 |<br>" format from legacy n8n
  if (!md) return [];
  const rows = md.split(/<br>|\n/).map(r => r.trim()).filter(r => r.startsWith('|') && !r.includes(':---'));
  const dataRows = rows.slice(1); // skip header
  return dataRows.map(row => {
    const cols = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 5) return null;
    return { criterio: cols[0], destacado: cols[1], logrado: cols[2], en_desarrollo: cols[3], inicial: cols[4] };
  }).filter((r): r is { criterio: string; destacado: string; logrado: string; en_desarrollo: string; inicial: string } => r !== null);
}
interface ContentData {
  metadata?: { topic?: string; subject?: string; level?: string };
  slides: { title: string; content: { main_text?: string; chilean_example?: string; key_vocabulary?: string[]; activation_questions?: string[] } }[];
  quiz: { question_text: string; options: { key?: string; option?: string; text?: string; content?: string }[]; correct_answer: string; explanation?: string; feedback?: string }[];
}
