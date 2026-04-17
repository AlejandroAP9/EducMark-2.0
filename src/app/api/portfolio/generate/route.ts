import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Admin client para leer planning_sequences (bypass RLS con service_role)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('[Portfolio] OPENAI_API_KEY not configured');
    return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const {
    classes,
    asignatura,
    curso,
    userId,
    evaluationId,
    evaluationItems,
    omrResults,
  } = body as {
    classes: Record<string, unknown>[];
    asignatura?: string;
    curso?: string;
    userId?: string;
    evaluationId?: string | null;
    evaluationItems?: Array<{
      question_text: string;
      cognitive_skill: string | null;
      oa: string | null;
    }>;
    omrResults?: Array<{
      question_number: number;
      skill_tag: string | null;
      correct_count: number;
      total_count: number;
      pct_correct: number;
    }>;
  };

  if (!classes || !Array.isArray(classes) || classes.length === 0) {
    return NextResponse.json({ error: 'No hay clases seleccionadas' }, { status: 400 });
  }

  // --- Leer planning_sequences del usuario (datos REALES de la planificación) ---
  let planningSequences: PlanningSequence[] = [];
  if (userId) {
    try {
      const admin = getAdminClient();
      const { data, error } = await admin
        .from('planning_sequences')
        .select('secuencia_planificacion, secuencia_evaluacion, secuencia_nee, paci_data, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('[Portfolio] Error leyendo planning_sequences:', error.message);
      } else if (data) {
        planningSequences = data as PlanningSequence[];
        console.log('[Portfolio] Secuencias encontradas:', planningSequences.length);
      }
    } catch (err) {
      console.error('[Portfolio] Error consultando planning_sequences:', err);
    }
  }

  // --- Contexto de clases seleccionadas ---
  const classContext = classes.map((c: Record<string, unknown>, i: number) => {
    return `Clase ${i + 1}:
- Tema: ${c.topic || '(sin tema)'}
- Fecha: ${c.created_at || ''}`;
  }).join('\n\n');

  // --- Contexto de secuencias reales (fuente principal de datos) ---
  const sequencesContext = planningSequences.length > 0
    ? planningSequences.map((s, i) => {
        const plan = s.secuencia_planificacion || {};
        const eval_ = s.secuencia_evaluacion || {};
        const nee = s.secuencia_nee || {};
        const paci = s.paci_data || {};

        const lines: string[] = [`=== SECUENCIA ${i + 1} (${s.created_at}) ===`];

        // Planificación real
        if (plan.obj_clase) lines.push(`OBJETIVO REAL: ${plan.obj_clase}`);
        if (plan.inicio) lines.push(`INICIO: ${plan.inicio}`);
        if (plan.desarrollo) lines.push(`DESARROLLO: ${plan.desarrollo}`);
        if (plan.cierre) lines.push(`CIERRE: ${plan.cierre}`);

        // Evaluación formativa real
        if (eval_.tipo || eval_.instrumento || eval_.detalle) {
          lines.push(`\nEVALUACIÓN FORMATIVA:`);
          if (eval_.tipo) lines.push(`- Tipo: ${eval_.tipo}`);
          if (eval_.instrumento) lines.push(`- Instrumento: ${eval_.instrumento}`);
          if (eval_.detalle) lines.push(`- Detalle: ${eval_.detalle}`);
        }

        // NEE (diversidad real del grupo)
        if (Object.keys(nee).length > 0) {
          lines.push(`\nNECESIDADES EDUCATIVAS ESPECIALES:`);
          if (nee.diagnostico) lines.push(`- Diagnóstico: ${nee.diagnostico}`);
          if (nee.perfil_neurocognitivo) lines.push(`- Perfil neurocognitivo: ${nee.perfil_neurocognitivo}`);
          if (nee.barrera_identificada) lines.push(`- Barrera identificada: ${nee.barrera_identificada}`);
          if (nee.adaptaciones) lines.push(`- Adaptaciones: ${nee.adaptaciones}`);
          if (nee.estrategia_dua_universal) lines.push(`- Estrategia DUA: ${nee.estrategia_dua_universal}`);
          if (nee.principio_dua_prioritario) lines.push(`- Principio DUA: ${nee.principio_dua_prioritario}`);
          if (nee.co_docencia) lines.push(`- Co-docencia: ${nee.co_docencia}`);
        }

        // PACI si existe
        if (paci && Object.keys(paci).length > 0) {
          lines.push(`\nPACI: ${JSON.stringify(paci)}`);
        }

        return lines.join('\n');
      }).join('\n\n---\n\n')
    : '(Sin datos estructurados de planificación disponibles — la IA deberá inferir desde el tema de la clase)';

  // --- Contexto de evaluación sumativa (si el profe asoció una) ---
  const evaluationContext = (() => {
    if (!evaluationId || !evaluationItems || evaluationItems.length === 0) {
      return '(Sin evaluación sumativa asociada — generá T2 con plantilla general para que el profe complete)';
    }

    const lines: string[] = [`=== EVALUACIÓN SUMATIVA (id: ${evaluationId}) ===`];
    lines.push(`Preguntas (${evaluationItems.length}):`);
    evaluationItems.slice(0, 40).forEach((it, i) => {
      const skill = it.cognitive_skill || 'sin clasificar';
      const oa = it.oa ? ` | OA: ${it.oa}` : '';
      const text = it.question_text.length > 140
        ? it.question_text.slice(0, 140) + '…'
        : it.question_text;
      lines.push(`  ${i + 1}. [${skill}${oa}] ${text}`);
    });

    if (omrResults && omrResults.length > 0) {
      lines.push('');
      lines.push('Resultados OMR (corrección automática):');
      const general = omrResults.find((r) => r.skill_tag === 'promedio_general');
      if (general) {
        lines.push(`- Estudiantes evaluados: ${general.total_count}`);
        lines.push(`- Porcentaje de logro general: ${general.pct_correct}%`);
      }
      const porHabilidad = omrResults.filter(
        (r) => r.skill_tag && r.skill_tag !== 'promedio_general'
      );
      if (porHabilidad.length > 0) {
        lines.push('- Por habilidad:');
        porHabilidad.forEach((r) => {
          lines.push(`    · ${r.skill_tag}: ${r.pct_correct}% (${r.correct_count}/${r.total_count})`);
        });
      }
    } else {
      lines.push('');
      lines.push('(Sin resultados OMR todavía — la prueba está diseñada pero aún no se corrigió)');
    }

    return lines.join('\n');
  })();

  const prompt = `Eres un experto en educación chilena y en el Portafolio Docentemás 2025 (Carrera Docente). Un profesor de ${asignatura || 'una asignatura'} de ${curso || 'un curso'} necesita que redactes los borradores del Módulo 1 de su portafolio.

DATOS REALES DEL PROFESOR (de su plataforma EducMark):

=== CLASES SELECCIONADAS ===
${classContext}

=== SECUENCIAS DE PLANIFICACIÓN REAL (usa estos datos como fuente principal) ===
${sequencesContext}

=== EVALUACIÓN SUMATIVA ASOCIADA (fuente primaria para T2) ===
${evaluationContext}

INSTRUCCIONES CRÍTICAS:
- Usa los datos REALES de las secuencias de planificación como fuente primaria
- Los objetivos, actividades (inicio/desarrollo/cierre), evaluación y NEE YA están en los datos arriba
- Tu trabajo es REDACTAR un texto continuo y coherente a partir de esos datos reales
- NO inventes nada si los datos están ahí — úsalos
- Solo complementa/inferir cuando un dato específico falte

Genera 3 borradores de texto COMPLETOS y LISTOS para copiar en docentemas.cl. Apunta al nivel COMPETENTE/DESTACADO de las rúbricas oficiales 2025.

=== BORRADOR T1: PLANIFICACIÓN ===
Redacta la descripción de 3 experiencias de aprendizaje usando los datos reales de las secuencias:
- Por cada una: fecha, objetivo REAL (campo obj_clase), descripción detallada del inicio/desarrollo/cierre (campos reales), acciones de monitoreo
- Al final: fundamentación de la diversidad usando los datos de NEE (diagnóstico, barrera identificada, adaptaciones, DUA). Vincula las oportunidades con al menos 2 tipos de características reales del grupo.

=== BORRADOR T2: EVALUACIÓN FORMATIVA ===
Si hay EVALUACIÓN SUMATIVA ASOCIADA con resultados OMR, usá esos datos REALES como fuente primaria (indicadores concretos, habilidades medidas, % de logro por habilidad). Si no, usá secuencia_evaluacion de las secuencias.
- 2.A: Describe la estrategia de monitoreo con el instrumento REAL usado y los indicadores observables
- 2.B.a: Analiza resultados concretos (cuando haya OMR: cita los % reales y qué habilidades salieron mejor/peor; qué diferencias observás entre estudiantes)
- 2.B.b: Explica causas pedagógicas (tus decisiones) Y contextuales — si hay preguntas con bajo % de logro, interpretá por qué
- 2.B.c: Describe 2+ acciones concretas de mejora, al menos 1 que involucre a los estudiantes en revisar su propia evidencia (auto-regulación)

=== BORRADOR T3: REFLEXIÓN SOCIOEMOCIONAL ===
- 3.a: Identifica UN aprendizaje socioemocional alineado con las barreras y perfil neurocognitivo REAL del grupo (datos en secuencia_nee). Fundamenta con comportamientos probables en esa diversidad.
- 3.b: Explica qué mantendrías o modificarías de tu actitud/forma de actuar y CÓMO eso aporta al desarrollo socioemocional del grupo específico.

FORMATO: Responde en JSON exacto:
{"t1": "texto completo T1...", "t2": "texto completo T2...", "t3": "texto completo T3..."}

REGLAS:
- Primera persona (yo, mis estudiantes)
- Lenguaje formal pero natural de profesor chileno
- Específico y concreto usando los datos REALES
- Sin markdown, solo texto plano con saltos de línea
- Cada borrador debe tener mínimo 500 palabras`;

  try {
    console.log('[Portfolio] Calling OpenAI — classes:', classes.length, 'sequences:', planningSequences.length);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('[Portfolio] Empty response from OpenAI');
      return NextResponse.json({ error: 'Sin respuesta de la IA' }, { status: 500 });
    }

    console.log('[Portfolio] Got response, length:', content.length);
    const drafts = JSON.parse(content);

    // --- Scoring post-generación contra rúbrica CPEIP 2025 ---
    // Llamada secundaria que evalúa cada borrador contra los indicadores oficiales
    // y devuelve nivel (competente/destacado/etc), score 1-5, strengths y gaps.
    // No bloquea: si falla, devolvemos drafts sin scoring.
    let scoring: PortfolioScoring | null = null;
    try {
      scoring = await scoreDrafts(openai, {
        t1: drafts.t1 || '',
        t2: drafts.t2 || '',
        t3: drafts.t3 || '',
      });
    } catch (err) {
      console.warn('[Portfolio] Scoring falló (no crítico):', err);
    }

    return NextResponse.json({
      t1: drafts.t1 || '',
      t2: drafts.t2 || '',
      t3: drafts.t3 || '',
      scoring,
      sequencesUsed: planningSequences.length,
    });
  } catch (error) {
    console.error('[Portfolio] Error:', error);
    return NextResponse.json(
      { error: 'Error generando borradores con IA' },
      { status: 500 }
    );
  }
}

