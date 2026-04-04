# PRP-001: Correccion Rapida OMR

> **Estado**: COMPLETADO
> **Fecha**: 2026-04-04
> **Proyecto**: EducMark

---

## Objetivo

Permitir a los docentes corregir evaluaciones externas (no creadas en EducMark) usando el scanner OMR existente, sin depender de una evaluacion registrada en la BD. El profe define manualmente la pauta de respuestas correctas, genera una hoja de respuesta generica, escanea y obtiene resultados.

## Por Que

| Problema | Solucion |
|----------|----------|
| El OMR actual requiere una evaluacion creada en EducMark (tabla `evaluations` + `evaluation_items`) para funcionar. Si el profe tiene una prueba hecha en Word, no puede usar el scanner. | Nueva opcion "Correccion Rapida" que permite definir la pauta manualmente sin evaluacion previa, generar una hoja de respuesta generica, escanear y obtener resultados. |
| Muchos profes ya tienen sus pruebas hechas y no van a recrearlas en EducMark solo para corregir con OMR. Es una barrera de entrada alta. | Eliminamos la barrera: llegan, definen pauta, imprimen hoja, escanean. Valor inmediato sin friccion. |

**Valor de negocio**: Captura profes que aun no confian en la generacion IA pero quieren la correccion automatica. Es la puerta de entrada perfecta — una vez que ven lo rapido que es corregir, exploran el resto. Reduce la barrera de adopcion a casi cero. Meta: que los 100 usuarios pioneros puedan corregir CUALQUIER prueba desde dia 1.

## Que

### Criterios de Exito
- [ ] El flujo actual de correccion con evaluaciones internas de EducMark sigue funcionando sin cambios
- [ ] Un profe puede definir una pauta manual (N preguntas V/F + M preguntas SM con respuestas correctas) sin tener una evaluacion en la BD
- [ ] Se puede generar/descargar una hoja de respuesta generica (sin QR de evaluacion) para imprimir
- [ ] El scanner OMR procesa la hoja generica y muestra resultados (puntaje, respuestas detectadas vs correctas)
- [ ] Los resultados de correccion rapida se pueden guardar opcionalmente (asociados al usuario, no a una evaluacion)
- [ ] El punto de entrada es claro e intuitivo desde el Dashboard de Evaluaciones

### Comportamiento Esperado (Happy Path)

1. Profe entra al modulo de Evaluaciones Sumativas
2. En el dashboard ve un boton/card "Correccion Rapida" (junto a las opciones existentes)
3. Hace click y entra a un flujo nuevo con 3 pasos:
   - **Paso 1 — Definir Pauta**: Ingresa cantidad de preguntas V/F y SM, y marca las respuestas correctas (UI identica a la "Pauta de Correccion" actual del OMR scanner)
   - **Paso 2 — Generar Hoja** (opcional): Puede generar y descargar/imprimir una hoja de respuesta generica con la cantidad de preguntas configurada. Si ya tiene hojas impresas, salta este paso
   - **Paso 3 — Escanear**: Usa la camara o sube imagen. El backend OMR procesa igual que siempre. Se muestran resultados con puntaje
4. Puede escanear multiples hojas en modo rafaga (batch) con la misma pauta
5. Resultados se guardan en `omr_results` con `evaluation_id = NULL` o un identificador especial tipo `quick-scan-{uuid}`

---

## Contexto

### Referencias

