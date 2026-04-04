---
name: bucle-agentico
description: "Ejecutar features complejas por fases con dependency graph, ejecucion paralela y cascade failure. Activar cuando la tarea toca multiples archivos, requiere cambios en BD + codigo + UI coordinados, tiene fases que dependen una de otra, o cuando un PRP fue aprobado y hay que implementarlo."
---

# Modo BLUEPRINT del Bucle Agentico

> "No planifiques lo que no entiendes. Mapea contexto, luego planifica."

El modo BLUEPRINT es para sistemas complejos que requieren construccion por fases con mapeo de contexto just-in-time.

---

## Cuando Usar BLUEPRINT

- La tarea requiere multiples componentes coordinados
- Involucra cambios en DB + codigo + UI
- Tiene fases que dependen una de otra
- Requiere entender contexto antes de implementar
- El sistema final tiene multiples partes integradas

### Ejemplos

```
"Sistema de autenticacion con roles y permisos"
"Feature de notificaciones en tiempo real"
"Dashboard con metricas y graficos"
"Sistema de facturacion con Stripe"
"CRUD completo de productos con imagenes"
"Migracion de arquitectura de componentes"
```

---

## La Innovacion Clave: Mapeo de Contexto Just-In-Time

### El Problema del Enfoque Tradicional

```
Recibir problema
    |
Generar TODAS las tareas y subtareas
    |
Ejecutar linealmente
```

**Problema**: Las subtareas se generan basandose en SUPOSICIONES, no en contexto real.

### El Enfoque BLUEPRINT

```
Recibir problema
    |
Generar solo FASES (sin subtareas)
    |
ENTRAR en Fase 1
    |
MAPEAR contexto real de Fase 1
    |
GENERAR subtareas basadas en contexto REAL
    |
Ejecutar Fase 1
    |
ENTRAR en Fase 2
    |
MAPEAR contexto (incluyendo lo construido en Fase 1)
    |
GENERAR subtareas de Fase 2
    |
... repetir ...
```

**Ventaja**: Cada fase se planifica con informacion REAL del estado actual del sistema.

---

## El Flujo BLUEPRINT: 6 Pasos

### PASO 1: CONSTRUIR DEPENDENCY GRAPH

```
+-------------------------------------------------------------+
|  PASO 1: CONSTRUIR DEPENDENCY GRAPH                          |
|                                                              |
|  - Entender el problema FINAL completo                       |
|  - Romper en FASES con dependencias explicitas               |
|  - Cada fase declara: deps: [N, M] o deps: []               |
|  - Identificar fases PARALELAS (deps: [] sin conflicto)     |
|  - NO generar subtareas todavia                              |
|  - Usar TodoWrite para registrar las fases                   |
+-------------------------------------------------------------+
```

Si existe un PRP aprobado, leer su Blueprint — el dependency graph ya esta definido ahi.
Si no existe PRP, construir el grafo ahora.

**Ejemplo de grafo:**

```
Fase 1: Migracion SQL           deps: []
Fase 2: Componentes UI base     deps: []
Fase 3: Hooks + Services        deps: [1, 2]
Fase 4: Integracion + Testing   deps: [3]

  ┌─── Fase 1 ───┐
  │               ├──→ Fase 3 ──→ Fase 4
  └─── Fase 2 ───┘
       (paralelo)     (join)      (secuencial)
```

### PASO 2: RESOLVER ORDEN DE EJECUCION

Leer el dependency graph y clasificar las fases en NIVELES:

```
Nivel 0: Fases con deps: []              → ejecutar en PARALELO
Nivel 1: Fases que dependen del Nivel 0  → ejecutar cuando Nivel 0 termine
Nivel 2: Fases que dependen del Nivel 1  → ejecutar cuando Nivel 1 termine
...
```

**Reglas de resolucion:**
- Fases en el MISMO nivel sin conflicto de archivos → PARALELO con Agent tool
- Fases en el mismo nivel que tocan los MISMOS archivos → SECUENCIAL
- Fases en niveles DIFERENTES → siempre SECUENCIAL (esperar dependencias)

### PASO 3: EJECUTAR NIVEL (PARALELO O SECUENCIAL)

**Si el nivel tiene UNA fase** → ejecutar directamente (secuencial clasico):

