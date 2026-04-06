# PRP-004: Output Portafolio Carrera Docente

> **Estado**: PENDIENTE
> **Fecha**: 2026-04-05
> **Proyecto**: EducMark

---

## Objetivo

Agregar un modo "Portafolio Carrera Docente" que genere **borradores de texto editables para cada tarea del Módulo 1** del portafolio de docentemas.cl, apuntando a nivel Competente/Destacado según las rúbricas oficiales 2025. No es un export PDF. No es un sistema nuevo. Es reempaquetar los datos que EducMark ya genera, con el lenguaje exacto que pide la rúbrica.

## Por Qué

| Problema | Solución |
|----------|----------|
| Profes preguntan "¿EducMark sirve para Carrera Docente?" y la respuesta actual es "no directamente" | Generar borradores de texto por tarea del Módulo 1 desde datos ya existentes |
| El portafolio se completa como texto en docentemas.cl — no es un PDF para subir | Cambiar el output: de "exportar PDF" a "generar borrador de texto por tarea" |
| Los 7 indicadores del Módulo 1 usan lenguaje técnico MBE que el profe no domina | Templates con las preguntas exactas de la rúbrica + texto pre-llenado con datos reales |
| La reflexión socioemocional (T3) es lo que más angustia — no tienen guía | Template con preguntas basadas en neuroeducación (Céspedes/Maturana) |
| Profes pasan fines de semana armando el portafolio desde cero | Un click para obtener el borrador alineado a los indicadores de la rúbrica |

**Valor de negocio**:
- Diferenciador brutal vs ChatGPT (no conoce las rúbricas 2025 de docentemas.cl)
- Hook de conversión: "¿Este año te toca Carrera Docente? Genera tu borrador de portafolio en minutos con los datos de tus clases"
- Aumenta retención: profes que usan EducMark para el portafolio no cancelan hasta después de la evaluación
- Mercado: ~50,000 profes evaluados por año en Chile

## Qué

### Estructura Real del Portafolio (Manual 2025)

El portafolio tiene **5 tareas en 3 módulos**, completadas como texto en la plataforma docentemas.cl:

| Módulo | Tarea | Formato | Descripción |
|--------|-------|---------|-------------|
| Módulo 1 | T1 Planificación | Texto | 3 experiencias de aprendizaje + fundamentación diversidad |
| Módulo 1 | T2 Evaluación formativa | Texto | Estrategia de monitoreo + análisis de resultados |
| Módulo 1 | T3 Reflexión socioemocional | Texto | Identificar aprendizaje SEL + fundamentar + cómo aporta |
| Módulo 2 | T4 Clase grabada | Video 40min + ficha | El profe graba la clase y completa ficha descriptiva |
| Módulo 3 | T5 Trabajo colaborativo | Texto | Actividad obligatoria + voluntaria |

**EducMark solo puede apoyar el Módulo 1 (las 3 tareas de texto).** El Módulo 2 (video) lo graba el profe. El Módulo 3 depende de su contexto institucional.

### Criterios de Éxito

- [ ] El profe puede seleccionar una unidad/periodo y obtener borradores de texto para T1, T2 y T3
- [ ] Cada borrador está alineado a los indicadores exactos de la rúbrica (nivel Competente/Destacado)
- [ ] Los borradores se pre-llenan con datos reales de EducMark (planificaciones, evaluaciones, OMR)
- [ ] El profe puede editar cada borrador en el wizard antes de copiarlo a docentemas.cl
- [ ] Las secciones que requieren texto libre del profe tienen preguntas guía visibles
- [ ] Funciona con datos que el profe ya generó — no requiere crear nada nuevo

### Mapeo: 7 Indicadores Módulo 1 → EducMark

| Indicador (rúbrica oficial) | Nivel Competente requiere | EducMark provee | Tipo |
|-----------------------------|--------------------------|-----------------|------|
| Formulación de objetivos | Habilidades + conocimientos claros en TODOS los objetivos | OA tridimensional (ya lo genera) | Auto |
| Relación actividades-objetivos | TODAS las actividades coherentes con los objetivos | Planificación de clase con actividades y OA | Auto |
| Fundamentación diversidad | Vincular oportunidades con 2+ tipos de características | Template guiado con preguntas (el profe completa) | Template |
| Estrategia de monitoreo | Indicadores observables + actividad coherente con propósito | Tabla de especificaciones + descripción de evaluación | Auto |
| Análisis de monitoreo | Analizar resultados + explicar causas pedagógicas | Datos OMR agregados por pregunta/habilidad | Auto+Template |
| Uso formativo | 2+ acciones + involucrar a estudiantes en el proceso | Template guiado (el profe describe acciones tomadas) | Template |
| Reflexión socioemocional | Identificar aprendizaje + fundamentar + explicar cómo aporta | Template guiado con preguntas neuroeducación | Template |

