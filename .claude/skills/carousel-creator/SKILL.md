---
name: carousel-creator
description: |
  Experto en carruseles de Instagram. Disena estructura slide por slide,
  copy, flujo de lectura y estilo visual sketch/pizarra pedagogica.
  Los carruseles son el formato mas guardado y compartido por profes.
  Activar cuando: carrusel, carousel, slides, desliza, paso a paso visual,
  infografia, listicle, post deslizable.
---

# Carousel Creator — El Formato que los Profes Guardan y Comparten

> Los carruseles son ORO para educacion: accionables, guardables, compartibles.
> Un buen carrusel se comparte en grupos de WhatsApp de profes.

---

## Tipos de Carrusel

### 1. Listicle
"5 errores al planificar" / "3 herramientas que todo profe necesita"

### 2. Paso a Paso
"Como generar tu evaluacion en 3 pasos"

### 3. Contrarian
Slide 1: paradigma roto → Slides 2-5: por que → Slide 6: alternativa → CTA

### 4. Antes/Despues
ANTES (proceso manual) → DESPUES (con EducMark) → como funciona → CTA

### 5. Datos Duros
Cada slide un dato impactante. Numero grande + contexto pequeno.

### 6. Storytelling
Hook emocional → historia → resolucion → leccion/CTA

---

## Estilo Visual: Sketch/Pizarra Pedagogica

- **Fondo**: beige/papel/pizarra
- **Tipografia**: bold tipo marcador, hand-written feel
- **Iconos**: dibujados a mano
- **Flechas**: manuscritas, curvas
- **Banners/cintas**: de colores para resaltar
- **Diagramas**: tipo mapa mental

Se genera con el skill image-creator.

---

## Reglas del Carrusel

1. **Slide 1 = Hook visual**: texto grande, contraste alto, funciona como miniatura
2. **1 idea por slide**: si el profe salta una slide, no pierde el hilo
3. **Texto minimo**: max 3-4 lineas por slide
4. **Flujo de lectura**: arriba a abajo, izquierda a derecha
5. **Slide final siempre CTA**
6. **7-8 slides optimo**
7. **CTA viene del usuario** — NUNCA inventar el CTA. Si el usuario no lo dio, preguntar antes de generar
8. **Stage = review hasta aprobacion** — todo carrusel queda en review en el calendario hasta que Alejandro confirme. Solo entonces pasar a "listo para publicar"
9. **Consistencia visual obligatoria** — TODAS las slides deben verse hermanas: misma paleta, mismo grano, mismos elementos. Usar el "Prompt Maestro 80/20" del skill image-creator (80% del prompt fijo, solo cambia el contenido en [corchetes])

---

## Framework Storytelling EducMark — 7 Slides (Hormozi adaptado)

Estructura por defecto cuando el carrusel busca conversion (no solo valor). Adaptado al avatar profe chileno con dolor cuantificable.

| Slide | Funcion | Que va | Layout |
|-------|---------|--------|--------|
| 1 | **Hook / Dolor** | Frase punzante que el profe siente en el hueso ("Pasaste el domingo planificando otra vez") | Portada con ilustracion + 2 bloques de texto |
| 2 | **Dato duro** | Estadistica o numero que valida el dolor (horas semanales, % burnout, costo Carrera Docente) | Solo texto, 3 bloques |
| 3 | **Why — el sistema** | Por que pasa esto (no es culpa del profe, es el sistema chileno) | Ilustracion + 2 bloques |
| 4 | **Problem — lo que estas haciendo mal** | El loop actual: planificar manual, copiar de internet, recalentar | Solo texto, 3 bloques |
| 5 | **Solution — EducMark** | El nuevo flujo: clase completa en minutos, alineada al curriculum MINEDUC | Ilustracion + 2 bloques |
| 6 | **Prueba** | Testimonio breve, output UTP-Ready, o numero del producto (51 clases generadas, etc.) | Ilustracion + 2 bloques |
| 7 | **CTA del usuario** | Lead magnet (3 clases gratis / ebook) — el usuario lo entrega | Ilustracion + 2 bloques |

**Cuando NO usar este framework:**
- Listicle puro ("5 errores...") — estructura propia del listicle
- Paso a paso instruccional — secuencia de pasos
- Storytelling personal — arco narrativo propio

Para cualquier otro carrusel orientado a venta: este framework por defecto.

---

## Formato de Salida

```markdown
# BRIEF CARRUSEL - [titulo]
**Tipo:** [Listicle/Paso a paso/Contrarian/Antes-Despues/Datos/Story]
**Slides:** [N] | **Estilo:** Sketch/pizarra

| Slide | Titulo | Copy | Visual | Notas |
|-------|--------|------|--------|-------|
| 1 | "[hook]" | — | [portada sketch] | Alto contraste |
| 2 | "[punto 1]" | "[texto]" | [icono] | — |
| N | "[CTA]" | "[texto]" | Logo EducMark | Cierre |

## CAPTION
[caption + hashtags]
```
