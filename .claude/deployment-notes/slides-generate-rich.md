# Deploy: /api/slides/generate-rich

## Variables de entorno a agregar en Easypanel

Servicio: `github` (Next.js de educmark.cl) — Proyecto `educmark`

Panel: Easypanel → Proyecto `educmark` → Servicio `github` → Environment → Agregar estas variables:

```env
# === RAG Supabase self-hosted ===
NEXT_PUBLIC_RAG_SUPABASE_URL=http://kong:8000
RAG_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

# === Kie.ai (imágenes Nano Banana) ===
KIE_API_KEY=7e332375bb74a76a95869f2a014e6ca2

# === Resend (emails) ===
RESEND_API_KEY=re_gXgTvC7a_EkKYC5WgWttWhXUvB7cyJvRg
```

**Nota crítica sobre hairpin NAT:**
- `NEXT_PUBLIC_RAG_SUPABASE_URL` usa `http://kong:8000` (DNS interno Docker)
- NO usar la URL pública `https://educmark-supabase.vfuqpl.easypanel.host` — causa timeouts intermitentes

## Verificación post-deploy

```bash
# Desde terminal del servicio github en Easypanel:
curl -X POST http://localhost:3000/api/slides/generate-rich \
  -H "Content-Type: application/json" \
  -H "Cookie: <sb-access-token=...>" \
  -d '{"asignatura":"historia","curso":"8-basico","oa":"Estado Moderno"}'

# Esperado: 200 con { success: true, classId, presentacionUrl, planificacionUrl, ... }
# Sin cookie: 401 "No autenticado"
```

## Arquitectura del endpoint

| Paso | Tiempo aprox | Servicio |
|---|---|---|
| 1. Auth + créditos | <100ms | Supabase Cloud |
| 2. RAG queries (programa + texto_estudiante) | 2s | Supabase self-hosted (pgvector) |
| 3. Planificación (gpt-4o-mini) | 5-8s | OpenAI |
| 4. Contenido slides+quiz (gpt-4o-mini) | 8-12s | OpenAI |
| 5. Image prompts (gpt-4o-mini) | 3s | OpenAI |
| 6. Imágenes Nano Banana (10 paralelas) | 10-15s | Kie.ai |
| 7. Upload HTML presentación + planificación | 1s | Supabase Storage |
| 8. INSERT generated_classes + descuento crédito | <100ms | Supabase Cloud |
| 9. Email | <500ms | Resend |
| **Total** | **~30-40s** | |

## Costo por clase

- OpenAI: ~$0.005
- Kie.ai Nano Banana (10 imgs × $0.02): $0.20
- **Total: ~$0.21 USD ≈ $190 CLP**

## Rollback

Si el endpoint falla en producción:
- No afecta el flujo actual (n8n sigue activo)
- Eliminar envs en Easypanel revierte el endpoint a no-operational
- El frontend sigue usando n8n hasta que se cambie

## Pendiente (siguiente iteración)

- [ ] Cambiar frontend para usar `/api/slides/generate-rich` en vez de `generate-class-kit` edge function
- [ ] Agregar arquitecto NEE/DUA (3er nodo de planificación de n8n)
- [ ] Agregar evaluación formativa con rúbrica (2do nodo de planificación de n8n)