### Comportamiento Esperado (Happy Path)

```
1. Profe va a Dashboard → botón "Preparar Portafolio Carrera Docente"
2. Wizard — Paso 1: selecciona asignatura + curso + rango de fechas (unidad)
3. Wizard — Paso 2: sistema muestra clases generadas en ese periodo
   → Pre-selecciona las 3 más recientes o el profe elige cuáles representan sus 3 experiencias de aprendizaje
4. Wizard — Paso 3: sistema detecta evaluaciones y resultados OMR vinculados
5. Sistema genera borradores por tarea:

   [T1 — Planificación]
   → Auto-llena: descripción de las 3 experiencias con OA tridimensional + actividades
   → Template guiado: preguntas para que el profe escriba la fundamentación de diversidad
   → Texto final: borrador T1 listo para copiar a docentemas.cl

   [T2 — Evaluación Formativa]
   → Auto-llena: descripción de la estrategia de monitoreo con indicadores de la tabla de especificaciones
   → Auto-llena (si hay OMR): análisis de resultados por pregunta/habilidad
   → Template guiado: preguntas para que el profe explique causas y acciones formativas
   → Texto final: borrador T2 listo para copiar a docentemas.cl

   [T3 — Reflexión Socioemocional]
   → Template guiado: 3 preguntas basadas en neuroeducación (Céspedes/Maturana)
   → El profe escribe libremente con las preguntas visibles como guía
   → Texto final: borrador T3 listo para copiar a docentemas.cl

6. Preview de los 3 borradores con editor inline
7. Botón "Copiar T1" / "Copiar T2" / "Copiar T3" → clipboard listo para pegar en docentemas.cl
```

---

## Contexto

### Referencias de Código Existente
- `src/features/dashboard/components/Generator.tsx` — wizard de planificación (patrón a seguir)
- `src/features/dashboard/components/KitResult.tsx` — editor de planificación existente
- `src/features/summative/components/SpecificationTable.tsx` — tabla de especificaciones
- `src/features/summative/store/useTestDesignerStore.ts` — estado de evaluaciones

### Datos Existentes que Alimentan los Borradores

```sql
-- Planificaciones del profe (alimenta T1)
SELECT id, lesson_objective, activities, oa_label, skills, attitudes, created_at
FROM generated_classes
WHERE user_id = $1 AND asignatura = $2 AND curso = $3
ORDER BY created_at DESC;

-- Evaluaciones asociadas (alimenta T2 estrategia)
SELECT id, title, subject, grade, specification_table, created_at
FROM evaluations
WHERE user_id = $1 AND subject = $2 AND grade = $3;

-- Resultados OMR agregados (alimenta T2 análisis)
SELECT question_number, skill_tag, correct_count, total_count,
       ROUND(correct_count::numeric / total_count * 100, 1) AS pct_correct
FROM omr_results
WHERE evaluation_id = $2
ORDER BY question_number;
```

### Arquitectura Propuesta (Feature-First)

```
src/features/portfolio/
├── components/
│   ├── PortfolioWizard.tsx          # Wizard principal (3 pasos)
│   ├── PortfolioPreview.tsx         # Vista previa de los 3 borradores
│   ├── TaskDraftEditor.tsx          # Editor inline por tarea (T1, T2, T3)
│   └── GuidedQuestions.tsx          # Componente de preguntas guía (template)
├── hooks/
│   ├── usePortfolioBuilder.ts       # Lógica de armado (queries + agregación de datos)
│   └── useDraftGenerator.ts         # Genera texto borrador desde datos + templates
├── services/
│   └── portfolioService.ts          # Queries a Supabase
├── store/
│   └── usePortfolioStore.ts         # Estado del wizard y los borradores
├── types/
│   └── portfolio.ts                 # Interfaces
└── data/
    ├── rubricaIndicadores.ts         # 7 indicadores con texto exacto de la rúbrica
    └── templatePreguntas.ts          # Preguntas guía por tarea
```