// --- Scoring helper ---
type RubricLevel = 'no_logrado' | 'en_desarrollo' | 'competente' | 'destacado';

interface TaskScoring {
  level: RubricLevel;
  score: number;
  strengths: string[];
  gaps: string[];
}

interface PortfolioScoring {
  t1?: TaskScoring;
  t2?: TaskScoring;
  t3?: TaskScoring;
}

const SCORING_PROMPT = `Eres evaluador CPEIP del Portafolio Docentemás 2025. Recibes 3 borradores (T1, T2, T3) del Módulo 1 y debes puntuar cada uno contra las rúbricas oficiales.

RÚBRICAS (resumen oficial 2025):

T1 — Planificación. Tres indicadores:
- Formulación de objetivos: habilidad + conocimiento claros; destacado = integra actitudes.
- Relación actividades↔objetivos: todos los objetivos abordados; destacado = actividad contextualizada con sentido.
- Fundamentación de diversidad: vincula oportunidades con al menos 2 tipos de características (aprendizaje, contexto sociocultural, experiencias/intereses); destacado = explica cómo promueve respeto/valoración de diversidad O reflexiona sobre enfoque inclusivo propio.

T2 — Evaluación. Tres indicadores:
- Estrategia de monitoreo: indicadores observables alineados al OA; actividad que recoge evidencia de todos; destacado = ofrece alternativas para demostrar aprendizaje.
- Análisis a partir del monitoreo: logros, no logros, diferencias; explica causas (decisiones pedagógicas O contextuales); destacado = causas de distinta naturaleza (pedagógicas Y contextuales).
- Uso formativo: al menos 2 acciones de mejora, una que involucre a estudiantes; destacado = se hace cargo de quienes tuvieron dificultades Y de quienes lograron.

T3 — Reflexión socioemocional. Un indicador:
- Identifica aprendizaje socioemocional + fundamenta por qué el grupo lo necesita + qué mantendría/modificaría de su actitud + cómo aporta; destacado = relaciona factores que influyen en comportamiento + hipótesis de pensamiento/sentimiento.

ESCALA:
- no_logrado (1): no cumple criterios mínimos
- en_desarrollo (2): cumple parcialmente
- competente (3-4): cumple todos los criterios del nivel competente (3 = ajustado, 4 = sólido)
- destacado (5): cumple competente + criterios adicionales de destacado

FORMATO DE RESPUESTA (JSON estricto):
{
  "t1": { "level": "...", "score": 1-5, "strengths": ["1-2 frases cortas"], "gaps": ["1-3 frases accionables"] },
  "t2": { "level": "...", "score": 1-5, "strengths": [...], "gaps": [...] },
  "t3": { "level": "...", "score": 1-5, "strengths": [...], "gaps": [...] }
}

Reglas:
- gaps deben ser CONCRETOS y ACCIONABLES. No digas "mejorar redacción"; di "T1 no vincula la fundamentación con características específicas del grupo (aprendizaje, contexto). Agregá al menos 2."
- Lenguaje directo al profe, en segunda persona singular.
- Sin markdown.`;

