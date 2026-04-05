# PRP-003: SEO Programatico MINEDUC

> **Estado**: COMPLETADO
> **Fecha**: 2026-04-04
> **Proyecto**: EducMark

---

## Objetivo

Generar ~2,400 paginas estaticas SEO a partir de la estructura curricular chilena (curriculumData.json), creando rutas dinamicas `/planificaciones/[asignatura]/[nivel]/[oa]` que funcionen como mini-landing pages con contenido util y CTA al registro. Cada pagina se genera en build time con `generateStaticParams` para maximo rendimiento SEO.

## Por Que

| Problema | Solucion |
|----------|----------|
| EducMark tiene ~15 paginas SEO manuales. Los profesores buscan en Google por OA especifico ("OA 3 Historia 7 basico") y no encuentran EducMark | 2,400+ paginas estaticas que capturan long-tail keywords de cada combinacion asignatura x nivel x OA del curriculum chileno |
| Cada pagina SEO actual es un componente React artesanal (~200 lineas). No escala | Un solo template dinamico que se alimenta del JSON curricular existente (567KB, 2,438 OAs) |
| Los profesores buscan planificaciones por OA especifico, no por producto generico | Cada pagina muestra el OA real, actividades sugeridas, indicadores de evaluacion, y un CTA contextualizado ("Genera tu planificacion para OA 3 de Historia 7° Basico") |

**Valor de negocio**: Capturar trafico organico long-tail de profesores chilenos que buscan planificaciones por OA especifico. Con 2,400 paginas indexadas, EducMark domina el nicho de "planificacion + OA + nivel" en Google Chile. Cada pagina es un embudo de conversion pasivo que trabaja 24/7.

## Que

### Criterios de Exito
- [ ] `generateStaticParams` genera las ~2,400 rutas a partir de curriculumData.json
- [ ] Cada pagina tiene metadata unica (title, description, canonical, og:image)
- [ ] Cada pagina muestra: nombre del OA, descripcion completa, asignatura, nivel, unidad, actividades sugeridas, indicadores de evaluacion, y CTA al registro
- [ ] `npm run build` completa exitosamente con todas las paginas estaticas generadas
- [ ] Sitemap.ts incluye todas las rutas programaticas
- [ ] Lighthouse SEO score >= 95 en paginas de muestra
- [ ] Las paginas existentes (`/planificaciones-mineduc`, `/generador-clases-chile`) siguen funcionando y linkean a las nuevas paginas

### Comportamiento Esperado

**Happy Path — Profesor busca en Google:**

1. Profesor googlea "planificacion OA 3 historia 7 basico"
2. Google muestra la pagina `/planificaciones/historia/7-basico/oa-3`
3. La pagina carga instantaneamente (estatica, sin JS necesario para contenido)
4. El profesor ve:
   - Breadcrumb: Planificaciones > Historia > 7° Basico > OA 3
   - Titulo: "Planificacion para OA 3 — Historia 7° Basico"
   - Descripcion completa del OA (desde curriculumData.json)
   - Unidad a la que pertenece
   - Actividades sugeridas (contenido semi-estatico generado en build)
   - Indicadores de evaluacion
   - CTA: "Genera esta planificacion completa en 6 minutos" → /login?tab=register
5. Internal links a otros OAs de la misma asignatura/nivel
6. Internal links a la pagina padre `/planificaciones/historia/7-basico`

**Navegacion jerarquica:**

```
/planificaciones                          → Hub: todas las asignaturas
/planificaciones/[asignatura]             → Hub: todos los niveles de esa asignatura
/planificaciones/[asignatura]/[nivel]     → Lista de OAs por unidad
/planificaciones/[asignatura]/[nivel]/[oa]  → Mini-landing del OA especifico
```

---

## Contexto

### Referencias
- `src/app/(public)/planificaciones-mineduc/page.tsx` — Pagina SEO manual existente (patron de metadata + componente)
- `src/features/seo/components/PlanificacionesMINEDUC.tsx` — Componente landing SEO (patron de UI: navbar, hero, CTA, schema.org)
- `src/shared/lib/staticCurriculum.ts` — Loader del JSON curricular (tipos: OA, Unit, Curriculum)
- `src/shared/constants/curriculum.ts` — SUBJECTS (16), GRADES (12), ELECTIVES_LIST (11)
- `public/data/curriculumData.json` — 567KB, 12 grados, 127 combinaciones asignatura-nivel, 502 unidades, 2,438 OAs
- `src/app/sitemap.ts` — Sitemap actual con ~15 rutas estaticas

