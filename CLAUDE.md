# EducMark Business OS — Sistema Operativo del Negocio

> Este no es un prompt suelto. Es un **sistema operativo**.
> Cada conversacion arranca con TODO el contexto cargado.
> Cada error documentado es un blindaje permanente.
> Cada noche, los datos se capturan solos.
> Con el tiempo, este sistema se vuelve mas inteligente que cualquier consultor.

---

## Identidad: Quien Soy y Por Que Hago Esto

### Alejandro — Fundador

Profesor de Historia en Chile desde 2006. 20 anos de experiencia docente.
Padre de Catalina (2018) y Leonardo (2020). Casado.

**Jornada actual:** 8:00 AM a 5:30 PM en el colegio, lunes a viernes.
Los ve salir a las 7 AM y no los vuelve a ver hasta las 8 PM — 13 horas sin ellos.
Trabaja en EducMark de noche, muchas veces hasta las 2 AM. Se levanta a las 6 AM.

**Por que existe EducMark:** La docencia en Chile tiene demasiada carga administrativa —
planificar, preparar clases, buscar material, reuniones con apoderados, informes.
Todo eso aleja de lo que uno estudio: ensenar. Al ser padre, Alejandro decidio que
no podia seguir dedicando 12+ horas a un trabajo que no le dejaba estar con su familia.

**El sueño:** Salir del colegio a la 1 PM. Tardes con sus hijos — talleres deportivos,
artisticos, lo que ellos quieran. Que su esposa tambien reduzca jornada.
Es profesor jefe de 4° Medio — quiere graduarse con ellos y transicionar a EducMark full-time.

**Como nacio EducMark:** Probo dropshipping, trading, marcas personales — nada funciono.
Llego a la IA y descubrio que su conocimiento interno como profesor podia ayudar a miles de colegas.
Empezo automatizando contenido de Historia. Asi nace EducMark (Educacion + Marketing).
Evolucion organica: slides → planificacion → quiz → evaluacion sumativa → hoja de respuestas
→ OMR scanner → plan institucional.

### Como Trabaja Alejandro

- Prueba TODO en produccion (Easypanel), nunca localhost
- Necesita que las cosas funcionen rapido — no tiene margen para debugging largo
- Prefiere que el agente sea proactivo y ejecute, no que pregunte demasiado
- Explicaciones directas, sin tecnicismos, con analogias cotidianas
- No presionar con temas legales/SII
- NUNCA pedir que re-explique cosas ya documentadas en memoria

---

## El Producto: EducMark

### Que Hace

Plataforma SaaS que genera con IA contenido pedagogico alineado al curriculum chileno (MINEDUC):

1. **Planificacion de clase** — Alineada a Bases Curriculares, objetivos de aprendizaje
2. **Slides/presentacion** — 9 imagenes unicas generadas con IA por clase
3. **Quiz** — Preguntas con taxonomia de Bloom nivel 4+
4. **Evaluacion sumativa** — Con tabla de especificaciones y pauta de correccion
5. **Hoja de respuestas** — Bubble sheet generada automaticamente
6. **OMR Scanner** — Correccion digital automatica desde foto del celular
7. **Plan institucional** — Para colegios completos (en desarrollo)

### Mercado Objetivo

| Segmento                | Descripcion                               | Prioridad     |
| ----------------------- | ----------------------------------------- | ------------- |
| Profesores basica/media | ~250,000 en Chile                         | Principal     |
| Coordinadores UTP       | Unidad Tecnico-Pedagogica                 | Secundario    |
| Directores              | Establecimientos educacionales            | Terciario     |
| LATAM                   | Peru, Argentina, Colombia, Espana, Mexico | Futuro (2028) |

### Etapa Actual — Pre-lanzamiento / Pre-PMF

> **Nota:** Estas metricas son un snapshot. Para datos en vivo: `SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 1;`

| Metrica               | Valor (mar 2026) |
| --------------------- | ---------------- |
| Usuarios registrados  | 4                |
| Suscripciones activas | 2                |
| Clases generadas      | 51               |
| Evaluaciones creadas  | 52               |
| Items generados       | 438              |
| Asignatura top        | Historia (80%)   |
| Curso top             | 7° Basico        |

---

## Metricas en Vivo

> **Detalle de 30 columnas y queries:** `docs/architecture.md` (seccion Metricas)

```sql
SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 7;  -- Ver ultimos 7 dias
SELECT capture_daily_metrics();                           -- Captura manual
```

---

## Metas y OKRs

### Q2 2026 (Abril — Junio)

- [ ] 100 usuarios pioneros activos (plan anual $200,000 CLP)
- [ ] Renovacion mensual recurrente
- [ ] 3,000 — 4,000 clases generadas acumuladas
- [ ] Revenue: ~$20,000,000 CLP anual ($20,000 USD)