- `src/features/summative/components/OMRScanner/` — Scanner actual completo (Setup, Camera, Preview, Processing, Result phases)
- `src/features/summative/components/OMRScanner/phases/SetupPhase.tsx` — UI de setup que hoy REQUIERE seleccionar evaluacion
- `src/features/summative/components/OMRScanner/WebOMRScanner.tsx` — Orquestador del scanner, carga evaluaciones de BD, auto-carga pauta
- `src/features/summative/services/omrProcessing.ts` — Logica de procesamiento OMR (API calls, score calculation, image compression)
- `src/features/summative/types/omrScanner.ts` — Tipos compartidos (CorrectAnswers, EvaluationOption, etc.)
- `src/features/summative/components/AnswerSheet/AnswerSheetGenerator.tsx` — Generador de hojas de respuesta (hoy vinculado a evaluaciones)
- `src/features/summative/components/AnswerSheet/AnswerSheetPreview.tsx` — Preview y HTML de la hoja
- `src/features/summative/components/SummativeAssessmentPage.tsx` — Pagina principal que orquesta todas las vistas (ViewType union)
- `src/features/summative/components/DashboardOverview.tsx` — Dashboard con cards de acceso rapido

### Dependencias criticas

- **Assessment API** (`NEXT_PUBLIC_ASSESSMENT_API_URL`): El backend OMR es un servicio externo que recibe la imagen y retorna las respuestas detectadas. NO se modifica — solo se reutiliza.
- **Tabla `omr_results`**: Hoy tiene `evaluation_id TEXT NOT NULL`. Necesita permitir NULL o un valor sentinel para scans sin evaluacion.

### Arquitectura Propuesta

NO se crea una feature nueva. Se extiende `src/features/summative/` con componentes adicionales:

```
src/features/summative/
├── components/
│   ├── OMRScanner/              # Existente — NO SE TOCA el flujo interno
│   │   ├── WebOMRScanner.tsx    # Se mantiene intacto
│   │   └── phases/              # Se mantienen intactas
│   │
│   ├── QuickScan/               # NUEVO — Flujo de correccion rapida
│   │   ├── QuickScanFlow.tsx    # Orquestador del flujo (3 pasos)
│   │   ├── QuickScanSetup.tsx   # Paso 1: definir pauta manualmente
│   │   ├── QuickScanSheet.tsx   # Paso 2: generar hoja generica (reutiliza AnswerSheetPreview)
│   │   └── QuickScanScanner.tsx # Paso 3: wrapper del scanner OMR sin evaluacion
│   │
│   ├── AnswerSheet/             # Existente — se reutiliza AnswerSheetPreview
│   ├── DashboardOverview.tsx    # Se modifica: agregar card "Correccion Rapida"
│   └── SummativeAssessmentPage.tsx # Se modifica: agregar ViewType 'quick-scan'
│
└── types/
    └── omrScanner.ts            # Se extiende: agregar tipo QuickScanConfig
```

### Modelo de Datos

```sql
-- Opcion 1 (preferida): Hacer evaluation_id nullable en omr_results
ALTER TABLE public.omr_results ALTER COLUMN evaluation_id DROP NOT NULL;

-- Agregar columna para identificar scans rapidos
ALTER TABLE public.omr_results ADD COLUMN IF NOT EXISTS scan_type TEXT DEFAULT 'evaluation';
-- scan_type: 'evaluation' (actual) | 'quick' (correccion rapida)

-- Agregar columna para guardar la pauta usada (solo quick scans, la evaluacion interna ya tiene su pauta en evaluation_items)
ALTER TABLE public.omr_results ADD COLUMN IF NOT EXISTS answer_key JSONB;
-- answer_key: { "tf": ["V","F","V",...], "mc": ["A","C","B",...] }

-- Agregar user_id para poder filtrar quick scans por usuario
ALTER TABLE public.omr_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Indice para queries de quick scan por usuario
CREATE INDEX IF NOT EXISTS idx_omr_results_user_scan_type ON public.omr_results(user_id, scan_type);
```

**Nota**: Los resultados de evaluaciones internas siguen usando `evaluation_id` para vincular. Los quick scans usan `user_id` + `scan_type = 'quick'`.

---

## Blueprint (Assembly Line)

> IMPORTANTE: Solo definir FASES. Las subtareas se generan al entrar a cada fase
> siguiendo el bucle agentico (mapear contexto -> generar subtareas -> ejecutar)