### Modelo de Datos

```sql
-- Tabla principal: borradores guardados
CREATE TABLE portfolio_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,                    -- "Portafolio 7°B Historia 2026"
  asignatura TEXT NOT NULL,
  curso TEXT NOT NULL,
  periodo TEXT,                           -- "Primer Semestre 2026"
  status TEXT DEFAULT 'borrador',         -- borrador | listo
  selected_classes UUID[] DEFAULT '{}',   -- IDs de generated_classes incluidas
  selected_evaluation UUID,               -- ID de evaluation principal
  draft_t1 TEXT DEFAULT '',               -- Borrador T1 (texto completo)
  draft_t2 TEXT DEFAULT '',               -- Borrador T2
  draft_t3 TEXT DEFAULT '',               -- Borrador T3
  guided_answers JSONB DEFAULT '{}',      -- Respuestas del profe a preguntas guía
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE portfolio_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own portfolio drafts"
  ON portfolio_drafts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_portfolio_drafts_user ON portfolio_drafts(user_id);
```

### Templates de Preguntas Guía (por Tarea)

```typescript
// data/templatePreguntas.ts
export const TEMPLATE_PREGUNTAS = {

  t1_diversidad: {
    tarea: "T1 — Fundamentación Diversidad",
    indicador: "Fundamentación de las oportunidades de aprendizaje en función de las características de los estudiantes",
    nivel_competente: "Vincula las oportunidades de aprendizaje con 2 o más tipos de características de los estudiantes.",
    preguntas: [
      "¿Qué características académicas de tus estudiantes consideraste al diseñar estas experiencias? (ritmos de aprendizaje, nivel previo, dificultades frecuentes)",
      "¿Qué características socioemocionales o contextuales influyeron en tu planificación? (motivación, contexto familiar, diversidad cultural)",
      "¿Cómo se refleja esa consideración en las actividades o en las formas de acceder al aprendizaje?"
    ]
  },

  t2_uso_formativo: {
    tarea: "T2 — Uso Formativo de los Resultados",
    indicador: "Uso de la información recogida para mejorar los aprendizajes",
    nivel_competente: "Describe 2 o más acciones realizadas a partir de los resultados e involucra a los estudiantes en el proceso.",
    preguntas: [
      "¿Qué hiciste con los resultados del monitoreo? Describe al menos 2 acciones concretas que tomaste.",
      "¿Cómo comunicaste a los estudiantes sus resultados y qué rol tuvieron ellos en la mejora?"
    ]
  },

  t2_analisis_causas: {
    tarea: "T2 — Análisis del Monitoreo",
    indicador: "Análisis de los resultados del monitoreo del aprendizaje",
    nivel_competente: "Analiza los resultados obtenidos y explica causas pedagógicas que los originan.",
    preguntas: [
      "¿Qué explica pedagógicamente que algunos estudiantes no hayan logrado el objetivo? (¿fue la instrucción, el tiempo, el nivel de la actividad?)",
      "¿Qué patrón de error fue más frecuente y qué te dice sobre cómo se enseñó el contenido?"
    ]
  },

  t3_socioemocional: {
    tarea: "T3 — Reflexión Socioemocional",
    indicador: "Reflexión sobre el aprendizaje socioemocional propio",
    nivel_competente: "Identifica un aprendizaje socioemocional, lo fundamenta y explica cómo aporta a su práctica.",
    preguntas: [
      "¿Qué aprendiste sobre ti mismo como docente durante estas experiencias? (en términos de emociones, reacciones o vínculos con tus estudiantes)",
      "¿Por qué crees que ese fue un aprendizaje significativo para ti? ¿Qué lo generó?",
      "¿Cómo ese aprendizaje cambia o mejora tu práctica pedagógica cotidiana?"
    ]
  }

};
```

---

## Blueprint (Assembly Line)

### Fase 1: Migración SQL + Tipos
**Objetivo**: Crear tabla `portfolio_drafts` con RLS + interfaces TypeScript  
**deps**: []  
**Validación**: Tabla existe en Supabase, types generados (`npm run typecheck` pasa), RLS funciona

