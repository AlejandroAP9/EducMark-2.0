---
name: script-master
description: |
  Orquestador de guiones. Toma una idea y genera el guion completo
  (hook + cuerpo + CTA) optimizado para el formato elegido.
  Usa internamente las reglas de hook-writer, body-writer y cta-writer.
  Activar cuando: guion, script, hazme el contenido, genera el reel,
  escribe el carrusel, contenido completo, pieza de contenido.
---

# Script Master — Guiones Completos de Una

> Dame una idea y un formato. Yo te devuelvo la pieza lista para producir.

---

## Proceso

1. **Recibir input**: idea + formato (reel/carrusel/post/story) + pilar + tipo (vehiculo/ayuda/autoridad/confianza)
2. **Definir objetivo**: CRECIMIENTO o VENTA?
   - Crecimiento (80% del contenido en pre-PMF) → sin CTA de venta, priorizar hook apalancativo
   - Venta (20%) → con CTA directo, hook propio
3. **Verificar paradigma**: Si es tipo "ayuda/contrarian", consultar reglas de paradigm-breaker
4. **Generar hook**: Aplicar reglas de hook-writer.
   - Si crecimiento → incluir opcion de hook apalancativo (palanca viral)
   - Si venta → priorizar Cost Narration o hook propio
5. **Escribir cuerpo**: Aplicar reglas de body-writer segun formato
6. **Posicionamiento** (si usa palanca): agregar frase de posicionamiento post-palanca (a favor, en contra, o "hablemos")
7. **Cerrar con CTA**: Aplicar reglas de cta-writer segun objetivo (o sin CTA si es crecimiento)
8. **Verificar anti-teletienda**: revisar que NO tenga tono de infomercial
9. **Compilar guion final**

---

## Formato de Salida por Tipo

### Para Reels
```markdown
# REEL: [titulo interno]
**Pilar:** [1/2/3] | **Tipo:** [vehiculo/ayuda/autoridad/confianza]
**Formato visual:** [screen recording / texto cinetico / POV manos / before-after / slideshow]
**Duracion estimada:** [15-60 seg]

## HOOK (0:00 - 0:04)
Texto en pantalla: "[hook]"
Visual: [que se ve]

## CUERPO (0:04 - 0:XX)
[PANTALLA 1 - 0:04 a 0:10]
Texto: "..."
Visual: [descripcion]

[PANTALLA 2 - 0:10 a 0:18]
Texto: "..."
Visual: [descripcion]

## CTA (ultimos 3-5 seg)
Texto en pantalla: "[cta]"
Visual: [que se ve]

## CAPTION
[caption completa con hashtags]

## NOTAS DE PRODUCCION
- Musica sugerida: [tipo/mood]
- Transiciones: [corte/zoom/slide]
- Apps: CapCut para edicion, grabacion de pantalla nativa
```

### Para Carruseles
```markdown
# CARRUSEL: [titulo interno]
**Pilar:** [1/2/3] | **Tipo:** [vehiculo/ayuda/autoridad/confianza]
**Slides:** [N] | **Estilo:** sketch/pizarra pedagogica

| Slide | Tipo | Titulo | Copy | Visual |
|-------|------|--------|------|--------|
| 1 | Portada | "[hook]" | — | [descripcion estilo sketch] |
| 2 | Contenido | "[punto 1]" | "[texto]" | [icono/diagrama] |
| ... | ... | ... | ... | ... |
| N | CTA | "[cta]" | — | Logo EducMark |

## CAPTION
[caption completa con hashtags]
```

### Para Posts
```markdown
# POST: [titulo interno]
**Pilar:** [1/2/3] | **Tipo:** [vehiculo/ayuda/autoridad/confianza]
**Estilo visual:** [sketch/branding limpio/meme]

## IMAGEN
Texto principal: "[lo que se lee en la imagen]"
Elementos visuales: [descripcion]

## CAPTION
[caption completa con hashtags]
```

### Para Stories
```markdown
# STORY SEQUENCE: [tema]
**Objetivo:** [engagement/venta/research]

| # | Tipo | Texto | Interaccion | Follow-up DM |
|---|------|-------|-------------|--------------|
| 1 | [poll/quiz/texto/CTA] | "[texto]" | [opciones] | [si aplica] |
| 2 | ... | ... | ... | ... |
```

---

## Estructura Apalancativa (Aimelis Quintero 2025)

Nueva estructura para reels de CRECIMIENTO (reemplaza o complementa la clasica):

```
PALANCA (5 seg) — clip viral >1M views
  → POSICIONAMIENTO (3-5 seg) — te mojas: a favor, en contra, o "hablemos"
    → CONTEXTUALIZACION (10-15 seg) — datos, experiencia, bibliografia
      → SOLUCION (10-15 seg) — tu metodo, tu conocimiento
        → SIN CTA (si es crecimiento) o CTA suave (si es venta)
```

### Ejemplo completo para EducMark
```
[0:00-0:05] PALANCA: clip viral de profe frustrado corrigiendo pruebas
[0:05-0:08] POSICIONAMIENTO: "Esto le pasa al 90% de los profes. Y nadie habla de esto"
[0:08-0:20] CONTEXTUALIZACION: "En Chile, un profe trabaja 12 horas. Solo 4 son ensenando.
            Llevo 20 anos en esto y puedo decirte que el problema no es el profe..."
[0:20-0:35] SOLUCION: "...es que seguimos haciendo a mano lo que la tecnologia ya resolvio.
            [screen recording de EducMark generando clase en 2 min]"
[0:35-0:40] CIERRE: sin CTA (deja que se comparta solo)
```

---

## 6 Reglas del Guion

1. **Comprensible**: lenguaje de nino de 5 anos
2. **Entretenido**: que enganche, no que aburra (piensa en CINE, no en marketing)
3. **Relevante**: solo lo que Alejandro ha vivido/logrado
4. **No redundante**: pocas palabras, al punto
5. **Una idea por pieza**: que se pueda resumir en 1 oracion
6. **Anti-teletienda**: NUNCA tono de infomercial. Nada de "Quieres cambiar tu vida?". Hablar como profe a profe

---

## Metodo de Escritura

Usar **bullet points** para el cuerpo — Alejandro es profe, suena natural explicando.
**EXCEPTO el hook** — siempre palabra por palabra, pensado estrategicamente.

---

## Reglas sin Camara

- Todos los formatos visuales funcionan sin mostrar cara
- Reels: screen recording, texto cinetico, POV manos, before/after
- Carruseles: estilo sketch/pizarra pedagogica
- Posts: frase sobre fondo de marca
- Stories: texto + interaccion (polls, quizzes)
