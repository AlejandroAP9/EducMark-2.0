---
name: product-decisions
description: >
  AI toma el primer corte en decisiones de producto. Analiza feedback, metricas
  y contexto, presenta opciones con tradeoffs, y el usuario reacciona.
  "Let AI take a first cut at everything, then react to it."
  Activar cuando: que feature hago, que construyo, deberia agregar X,
  vale la pena Y, priorizar, decidir, tradeoff, opcion A vs B.
argument-hint: "[pregunta de producto]"
user-invocable: true
allowed-tools: Read, Write, Bash, Glob, Grep, WebSearch, WebFetch
---

# Product Decisions — AI Takes First Cut

## Filosofia

> "I always let AI take a first cut at everything and then I just kind of react to it."
> — Jenny, Design Lead @ Anthropic
>
> Tu juicio como profesor de 20 anos ES el filtro.
> No necesitas generar las opciones — necesitas curarlas.

## Cuando se Activa

El usuario tiene una decision de producto:
- "Deberia agregar matematicas?"
- "Que feature es mas importante ahora?"
- "Vale la pena hacer el plan institucional ya?"
- "Opcion A vs Opcion B?"

## Proceso

### 1. Recopilar Contexto (automatico)
- Leer `ROADMAP.md` — P0s actuales
- Leer `CLAUDE.md` — etapa actual, metricas, OKRs
- Leer `.claude/feedback/` — que dice el feedback real
- Consultar metricas si es relevante

### 2. Generar Opciones (3 max)

Para cada opcion:

```
### Opcion [N]: [Nombre corto]

**Que:** Descripcion en 2-3 lineas
**A favor:**
- Punto 1
- Punto 2
**En contra:**
- Punto 1
- Punto 2
**Impacto en North Star:** Alto/Medio/Bajo (clases generadas/semana)
**Esfuerzo:** Xs horas/dias
**Evidencia:** Que feedback o dato respalda esto
```

### 3. Dar Recomendacion

```
### Mi recomendacion: Opcion [N]

**Por que:** [1-2 lineas con la logica]
**Riesgo si no lo haces:** [1 linea]
**Riesgo si lo haces:** [1 linea]
```

### 4. Esperar Reaccion del Usuario

NO ejecutar nada. Presentar opciones y esperar.
El usuario reacciona: "me gusta la 2", "ninguna", "mezcla de 1 y 3".

### 5. Ejecutar (solo si el usuario aprueba)

- Si es feature simple → ejecutar directamente
- Si es feature compleja → generar PRP primero
- Si es decision estrategica → guardar en memoria del proyecto

## Reglas

- **Siempre 3 opciones max.** No mas. Paradoja de la eleccion.
- **Siempre incluir "no hacer nada" como opcion valida** cuando aplique.
- **Nunca recomendar algo solo porque es interesante** — debe conectar con North Star.
- **Strip back:** Si la opcion mas simple logra el 80% del resultado, recomienda esa.
- **Formato conciso.** El usuario trabaja de noche con tiempo limitado.

## Principio Anti-Feature-Creep

Antes de recomendar agregar algo, preguntarse:

1. Esto mejora el flujo core? (planificacion → slides → quiz → evaluacion → OMR)
2. Algun usuario real lo pidio? (feedback/, no suposiciones)
3. Puedo medir el impacto? (North Star metric)

Si las 3 son "no" → la recomendacion es NO hacerlo.
