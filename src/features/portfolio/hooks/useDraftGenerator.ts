import { useCallback } from 'react';
import type {
  GeneratedClassRow,
  EvaluationItemRow,
  OMRResultRow,
  GuidedAnswers,
} from '../types/portfolio';

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function extractActivities(
  blocks: GeneratedClassRow['planning_blocks']
): string {
  // planning_blocks puede ser {} (objeto vacío), null, o un array
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0)
    return '(actividades detalladas en la planificación adjunta)';
  return blocks
    .map((b, i) => {
      const parts: string[] = [];
      if (b.title) parts.push(b.title);
      if (b.activities) parts.push(b.activities);
      return `  ${i + 1}. ${parts.join(' — ') || '(bloque sin detalle)'}`;
    })
    .join('\n');
}

export function useDraftGenerator() {
  const generateDraftT1 = useCallback(
    (classes: GeneratedClassRow[], _answers: GuidedAnswers): string => {
      if (classes.length === 0)
        return '(Selecciona al menos 1 experiencia de aprendizaje para generar el borrador)';

      const experiencias = classes
        .map((c, i) => {
          const num = i + 1;
          // Usar topic como título principal (es el campo que siempre tiene datos)
          const tema = c.topic ?? c.objetivo_clase ?? '(sin tema registrado)';
          const objetivo = c.objetivo_clase ?? tema;
          const fecha = formatDate(c.created_at);
          const actividades = extractActivities(c.planning_blocks);
          const oa = c.oa_label ? `OA: ${c.oa_label}` : '';
          const habilidades = c.skills ? `Habilidades: ${c.skills}` : '';

          return [
            `EXPERIENCIA ${num}: ${tema}`,
            `Fecha: ${fecha}`,
            `Objetivo de aprendizaje: ${objetivo}`,
            oa,
            habilidades,
            `Actividades:`,
            actividades,
          ]
            .filter(Boolean)
            .join('\n');
        })
        .join('\n\n---\n\n');

      const fundamentacion = `\n\n===== FUNDAMENTACIÓN =====\n[Complete con sus respuestas a las preguntas guía de la sección T1 — Diversidad]\nVincule las oportunidades de aprendizaje planificadas con al menos 2 tipos de características de sus estudiantes (aprendizaje, contexto sociocultural, experiencias e intereses).`;

      return `TAREA 1 — PLANIFICACIÓN DE EXPERIENCIAS DE APRENDIZAJE\n\n${experiencias}${fundamentacion}`;
    },
    []
  );

  const generateDraftT2 = useCallback(
    (
      items: EvaluationItemRow[],
      omrResults: OMRResultRow[],
      _answers: GuidedAnswers
    ): string => {
      if (items.length === 0)
        return '(Selecciona una evaluación para generar el borrador)';

      // Estrategia de monitoreo: indicadores
      const indicadores = items
        .map((item, i) => {
          const skill = item.cognitive_skill ?? 'sin clasificar';
          return `  Indicador ${i + 1}: [${skill}] ${item.question_text}`;
        })
        .join('\n');

      let seccionEstrategia = `ESTRATEGIA DE MONITOREO\n\nIndicadores de evaluación:\n${indicadores}`;

      // Resultados OMR si existen
      if (omrResults.length > 0) {
        const general = omrResults.find(
          (r) => r.skill_tag === 'promedio_general'
        );
        if (general) {
          seccionEstrategia += `\n\nRESULTADOS DEL MONITOREO\nEstudiantes evaluados: ${general.total_count}\nPorcentaje de logro promedio: ${general.pct_correct}%`;
          if (general.pct_correct >= 60) {
            seccionEstrategia += `\nLa mayoría de los estudiantes logró los aprendizajes evaluados.`;
          } else {
            seccionEstrategia += `\nSe observan dificultades significativas en el logro de los aprendizajes.`;
          }
        }

        // Desglose por habilidad si hay más de un resultado
        const porHabilidad = omrResults.filter(
          (r) => r.skill_tag !== 'promedio_general'
        );
        if (porHabilidad.length > 0) {
          seccionEstrategia += `\n\nDesglose por habilidad:`;
          porHabilidad.forEach((r) => {
            seccionEstrategia += `\n  - ${r.skill_tag}: ${r.pct_correct}% (${r.correct_count}/${r.total_count})`;
          });
        }
      }

      const seccionAnalisis = `\n\n===== ANÁLISIS DE CAUSAS =====\n[Complete con sus respuestas a las preguntas guía de la sección T2 — Análisis de causas]\nExplique qué decisiones pedagógicas o situaciones contextuales favorecieron o dificultaron los resultados.`;

      const seccionAcciones = `\n\n===== USO FORMATIVO =====\n[Complete con sus respuestas a las preguntas guía de la sección T2 — Uso formativo]\nDescriba al menos 2 acciones de mejora. Al menos 1 debe involucrar a los estudiantes.`;

      return `TAREA 2 — EVALUACIÓN Y MONITOREO DE APRENDIZAJES\n\n${seccionEstrategia}${seccionAnalisis}${seccionAcciones}`;
    },
    []
  );

  const generateDraftT3 = useCallback((): string => {
    return `TAREA 3 — REFLEXIÓN SOBRE LA PRÁCTICA PEDAGÓGICA

===== APRENDIZAJE SOCIOEMOCIONAL =====
[Complete con sus respuestas a las preguntas guía de la sección T3]

1. IDENTIFICACIÓN DEL APRENDIZAJE SOCIOEMOCIONAL
Identifique qué aprendizaje socioemocional necesitan desarrollar sus estudiantes.
(Ej: regular emociones, tolerar frustración, trabajar colaborativamente, empatizar, reconocer fortalezas)

2. FUNDAMENTACIÓN CON COMPORTAMIENTO OBSERVADO
Describa los comportamientos concretos que observó en sus estudiantes este año que lo llevaron a identificar esa necesidad.

3. ACTITUD DOCENTE Y APORTE AL DESARROLLO SOCIOEMOCIONAL
Explique qué mantendría o modificaría de su actitud, forma de actuar o de relacionarse con sus estudiantes, y cómo eso aporta al desarrollo del aprendizaje socioemocional identificado.

4. (NIVEL DESTACADO) FACTORES DEL CONTEXTO
Relacione factores del contexto de sus estudiantes que pueden estar influyendo en su comportamiento. Plantee hipótesis sobre lo que podrían estar pensando y sintiendo.`;
  }, []);

  return { generateDraftT1, generateDraftT2, generateDraftT3 };
}