### Mediano Plazo (Q4 2026)

- [ ] Alejandro reduce jornada docente (salir a la 1 PM)
- [ ] Esposa tambien reduce jornada
- [ ] Tardes dedicadas a familia
- [ ] Se gradua con su 4° Medio

### Vision 2 Anos (2028)

- [ ] Capacitaciones a profesores en IA y automatizaciones
- [ ] EducMark enfocado en colegios (institucional)
- [ ] Expansion: Peru, Argentina, Colombia, Espana, Mexico
- [ ] Adaptacion a planes y programas de cada pais

### North Star Metric

**Clases generadas por semana** — indica valor real entregado a profesores.
Si este numero crece, el resto sigue.

---

## Contexto Financiero

### Pricing (CLP)

| Plan                | Precio Mensual | Target                             |
| ------------------- | -------------- | ---------------------------------- |
| Basico              | $13,900        | Profesor individual, uso limitado  |
| Intermedio          | $21,900        | Profesor activo, mas generaciones  |
| Premium             | $29,900        | Profesor power user, todo incluido |
| **Pionero (anual)** | **$200,000**   | Fundadores, beneficios especiales  |

### Costos Mensuales

| Concepto             | Costo             | Notas                               |
| -------------------- | ----------------- | ----------------------------------- |
| VPS (Easypanel)      | $13 USD           | Servidor principal — app, APIs, n8n |
| Landing hosting      | $0                | Pagado por 2 anos (cPanel)          |
| OpenAI API           | ~$10 USD          | 50+ clases con saldo sobrante       |
| Replicate (imagenes) | ~$10 USD          | 450+ imagenes con saldo sobrante    |
| Claude Max           | $100 USD          | Desarrollo con IA                   |
| Gemini               | ~$22 USD          | 2TB storage + modelos               |
| **Total**            | **~$155 USD/mes** |                                     |

**Costo por clase:** ~$0.30 USD (margen alto)
**Pasarela:** MercadoPago — comision ~3.49% + IVA. CLP nativo, cuotas, profesores lo conocen.

### Unit Economics (a 100 usuarios)

- Revenue mensual: ~$2,190,000 CLP (promedio plan intermedio × 100)
- Costos fijos: ~$155 USD × 850 = ~$131,750 CLP
- Costos variables: 100 usuarios × 20 clases × $0.30 USD = ~$510,000 CLP
- **Margen bruto estimado: ~74%**

---

## Cron Jobs del Business OS

> **Detalle completo y troubleshooting:** `docs/architecture.md` (seccion Cron Jobs)
> **Healthcheck manual:** `docs/runbooks/healthcheck.md`

9 jobs automaticos: pg_cron (Postgres 24/7) + 8 Claude Code jobs.
Persistidos en `.claude/scheduled_tasks.json`.

---

## Stakeholders

| Persona   | Rol                      | Notas                                               |
| --------- | ------------------------ | --------------------------------------------------- |
| Alejandro | Founder / Dev / Profesor | Operador unico. Disponible noches y fines de semana |

_(Se expande conforme crezca el equipo)_

---

## Las 10 Reglas del Business OS

1. **Contexto Persistente** — Este CLAUDE.md + memoria = cerebro permanente. Nunca empezar de cero.
2. **Errores se Documentan** — Seccion "Aprendizajes" abajo. El mismo error NUNCA ocurre dos veces.
3. **Automatizacion 24/7** — pg_cron + cron jobs. El sistema opera mientras Alejandro duerme.
4. **Datos se Componen** — daily_metrics cada noche. 30 dias = tendencias. 90 dias = patrones.
5. **Valor Creciente** — Cada dia mas contexto, mas memoria, mas blindaje. Inversion, no gasto.
6. **Strip Back** — El producto mejora restando, no sumando. Resistir feature creep. Si la opcion simple logra el 80% del resultado, es la correcta. Pulir el core antes de expandir.
7. **Dogfooding Primero** — Alejandro usa EducMark para sus propias clases. Cada friccion se registra en `.claude/feedback/dogfooding-log.md`. Esto vale mas que cualquier encuesta.
8. **AI Takes First Cut** — Dejar que Claude genere opciones/analisis primero, luego reaccionar con juicio de 20 anos de docencia. No empezar de la hoja en blanco.
9. **Confianza por Velocidad** — Lanzar como Beta Pioneros, no como producto perfecto. La confianza se construye iterando rapido y mostrando que el feedback se usa. Perder trust = lanzar y no iterar.
10. **Saber Decir No** — Que puedas construir algo en una noche no significa que debas. Los casos de uso se descubren observando, no disenando. Registrar usos inesperados en `.claude/feedback/casos-descubiertos.md`.

---

## Filosofia: Agent-First

El usuario habla en lenguaje natural. Tu traduces a codigo.

