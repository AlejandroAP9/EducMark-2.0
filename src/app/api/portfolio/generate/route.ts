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

  const { classes, asignatura, curso, userId } = body;

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

  const prompt = `Eres un experto en educación chilena y en el Portafolio Docentemás 2025 (Carrera Docente). Un profesor de ${asignatura || 'una asignatura'} de ${curso || 'un curso'} necesita que redactes los borradores del Módulo 1 de su portafolio.

DATOS REALES DEL PROFESOR (de su plataforma EducMark):

=== CLASES SELECCIONADAS ===
${classContext}

=== SECUENCIAS DE PLANIFICACIÓN REAL (usa estos datos como fuente principal) ===
${sequencesContext}

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
Usa los datos del campo secuencia_evaluacion (tipo, instrumento, detalle):
- 2.A: Describe la estrategia de monitoreo con el instrumento REAL usado y los indicadores observables
- 2.B.a: Analiza resultados probables basándote en el tipo de evaluación y las características del grupo
- 2.B.b: Explica causas pedagógicas (tus decisiones) Y contextuales
- 2.B.c: Describe 2+ acciones concretas de mejora, al menos 1 que involucre a los estudiantes

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

    return NextResponse.json({
      t1: drafts.t1 || '',
      t2: drafts.t2 || '',
      t3: drafts.t3 || '',
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

// --- Types ---
interface PlanningSequence {
  secuencia_planificacion: Record<string, string> | null;
  secuencia_evaluacion: Record<string, string> | null;
  secuencia_nee: Record<string, string> | null;
  paci_data: Record<string, unknown> | null;
  created_at: string;
}
