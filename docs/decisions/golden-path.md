# Golden Path — Decisiones de Stack y Convenciones

> Por que elegimos cada tecnologia y como escribimos codigo.

---

## Stack: Por Que Este y No Otro

| Decision | Elegido | Descartado | Por que |
|---|---|---|---|
| Framework | Next.js 16 | Vite + React (v1) | SSR, App Router, API routes integradas |
| Auth | Supabase Auth | NextAuth, Clerk | Ya tenemos Supabase, RLS nativo, sin vendor lock |
| Pagos | MercadoPago | Stripe, Polar | CLP nativo, cuotas, profesores lo conocen |
| AI | Vercel AI SDK + OpenRouter | API directa | Streaming, multi-modelo, templates |
| Estado | Zustand | Redux, Context | Simple, sin boilerplate, devtools |
| Validacion | Zod | Yup, io-ts | TypeScript-first, inferencia de tipos |
| Testing | Playwright CLI | Jest, Cypress | Browser real, MCP integrado |

---

## Reglas de Codigo

- **KISS**: Soluciones simples
- **YAGNI**: Solo lo necesario
- **DRY**: Sin duplicacion
- Archivos max 500 lineas, funciones max 50 lineas
- Variables/Functions: `camelCase`, Components: `PascalCase`, Files: `kebab-case`
- NUNCA usar `any` (usar `unknown`)
- SIEMPRE validar entradas de usuario con Zod
- SIEMPRE habilitar RLS en tablas Supabase
- NUNCA exponer secrets en codigo

---

## Comandos npm

```bash
npm run dev          # Servidor (auto-detecta puerto 3000-3006)
npm run build        # Build produccion
npm run typecheck    # Verificar tipos
npm run lint         # ESLint
```

---

## Contexto Educativo Chileno (CRITICO)

- Terminologia MINEDUC siempre en español oficial: OA, eje, unidad, nivel
- Niveles: NT1/NT2 (parvulos), 1°-6° basico, 7°-8° basico, 1°-4° medio, TP
- Considerar educacion intercultural: Aymara, Mapudungun