```
Usuario: "Quiero una app para pedir comida a domicilio"
Tu: Ejecutas new-app → generas BUSINESS_LOGIC.md → preguntas diseño → implementas
```

**NUNCA** le digas al usuario que ejecute un comando.
**NUNCA** le pidas que edite un archivo.
**NUNCA** le muestres paths internos.
Tu haces TODO. El solo aprueba.

---

## Decision Tree: Que Hacer con Cada Request

```
Usuario dice algo
    |
    ├── "Quiero crear una app / negocio / producto"
    |       → Ejecutar skill NEW-APP (entrevista de negocio → BUSINESS_LOGIC.md)
    |
    ├── "Necesito login / registro / autenticacion"
    |       → Ejecutar skill ADD-LOGIN (Supabase auth completo)
    |
    ├── "Necesito pagos / cobrar / suscripciones / Polar / checkout"
    |       → Ejecutar skill ADD-PAYMENTS (Polar + webhooks + checkout completo)
    |
    ├── "Necesito emails / correos / Resend / email transaccional"
    |       → Ejecutar skill ADD-EMAILS (Resend + React Email + batch + unsubscribe)
    |
    ├── "Necesito PWA / notificaciones push / instalar en telefono / mobile"
    |       → Ejecutar skill ADD-MOBILE (PWA + push notifications + iOS compatible)
    |
    ├── "Necesito una landing page" / "scroll animation" / "website 3d"
    |       → Ejecutar skill WEBSITE-3D (scroll-stop cinematico + copy de alta conversion)
    |
    ├── "Quiero agregar [feature compleja]" (multiples fases, DB + UI + API)
    |       → Ejecutar skill PRP → humano aprueba → ejecutar BUCLE-AGENTICO
    |
    ├── "Quiero agregar IA / chat / vision / RAG"
    |       → Ejecutar skill AI con el template apropiado
    |
    ├── "Revisa que funcione / testea / hay un bug"
    |       → Ejecutar skill PLAYWRIGHT-CLI (testing automatizado)
    |
    ├── "Necesito algo de la base de datos" / "tabla" / "query" / "metricas"
    |       → Ejecutar skill SUPABASE (estructura + datos + metricas)
    |
    ├── "Quiero hacer deploy / publicar"
    |       → Deploy directo con Vercel CLI o git push
    |
    ├── "Quiero remover SaaS Factory"
    |       → Ejecutar skill EJECT-SF (DESTRUCTIVO, confirmar antes)
    |
    ├── "Recuerda que..." / "Guarda esto" / "En que quedamos?"
    |       → Ejecutar skill MEMORY-MANAGER (memoria persistente del proyecto)
    |
    ├── "Genera una imagen / thumbnail / logo / banner"
    |       → Ejecutar skill IMAGE-GENERATION (OpenRouter + Gemini)
    |
    ├── "Optimiza este skill / mejora el skill / autoresearch"
    |       → Ejecutar skill AUTORESEARCH (loop autonomo de mejora)
    |
    ├── "Como vamos?" / "Metricas" / "Reporte" / "Tendencias" / "Revenue"
    |       → Ejecutar skill DATA-ANALYST (analisis on-demand con datos reales)
    |
    ├── "Lunes" / "Kickoff" / "Que hago esta semana" / "Prioridades" / "Review semanal"
    |       → Ejecutar skill MONDAY-KICKOFF (ritual semanal: feedback → insights → prioridades)
    |
    ├── "Que feature hago" / "Que construyo" / "Vale la pena X" / "Opcion A vs B"
    |       → Ejecutar skill PRODUCT-DECISIONS (AI takes first cut, presenta 3 opciones)
    |
    ├── "Contenido" / "Instagram" / "Reel" / "Carrusel" / "Post" / "Story"
    |       → Ejecutar skill CONTENT-CALENDAR o SCRIPT-MASTER segun contexto
    |
    ├── "Ideas" / "De que hablo" / "Pilares" / "No se que publicar"
    |       → Ejecutar skill CONTENT-PILLARS (banco de ideas por pilar y angulo)
    |
    ├── "Hook" / "Gancho" / "Como empiezo el video"
    |       → Ejecutar skill HOOK-WRITER (genera 5-10 hooks rankeados)
    |
    ├── "Rompe paradigma" / "Contrarian" / "Creencias del profe"
    |       → Ejecutar skill PARADIGM-BREAKER (vacio de conocimiento)
    |
    ├── "Imagen para post" / "Imagen carrusel" / "Sketch" / "Pizarra"
    |       → Ejecutar skill IMAGE-CREATOR (estilo sketch pedagogico)
    |
    └── No encaja en nada
            → Usar tu juicio. Leer el codebase, entender patrones, ejecutar.
```

---

## Skills: 33 Herramientas Especializadas

### Skills de Producto (18 originales)

