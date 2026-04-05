# PRP-001: Output UTP-Ready — Exportador con Plantillas Institucionales

> **Estado**: EN PROGRESO
> **Fecha**: 2026-04-04
> **Proyecto**: EducMark

---

## Objetivo

Refactorizar los modulos de exportacion (`exportDocx.ts`, `htmlToPdf.ts`, `generateReport.ts`) para que todos los documentos exportados (planificaciones, tablas de especificaciones, reportes ejecutivos, hojas de respuestas) incluyan automaticamente el logo, nombre del colegio y membrete institucional del profesor. El documento se descarga listo para entregar a UTP/director, sin editar.

## Por Que

| Problema | Solucion |
|----------|----------|
| Los documentos exportados salen "genericos" — sin logo ni membrete del colegio. El profe tiene que abrir Word/Canva y agregar el logo a mano antes de entregar a UTP | Todos los exports inyectan automaticamente el branding institucional (logo + nombre + colores) desde el perfil del usuario o `institution_settings` |
| El profe pierde 5-15 min por documento formateando para que parezca "oficial" | El documento baja listo. Cero edicion. Entrega directa |
| El LogoUploader solo existe en AnswerSheet — no sirve para planificaciones ni reportes | Un sistema unificado de branding institucional que alimenta TODOS los exports |

**Valor de negocio**: Diferenciador clave para conversion. "El documento sale con TU logo" es tangible e inmediato. Reduce friccion post-generacion (el profe ya no tiene que "arreglar" el archivo). Fortalece el argumento de venta para coordinadores UTP que exigen formato oficial.

## Que

### Criterios de Exito
- [ ] El profe puede subir logo + nombre de institucion desde su perfil (o settings institucionales)
- [ ] El logo/membrete aparece en exports DOCX (planificaciones)
- [ ] El logo/membrete aparece en exports PDF (reportes ejecutivos, reportes de alumno, cobertura semestral)
- [ ] El logo/membrete aparece en exports HTML (presentaciones ejecutivas, documentos editables)
- [ ] La hoja de respuestas (AnswerSheet) sigue funcionando como antes con su LogoUploader existente, pero TAMBIEN puede leer el logo del perfil como default
- [ ] Si no hay logo configurado, los documentos se exportan igual que hoy (sin romper nada)
- [ ] `npm run typecheck` y `npm run build` pasan sin errores

### Comportamiento Esperado (Happy Path)

1. **Configuracion (una vez):** El profe va a su perfil o settings de institucion. Sube el logo de su colegio (PNG/JPG, max 2MB). Escribe el nombre oficial del establecimiento. Opcionalmente ajusta color primario.
2. **Exportacion:** Cuando el profe descarga cualquier documento (planificacion DOCX, reporte PDF, presentacion HTML), el sistema:
   - Lee el branding institucional del perfil/institution_settings
   - Inyecta logo en esquina superior izquierda (o centrado segun formato)
   - Agrega nombre del colegio como subtitulo/encabezado
   - Mantiene "Generado por EducMark" como footer discreto
3. **Override por documento:** En AnswerSheet, el LogoUploader existente permite override manual (diferente logo para una evaluacion especifica). Si no se sube logo manual, usa el del perfil.
4. **Sin logo:** Si el profe no ha configurado nada, todo funciona exactamente igual que hoy.

---

## Contexto

### Referencias

- `src/shared/lib/exportDocx.ts` — Export DOCX de planificaciones (docx lib). Actualmente sin logo ni branding.
- `src/shared/lib/htmlToPdf.ts` — Export PDF/HTML generico (html2pdf.js). Funciones: `downloadHtmlAsPdf`, `downloadUrlAsPdf`, `downloadUrlAsHtml`. Sin branding.
- `src/shared/lib/generateReport.ts` — Reportes PDF (jsPDF + autotable). 4 funciones exportadas:
  - `downloadExecutivePresentationHTML` — Presentacion HTML slides
  - `generateExecutiveReport` — PDF ejecutivo (ya carga logo EducMark hardcodeado de `/images/logo-full.png`)
  - `generateStudentReport` — PDF por alumno
  - `generateSemesterCoverageReport` — Cobertura semestral