### Fase 2: Servicio + Hook de datos
**Objetivo**: `portfolioService.ts` con queries para obtener clases + evaluaciones + resultados OMR por usuario/asignatura/periodo. Hook `usePortfolioBuilder.ts` que agrega los datos y detecta qué está disponible (¿hay OMR? ¿hay evaluación?).  
**deps**: [1]  
**Validación**: Hook retorna datos correctos para un usuario de prueba

### Fase 3: Wizard de selección (3 pasos)
**Objetivo**: `PortfolioWizard.tsx` — (1) asignatura + curso + periodo, (2) elegir hasta 3 clases como experiencias de aprendizaje, (3) confirmar evaluación + resultados OMR vinculados  
**deps**: [2]  
**Validación**: El wizard carga clases reales, permite seleccionar y avanza entre pasos

### Fase 4: Generador de borradores + Templates
**Objetivo**: `useDraftGenerator.ts` toma los datos seleccionados y genera texto borrador para T1, T2 y T3. Las secciones "auto" se pre-llenan con datos reales; las secciones "template" muestran preguntas de `templatePreguntas.ts` con campo editable. `GuidedQuestions.tsx` renderiza las preguntas guía con textarea por cada respuesta.  
**deps**: [3]  
**Validación**: Se generan los 3 borradores con datos reales pre-llenados y preguntas guía visibles

### Fase 5: Preview + Editor + Copy to Clipboard
**Objetivo**: `PortfolioPreview.tsx` muestra los 3 borradores lado a lado con `TaskDraftEditor.tsx` para edición inline. Botones "Copiar T1 / T2 / T3" copian el texto al clipboard con una nota al pie: *"Borrador generado por EducMark — editar antes de pegar en docentemas.cl"*. Los borradores se guardan automáticamente en `portfolio_drafts`.  
**deps**: [4]  
**Validación**: Editor funciona, clipboard funciona, datos se persisten en Supabase

### Fase 6: Integración Dashboard + Validación Final
**Objetivo**: Agregar botón "Preparar Portafolio Carrera Docente" en el Dashboard. Ruta `/dashboard/portfolio`. Flujo end-to-end funcional.  
**deps**: [5]  
**Validación**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] Flujo completo: seleccionar unidad → generar borradores → editar → copiar
- [ ] Los 3 borradores contienen datos reales de EducMark + lenguaje de la rúbrica
- [ ] Criterios de éxito cumplidos

```
Ejecución:
  Fase 1 ──→ Fase 2 ──→ Fase 3 ──→ Fase 4 ──→ Fase 5 ──→ Fase 6
  (secuencial — cada fase depende de la anterior)
```

---

## Gotchas

- [ ] El portafolio se completa en docentemas.cl como texto — el output son borradores editables, NO un PDF para subir
- [ ] Si el profe no tiene OMR, la sección de análisis de T2 muestra solo las preguntas guía (sin datos pre-llenados)
- [ ] Si el profe tiene menos de 3 clases, permitir continuar — la rúbrica pide "hasta 3 experiencias", no exactamente 3
- [ ] Los borradores deben tener un disclaimer visible: "Borrador generado con datos de EducMark — revisa y ajusta antes de enviarlo"
- [ ] Las preguntas de la rúbrica son públicas (Manual Portafolio 2025) — se pueden usar literalmente
- [ ] No inventar texto libre — solo el profe sabe qué ocurrió en su sala. El sistema provee datos + estructura, el profe provee el juicio pedagógico
- [ ] `guided_answers` en JSONB permite guardar las respuestas parciales del profe y retomarlas luego

## Anti-Patrones

- NO generar un PDF para subir a Carrera Docente — el portafolio se escribe en docentemas.cl, no se sube como archivo
- NO intentar cubrir Módulo 2 (video) ni Módulo 3 (trabajo colaborativo) — solo Módulo 1 es automatizable
- NO crear texto de reflexión inventado — el template guía al profe para que él escriba con su propio juicio
- NO replicar datos de `generated_classes` o `evaluations` — solo referenciar por ID, generar texto en runtime
- NO agregar más de una tabla nueva — `portfolio_drafts` es suficiente
- NO llamar a este feature "portafolio completo" — es apoyo al Módulo 1, ser explícito con el profe

---

*PRP pendiente aprobación. No se ha modificado código.*
