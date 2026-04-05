// Preguntas guía por tarea del Módulo 1, alineadas a las rúbricas oficiales 2025
// El profe responde estas preguntas y el sistema genera el borrador de texto

export interface TemplateSection {
  id: string;
  tarea: string;
  indicador: string;
  nivel_competente: string;
  preguntas: {
    key: string;
    pregunta: string;
    placeholder: string;
  }[];
}

export const TEMPLATE_PREGUNTAS: TemplateSection[] = [
  {
    id: 't1_diversidad',
    tarea: 'T1 — Fundamentación de la planificación',
    indicador:
      'Fundamentación de la pertinencia de las estrategias de enseñanza con la diversidad del grupo',
    nivel_competente:
      'Vincular las oportunidades de aprendizaje con al menos 2 tipos de características de los estudiantes (aprendizaje, contexto sociocultural, experiencias e intereses).',
    preguntas: [
      {
        key: 'caract_aprendizaje',
        pregunta:
          '¿Qué características de aprendizaje de tus estudiantes consideraste al diseñar estas experiencias? (conocimientos previos, ritmos, habilidades del nivel, formas de aprendizaje)',
        placeholder:
          'Ej: En mi curso hay estudiantes con diferentes ritmos de aprendizaje. Algunos dominan la lectura de fuentes primarias y otros aún necesitan apoyo para comprender textos extensos...',
      },
      {
        key: 'caract_contexto',
        pregunta:
          '¿Qué características del contexto sociocultural o de las experiencias e intereses de tus estudiantes influyeron en tu planificación? (etnia, nacionalidad, gustos, aficiones, contexto familiar)',
        placeholder:
          'Ej: Mi curso tiene estudiantes de origen haitiano y venezolano, por lo que incluí actividades que valoran la diversidad cultural...',
      },
      {
        key: 'como_vincula',
        pregunta:
          '¿Cómo las actividades que diseñaste permiten que TODOS tus estudiantes participen y avancen, considerando esas diferencias?',
        placeholder:
          'Ej: Diseñé actividades con distintos niveles de complejidad y ofrecí múltiples formas de demostrar el aprendizaje: presentación oral, infografía o texto escrito...',
      },
    ],
  },
  {
    id: 't2_analisis_causas',
    tarea: 'T2 — Análisis a partir del monitoreo',
    indicador:
      'Análisis de resultados de aprendizaje e identificación de causas pedagógicas y contextuales',
    nivel_competente:
      'Analizar distintos resultados (logrados, no logrados, diferencias) y explicar por qué las decisiones pedagógicas o situaciones contextuales favorecieron o dificultaron al menos un resultado.',
    preguntas: [
      {
        key: 'causas_pedagogicas',
        pregunta:
          '¿Qué decisiones pedagógicas tuyas explican estos resultados? (instrucción, tiempo, nivel de la actividad, recursos usados)',
        placeholder:
          'Ej: El tiempo que dediqué a la explicación del procedimiento fue insuficiente. Los estudiantes que trabajaron con material concreto lograron mejor el objetivo que los que solo usaron la guía...',
      },
      {
        key: 'causas_contextuales',
        pregunta:
          '¿Qué situaciones contextuales influyeron en los resultados? (asistencia, clima de aula, eventos externos, características del grupo)',
        placeholder:
          'Ej: La semana de la evaluación coincidió con las olimpiadas del colegio, lo que afectó la asistencia y concentración del grupo...',
      },
    ],
  },
  {
    id: 't2_uso_formativo',
    tarea: 'T2 — Uso formativo de la información',
    indicador:
      'Acciones orientadas a la mejora de los aprendizajes a partir del monitoreo',
    nivel_competente:
      'Describir al menos 2 acciones concretas orientadas a mejorar los aprendizajes, y al menos una de ellas debe involucrar a los estudiantes en la mejora.',
    preguntas: [
      {
        key: 'accion_1',
        pregunta:
          'Describe una acción concreta que realizaste para mejorar los aprendizajes después del monitoreo (actividad, explicación, metodología, recurso)',
        placeholder:
          'Ej: Reorganicé los grupos de trabajo para que estudiantes con mejor desempeño guiaran a sus compañeros en la resolución de ejercicios similares...',
      },
      {
        key: 'accion_2_estudiantes',
        pregunta:
          'Describe otra acción en la que los estudiantes se involucraron en la mejora de sus propios aprendizajes',
        placeholder:
          'Ej: Pedí a cada estudiante que identificara su error más frecuente en la evaluación y escribiera qué estrategia usaría para mejorar. Luego lo compartieron con un compañero...',
      },
      {
        key: 'accion_avanzados',
        pregunta:
          '(Para nivel Destacado) ¿Hiciste algo específico para los estudiantes que SÍ lograron los aprendizajes? Describe',
        placeholder:
          'Ej: A los estudiantes que dominaban el contenido les asigné el rol de tutores y les propuse un desafío de aplicación más complejo...',
      },
    ],
  },
  {
    id: 't3_socioemocional',
    tarea: 'T3 — Reflexión socioemocional',
    indicador:
      'Reflexión sobre el desarrollo de aprendizajes socioemocionales en los estudiantes',
    nivel_competente:
      'Identificar un aprendizaje socioemocional que los estudiantes necesitan desarrollar, fundamentarlo con comportamientos observados, y explicar cómo sus actitudes/formas de actuar aportan a ese desarrollo.',
    preguntas: [
      {
        key: 'aprendizaje_sel',
        pregunta:
          '¿Qué aprendizaje socioemocional consideras que tus estudiantes necesitan desarrollar? (Ej: regular emociones, tolerar frustración, trabajar en colaboración, empatizar, reconocer fortalezas)',
        placeholder:
          'Ej: Mis estudiantes necesitan desarrollar la tolerancia a la frustración...',
      },
      {
        key: 'comportamiento_observado',
        pregunta:
          '¿Qué comportamiento observaste en tus estudiantes que te llevó a identificar esa necesidad? Describe situaciones concretas de este año',
        placeholder:
          'Ej: Cuando reciben una calificación baja, varios estudiantes reaccionan con enojo, rompen la prueba o se niegan a revisar sus errores. En una actividad grupal, un estudiante se frustró porque su grupo no seguía su idea y dejó de participar...',
      },
      {
        key: 'actitud_docente',
        pregunta:
          '¿Qué mantendrías o modificarías de tu actitud, forma de actuar o de relacionarte con tus estudiantes para facilitar ese aprendizaje socioemocional? Explica CÓMO eso aporta',
        placeholder:
          'Ej: Mantendría el espacio de conversación grupal que hago al inicio de cada clase, porque les permite expresar cómo se sienten. Modificaría mi reacción cuando se frustran: en vez de pedirles que se calmen, les preguntaría qué están sintiendo y qué les ayudaría...',
      },
      {
        key: 'factores_contexto',
        pregunta:
          '(Para nivel Destacado) ¿Qué factores del contexto de tus estudiantes pueden estar influyendo en ese comportamiento? ¿Qué crees que están pensando y sintiendo?',
        placeholder:
          'Ej: Varios de mis estudiantes viven en contextos donde el error se castiga. Creo que cuando se frustran, están sintiendo miedo al juicio de sus pares y pensando que equivocarse significa que no son capaces...',
      },
    ],
  },
];