- `src/features/summative/components/AnswerSheet/LogoUploader.tsx` — Componente drag-and-drop para subir logo. Devuelve `dataUrl`. Patron a expandir.
- `src/features/summative/components/AnswerSheet/answerSheetTemplate.ts` — Template HTML con `institutionLogo` opcional.
- `src/features/summative/components/AnswerSheet/AnswerSheetPreview.tsx` — Usa `logo` prop para inyectar en template.
- `src/features/admin/components/InstitutionSettings.tsx` — Admin ya guarda `branding_logo_url` y `branding_primary_color` en `institution_settings`.

### Tablas Existentes Relevantes

```sql
-- user_profiles: tiene 'institution' TEXT pero NO tiene logo_url
CREATE TABLE user_profiles (
  ...
  institution TEXT,
  ...
);

-- institution_settings: YA tiene branding_logo_url y branding_primary_color
CREATE TABLE institution_settings (
  ...
  institution TEXT NOT NULL,
  branding_logo_url TEXT,
  branding_primary_color TEXT DEFAULT '#a48fff',
  ...
);
```

### Arquitectura Propuesta

No crear nueva feature folder. Esto es una mejora transversal a `shared/lib/` + un hook/servicio de branding:

```
src/shared/
├── lib/
│   ├── exportDocx.ts          # MODIFICAR: aceptar InstitutionBranding param
│   ├── htmlToPdf.ts           # MODIFICAR: inyectar header con branding
│   ├── generateReport.ts      # MODIFICAR: reemplazar logo hardcodeado por institucional
│   └── institutionBranding.ts # NUEVO: tipo + fetcher de branding desde Supabase
│
src/shared/hooks/
│   └── useInstitutionBranding.ts  # NUEVO: hook React que lee branding del usuario actual
│
src/features/summative/components/AnswerSheet/
│   └── LogoUploader.tsx       # MODIFICAR: aceptar defaultLogo desde branding
```

### Modelo de Datos

```sql
-- Agregar logo_url a user_profiles para profes individuales (sin institution_settings)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS institution_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS institution_display_name TEXT;

-- institution_settings ya tiene branding_logo_url — no requiere cambios
```

**Logica de resolucion del logo (cascada):**
1. Override manual en el componente (ej: LogoUploader en AnswerSheet) → prioridad maxima
2. `institution_settings.branding_logo_url` si el profe pertenece a una institucion configurada
3. `user_profiles.institution_logo_url` para profes individuales
4. `null` → sin logo, comportamiento actual

---

## Blueprint (Assembly Line)

> IMPORTANTE: Solo definir FASES. Las subtareas se generan al entrar a cada fase.

### Fase 1: Migracion SQL + Tipo InstitutionBranding
**Objetivo**: Agregar columnas a `user_profiles`, crear tipo TypeScript `InstitutionBranding` y funcion fetcher que resuelve la cascada logo/nombre desde Supabase.
**deps**: []
**Validacion**: `npm run typecheck` pasa. El fetcher retorna branding correcto en tests manuales via Supabase.

### Fase 2: Hook useInstitutionBranding
**Objetivo**: Hook React que carga el branding del usuario autenticado (con cache) y lo expone como `{ logo: string | null, institutionName: string | null, primaryColor: string | null, loading: boolean }`.
**deps**: [1]
**Validacion**: Hook retorna datos correctos en un componente de prueba.

### Fase 3: Refactorizar exportDocx.ts
**Objetivo**: `exportPlanningToDocx` acepta parametro opcional `InstitutionBranding`. Si presente, agrega logo como imagen en header + nombre del colegio debajo del titulo. Si ausente, comportamiento identico al actual.
**deps**: [1]
**Validacion**: Export DOCX con branding muestra logo y nombre. Sin branding, igual que antes.

### Fase 4: Refactorizar generateReport.ts
**Objetivo**: Las 4 funciones de reporte aceptan `InstitutionBranding` opcional. `generateExecutiveReport` reemplaza el logo EducMark hardcodeado por el logo institucional (si existe). Los demas reportes inyectan el logo en su header.
**deps**: [1]
**Validacion**: PDF ejecutivo muestra logo del colegio. Presentacion HTML muestra logo. Reporte alumno y cobertura semestral muestran logo.