### Data disponible en curriculumData.json
```typescript
// Estructura:
{
  "7° Básico": {
    "Historia, Geografía y Ciencias Sociales": [
      {
        "name": "Unidad 1: ...",
        "oas": [
          { "id": "OA 1", "description": "Explicar el proceso de..." }
        ]
      }
    ]
  }
}

// Numeros reales:
// 12 grados (1° Basico a IV Medio)
// 127 combinaciones grado x asignatura
// 502 unidades
// 2,438 OAs (paginas leaf)
// Total paginas: ~2,438 (OA) + 127 (nivel) + ~16 (asignatura) + 1 (hub) = ~2,582
```

### Arquitectura Propuesta

```
src/
├── app/(public)/planificaciones/
│   ├── page.tsx                              # Hub principal (todas las asignaturas)
│   ├── [asignatura]/
│   │   ├── page.tsx                          # Hub de asignatura (todos los niveles)
│   │   └── [nivel]/
│   │       ├── page.tsx                      # Lista de OAs por unidad
│   │       └── [oa]/
│   │           └── page.tsx                  # Mini-landing del OA (LEAF PAGE)
│
├── features/seo/
│   ├── components/
│   │   ├── PlanificacionesHub.tsx            # Componente hub principal
│   │   ├── AsignaturaHub.tsx                 # Componente hub asignatura
│   │   ├── NivelPage.tsx                     # Lista de OAs de un nivel
│   │   └── OALanding.tsx                     # Mini-landing del OA individual
│   ├── lib/
│   │   ├── curriculumSEO.ts                  # Helpers: slugify, generateStaticParams, metadata
│   │   └── oaContentGenerator.ts             # Genera actividades/indicadores para cada OA
│   └── types/
│       └── seo.ts                            # Tipos para las rutas programaticas
```

**Decisiones clave:**

1. **Leer JSON en build time via `fs`**, no via `fetch('/data/...')`. El staticCurriculum actual usa fetch (client-side). Para generateStaticParams necesitamos leerlo con fs desde el server.

2. **Slugs legibles**: "historia-geografia-y-ciencias-sociales" / "7-basico" / "oa-1-unidad-1". Necesitan un mapper bidireccional (slug ↔ nombre real en JSON).

3. **Contenido semi-estatico**: Actividades sugeridas e indicadores de evaluacion se generan con templates predefinidos por asignatura/nivel (NO con IA en build time — costaria demasiado para 2,400 paginas). Se pueden enriquecer progresivamente con IA despues.

4. **Schema.org**: Cada pagina incluye EducationalOccupationalProgram o Course schema para rich snippets.

5. **Internal linking**: Cada pagina leaf linkea a sus hermanos (otros OAs del mismo nivel), a su padre (nivel), y al hub de asignatura. Esto crea una malla SEO fuerte.

### Modelo de Datos

No requiere tablas nuevas en Supabase. Todo se genera desde `curriculumData.json` en build time.

---

## Blueprint (Assembly Line)

> IMPORTANTE: Solo definir FASES. Las subtareas se generan al entrar a cada fase.

### Fase 1: Infraestructura SEO — Lib de slugs y lectura server-side del curriculum
**Objetivo**: Crear `curriculumSEO.ts` con funciones para: (a) leer curriculumData.json via fs en server, (b) slugificar nombres de asignaturas/niveles/OAs, (c) mapear slug → dato real, (d) generar arrays para generateStaticParams en cada nivel de ruta.
**deps**: []
**Validacion**: Unit test o script que genera los ~2,582 param combos y los imprime correctamente.

### Fase 2: Paginas leaf — Ruta `/planificaciones/[asignatura]/[nivel]/[oa]`
**Objetivo**: Crear la ruta dinamica con generateStaticParams + generateMetadata + componente OALanding. Cada pagina muestra: breadcrumb, OA completo, unidad, actividades sugeridas (template), indicadores (template), CTA al registro, links a OAs hermanos.
**deps**: [1]
**Validacion**: `npm run build` genera las ~2,438 paginas. Una pagina de muestra tiene metadata correcta, contenido visible, CTA funcional.

