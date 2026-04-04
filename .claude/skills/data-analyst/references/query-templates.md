# Query Templates — EducMark Data Analyst

## Supabase Project ID
`gjudfgpudbqdhclbmjjo`

---

## Crecimiento Semana vs Semana
```sql
WITH weeks AS (
  SELECT
    date_trunc('week', date)::date as semana,
    MAX(total_users) as usuarios,
    SUM(classes_generated_today) as clases,
    SUM(evaluations_created_today) as evals,
    SUM(new_users_today) as nuevos
  FROM daily_metrics
  GROUP BY 1
  ORDER BY 1 DESC
  LIMIT 4
)
SELECT * FROM weeks;
```

## Resumen Mensual
```sql
SELECT
  date_trunc('month', date)::date as mes,
  MAX(total_users) as usuarios_fin_mes,
  SUM(new_users_today) as nuevos,
  SUM(classes_generated_today) as clases,
  SUM(evaluations_created_today) as evals,
  SUM(revenue_today) as revenue_total,
  AVG(active_users_today)::INTEGER as promedio_activos_dia
FROM daily_metrics
GROUP BY 1
ORDER BY 1 DESC
LIMIT 6;
```

## Revenue por Plan
```sql
SELECT
  plan_type,
  COUNT(*) as suscripciones,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activas,
  SUM(CASE WHEN status IN ('cancelled','inactive') THEN 1 ELSE 0 END) as canceladas
FROM user_subscriptions
GROUP BY plan_type;
```

## Top Asignaturas Trending (ultimo mes)
```sql
SELECT
  asignatura,
  COUNT(*) as clases,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  ROUND(AVG(rating), 2) as rating_promedio
FROM generated_classes
WHERE created_at >= CURRENT_DATE - 30
  AND asignatura IS NOT NULL
GROUP BY asignatura
ORDER BY clases DESC;
```

## Top Cursos Trending (ultimo mes)
```sql
SELECT
  curso,
  COUNT(*) as clases,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM generated_classes
WHERE created_at >= CURRENT_DATE - 30
  AND curso IS NOT NULL
GROUP BY curso
ORDER BY clases DESC;
```

## Engagement por Usuario
```sql
SELECT
  up.full_name,
  up.email,
  up.institution,
  us.plan_type,
  us.status,
  COALESCE(us.total_generations, 0) as total_generaciones,
  COALESCE(us.remaining_credits, 0) as creditos,
  (SELECT COUNT(*) FROM generated_classes gc WHERE gc.user_id = up.user_id) as clases,
  (SELECT COUNT(*) FROM evaluations e WHERE e.user_id = up.user_id) as evaluaciones,
  (SELECT MAX(created_at) FROM generated_classes gc WHERE gc.user_id = up.user_id) as ultima_clase
FROM user_profiles up
LEFT JOIN user_subscriptions us ON us.user_id = up.user_id
ORDER BY clases DESC;
```

## Retención (usuarios que volvieron después de su primera clase)
```sql
WITH first_class AS (
  SELECT
    user_id,
    MIN(created_at)::date as primera_clase
  FROM generated_classes
  GROUP BY user_id
),
returned AS (
  SELECT
    fc.user_id,
    fc.primera_clase,
    COUNT(gc.id) as clases_posteriores
  FROM first_class fc
  LEFT JOIN generated_classes gc ON gc.user_id = fc.user_id
    AND gc.created_at::date > fc.primera_clase
  GROUP BY fc.user_id, fc.primera_clase
)
SELECT
  COUNT(*) as total_usuarios_con_clases,
  SUM(CASE WHEN clases_posteriores > 0 THEN 1 ELSE 0 END) as retornaron,
  ROUND(SUM(CASE WHEN clases_posteriores > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as tasa_retencion
FROM returned;
```

## Funnel Completo CRM
```sql
SELECT
  COALESCE(stage, 'sin_stage') as etapa,
  COUNT(*) as leads,
  COALESCE(source, 'desconocido') as fuente_principal,
  AVG(EXTRACT(EPOCH FROM (COALESCE(last_interaction, created_at) - created_at)) / 86400)::INTEGER as dias_promedio_en_etapa
FROM usuarios_crm
GROUP BY stage, source
ORDER BY
  CASE stage
    WHEN 'nuevo' THEN 1
    WHEN 'contactado' THEN 2
    WHEN 'trial' THEN 3
    WHEN 'cliente' THEN 4
    WHEN 'churned' THEN 5
    ELSE 6
  END;
```

## Días Más Activos (para saber cuándo publicar contenido)
```sql
SELECT
  TO_CHAR(date, 'Day') as dia_semana,
  EXTRACT(DOW FROM date) as dow,
  AVG(classes_generated_today) as promedio_clases,
  AVG(active_users_today) as promedio_activos
FROM daily_metrics
GROUP BY 1, 2
ORDER BY 2;
```