| #   | Skill              | Cuando usarlo                                                                  |
| --- | ------------------ | ------------------------------------------------------------------------------ |
| 1   | `new-app`          | Empezar proyecto desde cero. Entrevista de negocio → BUSINESS_LOGIC.md         |
| 2   | `add-login`        | Auth completa: Email/Password + Google OAuth + profiles + RLS                  |
| 3   | `add-payments`     | Pagos con MercadoPago: checkout, webhooks, suscripciones, CLP nativo           |
| 4   | `add-emails`       | Emails transaccionales: Resend + React Email + batch + unsubscribe             |
| 5   | `add-mobile`       | PWA instalable + notificaciones push (iOS compatible)                          |
| 6   | `website-3d`       | Landing cinematica Apple-style: scroll-driven video + copy AIDA/PAS            |
| 7   | `prp`              | Plan de feature compleja antes de implementar. Siempre antes de bucle-agentico |
| 8   | `bucle-agentico`   | Features complejas: dependency graph + ejecucion paralela + cascade failure    |
| 9   | `ai`               | Capacidades de IA: chat, RAG, vision, tools, web search                        |
| 10  | `supabase`         | Todo BD: crear tablas, RLS, migraciones, queries, metricas, CRUD               |
| 11  | `playwright-cli`   | Testing automatizado con browser real                                          |
| 12  | `primer`           | Cargar contexto completo del proyecto al inicio de sesion                      |
| 13  | `memory-manager`   | Memoria persistente POR PROYECTO en `.claude/memory/` (git-versioned)          |
| 14  | `data-analyst`     | Analisis de datos on-demand: metricas, tendencias, reportes, decisiones        |
| 15  | `image-generation` | Generar y editar imagenes con OpenRouter + Gemini                              |
| 16  | `autoresearch`     | Auto-optimizar skills con loop autonomo (patron Karpathy)                      |
| 17  | `monday-kickoff`   | Ritual semanal: feedback → insights → 3 prioridades producto + 3 ideas contenido |
| 18  | `product-decisions`| AI toma primer corte en decisiones de producto. Presenta 3 opciones + recomendacion |

### Skills de Marketing y Contenido (12 — creados 2026-03-29)

Fabrica de contenido para Instagram. Cada skill es una pieza especializada del sistema.

| #   | Skill              | Cuando usarlo                                                                                    |
| --- | ------------------ | ------------------------------------------------------------------------------------------------ |
| 19  | `content-pillars`  | Definir pilares, angulos y generar banco de ideas para contenido                                 |
| 20  | `paradigm-breaker` | Romper creencias del profe chileno. Contenido contrarian que crea vacio de conocimiento          |
| 21  | `hook-writer`      | Generar hooks potentes (Cost Narration, dolor, estadistica, polemico, emocional)                 |
| 22  | `body-writer`      | Escribir cuerpo del contenido adaptado al formato (reel, carrusel, post, story)                  |
| 23  | `cta-writer`       | Generar CTA + caption completa + hashtags. Tipos: Manychat, follow, interaction, value           |
| 24  | `script-master`    | Orquestador: genera guion completo (hook + cuerpo + CTA) de una pieza de contenido               |
| 25  | `reel-creator`     | Experto en Reels SIN camara: screen recording, texto cinetico, POV manos, before/after           |
| 26  | `carousel-creator` | Experto en carruseles: estructura slide por slide, estilo sketch/pizarra                         |
| 27  | `post-creator`     | Posts estaticos: frases de impacto, datos, screenshots, memes de profe                           |
| 28  | `story-creator`    | Stories: encuestas, quizzes, CTAs, secuencias. Nutrir y vender sin esfuerzo                      |
| 29  | `content-calendar` | Calendario semanal completo. Asigna formatos, pilares, tipos y CTAs por dia                      |
| 30  | `image-creator`    | Imagenes estilo sketch/pizarra pedagogica. Proveedor: Gemini Nano Banana (gratis) + Kie.ai (API) |

**Flujo de contenido:**

```
content-calendar → content-pillars → script-master → reel/carousel/post/story-creator → image-creator
```

**Skills de sistema** (no invocables, se usan internamente):
`update-sf`, `eject-sf`, `skill-creator`

---

## Flujos Principales

> **Detalle completo de todos los flujos:** `docs/architecture.md` (seccion Flujos)

| Flujo | Trigger | Skills involucrados |
|---|---|---|
| Proyecto nuevo | "Quiero crear una app" | new-app → add-login → add-payments → prp → bucle-agentico |
| Feature compleja | "Agregar [feature]" | prp (dependency graph) → bucle-agentico (paralelo + cascade) → playwright-cli |
| Agregar IA | "Chat / RAG / vision" | ai (11 templates) |
| Ciclo semanal | Lunes | monday-kickoff → product-decisions |
| Analisis | "Como vamos?" | data-analyst (consulta daily_metrics) |
| Business OS | Automatico 24/7 | pg_cron → briefings → reports |

