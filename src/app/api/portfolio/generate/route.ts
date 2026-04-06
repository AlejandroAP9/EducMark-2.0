import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { classes, evaluationItems, omrResults, asignatura, curso } = body;

  // Build context from real data
  const classContext = (classes || []).map((c: { topic?: string; objetivo_clase?: string; created_at: string; planning_blocks?: Record<string, unknown> }, i: number) => {
    const pb = c.planning_blocks && typeof c.planning_blocks === 'object' ? c.planning_blocks : {};
    const objective = pb.objective || c.objetivo_clase || '';
    const inicio = pb.inicio || '';
    const desarrollo = pb.desarrollo || '';
    const cierre = pb.cierre || '';

    return `Clase ${i + 1}:
- Tema: ${c.topic || '(sin tema)'}
- Objetivo: ${objective || '(no registrado en BD)'}
- Fecha: ${c.created_at}
${inicio ? `- Inicio: ${inicio}` : ''}
${desarrollo ? `- Desarrollo: ${desarrollo}` : ''}
${cierre ? `- Cierre: ${cierre}` : ''}`;
  }).join('\n\n');

  const itemsContext = (evaluationItems || []).map((item: { oa?: string; skill?: string; question?: string; type?: string }, i: number) => {
    return `Item ${i + 1}: [${item.skill || 'sin habilidad'}] [${item.oa || ''}] (${item.type || ''}) ${item.question || ''}`;
  }).join('\n');

  const omrContext = (omrResults || []).length > 0
    ? `Resultados OMR disponibles: ${JSON.stringify(omrResults)}`
    : 'No hay resultados OMR escaneados para esta evaluación.';

  const prompt = `Eres un experto en educación chilena y en el proceso de evaluación docente (Carrera Docente / Portafolio Docentemás 2025). Un profesor de ${asignatura} de ${curso} necesita que le redactes los borradores del Módulo 1 de su portafolio.

DATOS REALES DEL PROFESOR (de su plataforma EducMark):

=== CLASES GENERADAS ===
${classContext || '(sin clases disponibles)'}

=== EVALUACIÓN — ITEMS ===
${itemsContext || '(sin evaluación seleccionada)'}

=== RESULTADOS OMR ===
${omrContext}

INSTRUCCIONES:
Genera 3 borradores de texto COMPLETOS, listos para copiar y pegar en la plataforma docentemas.cl. Cada borrador debe apuntar al nivel COMPETENTE de la rúbrica oficial 2025.

El profesor solo necesita revisar y ajustar detalles personales — el texto debe estar REDACTADO, no ser un template con espacios en blanco.

BORRADOR T1 — PLANIFICACIÓN DE LA ENSEÑANZA (Tarea 1):
Incluye:
- Descripción de 3 experiencias de aprendizaje (usa los datos de las clases)
- Para cada experiencia: fecha, objetivo de aprendizaje (inventa uno coherente si no existe en los datos, integrando habilidad + conocimiento + actitud), descripción de actividades (inventa actividades pedagógicas coherentes con el tema y nivel)
- Fundamentación de la diversidad: redacta una fundamentación que vincule las oportunidades de aprendizaje con al menos 2 tipos de características de los estudiantes (aprendizaje + contexto sociocultural). Sé concreto y realista para un curso chileno de ${curso}.

BORRADOR T2 — EVALUACIÓN FORMATIVA (Tarea 2):
Incluye:
- 2.A Estrategia de monitoreo: describe indicadores de evaluación observables basados en los items de la evaluación. Describe la actividad de monitoreo.
- 2.B.a Análisis de resultados: analiza qué aprendizajes se lograron y cuáles no, basándote en los datos OMR si existen o en una descripción realista.
- 2.B.b Causas: explica causas pedagógicas Y contextuales (ambas, para nivel Destacado).
- 2.B.c Acciones: describe al menos 2 acciones concretas realizadas para mejorar, donde al menos 1 involucre a los estudiantes.

BORRADOR T3 — REFLEXIÓN SOCIOEMOCIONAL (Tarea 3):
Incluye:
- 3.a Identificar UN aprendizaje socioemocional relevante para estudiantes de ${curso}, fundamentar por qué lo necesitan con comportamientos observados concretos y realistas.
- 3.b Explicar qué mantendría o modificaría de su actitud docente y CÓMO eso aporta al desarrollo del aprendizaje socioemocional.

FORMATO DE RESPUESTA:
Responde EXACTAMENTE en este formato JSON:
{
  "t1": "texto completo del borrador T1...",
  "t2": "texto completo del borrador T2...",
  "t3": "texto completo del borrador T3..."
}

REGLAS:
- Escribe en primera persona (yo, mis estudiantes, mi curso)
- Usa lenguaje formal pero natural de profesor chileno
- Sé específico y concreto, no genérico
- Los objetivos deben integrar habilidad + conocimiento (nivel Competente) y si puedes también actitud (nivel Destacado)
- La fundamentación de diversidad debe mencionar 2+ tipos de características reales
- El análisis de T2 debe dar causas pedagógicas Y contextuales
- La reflexión T3 debe ser personal y auténtica
- NO uses markdown ni formato especial, solo texto plano con saltos de línea`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Sin respuesta de la IA' }, { status: 500 });
    }

    const drafts = JSON.parse(content);

    return NextResponse.json({
      t1: drafts.t1 || '',
      t2: drafts.t2 || '',
      t3: drafts.t3 || '',
    });
  } catch (error) {
    console.error('Error generando borradores:', error);
    return NextResponse.json(
      { error: 'Error generando borradores con IA' },
      { status: 500 }
    );
  }
}
