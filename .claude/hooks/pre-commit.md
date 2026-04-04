# Pre-Commit Hook

Guardrails que se ejecutan antes de cada commit.

## Checks Obligatorios

### 1. TypeScript Check
```bash
npm run typecheck
```
Bloquea el commit si hay errores de tipos.

### 2. Security Check
Buscar patterns peligrosos en archivos staged:
- API keys hardcodeadas
- Tokens en codigo fuente
- Archivos .env incluidos por error

### 3. Build Verification (solo releases)
```bash
npm run build
```
Solo cuando el commit message contiene "release" o "deploy".

## Activacion

Para activar como git hook:
```bash
#!/bin/sh
npm run typecheck || exit 1
```

Guardar en `.git/hooks/pre-commit` y hacer `chmod +x`.
