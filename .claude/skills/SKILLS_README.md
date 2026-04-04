# Skills System - SaaS Factory V4

> Todo es un Skill. Hot reload. Auto-discovery. Zero config.

---

## Inventario de Skills (33 total)

### Skills de Producto (18)

| # | Skill | Comando | Descripcion |
|---|-------|---------|-------------|
| 1 | `new-app` | `/new-app` | Entrevista de negocio → BUSINESS_LOGIC.md |
| 2 | `add-login` | `/add-login` | Auth completo Supabase (login, signup, password reset, profiles, RLS) |
| 3 | `add-payments` | `/add-payments` | Pagos con MercadoPago: checkout, webhooks, suscripciones, CLP nativo |
| 4 | `add-emails` | `/add-emails` | Emails transaccionales: Resend + React Email + batch + unsubscribe |
| 5 | `add-mobile` | `/add-mobile` | PWA instalable + push notifications (iOS compatible) |
| 6 | `website-3d` | `/website-3d` | Landing cinematica Apple-style: scroll-driven video + copy AIDA/PAS |
| 7 | `prp` | `/prp [feature]` | Generar PRP con dependency graph para features complejas |
| 8 | `bucle-agentico` | `/bucle-agentico` | Ejecutar features por fases: dependency graph + paralelo + cascade failure |
| 9 | `ai` | `/ai [template]` | 11 AI Templates (chat, RAG, vision, tools, web search, etc.) |
| 10 | `supabase` | `/supabase` | Todo BD: crear tablas, RLS, migraciones, queries, metricas, CRUD |
| 11 | `playwright-cli` | `/playwright-cli` | Testing automatizado con browser real |
| 12 | `primer` | `/primer` | Cargar contexto completo del proyecto al inicio de sesion |
| 13 | `memory-manager` | `/memory-manager` | Memoria persistente POR PROYECTO en `.claude/memory/` (git-versioned) |
| 14 | `data-analyst` | `/data-analyst` | Analisis de datos on-demand: metricas, tendencias, reportes |
| 15 | `image-generation` | `/image-generation` | Generar/editar imagenes con OpenRouter + Gemini |
| 16 | `autoresearch` | `/autoresearch [skill]` | Auto-optimizar skills con loop autonomo (patron Karpathy) |
| 17 | `monday-kickoff` | `/monday-kickoff` | Ritual semanal: feedback → 3 prioridades producto + 3 ideas contenido |
| 18 | `product-decisions` | `/product-decisions` | AI toma primer corte en decisiones. Presenta 3 opciones + recomendacion |

### Skills de Marketing y Contenido (12 — creados 2026-03-29)

Fabrica de contenido para Instagram. Cada skill es una pieza del pipeline.

| # | Skill | Comando | Descripcion |
|---|-------|---------|-------------|
| 19 | `content-pillars` | `/content-pillars` | Definir pilares, angulos y banco de ideas |
| 20 | `paradigm-breaker` | `/paradigm-breaker` | Contenido contrarian que rompe creencias del profe chileno |
| 21 | `hook-writer` | `/hook-writer` | Generar hooks (Cost Narration, dolor, estadistica, polemico) |
| 22 | `body-writer` | `/body-writer` | Escribir cuerpo adaptado al formato (reel, carrusel, post, story) |
| 23 | `cta-writer` | `/cta-writer` | Generar CTA + caption + hashtags (Manychat, follow, interaction) |
| 24 | `script-master` | `/script-master` | Orquestador: guion completo (hook + cuerpo + CTA) |
| 25 | `reel-creator` | `/reel-creator` | Reels SIN camara: screen recording, texto cinetico, POV, before/after |
| 26 | `carousel-creator` | `/carousel-creator` | Carruseles: estructura slide por slide, estilo sketch/pizarra |
| 27 | `post-creator` | `/post-creator` | Posts estaticos: frases de impacto, datos, screenshots, memes |
| 28 | `story-creator` | `/story-creator` | Stories: encuestas, quizzes, CTAs, secuencias interactivas |
| 29 | `content-calendar` | `/content-calendar` | Calendario semanal: formatos, pilares, tipos y CTAs por dia |
| 30 | `image-creator` | `/image-creator` | Imagenes sketch/pizarra pedagogica (Gemini Nano Banana gratis) |

**Pipeline de contenido:**
```
content-calendar → content-pillars → script-master → format-creator → image-creator
```

### Skills de Sistema (3 — no invocables por usuario)

| Skill | Proposito |
|-------|-----------|
| `update-sf` | Actualizar SaaS Factory a la ultima version |
| `eject-sf` | Remover SaaS Factory del proyecto (DESTRUCTIVO) |
| `skill-creator` | Crear nuevos skills con scripts de init/validate/package |

### Skills Adicionales

| Skill | Comando | Descripcion |
|-------|---------|-------------|
| `video-visuals` | `/video-visuals` | Paquetes visuales narrativos estilo sketchnote |

---

## Estructura de un Skill

```
skill-name/
├── SKILL.md              # Requerido: frontmatter YAML + instrucciones
├── scripts/              # Opcional: codigo ejecutable (.py, .sh, .js)
├── references/           # Opcional: docs de referencia (>5k palabras)
└── assets/               # Opcional: templates, imagenes, fonts
```

### Frontmatter YAML

```yaml
---
name: skill-name                    # Identificador (lowercase, hyphens, max 64 chars)
description: Que hace               # Claude usa esto para decidir cuando activarlo
argument-hint: "[argumento]"        # Hint en autocomplete (opcional)
user-invocable: false               # Solo Claude puede invocarlo (opcional)
disable-model-invocation: true      # Solo el usuario puede invocarlo (opcional)
allowed-tools: Read, Write, Bash    # Tools permitidos sin pedir permiso (opcional)
model: claude-sonnet-4-6            # Modelo especifico (opcional)
context: fork                       # Ejecuta en subagent aislado (opcional)
agent: Explore                      # Tipo de agente (opcional)
---
```

### Variables de Sustitucion

| Variable | Descripcion |
|----------|-------------|
| `$ARGUMENTS` | Todos los argumentos del usuario |
| `$ARGUMENTS[N]` o `$N` | Argumento por indice (0-based) |
| `${CLAUDE_SESSION_ID}` | ID de sesion actual |
| `${CLAUDE_SKILL_DIR}` | Directorio del skill |
| `` !`comando` `` | Inyeccion de contexto dinamico (ejecuta shell) |

### Progressive Disclosure

1. **Metadata** (~100 palabras) - Siempre en contexto (frontmatter)
2. **SKILL.md** (<5k palabras) - Cuando se activa
3. **Resources** (unlimited) - Bajo demanda (scripts/, references/, assets/)

---

## Recursos Compartidos

| Recurso | Path | Usado por |
|---------|------|-----------|
| PRP Template | `.claude/PRPs/prp-base.md` | Skill `prp` |
| AI Templates | `.claude/skills/ai/references/` | Skill `ai` |
| Design Systems | `.claude/design-systems/` | Directo (5 sistemas) |
| Memoria | `.claude/memory/` | Skill `memory-manager` |

---

*SaaS Factory V4: Todo es un Skill. 33 herramientas especializadas.*
*Ultima actualizacion: 2026-04-04*
