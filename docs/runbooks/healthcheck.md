# Runbook: Health Check

## Servicios a Verificar

| Servicio | Como verificar | Que hacer si falla |
|---|---|---|
| App (Next.js) | Abrir URL de produccion | Revisar logs en Vercel |
| Supabase | `SELECT 1;` via MCP | Verificar dashboard Supabase |
| pg_cron | `SELECT * FROM cron.job;` | Re-crear schedule |
| daily_metrics | `SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 1;` | Ejecutar `SELECT capture_daily_metrics();` |
| MercadoPago webhooks | Revisar `payment_transactions` recientes | Verificar URL de webhook en MP dashboard |

## Verificacion Rapida

```sql
-- Ultimo registro de metricas (debe ser de ayer o hoy)
SELECT date, total_users, total_classes, total_evaluations
FROM daily_metrics ORDER BY date DESC LIMIT 3;

-- Usuarios activos recientes
SELECT count(*) FROM user_profiles WHERE last_sign_in_at > now() - interval '7 days';

-- Suscripciones activas
SELECT status, count(*) FROM user_subscriptions GROUP BY status;
```

## Cron Jobs Activos

```sql
-- Ver todos los cron jobs
SELECT jobid, schedule, command, active FROM cron.job;

-- Ver ejecuciones recientes
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```