```
1. MAPEAR contexto de la fase (codebase, BD, lo construido antes)
2. GENERAR subtareas basadas en contexto REAL
3. EJECUTAR subtareas una por una
4. VALIDAR fase completa
```

**Si el nivel tiene MULTIPLES fases independientes** → ejecutar en PARALELO:

```
1. Lanzar cada fase como un Agent (subagente) independiente
2. Cada subagente recibe:
   - El objetivo de su fase
   - El contexto del PRP
   - Acceso a las mismas tools (Read, Write, Edit, Bash, MCPs)
3. Esperar a que TODOS los subagentes terminen
4. Recopilar resultados y verificar conflictos
5. Si hay conflictos de archivos → resolver manualmente antes de continuar
```

**Template de prompt para subagente paralelo:**

```
Eres un agente ejecutando la Fase N de un PRP.

CONTEXTO DEL PRP: [resumen del PRP]
TU FASE: [nombre y objetivo de la fase]
VALIDACION: [como verificar que tu fase esta completa]
FASES YA COMPLETADAS: [lista de fases anteriores y que construyeron]

PROCESO:
1. Mapear contexto real (leer archivos relevantes, verificar BD)
2. Generar subtareas especificas
3. Ejecutar cada subtarea
4. Validar resultado
5. Reportar: que construiste, que archivos tocaste, errores encontrados

REGLAS:
- NO tocar archivos fuera del scope de tu fase
- Si encuentras un error, arreglalo Y documentalo
- Reportar archivos modificados al final (para detectar conflictos)
```

### PASO 3.5: AUTO-BLINDAJE (cuando hay errores)

El sistema se BLINDA con cada error. Cuando algo falla:

1. **ARREGLA** el codigo
2. **TESTEA** que funcione
3. **DOCUMENTA** el aprendizaje:
   - En el PRP actual (seccion "Aprendizajes")
   - O en el skill relevante (`.claude/skills/*/SKILL.md`)
4. Continua con la subtarea

**Formato de documentacion:**

```markdown
### [YYYY-MM-DD]: [Titulo corto]
- **Error**: [Que fallo exactamente]
- **Fix**: [Como se arreglo]
- **Aplicar en**: [Donde mas aplica este conocimiento]
```

| Tipo de Error | Donde Documentar |
|---------------|------------------|
| Especifico de esta feature | PRP actual (seccion Aprendizajes) |
| Aplica a multiples features | Skill relevante (`.claude/skills/*/SKILL.md`) |
| Aplica a TODO el proyecto | `CLAUDE.md` (seccion No Hacer) |

### PASO 4: CASCADE FAILURE (cuando una fase falla)

Si una fase falla y no se puede resolver:

```
1. Marcar fase como FALLIDA
2. Buscar todas las fases que dependen de ella (directa o transitivamente)
3. Marcar dependientes como BLOQUEADAS
4. Reportar al usuario:
   - Que fase fallo y por que
   - Que fases estan bloqueadas
   - Opciones: reintentar, skip, abortar
5. Si el usuario elige reintentar → volver a ejecutar la fase
6. Si elige skip → eliminar dependencia y continuar (bajo riesgo del usuario)
7. Si elige abortar → detener ejecucion, guardar progreso
```

**Estados de fase:**

```
PENDIENTE → EN_PROGRESO → COMPLETADA
                       → FALLIDA → BLOQUEADA (propagado a dependientes)
```

### PASO 5: TRANSICIONAR AL SIGUIENTE NIVEL

- Confirmar que TODAS las fases del nivel actual estan COMPLETADAS
- Si hubo ejecucion paralela, verificar conflictos de archivos
- Avanzar al siguiente nivel del dependency graph
- El contexto ahora INCLUYE todo lo construido en niveles anteriores

Repetir PASO 3 para cada nivel hasta completar el grafo.

### PASO 6: VALIDACION FINAL

- Testing end-to-end del sistema completo
- `npm run typecheck` + `npm run build`
- Validacion visual con Playwright si aplica
- Confirmar que el problema ORIGINAL esta resuelto
- Reportar al usuario que se construyo

---

## Uso de MCPs en BLUEPRINT