---

## Auto-Blindaje

```
Error ocurre → Se arregla → Se DOCUMENTA (PRP / Skill / CLAUDE.md) → blindaje permanente
```

---

## Golden Path, Arquitectura y Reglas de Codigo

> **Detalle completo en:** `docs/decisions/golden-path.md`
> **Arquitectura feature-first, MCPs, y flujos:** `docs/architecture.md`

| Capa       | Tecnologia                         |
| ---------- | ---------------------------------- |
| Framework  | Next.js 16 + React 19 + TypeScript |
| Estilos    | Tailwind CSS 3.4                   |
| Backend    | Supabase (Auth + DB + RLS)         |
| AI Engine  | Vercel AI SDK v5 + OpenRouter      |
| Validacion | Zod                                |
| Estado     | Zustand                            |
| Testing    | Playwright CLI + MCP               |

```bash
npm run dev          # Servidor (auto-detecta puerto 3000-3006)
npm run build        # Build produccion
npm run typecheck    # Verificar tipos
npm run lint         # ESLint
```

---

## Estructura del Proyecto

```
saas-factory/
├── CLAUDE.md                          # Brain — contexto, reglas, instrucciones
├── ROADMAP.md                         # Max 12 P0s, revision cada lunes
│
├── docs/                              # Arquitectura y decisiones ("the why")
│   ├── architecture.md                # Stack, flujos, MCPs, metricas, cron jobs
│   ├── decisions/                     # Por que se eligio X sobre Y
│   │   └── golden-path.md            # Stack y convenciones de codigo
│   └── runbooks/                      # Guias operativas
│       ├── deploy.md                 # Deploy y rollback
│       └── healthcheck.md            # Monitoreo y troubleshooting
│
├── .claude/                           # Cerebro del agente
│   ├── skills/                        # 35+ workflows reutilizables
│   ├── hooks/                         # Guardrails y automatizacion
│   │   ├── log-tool-usage.sh         # Tracking de uso
│   │   └── pre-commit.md             # Checks antes de commit
│   ├── memory/                        # Memoria persistente (git-versioned)
│   ├── PRPs/                          # Product Requirements Proposals
│   ├── design-systems/                # 5 temas visuales
│   ├── feedback/                      # Dogfooding y observaciones
│   └── content/                       # Contenido generado
│
├── tools/                             # Scripts y utilidades
│   ├── scripts/                       # Ingestion, consolidacion, RAG
│   └── prompts/                       # Templates de prompts reutilizables
│
├── src/                               # Codigo fuente (Feature-First)
│   ├── app/                          # Next.js App Router
│   ├── features/                     # Modulos por funcionalidad
│   └── shared/                       # Codigo reutilizable
│
├── supabase/                          # Migraciones SQL
└── public/                            # Assets estaticos + PWA
```

### Base de Datos del Business OS

> **Esquema completo de tablas:** `docs/architecture.md` (seccion Base de Datos)

Tablas principales: `daily_metrics`, `user_profiles`, `user_subscriptions`, `generated_classes`, `evaluations`, `evaluation_items`, `evaluation_blueprint`, `monthly_usage`, `usuarios_crm`, `payment_transactions`, `audit_logs`.

---

## Guias de Decision

### Cuando Alejandro Pide Algo Nuevo

```
¿Es una feature del producto (EducMark)?
  SI → ¿Es compleja (multiples tablas, API, UI)?
         SI → PRP → Aprobacion → BUCLE-AGENTICO
         NO → Implementar directo con SPRINT
  NO → ¿Es del Business OS (metricas, automatizacion, memoria)?
         SI → Implementar directo, documentar en CLAUDE.md
         NO → ¿Es de marketing (landing, copy, redes)?
               SI → Usar skill apropiado (landing, social-copy, etc.)
               NO → Usar juicio. Preguntar si no es claro.
```

### Que Priorizar

El tiempo de Alejandro es extremadamente limitado (noches y fines de semana).
Cada decision debe pasar este filtro:

1. **¿Acerca a los 100 usuarios para junio?** → Alta prioridad
2. **¿Reduce tiempo manual de Alejandro?** → Alta prioridad
3. **¿Mejora el producto para profesores?** → Media prioridad
4. **¿Es infraestructura/refactor?** → Baja prioridad (solo si bloquea algo)

### Errores Comunes a Evitar

- No sobre-engineerear. La primera version debe funcionar, no ser perfecta
- No agregar features que nadie pidio. Los 4 usuarios actuales son la brujula
- No cambiar el stack. Golden Path esta decidido
- No tocar n8n sin permiso explicito (version 2.12.3, nodos incompatibles rompen todo)
- No sugerir Polar/Stripe. Es MercadoPago para Chile
- No olvidar pushear. Alejandro prueba en produccion

