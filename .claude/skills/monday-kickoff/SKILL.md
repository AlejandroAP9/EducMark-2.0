---
name: monday-kickoff
description: >
  Ritual semanal: procesa feedback de multiples fuentes y genera
  3 prioridades de producto + 3 ideas de contenido + presentacion para la semana.
  Inspirado en Jenny (Anthropic): "Every Monday at 10am I get 3 vetted product ideas."
  Activar cuando: lunes, kickoff, que hago esta semana, prioridades, review semanal,
  como vamos, que construir, insights.
argument-hint: "[semana]"
user-invocable: true
allowed-tools: Read, Write, Bash, Glob, Grep, WebSearch, WebFetch
---

# Monday Kickoff — Ritual Semanal EducMark

## Filosofia

> "Garbage in, treasure out." — Jenny, Design Lead @ Anthropic
> Tomar inputs desordenados de multiples fuentes y extraer gemas accionables.

## Paso 1: Recopilar Inputs (en paralelo)

### Fuentes internas
1. Leer TODO en `.claude/feedback/` — dogfooding log, observaciones, feedback de usuarios
2. Leer `.claude/content/` — calendario actual, que se publico, que falta
3. Leer `ROADMAP.md` — P0s actuales y su estado
4. Consultar metricas recientes:
   ```sql
   SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 7;
   ```

### Fuentes externas
5. Buscar en redes sociales menciones de EducMark, feedback de profes chilenos sobre IA
6. Buscar tendencias en educacion + IA en Chile (si hay tiempo)

## Paso 2: Analizar y Priorizar

Con TODOS los inputs, generar:

### A. Insights de la Semana (3-5 max)
- Que patron emerge del feedback?
- Que friccion se repite?
- Que oportunidad aparece?

### B. 3 Prioridades de Producto
Para cada una:
- **Que:** Descripcion en 1 linea
- **Por que:** Evidencia del feedback que lo respalda
- **Impacto:** Alto/Medio/Bajo en North Star (clases generadas/semana)
- **Esfuerzo:** Horas estimadas

### C. 3 Ideas de Contenido
Para cada una:
- **Formato:** Reel / Carrusel / Post / Story
- **Pilar:** Dolor / Educacion / Caso de uso / Contrarian
- **Hook sugerido:** 1 linea
- **Por que esta semana:** Conexion con insights o tendencia

## Paso 3: Generar Outputs

1. **Archivo de insights** → `.claude/feedback/weekly-insights/insights-YYYY-WXX.md`
2. **Actualizar ROADMAP.md** → Marcar progreso, ajustar P0s si es necesario
3. **Resumen ejecutivo** → Mostrar al usuario en formato limpio:

```
## Monday Kickoff — Semana XX

### Insights
1. ...
2. ...
3. ...

### Prioridades de Producto
| # | Que | Por que | Impacto | Esfuerzo |
|---|-----|---------|---------|----------|
| 1 | ... | ... | Alto | 2h |
| 2 | ... | ... | Medio | 4h |
| 3 | ... | ... | Alto | 1h |

### Ideas de Contenido
| # | Formato | Pilar | Hook |
|---|---------|-------|------|
| 1 | Reel | Dolor | "..." |
| 2 | Carrusel | Caso de uso | "..." |
| 3 | Post | Contrarian | "..." |

### Estado del ROADMAP
- [x] Cosa completada
- [ ] Cosa en progreso (70%)
- [ ] Cosa pendiente
```

## Paso 4: Preguntar al Usuario

- "Quieres que programe esto como tarea recurrente cada lunes?"
- "Quieres que genere los guiones de contenido para estas 3 ideas?"
- "Alguna prioridad que quieras cambiar?"

## Reglas

- NO inventar feedback. Solo usar datos reales de las fuentes.
- Si no hay feedback en las carpetas, decirlo honestamente y sugerir que empiece a capturar.
- Priorizar siempre por impacto en North Star metric (clases generadas/semana).
- Formato conciso. El usuario tiene poco tiempo (trabaja de noche).