Los MCPs se usan **durante la ejecucion**, no como pasos del plan.

### Durante Mapeo de Contexto

```
Supabase MCP:
  - list_tables -> Ver que tablas existen
  - execute_sql -> Verificar estructura actual

Codebase (Grep/Glob/Read):
  - Buscar patrones existentes
  - Entender estructura actual
```

### Durante Ejecucion de Subtareas

```
Next.js MCP:
  - get_errors -> Despues de escribir codigo
  - get_logs -> Si algo no funciona como esperado

Playwright MCP:
  - screenshot -> Validar UI despues de cambios visuales
  - click/fill -> Probar flujos completos

Supabase MCP:
  - apply_migration -> Crear/modificar tablas
  - execute_sql -> Verificar que datos se guardan
```

---

## Errores Comunes a Evitar

### Error 1: Generar todas las subtareas al inicio

```
MAL:
Fase 1: Auth base → 10 subtareas detalladas
Fase 2: Roles → 8 subtareas (basadas en SUPOSICIONES)

BIEN:
Fase 1: Auth base    deps: []   (sin subtareas)
Fase 2: UI base      deps: []   (sin subtareas)
Fase 3: Integracion  deps: [1,2]

→ Resolver niveles → Ejecutar Fase 1 y 2 en paralelo
→ MAPEAR contexto de Fase 3 (con lo que REALMENTE se construyo)
→ Generar subtareas → Ejecutar
```

### Error 2: Todo secuencial cuando hay fases independientes

```
MAL:
Fase 1 → esperar → Fase 2 → esperar → Fase 3 → esperar → Fase 4
(todo en serie, 4x mas lento)

BIEN:
Nivel 0: Fase 1 + Fase 2 (paralelo, ambas deps: [])
Nivel 1: Fase 3 (deps: [1,2], espera join)
Nivel 2: Fase 4 (deps: [3])
(2x mas rapido — Nivel 0 corre en paralelo)
```

### Error 3: No verificar conflictos despues de ejecucion paralela

```
MAL:
Fase 1 (paralela) modifica layout.tsx
Fase 2 (paralela) tambien modifica layout.tsx
→ Conflicto silencioso, uno sobreescribe al otro

BIEN:
Despues de paralelo, verificar archivos tocados por cada agente.
Si hay overlap → resolver manualmente antes de continuar.
```

### Error 4: No propagar fallos a dependientes

```
MAL:
Fase 1 falla → ignorar → ejecutar Fase 3 (deps: [1]) → falla peor

BIEN:
Fase 1 falla → CASCADE: marcar Fase 3 y Fase 4 como BLOQUEADAS
→ Reportar al usuario → decidir: reintentar, skip, o abortar
```

---

## Checklist de Calidad

Antes de marcar una fase como completada:

- [ ] Todas las subtareas estan realmente terminadas?
- [ ] Verifique errores con Next.js MCP?
- [ ] La funcionalidad hace lo que se esperaba?
- [ ] Hay algo que deberia ajustar antes de avanzar?

Antes de transicionar a siguiente fase:

- [ ] Mapee el contexto actualizado?
- [ ] Las subtareas de la nueva fase consideran lo que YA existe?
- [ ] Hay dependencias que debo tener en cuenta?

---

## Principios BLUEPRINT

1. **Dependency graph primero**: Cada fase declara deps antes de ejecutar nada
2. **Paralelo cuando sea posible**: Fases independientes corren simultaneamente con Agent tool
3. **Mapeo just-in-time**: Subtareas se generan al entrar a la fase, no antes
4. **Cascade failure**: Si una fase falla, sus dependientes se bloquean automaticamente
5. **Conflicto-aware**: Despues de ejecucion paralela, verificar archivos tocados
6. **TodoWrite activo**: Mantener estado de cada fase (PENDIENTE/EN_PROGRESO/COMPLETADA/FALLIDA/BLOQUEADA)
7. **Contexto acumulativo**: Cada nivel hereda todo lo construido en niveles anteriores
8. **Auto-blindaje persistente**: Errores se documentan, nunca se repiten

---

*"La precision viene de mapear la realidad, no de imaginar el futuro."*
*"Fases independientes son oportunidades de velocidad."*
*"El sistema que se blinda solo es invencible."*