async function scoreDrafts(
  openai: OpenAI,
  drafts: { t1: string; t2: string; t3: string }
): Promise<PortfolioScoring | null> {
  const hasAny = drafts.t1 || drafts.t2 || drafts.t3;
  if (!hasAny) return null;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SCORING_PROMPT },
      {
        role: 'user',
        content: `=== T1 ===\n${drafts.t1 || '(vacío)'}\n\n=== T2 ===\n${drafts.t2 || '(vacío)'}\n\n=== T3 ===\n${drafts.t3 || '(vacío)'}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;
  const parsed = JSON.parse(raw);

  const clean = (s: unknown): TaskScoring | undefined => {
    if (!s || typeof s !== 'object') return undefined;
    const obj = s as Record<string, unknown>;
    const levelRaw = typeof obj.level === 'string' ? obj.level : 'en_desarrollo';
    const level: RubricLevel = (['no_logrado', 'en_desarrollo', 'competente', 'destacado'] as const)
      .includes(levelRaw as RubricLevel) ? (levelRaw as RubricLevel) : 'en_desarrollo';
    const score = typeof obj.score === 'number' ? Math.max(1, Math.min(5, Math.round(obj.score))) : 2;
    const strengths = Array.isArray(obj.strengths) ? obj.strengths.map(String).slice(0, 3) : [];
    const gaps = Array.isArray(obj.gaps) ? obj.gaps.map(String).slice(0, 4) : [];
    return { level, score, strengths, gaps };
  };

  return {
    t1: clean(parsed.t1),
    t2: clean(parsed.t2),
    t3: clean(parsed.t3),
  };
}

// --- Types ---
interface PlanningSequence {
  secuencia_planificacion: Record<string, string> | null;
  secuencia_evaluacion: Record<string, string> | null;
  secuencia_nee: Record<string, string> | null;
  paci_data: Record<string, unknown> | null;
  created_at: string;
}
