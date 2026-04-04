# Feedback — Garbage In, Treasure Out

> Inspirado en Jenny (Design Lead, Anthropic): tomar inputs desordenados
> de multiples fuentes y extraer las gemas accionables.

## Como Funciona

1. **Captura diaria** — Tira notas sueltas en esta carpeta. No importa el formato.
2. **Procesamiento semanal** — Cada lunes, el skill `monday-kickoff` procesa TODO esto.
3. **Output** — 3 prioridades de producto + 3 ideas de contenido + presentacion.

## Fuentes de Feedback

| Fuente | Tipo | Como capturar |
|--------|------|---------------|
| Dogfooding propio | Fricciones usando EducMark | Archivo `dogfooding-log.md` |
| Instagram DMs | Preguntas y comentarios de profes | Archivo `social-YYYY-MM.md` |
| Usuarios registrados | Feedback directo | Archivo `usuarios-YYYY-MM.md` |
| Observacion en colegio | Lo que ves que hacen otros profes | Archivo `observaciones.md` |
| Casos de uso descubiertos | Usos inesperados del producto | Archivo `casos-descubiertos.md` |

## Casos de Uso Descubiertos

> "You can't mock up all the states. You have to discover use cases
> as you see people using them." — Jenny Wen, Anthropic

Los productos con IA son no-determinísticos. No puedes predecir qué hará cada profe.
Los mejores casos de uso se DESCUBREN observando, no se diseñan de antemano.

Cuando alguien use EducMark de una forma que no esperabas, anotalo en `casos-descubiertos.md`.
Estos son oro puro — pueden redefinir el producto, el contenido, y el pricing.

## Formato de Notas

No hay formato. Escribe lo que sea, como sea. Claude lo procesa.

```
2026-03-29: Use EducMark para mi prueba de 7mo. El OMR tardo mucho en cargar.
2026-03-29: Un colega me pregunto si podia generar pruebas de matematicas.
2026-03-30: Vi a la profe de lenguaje copiando items de una prueba antigua a Word. 45 min.
```

## Archivos en esta Carpeta

- `dogfooding-log.md` — Tu experiencia usando EducMark como profesor
- `social-YYYY-MM.md` — Feedback de Instagram, DMs, comentarios
- `usuarios-YYYY-MM.md` — Feedback directo de usuarios registrados
- `observaciones.md` — Lo que observas en el colegio
- `weekly-insights/` — Outputs del monday-kickoff (generados automaticamente)