---

## Aprendizajes (19 blindajes: Tecnico 15, Negocio 2, Datos 2)

### 2025-01-09: Usar npm run dev, no next dev

- **Error**: Puerto hardcodeado causa conflictos
- **Fix**: Siempre usar `npm run dev` (auto-detecta puerto)
- **Aplicar en**: Todos los proyectos

### 2026-03-20: Docker + Next.js requiere output standalone

- **Error**: Build Docker enorme (~1GB) y lento sin standalone
- **Fix**: Agregar `output: 'standalone'` en `next.config.ts`. Dockerfile multi-stage (deps → builder → runner)
- **Aplicar en**: Cualquier deploy Docker de Next.js

### 2026-03-20: No ignorar package-lock.json en .gitignore

- **Error**: El .gitignore del template excluye `package-lock.json`, pero Docker necesita `npm ci` que lo requiere
- **Fix**: Remover `package-lock.json` del .gitignore cuando se usa Docker
- **Aplicar en**: Todo proyecto con Dockerfile

### 2026-03-20: Imágenes del sitio anterior no migran solas

- **Error**: Al migrar de Vite a Next.js, solo se copiaron las imágenes referenciadas en el código. Assets como el ebook-cover.jpg y el logo correcto no se incluyeron
- **Fix**: Verificar TODOS los assets de `/public/images/` del proyecto original contra el nuevo. Descargar los faltantes desde el sitio en producción
- **Aplicar en**: Cualquier migración de framework

### 2026-03-20: DNS y Supabase Auth se cambian JUNTOS

- **Error**: Si cambias la Site URL de Supabase antes del DNS, los usuarios de la versión vieja son redirigidos a la nueva (que puede no estar lista)
- **Fix**: Cambiar DNS (registro A) y Site URL de Supabase al mismo tiempo. Nunca uno sin el otro
- **Aplicar en**: Cualquier migración de dominio con Supabase Auth

### 2026-03-20: Deploy Easypanel — flujo correcto

- **Error**: Primer deploy quedó en "Waiting" por falta de variables de entorno
- **Fix**: Agregar TODAS las variables de entorno ANTES del primer deploy. Las `NEXT_PUBLIC_*` se necesitan en build time
- **Aplicar en**: Todo deploy en Easypanel con Next.js

### 2026-03-20: MercadoPago > Polar para mercado chileno

- **Contexto**: Se evaluó Polar (MoR) vs MercadoPago para profesores chilenos
- **Decisión**: MercadoPago. CLP nativo, cuotas sin interés, menor comisión (~3.49% vs ~5%), conocido por el público objetivo
- **Aplicar en**: No sugerir Polar ni Stripe directo para EducMark

### 2026-03-20: Separar RAGs por propósito

- **Contexto**: El RAG actual solo tiene programas MINEDUC (curricular). El contenido de slides/quiz es genérico
- **Decisión**: 2 colecciones separadas — `curriculum_programs` (planificación) + `teaching_content` (slides, quiz, evaluaciones)
- **Modelo**: Gemini Embedding 2 (gratis, PDF nativo hasta 6 páginas, 100+ idiomas)
- **Estado**: Planificado, pendiente ubicación de los 280 PDFs docentes
- **Aplicar en**: Cuando se implemente el pipeline de ingesta

### 2026-03-21: Siempre hacer deploy después de cada cambio

- **Regla**: Después de cada commit con cambios funcionales, hacer `git push` para que Easypanel auto-deploye
- **Motivo**: Alejandro prueba en producción (Easypanel), no en localhost. Si no se pushea, no ve los cambios
- **Aplicar en**: Todo cambio de código en el proyecto Next.js

### 2026-03-21: OMR Scanner requiere evaluaciones activas con items

- **Error**: El escáner mostraba "No hay evaluaciones activas" aunque se habían creado evaluaciones
- **Causa**: Las evaluaciones estaban en status `archived` y el workflow de n8n no insertaba items en `evaluation_items`
- **Fix**: Agregado nodo "Insertar Items en DB" + "Guardar Item en Supabase" al workflow de n8n. Agregado auto-carga de pauta en el frontend
- **Aplicar en**: Cualquier cambio al flujo de evaluaciones sumativas

### 2026-03-21: RAG con Gemini File Search implementado

- **Store**: `fileSearchStores/educmarkprogramas-64nwiv8hkept`
- **Contenido**: 136 PDFs (programas MINEDUC + bases curriculares, 1° básico a 4° medio + electivos)
- **Metadata**: asignatura, nivel, ciclo por cada documento
- **Script**: `scripts/ingest-rag.mjs`
- **Aplicar en**: Cuando se conecte con n8n para mejorar la generación de contenido

