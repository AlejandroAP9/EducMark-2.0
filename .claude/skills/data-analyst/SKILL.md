---
name: data-analyst
description: |
  Analisis de datos on-demand para EducMark. Consulta daily_metrics y tablas raw
  para responder preguntas de negocio, generar reportes, identificar tendencias y
  recomendar acciones basadas en datos reales.
  Activar cuando el usuario dice: como vamos, metricas, reporte, tendencia,
  cuantos usuarios, revenue, churn, crecimiento, analisis, datos, dashboard,
  comparar periodos, funnel, conversion, asignatura mas popular, que construir,
  dame los numeros, como esta el negocio, progreso, metas.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(python3 *) Bash(curl *)
metadata:
  author: educmark
  version: "1.0"
---

# Data Analyst — Analisis de Negocio On-Demand

> Tu IA es tu analista de datos. No necesitas dashboards de $200/mes.
> Solo necesitas preguntar.

---

## Fuentes de Datos

### Tabla Principal: daily_metrics
30 columnas, 1 fila por dia. Se llena automaticamente cada noche (pg_cron 23:55).

```sql
-- Ultimos 7 dias
SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 7;

-- Snapshot inmediato (si quieres datos frescos)
SELECT capture_daily_metrics();
```

### Tablas Raw (para analisis profundo)
| Tabla | Para que |
|-------|---------|
| `user_profiles` | Detalle de usuarios, institucion, asignaturas |
| `user_subscriptions` | Planes, estado, creditos, MercadoPago IDs |
| `generated_classes` | Cada clase generada (asignatura, curso, rating, feedback) |
| `evaluations` | Evaluaciones sumativas |
| `evaluation_items` | Preguntas individuales |
| `monthly_usage` | Uso mensual por usuario |
| `usuarios_crm` | Leads, pipeline, fuente |
| `interactions` | Interacciones CRM |
| `payment_transactions` | Pagos en CLP |

### Acceso
Usar Supabase MCP: `mcp__supabase__execute_sql` con project_id `gjudfgpudbqdhclbmjjo`

---

## Como Responder

### Regla 1: Lenguaje Simple
Alejandro es profesor, no ingeniero. Nada de "p-value", "standard deviation", "cohort analysis".
Decir: "De los 4 usuarios, 2 pagan. El 80% de las clases son de Historia."

### Regla 2: Numeros Reales
NUNCA inventar datos. Si una tabla esta vacia, decirlo: "No hay datos de pagos todavia."
Si hay pocos datos para ver tendencias, decirlo: "Con 4 usuarios es pronto para ver patrones."

### Regla 3: Accionable
Cada respuesta debe terminar con 1-3 acciones concretas basadas en los datos.
No "considera diversificar". Si: "Historia tiene el 80% del uso. Prueba generar 5 clases de Lenguaje y Matematicas para verificar que funcionan bien antes de promoverlas."

### Regla 4: Contexto de Metas
Siempre relacionar con las metas Q2 2026:
- 100 usuarios activos
- 3,000-4,000 clases generadas
- Revenue recurrente

---

## Queries Frecuentes

### "Como vamos?" (Resumen rapido)
```sql
SELECT
  date,
  total_users,
  active_users_today,
  classes_generated_total,
  evaluations_created_total,
  active_subscriptions,
  revenue_month,
  top_subject,
  top_grade
FROM daily_metrics
ORDER BY date DESC
LIMIT 7;
```

### "Cuanto hemos crecido?" (Comparacion periodos)
```sql
-- Semana actual vs anterior
WITH current_week AS (
  SELECT
    SUM(new_users_today) as new_users,
    SUM(classes_generated_today) as classes,
    SUM(evaluations_created_today) as evals
  FROM daily_metrics
  WHERE date >= CURRENT_DATE - 7
),
previous_week AS (
  SELECT
    SUM(new_users_today) as new_users,
    SUM(classes_generated_today) as classes,
    SUM(evaluations_created_today) as evals
  FROM daily_metrics
  WHERE date >= CURRENT_DATE - 14 AND date < CURRENT_DATE - 7
)
SELECT
  'Esta semana' as periodo,
  cw.new_users, cw.classes, cw.evals
FROM current_week cw
UNION ALL
SELECT
  'Semana anterior',
  pw.new_users, pw.classes, pw.evals
FROM previous_week pw;
```

### "Que asignaturas usan mas?" (Distribucion)
```sql
SELECT
  asignatura,
  COUNT(*) as total_clases,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM generated_classes), 1) as porcentaje
FROM generated_classes
WHERE asignatura IS NOT NULL
GROUP BY asignatura
ORDER BY total_clases DESC;
```

### "Como esta el funnel?" (CRM)
```sql
SELECT
  COALESCE(stage, 'sin_stage') as etapa,
  COUNT(*) as leads,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM usuarios_crm), 1) as porcentaje
FROM usuarios_crm
GROUP BY stage
ORDER BY COUNT(*) DESC;
```

### "Que usuarios son mas activos?" (Engagement)
```sql
SELECT
  up.full_name,
  up.email,
  us.plan_type,
  COALESCE(us.total_generations, 0) as generaciones,
  COALESCE(us.remaining_credits, 0) as creditos_restantes,
  (SELECT COUNT(*) FROM generated_classes gc WHERE gc.user_id = up.user_id) as clases,
  (SELECT COUNT(*) FROM evaluations e WHERE e.user_id = up.user_id) as evaluaciones
FROM user_profiles up
LEFT JOIN user_subscriptions us ON us.user_id = up.user_id
ORDER BY clases DESC;
```

### "Progreso hacia metas" (OKRs)
```sql
SELECT
  total_users as usuarios_actuales,
  100 as meta_usuarios,
  ROUND(total_users * 100.0 / 100, 1) as progreso_usuarios_pct,
  classes_generated_total as clases_actuales,
  3000 as meta_clases,
  ROUND(classes_generated_total * 100.0 / 3000, 1) as progreso_clases_pct,
  revenue_month as revenue_actual,
  active_subscriptions as subs_activas
FROM daily_metrics
ORDER BY date DESC
LIMIT 1;
```

---

## Reportes Avanzados (con Python)

Si Alejandro pide graficas o reportes PDF, usar matplotlib + pandas:

```python
# Patrón base para gráficas
import matplotlib.pyplot as plt
import json

# Colores EducMark
MORADO = '#8C27F1'
NARANJA = '#f69f02'
VERDE = '#2ECC71'
FONDO = '#1a1a2e'

plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(10, 6))
fig.patch.set_facecolor(FONDO)
ax.set_facecolor(FONDO)
# ... graficar datos ...
plt.savefig('reporte.png', dpi=150, bbox_inches='tight', facecolor=FONDO)
```

---

## Principios

1. **Datos > opiniones.** Si hay datos, usarlos. Si no, decirlo.
2. **Pocos datos ≠ inutil.** Con 4 usuarios puedes ver que funciona (Historia, 7° Basico). Con 100 veras patrones.
3. **Cada dia mas inteligente.** daily_metrics acumula. 30 dias = tendencias. 90 = patrones. 180 = inteligencia de negocio.
4. **El analisis sirve si lleva a una accion.** Nunca terminar sin recomendar que hacer.