### Fase 5: Refactorizar htmlToPdf.ts
**Objetivo**: `downloadHtmlAsPdf` y `downloadUrlAsHtml` aceptan `InstitutionBranding` opcional. Inyectan un header HTML con logo + nombre antes del contenido.
**deps**: [1]
**Validacion**: HTML exportado incluye header institucional. PDF generado desde HTML tiene el logo.

### Fase 6: Integrar branding en componentes consumidores
**Objetivo**: Todos los componentes que llaman a las funciones de export ahora usan `useInstitutionBranding()` y pasan el branding al exportador. LogoUploader recibe `defaultLogo` del hook. Componentes afectados:
- `AnswerSheetGenerator.tsx` / `AnswerSheetPreview.tsx`
- `DashboardOverview.tsx`
- `History.tsx`
- `Overview.tsx`
- `AssessmentAnalytics.tsx`
- `FeedbackDashboard.tsx`
- `CurriculumCoverage.tsx`
- `QuickScanSheet.tsx`
**deps**: [2, 3, 4, 5]
**Validacion**: Cada punto de export inyecta branding automaticamente.

### Fase 7: UI de configuracion de branding en perfil
**Objetivo**: Agregar seccion de "Branding Institucional" en el perfil del profesor (reusar LogoUploader) para que suba su logo y nombre de colegio. Guardar en `user_profiles.institution_logo_url` y `institution_display_name`. Upload va a Supabase Storage.
**deps**: [2]
**Validacion**: El profe puede subir logo desde su perfil. El logo aparece en la siguiente exportacion.

### Fase 8: Validacion Final
**Objetivo**: Sistema funcionando end-to-end.
**deps**: [6, 7]
**Validacion**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] Export DOCX planificacion con logo institucional
- [ ] Export PDF reporte ejecutivo con logo institucional
- [ ] Export HTML presentacion con logo institucional
- [ ] Export PDF hoja de respuestas con logo (default del perfil)
- [ ] Sin logo configurado: todo funciona igual que antes
- [ ] Criterios de exito cumplidos

### Dependency Graph

```
Fase 1: SQL + Tipo               deps: []
Fase 2: Hook                     deps: [1]
Fase 3: exportDocx               deps: [1]
Fase 4: generateReport           deps: [1]
Fase 5: htmlToPdf                deps: [1]
Fase 6: Integrar componentes     deps: [2, 3, 4, 5]
Fase 7: UI perfil                deps: [2]
Fase 8: Validacion Final         deps: [6, 7]

Ejecucion:
              ┌── Fase 2 ──┬── Fase 6 ──┐
              │             │            │
  Fase 1 ────┼── Fase 3 ──┘            ├── Fase 8
              │                          │
              ├── Fase 4 ──────────────┘
              │                          
              └── Fase 5 ──────────────  
                                         
              Fase 7 ──── (deps: [2]) ──┘
```

---

## Aprendizajes (Self-Annealing)

> Esta seccion CRECE con cada error encontrado durante la implementacion.

_(vacio — se llena durante ejecucion)_

---

## Gotchas

- [ ] `generateExecutiveReport` ya carga `/images/logo-full.png` como logo EducMark. Hay que reemplazar por logo institucional pero mantener EducMark como fallback o footer
- [ ] El logo en `institution_settings.branding_logo_url` es una URL (texto). El `LogoUploader` devuelve un dataUrl (base64). La funcion de resolucion debe manejar ambos formatos
- [ ] Para DOCX (docx lib), agregar imagen requiere el buffer/base64, no una URL. Hay que fetch + convertir si el logo viene como URL
- [ ] Supabase Storage para logo requiere bucket publico o URL firmada. Decidir en Fase 7
- [ ] Los reportes PDF con jsPDF usan `doc.addImage` que acepta base64 — compatible
- [ ] html2pdf.js renderiza imagenes via html2canvas — necesita CORS habilitado si el logo viene de Supabase Storage

## Anti-Patrones

- NO crear nuevos patrones si los existentes funcionan (reusar LogoUploader)
- NO ignorar errores de TypeScript
- NO hardcodear URLs de logo (usar la cascada de resolucion)
- NO romper exports existentes — todo debe ser backward-compatible (branding opcional)
- NO subir logos sin validacion de tamano/formato (ya existe en LogoUploader, reusar)

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