### Fase 3: Paginas hub — Rutas `/planificaciones`, `/planificaciones/[asignatura]`, `/planificaciones/[asignatura]/[nivel]`
**Objetivo**: Crear las 3 paginas intermedias con generateStaticParams + contenido. Hub principal lista asignaturas. Hub asignatura lista niveles. Pagina nivel lista OAs agrupados por unidad.
**deps**: [1]
**Validacion**: Navegacion completa desde hub hasta leaf funciona. Cada nivel tiene metadata unica.

### Fase 4: Sitemap + Internal Linking + Schema.org
**Objetivo**: Actualizar sitemap.ts para incluir las ~2,582 rutas programaticas. Agregar links desde paginas SEO existentes (`/planificaciones-mineduc`, `/generador-clases-chile`) hacia los hubs. Agregar schema.org (JSON-LD) a las paginas leaf.
**deps**: [2, 3]
**Validacion**: Sitemap generado incluye todas las URLs. Schema.org valida en Google Rich Results Test. Links internos funcionan.

### Fase 5: Validacion Final
**Objetivo**: Sistema funcionando end-to-end
**deps**: [1, 2, 3, 4]
**Validacion**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso (genera ~2,582 paginas estaticas)
- [ ] Pagina de muestra: Lighthouse SEO >= 95
- [ ] Sitemap incluye todas las rutas
- [ ] Internal linking funciona en todos los niveles
- [ ] Paginas existentes no se rompen
- [ ] Schema.org valida
- [ ] Criterios de exito cumplidos

### Dependency Graph

```
Fase 1: Lib slugs + server read    deps: []
Fase 2: Paginas leaf (OA)          deps: [1]
Fase 3: Paginas hub                deps: [1]
Fase 4: Sitemap + linking + schema deps: [2, 3]
Fase 5: Validacion Final           deps: [1, 2, 3, 4]

Ejecucion:
            ┌─── Fase 2 (leaf) ───┐
  Fase 1 ──┤                      ├──→ Fase 4 ──→ Fase 5
            └─── Fase 3 (hubs) ───┘
                  (paralelo)          (espera)    (espera)
```

---

## Aprendizajes (Self-Annealing)

> Esta seccion CRECE con cada error encontrado durante la implementacion.

_(Vacia — se llena durante la implementacion)_

---

## Gotchas

- [ ] `generateStaticParams` lee en build time — necesita `fs.readFileSync`, no `fetch`. El staticCurriculum.ts actual usa fetch (client-side), NO reusar directo
- [ ] Los nombres de asignaturas tienen tildes, espacios y caracteres especiales. Los slugs deben ser URL-safe y el mapper bidireccional debe ser robusto
- [ ] "OA 1" puede repetirse en distintas unidades del mismo nivel/asignatura. El slug debe incluir referencia a la unidad para ser unico (ej: `oa-1-unidad-1`)
- [ ] Build time con 2,400+ paginas puede ser largo. Verificar que no exceda el timeout de Vercel (funciones serverless) ni el build de Easypanel
- [ ] Nombres de asignaturas cambian segun el grado (ej: "Ciencias Naturales" en basica → "Ciencias para la Ciudadania" en media). El slug debe normalizarse
- [ ] Las electives de III-IV Medio tienen estructura diferente (ej: "Comprension Historica del Presente" es un electivo, no una asignatura base)
- [ ] CSP headers en next.config.ts: verificar que no bloqueen nada en las nuevas paginas
- [ ] El `output: 'standalone'` en next.config.ts funciona con paginas estaticas, pero verificar que generateStaticParams + standalone no tenga edge cases

## Anti-Patrones

- NO generar contenido con IA en build time (2,400 llamadas API = caro y lento)
- NO crear un componente diferente por asignatura — un solo template parametrizado
- NO hardcodear asignaturas/niveles — todo viene del JSON
- NO romper las paginas SEO existentes (`/planificaciones-mineduc`, `/generador-clases-chile`)
- NO crear rutas que colisionen con las existentes
- NO ignorar errores de TypeScript en los slug mappers

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