### Fase 1: Migracion SQL
**Objetivo**: Extender tabla `omr_results` para soportar scans sin evaluacion
**deps**: []
**Validacion**: Migracion aplicada, `omr_results` acepta `evaluation_id = NULL`, columnas `scan_type`, `answer_key`, `user_id` existen. Datos existentes no se pierden (scan_type default 'evaluation').

### Fase 2: Componentes QuickScan UI
**Objetivo**: Crear el flujo visual completo de correccion rapida (setup pauta + generacion hoja + scanner) reutilizando componentes existentes
**deps**: []
**Validacion**: Los 3 componentes renderizan correctamente. La pauta se puede definir manualmente. La hoja generica se puede descargar como PDF.

### Fase 3: Integracion con Scanner OMR
**Objetivo**: Conectar el flujo QuickScan con el backend OMR existente. Los quick scans se procesan igual que los normales pero sin requerer evaluacion en BD. Persistir resultados en `omr_results` con scan_type='quick'.
**deps**: [1, 2]
**Validacion**: Un scan rapido llega al backend, retorna respuestas detectadas, calcula puntaje, y se guarda en BD con scan_type='quick'.

### Fase 4: Integracion en Dashboard
**Objetivo**: Agregar punto de entrada "Correccion Rapida" en el dashboard de evaluaciones y en la navegacion. Agregar ViewType 'quick-scan' en SummativeAssessmentPage.
**deps**: [2]
**Validacion**: Desde el dashboard se puede acceder al flujo QuickScan. El flujo actual de evaluaciones internas no se ve afectado.

### Fase 5: Validacion Final
**Objetivo**: Sistema funcionando end-to-end, ambos flujos (interno + rapido) operativos
**deps**: [1, 2, 3, 4]
**Validacion**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] Flujo evaluacion interna sigue funcionando sin cambios
- [ ] Flujo quick scan: definir pauta -> generar hoja -> escanear -> ver resultados
- [ ] Resultados quick scan se guardan en BD con scan_type='quick'
- [ ] Criterios de exito cumplidos

### Dependency Graph

```
Fase 1: Migracion SQL          deps: []
Fase 2: Componentes UI         deps: []
Fase 3: Integracion Scanner    deps: [1, 2]
Fase 4: Dashboard Entry        deps: [2]
Fase 5: Validacion Final       deps: [1, 2, 3, 4]

Ejecucion:
  ┌─── Fase 1 ───┐
  │               ├──→ Fase 3 ──┐
  └─── Fase 2 ──┬┘              ├──→ Fase 5
                 └──→ Fase 4 ──┘
     (paralelo)      (parcial)     (join)
```

---

## Aprendizajes (Self-Annealing)

> Esta seccion CRECE con cada error encontrado durante la implementacion.

_(Vacia — se llena durante la implementacion)_

---

## Gotchas

- [ ] `omr_results.evaluation_id` es TEXT NOT NULL hoy — la migracion debe cambiar a nullable sin romper datos existentes
- [ ] El backend Assessment API espera la imagen y retorna respuestas detectadas — NO necesita saber si es quick scan o no. Verificar que no valide evaluationId server-side.
- [ ] La hoja de respuesta generica NO tendra QR con evaluationId (el QR actual codifica datos de la evaluacion). Puede tener un QR simplificado o no tener QR.
- [ ] RLS en `omr_results` hoy probablemente filtra por evaluation_id. Los quick scans necesitan filtrarse por user_id — verificar politicas RLS.
- [ ] El AnswerSheetPreview actual recibe datos de evaluacion (subject, grade, unit, oa). La version generica debe funcionar con datos minimos o genericos.

## Anti-Patrones

- NO modificar WebOMRScanner.tsx ni sus phases — el flujo de evaluaciones internas debe quedar intacto
- NO crear un backend OMR separado — reusar el Assessment API existente
- NO duplicar logica de procesamiento — importar desde `omrProcessing.ts`
- NO hardcodear limites de preguntas — reutilizar las constantes existentes (max 20 V/F, max 60 SM)
- NO ignorar errores de TypeScript
- NO omitir validacion Zod en inputs de usuario

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
