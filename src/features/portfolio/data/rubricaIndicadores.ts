// 7 indicadores del Módulo 1 con texto exacto de las rúbricas oficiales 2025
// Fuente: Rúbricas Docentemás 2025 (CPEIP/Mineduc)

import type { RubricIndicator } from '../types/portfolio';

export const RUBRICA_INDICADORES: RubricIndicator[] = [
  {
    id: 'formulacion_objetivos',
    name: 'Formulación de objetivos de aprendizaje',
    tarea: 'T1',
    type: 'auto',
    nivel_competente:
      'Todos los objetivos propuestos para las experiencias dan cuenta claramente de las habilidades y conocimientos que el/la docente se propuso alcanzar con sus estudiantes.',
    nivel_destacado:
      'Cumple con el nivel Competente y, además: Logra integrar conocimientos, habilidades y actitudes en objetivos propuestos para sus experiencias.',
  },
  {
    id: 'relacion_actividades_objetivos',
    name: 'Relación entre actividades y objetivos',
    tarea: 'T1',
    type: 'auto',
    nivel_competente:
      'En todas las experiencias: todos los objetivos son abordados a través de actividades que el/la docente propone a sus estudiantes, y todas las actividades se relacionan con los objetivos.',
    nivel_destacado:
      'Cumple con el nivel Competente y, además: En alguna de las experiencias de aprendizaje, propone al menos una actividad contextualizada que permite a los/as estudiantes comprender el sentido, importancia o utilidad de los aprendizajes propuestos.',
  },
  {
    id: 'fundamentacion_diversidad',
    name: 'Fundamentación de la planificación de una experiencia de aprendizaje',
    tarea: 'T1',
    type: 'template',
    nivel_competente:
      'El/la docente fundamenta la pertinencia de la experiencia de aprendizaje planificada, vinculando las variadas oportunidades que ofrece a sus estudiantes para participar y avanzar en el aprendizaje propuesto, con las diferencias que existen entre sus estudiantes, refiriendo al menos a dos tipos de características: de aprendizaje, del contexto sociocultural y otras asociadas a sus experiencias e intereses.',
    nivel_destacado:
      'Cumple con el nivel Competente y, además: En su fundamentación el/la docente explica cómo en la experiencia promueve que los/as estudiantes respeten o valoren la diversidad. O bien, logra reflexionar sobre su propia práctica en relación con el enfoque inclusivo.',
  },
  {
    id: 'estrategia_monitoreo',
    name: 'Estrategia de monitoreo de los aprendizajes',
    tarea: 'T2',
    type: 'auto',
    nivel_competente:
      'Todos los indicadores de evaluación dan cuenta de conductas observables, relacionadas con el(los) Objetivo(s) de Aprendizaje que se propuso abordar. Y la actividad implementada para monitorear permite recoger evidencia de todos los indicadores de evaluación que contempló.',
    nivel_destacado:
      'Cumple con el nivel Competente y, además: En la estrategia de monitoreo el/la docente ofrece distintas formas o alternativas para que los/as estudiantes puedan demostrar sus aprendizajes.',
  },
  {
    id: 'analisis_monitoreo',
    name: 'Análisis a partir del monitoreo de los aprendizajes',
    tarea: 'T2',
    type: 'auto+template',
    nivel_competente:
      'El/la docente analiza distintos resultados de aprendizaje que observa durante el monitoreo, es decir, da cuenta de aspectos logrados, no logrados y/o diferencias entre los desempeños de sus estudiantes. Y explica las posibles causas, es decir, por qué sus decisiones pedagógicas o situaciones contextuales favorecieron o dificultaron al menos un resultado de aprendizaje observado.',
    nivel_destacado:
      'Cumple con el nivel Competente y, además: Explica los resultados de aprendizaje observados en sus estudiantes considerando causas de distinta naturaleza: tanto sus decisiones pedagógicas como situaciones contextuales.',
  },
  {
    id: 'uso_formativo',
    name: 'Uso formativo de la información recogida a partir del monitoreo',
    tarea: 'T2',
    type: 'template',
    nivel_competente:
      'El/la docente propone al menos dos acciones orientadas a mejorar los aprendizajes observados, y al menos una de ellas promueve que los/as estudiantes se involucren en la mejora de sus aprendizajes.',
    nivel_destacado:
      'Cumple con el nivel Competente y, además: Propone acciones que se hacen cargo tanto de quienes tienen dificultades como de quienes han logrado los aprendizajes.',
  },
  {
    id: 'reflexion_socioemocional',
    name: 'Reflexión en torno al desarrollo de aprendizajes socioemocionales',
    tarea: 'T3',
    type: 'template',
    nivel_competente:
      'El/la docente identifica cuál es el aprendizaje socioemocional y fundamenta por qué sus estudiantes lo necesitan desarrollar, a partir del comportamiento que observó en sus estudiantes. Y identifica qué mantendría o qué modificaría de su actitud, forma de actuar o de relacionarse, explicando cómo esto podría aportar al desarrollo del aprendizaje socioemocional.',
    nivel_destacado:
      'Cumple con el nivel Competente y, además: A partir de la observación de los y las estudiantes, el/la docente relaciona distintos factores que pueden estar influyendo en su comportamiento y plantea hipótesis sobre lo que podrían estar pensando y sintiendo.',
  },
];
