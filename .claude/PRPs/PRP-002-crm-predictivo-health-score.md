# PRP-002: CRM Predictivo Admin — Health Score de Usuarios Pioneros

> **Estado**: COMPLETADO
> **Fecha**: 2026-04-04
> **Proyecto**: EducMark

---

## Objetivo

Calcular un health score por usuario pionero basado en actividad reciente (clases, evaluaciones, scans OMR, logins) y disparar alertas automaticas via Telegram cuando un usuario muestra senales de desenganche (7 dias sin actividad), para lograr churn zero en la fase beta.

## Por Que

| Problema | Solucion |
|----------|----------|
| Con 4 usuarios pioneros, perder 1 es perder 25% de la base. No hay forma de detectar desenganche hasta que cancelan | Health score calcula engagement automaticamente. Si baja del umbral, Alejandro recibe alerta en Telegram y puede actuar antes de que el usuario se vaya |
| Alejandro no tiene tiempo de revisar manualmente si cada usuario esta activo | pg_cron + edge function automatizan la deteccion. Zero esfuerzo manual |
| No hay metricas por usuario en el admin panel — solo totales agregados | Vista individual por usuario con score, ultima actividad, y tendencia |

**Valor de negocio**: Retener 100% de los pioneros es critico para PMF. Cada usuario retenido = $200,000 CLP/ano + feedback + referidos. Detectar churn 7 dias antes de que ocurra permite intervencion personal (WhatsApp, llamada, soporte prioritario).

## Que

### Criterios de Exito
- [ ] Health score calculado para cada usuario con suscripcion activa (0-100)
- [ ] Score se recalcula automaticamente cada noche (pg_cron, despues de daily_metrics)
- [ ] Alerta Telegram enviada a Alejandro cuando un usuario tiene 0 actividad en 7 dias
- [ ] Vista en /admin con tabla de usuarios ordenada por health score (peor primero)
- [ ] Cada usuario muestra: nombre, plan, score, ultima actividad, dias inactivo, tendencia (subiendo/bajando/estable)

### Comportamiento Esperado

**Happy Path — Calculo nocturno:**
1. pg_cron ejecuta `calculate_user_health_scores()` cada noche a las 00:05 (despues de `capture_daily_metrics` a las 23:55)
2. La funcion SQL recorre todos los usuarios con suscripcion activa
3. Para cada usuario calcula el health score ponderado:
   - Clases generadas ultimos 7 dias (peso 35%)
   - Evaluaciones creadas ultimos 7 dias (peso 25%)
   - Scans OMR ultimos 7 dias (peso 15%)
   - Logins ultimos 7 dias (peso 25%) — via `auth.users.last_sign_in_at` o `user_profiles.updated_at`
4. Guarda score en tabla `user_health_scores` (historial) y actualiza `user_health_scores_latest` (vista materializada o tabla con UPSERT)
5. Si algun usuario tiene score = 0 Y dias_sin_actividad >= 7, inserta un registro en `health_score_alerts`

**Happy Path — Alerta Telegram:**
1. pg_cron (o la misma funcion) detecta alertas no enviadas en `health_score_alerts`
2. Llama a una Supabase Edge Function via `net.http_post` (extension pg_net)
3. La edge function recibe el payload (usuario, score, dias inactivo) y lo envia al bot de Telegram de Alejandro
4. Marca la alerta como enviada

**Happy Path — Vista Admin:**
1. Alejandro entra a `/dashboard/admin` y ve una nueva tarjeta "Health Score" en el dashboard
2. Hace click y navega a `/dashboard/admin/health`
3. Ve tabla con todos los usuarios ordenados por score ascendente (los peores primero)
4. Semaforo visual: rojo (0-30), amarillo (31-60), verde (61-100)
5. Click en un usuario expande detalle: historial de score ultimos 30 dias, desglose por dimension

---

## Contexto