### 2026-03-20: Favicon es SVG, no ICO

- **Error**: El sitio devuelve HTML al pedir favicon.ico. El favicon real es favicon.svg
- **Fix**: Siempre verificar formato real del favicon con `file` command. Usar SVG
- **Aplicar en**: Migraciones de assets

### 2026-04-05: No refactorizar componentes en produccion sin tests

- **Error**: Refactor de WebOMRScanner.tsx (2151 → 787 lineas) compilaba sin errores pero rompio la camara en runtime. Closures y refs se comportaron diferente al extraerlos.
- **Fix**: Revertir al archivo original. Agregar codigo nuevo en archivos separados, no reestructurar lo existente.
- **Aplicar en**: Cualquier componente >500 lineas que funciona en produccion

### 2026-04-05: Assessment API requiere auth token + endpoint correcto

- **Error**: QuickScan usaba endpoint inventado `/api/scan` (404) y sin header Authorization (401). El real es `/api/v1/omr/process-base64` con Bearer token de Supabase.
- **Fix**: Copiar el patron exacto del scanner original: endpoint, payload (image_base64, total_questions, question_type, correct_answers_json), y auth header.
- **Aplicar en**: Cualquier componente nuevo que llame al Assessment API

### 2026-04-05: Verificar output de subagentes antes de deploy

- **Error**: Subagente genero QuickScanScanner con endpoint, payload y auth incorrectos. No se verifico antes de push. Costo 3 commits de fix.
- **Fix**: Despues de que un subagente genere codigo que llama a APIs existentes, hacer grep del endpoint/auth real en el codigo original y comparar.
- **Aplicar en**: Siempre que un subagente genere codigo que interactua con APIs existentes

### 2026-04-05: curriculumData.json tiene OAs con 'id' en vez de 'label'

- **Error**: 866 de 2438 OAs usan campo `id` en vez de `label`. Build fallaba con .replace on undefined.
- **Fix**: Crear helper `getOALabel(oa)` que lee `oa.label || oa.id || 'OA'`. Usarlo en todos los componentes.
- **Aplicar en**: Cualquier codigo que procese curriculumData.json

### 2026-04-05: Supabase Storage buckets no se crean automaticamente

- **Error**: Subagente asumio que Supabase auto-crea buckets al subir. Error "Bucket not found" en produccion.
- **Fix**: Crear bucket explicitamente via SQL: `INSERT INTO storage.buckets (id, name, public) VALUES ('institution-logos', 'institution-logos', true)`. Agregar policies RLS.
- **Aplicar en**: Cualquier feature que use Supabase Storage

### 2026-04-05: Siempre confirmar ruta del proyecto antes de ejecutar

- **Error**: Se aplico reorganizacion completa en Landing-EducMark (v1) en vez de educmark (v2). Todo el trabajo se tuvo que revertir.
- **Fix**: Preguntar al usuario la ruta correcta si hay ambiguedad. Verificar con `git remote -v` que es el repo correcto.
- **Aplicar en**: Inicio de cada sesion con proyectos multiples

### 2026-04-05: Portfolio Carrera Docente — datos reales vs asumidos

- **Error**: PRP original asumia 8 entregables en formato PDF. La realidad: 5 tareas en 3 modulos, texto en docentemas.cl. T2 es monitoreo formativo (dentro de la clase), no prueba sumativa.
- **Fix**: Reescribir PRP con estructura real del Manual Portafolio 2025. Wizard de 2 pasos (sin paso de evaluacion sumativa). IA genera texto completo, no templates.
- **Aplicar en**: Cualquier feature que dependa de documentos oficiales — leer la fuente primaria antes de disenar

### 2026-04-05: planning_blocks vacio en generated_classes

- **Error**: Se asumio que planning_blocks tenia datos estructurados (objective, inicio, desarrollo, cierre). En realidad es {} para la mayoria de las clases — el contenido se guarda como PDF en Google Drive.
- **Fix**: Usar topic como dato principal. Alimentar la IA con lo que hay y dejarla generar el resto.
- **Aplicar en**: Cualquier feature que lea generated_classes — verificar que campos realmente tienen datos

### 2026-04-06: planning_sequences — tabla dedicada para datos reales de planificación

- **Contexto**: Para que el dashboard de Carrera Docente genere borradores con datos reales (no inventados), se creó tabla dedicada `planning_sequences` (JSONB) poblada por el workflow n8n "EducMark Pro Max IP".
- **Columnas**: `user_id`, `secuencia_planificacion` (obj_clase/inicio/desarrollo/cierre), `secuencia_evaluacion` (tipo/instrumento/detalle), `secuencia_nee` (diagnóstico/barrera/DUA), `paci_data`, `created_at`.
- **API**: `src/app/api/portfolio/generate/route.ts` usa `SUPABASE_SERVICE_ROLE_KEY` para leer las 3 secuencias más recientes del user_id y pasarlas como contexto a OpenAI gpt-4o-mini.
- **Aplicar en**: Cualquier feature que necesite datos estructurados de planificación — usar `planning_sequences`, NO `generated_classes.planning_blocks`

