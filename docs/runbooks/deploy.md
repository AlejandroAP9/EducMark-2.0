# Runbook: Deploy a Produccion

## Pre-Deploy Checklist

1. Verificar rama limpia: `git status`
2. Typecheck: `npm run typecheck`
3. Build: `npm run build`
4. Tests: `npx playwright test` (si hay tests configurados)

## Deploy

### Vercel (Principal)

```bash
# Deploy automatico via git push
git push origin main

# Deploy manual
npx vercel --prod
```

### Validacion Post-Deploy

1. Verificar que la app carga en produccion
2. Probar flujo critico: login → generar clase → resultado
3. Verificar metricas: `SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 1;`

## Rollback

```bash
# Ver deploys recientes
npx vercel ls

# Rollback al deploy anterior
npx vercel rollback
```
