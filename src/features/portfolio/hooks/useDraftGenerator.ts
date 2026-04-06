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
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * planning_blocks en la BD puede ser:
 * - {} (objeto vacío — clases antiguas)
 * - { objective, indicators, inicio, desarrollo, cierre, resources } (clases con datos)
 */
function extractFromBlocks(blocks: unknown): {
  objective: string;
  inicio: string;
  desarrollo: string;
  cierre: string;
  indicators: string[];
} {
  const empty = { objective: '', inicio: '', desarrollo: '', cierre: '', indicators: [] };
  if (!blocks || typeof blocks !== 'object') return empty;
  const b = blocks as Record<string, unknown>;
  return {
    objective: typeof b.objective === 'string' ? b.objective : '',
    inicio: typeof b.inicio === 'string' ? b.inicio : '',
    desarrollo: typeof b.desarrollo === 'string' ? b.desarrollo : '',
    cierre: typeof b.cierre === 'string' ? b.cierre : '',
    indicators: Array.isArray(b.indicators) ? b.indicators.filter(Boolean).map(String) : [],
  };
}

export function useDraftGenerator() {
  const generateDraftT1 = useCallback(
    (classes: GeneratedClassRow[], _answers: GuidedAnswers): string => {
      if (classes.length === 0)
        return '(Selecciona al menos 1 experiencia de aprendizaje para generar el borrador)';

      const experiencias = classes
        .map((c, i) => {
          const num = i + 1;
          const tema = c.topic ?? '(sin tema)';
          const fecha = formatDate(c.created_at);
          const pb = extractFromBlocks(c.planning_blocks);
          const hasBlocks = !!(pb.objective || pb.inicio || pb.desarrollo);

          const lines: string[] = [
            `EXPERIENCIA DE APRENDIZAJE ${num}`,
            `Tema: ${tema}`,
            `Fecha de implementación: ${fecha}`,
            `Duración estimada: 90 minutos`,
          ];

          // Objetivo: si está en planning_blocks usarlo, si no pedir al profe
          if (pb.objective) {
            lines.push(`\nObjetivo(s) de la experiencia:\n${pb.objective}`);
          } else if (c.objetivo_clase) {
            lines.push(`\nObjetivo(s) de la experiencia:\n${c.objetivo_clase}`);
          } else {
            lines.push(`\nObjetivo(s) de la experiencia:\n[Escriba aquí el objetivo de aprendizaje que trabajó en esta experiencia. Debe incluir habilidad + conocimiento. Ej: "Analizar las causas y consecuencias de la Revolución Neolítica, a partir de fuentes primarias y secundarias."]`);
          }

          // Actividades: si hay bloques inicio/desarrollo/cierre, usarlos
          lines.push(`\nDescripción de las actividades para el aprendizaje:`);
          if (hasBlocks) {
            if (pb.inicio) lines.push(`Inicio: ${pb.inicio}`);
            if (pb.desarrollo) lines.push(`Desarrollo: ${pb.desarrollo}`);
            if (pb.cierre) lines.push(`Cierre: ${pb.cierre}`);
          } else {
            lines.push(`[Describa las actividades que realizaron los estudiantes en esta experiencia. Incluya instrucciones, preguntas, recursos y cómo atendió la diversidad del grupo.]`);
            lines.push(`(Puede revisar su planificación generada por EducMark para esta clase como referencia.)`);
          }

          // Indicadores si existen
          if (pb.indicators.length > 0) {
            lines.push(`\nIndicadores de monitoreo:`);
            pb.indicators.forEach((ind, j) => lines.push(`  ${j + 1}. ${ind}`));
          }

          return lines.join('\n');
        })
        .join('\n\n' + '─'.repeat(50) + '\n\n');

      const fundamentacion = [
        '',
        '═'.repeat(50),
        'FUNDAMENTACIÓN DE LA PLANIFICACIÓN',
        '═'.repeat(50),
        '',
        '[Complete esta sección respondiendo las preguntas guía de la pestaña "T1 — Diversidad"]',
        '',
        'Debe vincular:',
        '• Las oportunidades de aprendizaje que ofreció a sus estudiantes',
        '• Con al menos 2 tipos de características del grupo:',
        '  - Características de aprendizaje (ritmos, conocimientos previos, habilidades)',
        '  - Contexto sociocultural (etnia, nacionalidad, comunidad)',
        '  - Experiencias e intereses (gustos, aficiones, historias de vida)',
      ].join('\n');

      return `TAREA 1 — PLANIFICACIÓN DE LA ENSEÑANZA PARA TODOS Y TODAS LOS/AS ESTUDIANTES\n\n${experiencias}${fundamentacion}`;
    },
    []
  );

  const generateDraftT2 = useCallback(
    (
      items: EvaluationItemRow[],
      omrResults: OMRResultRow[],
      _answers: GuidedAnswers
    ): string => {
      const lines: string[] = [
        'TAREA 2 — EVALUACIÓN FORMATIVA',
        '',
        '═'.repeat(50),
        'A. ESTRATEGIA DE MONITOREO DEL APRENDIZAJE',
        '═'.repeat(50),
      ];

      if (items.length > 0) {
        lines.push('', 'Indicadores de evaluación:');
        items.forEach((item, i) => {
          const skill = item.cognitive_skill ?? 'sin clasificar';
          const text = item.question_text.length > 120
            ? item.question_text.slice(0, 120) + '...'
            : item.question_text;
          lines.push(`  ${i + 1}. [${skill}] ${text}`);
        });
        lines.push('', 'Actividad para monitorear:');
        lines.push('[Describa la actividad que implementó para recoger evidencia de estos indicadores. Detalle preguntas, instrucciones y cómo los estudiantes demostraron su aprendizaje.]');
      } else {
        lines.push('', '[Seleccione una evaluación en el paso anterior para pre-llenar los indicadores]');
        lines.push('', 'Si no tiene evaluación en EducMark, describa aquí:');
        lines.push('- Los indicadores de evaluación que utilizó');
        lines.push('- La actividad que implementó para monitorear');
      }

      // Resultados OMR
      if (omrResults.length > 0) {
        lines.push('', '─'.repeat(50));
        lines.push('RESULTADOS DEL MONITOREO (datos OMR)');
        const general = omrResults.find((r) => r.skill_tag === 'promedio_general');
        if (general) {
          lines.push(`Estudiantes evaluados: ${general.total_count}`);
          lines.push(`Porcentaje de logro promedio: ${general.pct_correct}%`);
        }
      }

      // Sección B: Análisis
      lines.push(
        '', '═'.repeat(50),
        'B. ANÁLISIS Y USO FORMATIVO DE LA EVALUACIÓN',
        '═'.repeat(50),
        '',
        'a) Análisis de resultados:',
        '[Complete respondiendo las preguntas guía de "T2 — Análisis de causas"]',
        '• ¿Qué aprendizajes se observaron en mejor nivel?',
        '• ¿Qué diferencias observó entre estudiantes?',
        '• ¿Qué errores fueron frecuentes?',
        '',
        'b) Causas de los resultados:',
        '[Explique sus decisiones pedagógicas Y situaciones contextuales que influyeron]',
        '',
        'c) Acciones realizadas:',
        '[Complete respondiendo las preguntas guía de "T2 — Uso formativo"]',
        '• Describa al menos 2 acciones concretas',
        '• Al menos 1 debe involucrar a los estudiantes en la mejora'
      );

      return lines.join('\n');
    },
    []
  );

  const generateDraftT3 = useCallback((): string => {
    return [
      'TAREA 3 — REFLEXIÓN EN TORNO AL DESARROLLO DE APRENDIZAJES SOCIOEMOCIONALES',
      '',
      '[Complete respondiendo las preguntas guía de la pestaña "T3 — Reflexión socioemocional"]',
      '',
      '═'.repeat(50),
      'a) ¿Qué aprendizaje socioemocional considera necesario promover?',
      '═'.repeat(50),
      '',
      'Identifique UN aprendizaje socioemocional y fundamente POR QUÉ sus estudiantes lo necesitan desarrollar.',
      'Refiera a:',
      '• El comportamiento que observó en situaciones concretas de este año',
      '• Qué cree que estaban pensando y sintiendo los estudiantes',
      '• Información del contexto que ayuda a entender la situación',
      '',
      'Ejemplos de aprendizajes socioemocionales: regular emociones, tolerar la frustración,',
      'trabajar en colaboración, empatizar, reconocer fortalezas, comunicarse efectivamente.',
      '',
      '[Escriba aquí su respuesta]',
      '',
      '═'.repeat(50),
      'b) ¿Qué mantendría o modificaría de sus actitudes?',
      '═'.repeat(50),
      '',
      'Explique qué mantendría o modificaría de su actitud, forma de actuar o de',
      'relacionarse con sus estudiantes, y explique CÓMO eso podría aportar al',
      'desarrollo del aprendizaje socioemocional señalado.',
      '',
      '[Escriba aquí su respuesta]',
    ].join('\n');
  }, []);

  return { generateDraftT1, generateDraftT2, generateDraftT3 };
}