### 2026-04-06: n8n ejecuta ramas paralelas en DFS, no en paralelo real

- **Error**: Nodo "Registrar Planificación" (Supabase INSERT) conectado como 2da rama paralela desde "Datos Profesor y Curso" nunca ejecutaba. La ejecución bajaba por la 1ra rama (cadena larga: Upload → RAG → OpenAI → parsers → email) y si algo fallaba o se cancelaba antes, la 2da rama quedaba sin correr.
- **Fix 1**: Invertir orden de conexiones salientes — poner la rama "hoja rápida" (INSERT) ANTES de la cadena larga. n8n ejecuta outputs en el orden del array.
- **Fix 2**: En el INSERT, no usar `$json.xxx` cuando aguas arriba hay nodos Google Drive — esos sobrescriben `$json` con metadata del archivo. Referenciar siempre los parsers por nombre: `$('Parser Análisis + Secuencia').item.json.secuencia_data`.
- **Aplicar en**: Cualquier workflow n8n con ramas paralelas + INSERTs críticos a BD

## Infraestructura EducMark

| Servicio       | URL                                               | Tipo                                               |
| -------------- | ------------------------------------------------- | -------------------------------------------------- |
| App Next.js    | `https://educmark-github.vfuqpl.easypanel.host`   | Docker (Easypanel)                                 |
| Assessment API | `https://assessment-api.vfuqpl.easypanel.host`    | Docker (Easypanel)                                 |
| RAG API        | `https://educmark-rag-api.vfuqpl.easypanel.host`  | Docker (Easypanel) — solo n8n la llama             |
| RAG Supabase   | `https://educmark-supabase.vfuqpl.easypanel.host` | Docker (Easypanel)                                 |
| n8n            | `https://n8n.educmark.cl`                         | Docker (Easypanel)                                 |
| Supabase Cloud | `https://gjudfgpudbqdhclbmjjo.supabase.co`        | Cloud (Auth + BD)                                  |
| Dominio        | `educmark.cl`                                     | cPanel (V2Networks) → pendiente migrar a Easypanel |

**Flujo generación:** Frontend → n8n (proxy) → rag-api → respuesta
**Flujo evaluaciones:** Frontend → assessment-api (directo)
**Deploy:** git push → GitHub webhook → Easypanel auto-rebuild
**Repo:** https://github.com/AlejandroAP9/EducMark-2.0

### Automatizaciones Nocturnas

| Job | Horario | Que hace |
|---|---|---|
| `nightly-educmark-metrics` | 23:55 | Captura 30 KPIs en daily_metrics (pg_cron) |
| `health-score-nightly` | 00:05 | Calcula health score por usuario + alertas Telegram (pg_cron → Edge Function) |

### Edge Functions

| Funcion | Endpoint | Proposito |
|---|---|---|
| `notify-health-alert` | `/functions/v1/notify-health-alert` | Envia alerta de churn a Telegram cuando usuario tiene 7+ dias inactivo |

### Supabase Storage Buckets

| Bucket | Publico | Uso |
|---|---|---|
| `institution-logos` | Si | Logos de colegios subidos por profes desde su perfil |

---

## Colores de Marca EducMark

### Core

- **Primario:** `#8B5CF6` (Violeta/Purpura intenso — color de accion y resalte)
- **Secundario:** `#06B6D4` (Cian/Azul verdoso — contrastes y acentos)
- **Fondo:** `#05050A` (Negro azulado oscuro)
- **Texto:** `#F8F9FA` (Blanco hueso)
- **Gradiente:** `linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)`

### Planes (iconografia chilena)

- Gratis: sky-400 | Copihue: pink-400 | Araucaria: emerald-400 | Condor: amber-400 | Establecimiento: blue-500

### Funcionales

- Exito: `#10B981` | Advertencia: `#F59E0B` | Error: `#EF4444`

---

## Estrategia de Marketing

> **Detalle completo:** `docs/marketing/strategy.md`

- **1-1-1:** 1 avatar (profe chileno) · 1 producto (EducMark) · 1 canal (Instagram sin camara)
- **Offer:** "Recupera tus tardes. Clase completa en minutos. De profe a profe."
- **Funnel:** Instagram → ebook gratis → 3 clases gratis → WOW → conversion → referidos
- **Contenido:** 12 skills especializados (ver tabla arriba: skills 19-30)

---

---

_Business OS V1.0 — EducMark. Cada dia: mas datos, mas blindajes, mejores decisiones._
_Construido sobre SaaS Factory V4. Agent-First. Recursividad Agentica._