### Referencias
- `src/features/admin/components/AdminDashboard.tsx` — Dashboard actual, agregar tarjeta de Health Score
- `src/features/admin/components/UserManagement.tsx` — Patron de tabla de usuarios existente
- `supabase/migrations/20260101000000_initial_schema.sql` — Schema completo (38 tablas)
- `docs/architecture.md` — pg_cron a las 23:55, capture_daily_metrics()
- `docs/runbooks/healthcheck.md` — Referencia de jobs existentes

### Tablas existentes relevantes
- `user_profiles` — nombre, email, user_id, is_active
- `user_subscriptions` — plan_type, status, remaining_credits, last_generation_at
- `generated_classes` — user_id, created_at (indicador de actividad)
- `evaluations` — user_id, created_at (indicador de actividad)
- `omr_results` — No tiene user_id directo, necesita JOIN via evaluation_id -> evaluations.user_id
- `daily_metrics` — Metricas agregadas (no por usuario)
- `auth.users` — last_sign_in_at (login mas reciente)

### Arquitectura Propuesta

**NO crear backend separado.** Todo dentro del stack existente:

```
pg_cron (00:05) → calculate_user_health_scores() [SQL function]
                    ↓
              user_health_scores [tabla nueva]
                    ↓
              Si score=0 + 7d inactivo → health_score_alerts [tabla nueva]
                    ↓
              pg_net.http_post → Supabase Edge Function
                    ↓
              Telegram Bot API → Alejandro recibe alerta
```

**Frontend:**
```
src/features/admin/
├── components/
│   ├── AdminDashboard.tsx        ← Agregar tarjeta Health Score
│   └── AdminHealthScore.tsx      ← NUEVO: Vista completa
├── hooks/
│   └── useHealthScores.ts        ← NUEVO: Hook de datos
└── ...

src/app/(main)/dashboard/admin/
└── health/
    └── page.tsx                  ← NUEVO: Ruta /admin/health
```

### Modelo de Datos

```sql
-- Historial de health scores (1 registro por usuario por dia)
CREATE TABLE IF NOT EXISTS public.user_health_scores (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  classes_7d INTEGER DEFAULT 0,
  evaluations_7d INTEGER DEFAULT 0,
  omr_scans_7d INTEGER DEFAULT 0,
  logins_7d INTEGER DEFAULT 0,
  days_inactive INTEGER DEFAULT 0,
  calculated_at DATE NOT NULL DEFAULT CURRENT_DATE,

  CONSTRAINT user_health_scores_pkey PRIMARY KEY (id),
  CONSTRAINT user_health_scores_unique UNIQUE (user_id, calculated_at)
);
ALTER TABLE public.user_health_scores ENABLE ROW LEVEL SECURITY;

-- Alertas de churn
CREATE TABLE IF NOT EXISTS public.health_score_alerts (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  alert_type TEXT NOT NULL DEFAULT 'inactive_7d',
  score INTEGER NOT NULL,
  days_inactive INTEGER NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT health_score_alerts_pkey PRIMARY KEY (id)
);
ALTER TABLE public.health_score_alerts ENABLE ROW LEVEL SECURITY;
```

### Formula del Health Score

```
score = (
  min(classes_7d, 5) / 5 * 35 +          -- 35 pts: 5+ clases/semana = maximo
  min(evaluations_7d, 3) / 3 * 25 +      -- 25 pts: 3+ evaluaciones/semana = maximo
  min(omr_scans_7d, 3) / 3 * 15 +        -- 15 pts: 3+ scans/semana = maximo
  min(logins_7d, 5) / 5 * 25             -- 25 pts: 5+ logins/semana = maximo
)::INTEGER
```

Los umbrales (5 clases, 3 evaluaciones, etc.) se basan en el uso actual de los pioneros y se pueden ajustar.

### Dependencias tecnicas
- **pg_net extension**: Necesaria para que pg_cron llame a la edge function. Verificar si esta habilitada en Supabase Cloud.
- **Telegram Bot**: Crear bot con @BotFather, obtener token y chat_id de Alejandro. Guardar como secrets en Supabase.
- **Supabase Edge Functions**: Primera edge function del proyecto. Se deploya con `supabase functions deploy`.

---

## Blueprint (Assembly Line)

