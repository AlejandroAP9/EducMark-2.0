import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  // Check API key exists
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

  const { classes, asignatura, curso } = body;

  if (!classes || !Array.isArray(classes) || classes.length === 0) {
    return NextResponse.json({ error: 'No hay clases seleccionadas' }, { status: 400 });
  }

  // Build context from real class data
  const classContext = classes.map((c: Record<string, unknown>, i: number) => {
    const pb = c.planning_blocks && typeof c.planning_blocks === 'object' ? c.planning_blocks as Record<string, unknown> : {};
    const objective = pb.objective || c.objetivo_clase || '';
    const inicio = pb.inicio || '';
    const desarrollo = pb.desarrollo || '';
    const cierre = pb.cierre || '';

    return `Clase ${i + 1}:
- Tema: ${c.topic || '(sin tema)'}
- Objetivo registrado: ${objective || '(no registrado)'}
- Fecha: ${c.created_at || ''}
${inicio ? `- Inicio: ${inicio}` : ''}
${desarrollo ? `- Desarrollo: ${desarrollo}` : ''}
${cierre ? `- Cierre: ${cierre}` : ''}`;
  }).join('\n\n');

  const prompt = `Eres un experto en educación chilena y en el Portafolio Docentemás 2025 (Carrera Docente). Un profesor de ${asignatura || 'una asignatura'} de ${curso || 'un curso'} necesita que redactes los borradores del Módulo 1 de su portafolio.

DATOS REALES DEL PROFESOR (de su plataforma EducMark):

=== CLASES GENERADAS ===
${classContext}

INSTRUCCIONES:
Genera 3 borradores de texto COMPLETOS y LISTOS para copiar en docentemas.cl. El profesor NO debe tener que llenar espacios en blanco — el texto debe estar completamente redactado. Apunta al nivel COMPETENTE/DESTACADO de las rúbricas oficiales 2025.

Si algún dato no está disponible (como el objetivo de aprendizaje), INVENTA uno coherente con el tema y nivel, integrando habilidad + conocimiento + actitud.

=== BORRADOR T1: PLANIFICACIÓN ===
Redacta la descripción de 3 experiencias de aprendizaje:
- Por cada una: fecha aproximada, objetivo tridimensional (habilidad + conocimiento + actitud), descripción detallada de actividades de inicio/desarrollo/cierre, acciones de monitoreo, recursos
- Las actividades deben ser realistas, variadas, con enfoque inclusivo
- Al final: fundamentación de la diversidad vinculando las oportunidades con al menos 2 tipos de características de los estudiantes (de aprendizaje + contexto sociocultural). Sé concreto para un curso chileno real.

=== BORRADOR T2: EVALUACIÓN FORMATIVA ===
La evaluación formativa NO es una prueba sumativa. Es el monitoreo DENTRO de las clases.
- 2.A: Describe una estrategia de monitoreo con indicadores observables (qué esperabas que hicieran los estudiantes) y la actividad concreta que usaste para monitorear (preguntas en clase, ticket de salida, observación de trabajo grupal, etc.)
- 2.B.a: Analiza resultados — qué lograron, qué no, diferencias entre estudiantes
- 2.B.b: Explica causas pedagógicas (tus decisiones) Y contextuales (situaciones del entorno)
- 2.B.c: Describe 2+ acciones concretas de mejora, al menos 1 que involucre a los estudiantes

=== BORRADOR T3: REFLEXIÓN SOCIOEMOCIONAL ===
- 3.a: Identifica UN aprendizaje socioemocional necesario para estos estudiantes. Fundamenta con comportamientos concretos observados este año. Incluye qué crees que piensan y sienten.
- 3.b: Explica qué mantendrías o modificarías de tu actitud/forma de actuar y CÓMO eso aporta al desarrollo socioemocional.

FORMATO: Responde en JSON exacto:
{"t1": "texto completo T1...", "t2": "texto completo T2...", "t3": "texto completo T3..."}

REGLAS:
- Primera persona (yo, mis estudiantes)
- Lenguaje formal pero natural de profesor chileno
- Específico y concreto, NO genérico
- Sin markdown, solo texto plano con saltos de línea
- Cada borrador debe tener mínimo 500 palabras`;

  try {
    console.log('[Portfolio] Calling OpenAI with', classes.length, 'classes');

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
    });
  } catch (error) {
    console.error('[Portfolio] Error:', error);
    return NextResponse.json(
      { error: 'Error generando borradores con IA' },
      { status: 500 }
    );
  }
}
