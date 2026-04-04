# Arquitectura — EducMark

> Documento de referencia de la arquitectura tecnica del sistema.
> Extraido de CLAUDE.md para mantener el brain lean.

---

## Golden Path (Un Solo Stack)

| Capa       | Tecnologia                         |
| ---------- | ---------------------------------- |
| Framework  | Next.js 16 + React 19 + TypeScript |
| Estilos    | Tailwind CSS 3.4                   |
| Backend    | Supabase (Auth + DB + RLS)         |
| AI Engine  | Vercel AI SDK v5 + OpenRouter      |
| Validacion | Zod                                |
| Estado     | Zustand                            |
| Testing    | Playwright CLI + MCP               |

---

## Arquitectura Feature-First

Todo el contexto de una feature en un solo lugar:

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas de autenticacion
│   ├── (main)/              # Rutas principales
│   └── layout.tsx
│
├── features/                 # Organizadas por funcionalidad
│   └── [feature]/
│       ├── components/      # UI de la feature
│       ├── hooks/           # Logica
│       ├── services/        # API calls
│       ├── types/           # Tipos
│       └── store/           # Estado
│
└── shared/                   # Codigo reutilizable
    ├── components/
    ├── hooks/
    ├── lib/
    └── types/
```

---

## MCPs: Sentidos y Manos del Agente

### Next.js DevTools MCP (Quality Control)

Conectado via `/_next/mcp`. Ve errores build/runtime en tiempo real.

### Playwright (Ojos)

**CLI** (preferido, menos tokens):

```bash
npx playwright navigate http://localhost:3000
npx playwright screenshot http://localhost:3000 --output screenshot.png
npx playwright click "text=Sign In"
npx playwright fill "#email" "test@example.com"
npx playwright snapshot http://localhost:3000
```

**MCP** (cuando necesitas explorar UI desconocida):

```
playwright_navigate, playwright_screenshot, playwright_click/fill
```

### Supabase MCP (Manos)

```
execute_sql, apply_migration, list_tables, get_advisors
```

---

## Base de Datos del Business OS

```
Supabase (gjudfgpudbqdhclbmjjo)
│
├── daily_metrics              # 30 KPIs, 1 fila/dia, pg_cron 23:55
│   ├── Usuarios (6 cols)     # total, nuevos, activos, free, paid, churn
│   ├── Producto (6 cols)     # clases, evals, items, promedio
│   ├── Revenue (6 cols)      # hoy, mes, subs, ARPU
│   ├── CRM (6 cols)          # leads, funnel, conversion
│   └── Engagement (6 cols)   # asignaturas, cursos, rating
│
├── user_profiles              # Usuarios registrados
├── user_subscriptions         # Suscripciones MercadoPago
├── generated_classes          # Clases generadas (producto core)
├── evaluations                # Evaluaciones sumativas
├── evaluation_items           # Preguntas individuales
├── evaluation_blueprint       # Tablas de especificaciones
├── monthly_usage              # Uso mensual por usuario
├── usuarios_crm               # Leads y pipeline
├── interactions               # Interacciones CRM
├── payment_transactions       # Pagos (CLP)
└── audit_logs                 # Auditoria
```

---

## Cron Jobs del Business OS

| #   | Job                 | Horario      | Que hace                          | Donde corre              |
| --- | ------------------- | ------------ | --------------------------------- | ------------------------ |
| 1   | **Nightly Metrics** | 23:55 diario | Captura 30 KPIs en daily_metrics  | pg_cron (Postgres)       |
| 2   | Morning Briefing    | 5:57 diario  | Resumen ejecutivo a memoria       | Claude Code (CronCreate) |
| 3   | Weekly Report       | Dom 20:03    | Analisis tendencias semanal       | Claude Code (CronCreate) |
| 4   | Monthly Report      | 1ro 7:07     | Analisis profundo mensual         | Claude Code (CronCreate) |
| 5   | Health Check        | c/6h         | Verificar servicios activos       | Claude Code (CronCreate) |
| 6   | Auto-blindaje       | 2:17 diario  | Documentar errores nuevos         | Claude Code (CronCreate) |
| 7   | Memory Cleanup      | Mie 3:23     | Sugerir limpieza de memoria       | Claude Code (CronCreate) |
| 8   | Data Quality        | 3:37 diario  | Verificar integridad de datos     | Claude Code (CronCreate) |
| 9   | **Monday Kickoff**  | Lun 10:00    | Feedback → insights → prioridades | Claude Code (CronCreate) |

**Job 1 (pg_cron)** corre DENTRO de Postgres 24/7 sin depender de nada.
**Jobs 2-9** corren cuando Claude Code esta activo. Persistidos en `.claude/scheduled_tasks.json`.

---

## Metricas en Vivo

> Tabla `daily_metrics` en Supabase — 30 columnas, una fila por dia.
> Funcion `capture_daily_metrics()` calcula todo automaticamente.

```sql
-- Ver ultimos 7 dias
SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 7;

-- Captura manual
SELECT capture_daily_metrics();
```

### Categorias de Metricas (30 columnas)

| Categoria      | Columnas                                        | Que mide                |
| -------------- | ----------------------------------------------- | ----------------------- |
| Usuarios (6)   | total, nuevos, activos, free, paid, churn       | Crecimiento y retencion |
| Producto (6)   | clases/evals hoy y total, items, promedio       | Uso real del producto   |
| Revenue (6)    | hoy, mes, subs activas/nuevas/canceladas, ARPU  | Salud financiera        |
| CRM/Funnel (6) | leads, interacciones, stage, conversion, tiempo | Pipeline de ventas      |
| Engagement (6) | asignatura/curso top, distribuciones, rating    | Que construir despues   |

---

## Flujos Principales

### Flujo 1: Proyecto Nuevo (de cero)

```
1. NEW-APP → Entrevista de negocio → BUSINESS_LOGIC.md
2. Preguntar diseño visual (design system)
3. ADD-LOGIN → Auth completo
4. ADD-PAYMENTS → Pagos con Mercadopago (si el proyecto cobra)
5. PRP → Plan de primera feature
6. BUCLE-AGENTICO → Implementar fase por fase
7. PLAYWRIGHT-CLI → Verificar que todo funciona
```

### Flujo 2: Feature Compleja

```
1. PRP → Generar plan (usuario aprueba)
2. BUCLE-AGENTICO → Ejecutar por fases
3. PLAYWRIGHT-CLI → Validar resultado final
```

### Flujo 3: Ciclo Semanal (Monday Kickoff)

```
1. Alejandro anota fricciones en .claude/feedback/ durante la semana
2. Lunes → MONDAY-KICKOFF procesa todo
3. Alejandro reacciona: aprueba, ajusta o descarta
4. Si hay decision → PRODUCT-DECISIONS (3 opciones)
```

### Flujo 4: Business OS (Ciclo Recursivo)

```
Cada noche (23:55):  pg_cron → capture_daily_metrics() → 30 KPIs
Cada manana:         Morning briefing → resumen → memoria
Cada semana:         Weekly report → tendencias → decisiones
Cada mes:            Monthly report → patrones → ajuste estrategia
```