### Fase 1: Migracion SQL — Tablas + Funcion de calculo
**Objetivo**: Crear tablas `user_health_scores` y `health_score_alerts`, y la funcion SQL `calculate_user_health_scores()` que calcula el score para todos los usuarios activos.
**deps**: []
**Validacion**: `SELECT calculate_user_health_scores();` ejecuta sin error y popula `user_health_scores` para los 4 usuarios actuales.

### Fase 2: Edge Function + Telegram Webhook
**Objetivo**: Crear Supabase Edge Function `notify-health-alert` que recibe un payload (usuario, score, dias inactivo) y envia mensaje a Telegram via Bot API. Configurar secrets de Telegram.
**deps**: []
**Validacion**: Invocar edge function manualmente con payload de prueba y recibir mensaje en Telegram de Alejandro.

### Fase 3: pg_cron + pg_net — Automatizacion nocturna
**Objetivo**: Programar pg_cron a las 00:05 para ejecutar `calculate_user_health_scores()`. Configurar pg_net para que las alertas no enviadas disparen la edge function automaticamente.
**deps**: [1, 2]
**Validacion**: Ejecutar manualmente el job de cron. Verificar que scores se calculan Y que alertas se envian a Telegram si hay usuarios inactivos.

### Fase 4: Vista Admin — Componente UI
**Objetivo**: Crear `/dashboard/admin/health` con tabla de usuarios + health score, semaforo visual, y detalle expandible por usuario. Agregar tarjeta en AdminDashboard.tsx.
**deps**: [1]
**Validacion**: Navegar a /admin/health, ver tabla con los 4 usuarios, scores correctos, y semaforo visual funcionando.

### Fase 5: Validacion Final
**Objetivo**: Sistema funcionando end-to-end
**deps**: [3, 4]
**Validacion**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] Health scores calculados correctamente para los 4 usuarios
- [ ] Alerta Telegram llega cuando se simula usuario inactivo 7+ dias
- [ ] Vista /admin/health muestra datos reales
- [ ] Criterios de exito cumplidos

### Dependency Graph

```
Fase 1: Migracion SQL          deps: []
Fase 2: Edge Function Telegram  deps: []
Fase 3: pg_cron + pg_net        deps: [1, 2]
Fase 4: Vista Admin UI          deps: [1]
Fase 5: Validacion Final        deps: [3, 4]

Ejecucion:
  ┌─── Fase 1 ───┬──→ Fase 3 ──┐
  │              │              ├──→ Fase 5
  └─── Fase 2 ──┘  Fase 4 ────┘
       (paralelo)    (paralelo con 3)
```

---

## Aprendizajes (Self-Annealing)

> Esta seccion CRECE con cada error encontrado durante la implementacion.

_(vacio — se llena durante implementacion)_

---

## Gotchas

- [ ] `pg_net` extension debe estar habilitada en Supabase Cloud — verificar antes de Fase 3
- [ ] `auth.users.last_sign_in_at` puede ser NULL si el usuario nunca hizo login directo (ej: creo cuenta pero no volvio). Manejar con COALESCE
- [ ] `omr_results` no tiene `user_id` — necesita JOIN via `evaluations.user_id` para atribuir scans
- [ ] Los 4 usuarios actuales incluyen a Alejandro (admin). Decidir si excluirlo del health score o incluirlo como referencia
- [ ] Supabase Edge Functions requieren Deno runtime — primera edge function del proyecto, verificar setup local
- [ ] El bot de Telegram necesita que Alejandro le envie un mensaje primero para obtener el chat_id
- [ ] Los umbrales del score (5 clases/semana, 3 evaluaciones/semana) son hipotesis — ajustar segun uso real de pioneros

## Anti-Patrones

- NO crear API routes en Next.js para el webhook — usar Supabase Edge Function directamente
- NO calcular health score en el frontend — es calculo backend/SQL
- NO hacer polling desde el frontend — los scores se calculan una vez al dia
- NO hardcodear el chat_id o token de Telegram — usar Supabase secrets
- NO ignorar errores de TypeScript en los componentes admin
- NO crear un servicio Node separado para el cron — usar pg_cron existente

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
