---
name: image-creator
description: |
  Genera imagenes estilo sketch/pizarra pedagogica para posts, carruseles
  y thumbnails de Reels. Estilo hand-drawn, fondo beige, tipografia marcador,
  iconos dibujados, banners de colores, flechas manuscritas.
  Usa el skill image-generation con prompts especializados.
  Activar cuando: imagen para post, imagen para carrusel, thumbnail,
  visual del contenido, diseno, sketch, pizarra, ilustracion educativa.
---

# Image Creator — Estilo Sketch/Pizarra Pedagogica

> Cada imagen de EducMark tiene un estilo UNICO: sketch educativo
> que parece dibujado a mano en una pizarra. Profesional pero cercano.

---

## Estilo Visual EducMark

### Caracteristicas
- **Fondo**: beige claro / papel texturizado / pizarra blanca
- **Tipografia**: bold, tipo marcador de pizarra, hand-written feel
- **Iconos**: dibujados a mano (NO iconos genericos)
- **Flechas**: manuscritas, curvas, con punta dibujada
- **Banners/cintas**: de colores (azul, verde, naranja, morado)
- **Diagramas**: tipo mapa mental, como un profe dibuja en la pizarra
- **Bordes**: irregulares, sketch, como recortes de papel
- **Branding sutil**: "EDUCMARK" en tipografia consistente

### Paleta de Colores EducMark (Oficial)

**Core:**
- Primario: #8B5CF6 (Violeta/Purpura intenso — color de accion y resalte)
- Secundario: #06B6D4 (Cian/Azul verdoso — contrastes y acentos)
- Fondo: #05050A (Negro azulado muy oscuro)
- Texto: #F8F9FA (Blanco hueso)
- Gradiente acento: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)

**Planes (iconografia chilena):**
- Gratis: sky-400 (celeste)
- Copihue: pink-400 (rosado)
- Araucaria: emerald-400 (verde esmeralda)
- Condor: amber-400 (dorado)
- Establecimiento: blue-500 (azul institucional)

**Funcionales:**
- Exito: #10B981 (verde)
- Advertencia: #F59E0B (naranja)
- Error: #EF4444 (rojo)

**Para imagenes sketch/pizarra:** usar fondo beige #F5F0E8 con acentos en violeta #8B5CF6 y cian #06B6D4 (en vez de azul generico). Esto mantiene el estilo pedagogico pero con identidad EducMark.

---

## Tipos de Imagen

### 1. Portada de Carrusel (1:1 o 4:5)
Titulo grande en banner/cinta + 1-2 iconos sketch + subtitulo

### 2. Slide de Carrusel (1:1 o 4:5)
Titulo arriba + contenido con iconos/diagramas + numero de slide

### 3. Post de Frase (1:1)
Frase centrada + decoracion sketch minima + logo sutil

### 4. Post de Dato (1:1)
Numero GIGANTE + contexto + icono sketch + banner de color

### 5. Diagrama/Mapa Mental (1:1 o 4:5)
Concepto central + ramas con flechas + iconos en nodos

---

## Prompt Maestro 80/20 (Consistencia visual entre slides)

> **Regla de oro:** Cuando generes un carrusel, el 80% del prompt es FIJO entre todas las slides.
> Solo cambia lo que esta en [corchetes]. Esto garantiza que todas las imagenes se vean hermanas.

```
Una imagen estatica para Instagram en estilo sketch / cuaderno de profe. Fondo
beige texturizado #F5F0E8 que parece papel de cuaderno con lineas tenues.
Este slide es [TIPO LAYOUT: con ilustracion central / solo texto].
[Si lleva ilustracion: En el centro, dibujo a mano alzada en trazo violeta
#8B5CF6 de DESCRIPCION CONCEPTO, con sombreado a lapiz y acentos cian #06B6D4.
Borde irregular tipo recorte de papel.]
Sobre la composicion hay [N: 2 o 3] tiras horizontales de papel blanco
rasgado con borde irregular, sombra suave, conteniendo texto en ESPANOL
chileno: tipografia sans-serif bold negra, [CONTENIDO TEXTUAL].
Sombras sutiles tipo scrapbook, sensacion tactil. Formato cuadrado 1:1.
Estilo: cuaderno de profe + diseno limpio EducMark. NO usar ningun otro
color fuera de violeta #8B5CF6, cian #06B6D4, beige #F5F0E8, blanco y negro.
```

### Variables por slide del framework de 7 (ver carousel-creator)

| Slide | Layout | N tiras | Contenido |
|-------|--------|---------|-----------|
| 1 — Hook | con ilustracion | 2 | top: [DOLOR], bottom: [DOLOR amplificado] |
| 2 — Dato | solo texto | 3 | top, middle, bottom: [DATO + CONTEXTO] |
| 3 — Why | con ilustracion | 2 | top: [POR QUE], bottom: [VALIDACION] |
| 4 — Problem | solo texto | 3 | top, middle, bottom: [QUE ESTAS HACIENDO MAL] |
| 5 — Solution | con ilustracion | 2 | top: [EDUCMARK], bottom: [BENEFICIO] |
| 6 — Prueba | con ilustracion | 2 | top: [TESTIMONIO/NUMERO], bottom: [VALIDACION] |
| 7 — CTA | con ilustracion | 2 | top: [CTA del usuario], bottom: [URGENCIA/beneficio] |

**Importante:** El contenido textual en espanol se valida visualmente. Si la IA comete errores con tildes/n/numeros, retocar en Canva — NO regenerar (rompe consistencia con el resto).

---

## Variantes de Logo EducMark

| Archivo | Uso | Estilo |
|---------|-----|--------|
| `public/images/logo-educmark-icon.png` | App icon, favicon, perfil IG, OG image | Squircle iOS negro #05050A con barras glow violeta→cian estilo neón |
| `public/images/logo-educmark-watermark.png` | **Watermark en carruseles sketch** (uso por defecto del overlay) | 3 barras planas violeta sólido #8B5CF6, sin squircle, sin glow, transparente |
| `public/images/logo-educmark-wordmark.png` | Headers de landing, footer, bio links | Lockup horizontal: barras glow + "EDUCMARK" en sans-serif bold blanco |

**Regla clave:** NUNCA usar el icon (con squircle negro) como watermark sobre fondos beige. Choca visualmente. El watermark plano es la única variante diseñada para superposición.

---

## Watermark Logo EducMark (post-procesado)

Para asegurar branding consistente sin depender de la IA: generar imagen base limpia y superponer el watermark con el script `scripts/overlay_logo.py`.

```bash
python3 .claude/skills/image-creator/scripts/overlay_logo.py \
  imagen_base.png \
  imagen_final.png
```

- Por defecto usa `public/images/logo-educmark-watermark.png` (variante plana sin glow)
- Coloca el logo en esquina inferior derecha (margen 2%, 12% del ancho)
- Mantiene transparencia
- NO regenera la imagen — mas barato y consistente que pedirle a la IA que ponga el logo

Cuando uses este flujo, el prompt de generacion debe terminar con:
> "IMPORTANTE: En la esquina inferior derecha deja el fondo limpio — NO pongas texto ni elementos alli, ese espacio es para el logo."

---

## Prompt Base para Generacion

Usar con el skill image-generation (Nano Banana 2 via OpenRouter):

```
Create a hand-drawn educational sketch illustration on a light beige textured paper background.
Style: sketchnote / whiteboard illustration, like a teacher drew it on a classroom whiteboard.
Elements: hand-drawn icons, curved manuscript arrows, colored ribbon banners (blue, green, orange),
bold marker-style typography, decorative stars and circles for emphasis.
Professional but approachable, educational but not boring.
Text in SPANISH.
Brand: EDUCMARK (subtle).

[CONTENIDO ESPECIFICO]
```

### Prompts por Tipo

**Portada carrusel:**
```
...educational sketch cover for Instagram carousel.
Title in a blue ribbon banner: "[TITULO]"
2-3 hand-drawn icons: [CONCEPTOS]
Aspect ratio: 1:1
```

**Post de frase:**
```
...minimalist educational sketch with a powerful quote centered.
Quote: "[FRASE]"
Decorative: hand-drawn underline, small stars.
"EDUCMARK" small at bottom. Aspect ratio: 1:1
```

**Diagrama:**
```
...educational mind-map sketch diagram.
Central concept: "[CONCEPTO]"
Branches: [NODO 1], [NODO 2], [NODO 3]
Each node with hand-drawn icon. Curved arrows. Aspect ratio: 1:1
```

---

## Proveedor Principal: Gemini Nano Banana (GRATIS via plan Gemini)

El metodo preferido es generar en Gemini directamente (Nano Banana incluido en plan).
- Costo: $0 (incluido en suscripcion Gemini)
- Calidad: excelente para estilo sketchnote
- Texto en espanol: muy bueno (tildes correctas en la mayoria de casos)
- Retoques menores: Canva para corregir palabras con n o numeros incorrectos

### Flujo de trabajo
1. Copiar el prompt del skill
2. Pegar en Gemini (chat o AI Studio)
3. Descargar imagen generada
4. Si hay errores de texto menor → retocar en Canva
5. Guardar en `generated/content/`

## Proveedor Secundario: Kie.ai (API, para automatizacion)

Para generacion masiva via API cuando se necesite automatizar.
Requiere: `KIE_API_KEY` en `.env.local`
Docs: https://docs.kie.ai
1 credito = $0.005 USD

---

## 3 Modelos Segun Uso

| Uso | Modelo | Costo Kie.ai | Creditos | Cuando usar |
|-----|--------|-------------|----------|-------------|
| **Volumen** (slides internas, thumbnails) | Grok Imagine | $0.003/img (6 imgs/$0.02) | 4 cred/6 imgs | Slides 2-6 de carruseles, thumbnails de Reels, borradores rapidos |
| **Texto en imagen** (portadas, posts con frase) | Ideogram v3 Turbo | $0.0175/img | 3.5 cred | Portadas de carrusel, posts de frase/dato, cualquier imagen donde el TEXTO debe ser legible |
| **Estilo sketch premium** (piezas clave) | Nano Banana 2 (1K) | $0.04/img | 8 cred | Posts hero, imagenes de marca, piezas que requieran el estilo hand-drawn de alta calidad |

### Modelos alternativos disponibles en Kie.ai
| Modelo | Costo | Notas |
|--------|-------|-------|
| Qwen z-image | $0.004/img | Ultra barato, calidad basica |
| Google Imagen 4 Fast | $0.02/img | Google nuevo, buena calidad rapida |
| Seedream 5.0 Lite | $0.0275/img | ByteDance, buena calidad general |
| Flux Kontext Pro | $0.025/img | Bueno para mantener estilo consistente entre imagenes |
| OpenAI 4o Image | $0.03/img | Estilo artistico, bueno en sketch |
| Nano Banana 2 (2K) | $0.06/img | Mayor resolucion, para piezas premium |
| Nano Banana 2 (4K) | $0.09/img | Maxima resolucion, solo para impresion/web hero |

### Costo semanal estimado (18 imagenes/semana)
| Contenido | Imgs | Modelo | Costo |
|-----------|------|--------|-------|
| Slides internas carrusel (12) | 12 | Grok Imagine | $0.04 |
| Portadas carrusel (2) | 2 | Ideogram Turbo | $0.035 |
| Post estatico sketch (1) | 1 | Nano Banana 2 | $0.04 |
| Thumbnails Reel (3) | 3 | Grok Imagine | $0.01 |
| **Total semanal** | **18** | **Mix** | **~$0.125** |
| **Total mensual** | **~72** | | **~$0.50** |

---

## Generacion de Imagenes

### Opcion A: Via skill image-generation existente (OpenRouter)
Para modelos de Google (Nano Banana) via OpenRouter:
```bash
npx tsx .claude/skills/image-generation/scripts/generate-image.ts \
  --prompt "[PROMPT ADAPTADO]" \
  --output "generated/content/[nombre].png" \
  --aspect [1:1 o 4:5 o 9:16] \
  --model google/gemini-2.5-flash-preview-image-generation
```

### Opcion B: Via Kie.ai API directamente (PREFERIDA para costos)
```bash
curl -X POST "https://api.kie.ai/v1/images/generations" \
  -H "Authorization: Bearer $KIE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "grok-imagine",
    "prompt": "[PROMPT]",
    "n": 1,
    "size": "1024x1024"
  }' \
  -o "generated/content/[nombre].png"
```

Modelos para el campo `model`:
- `grok-imagine` — volumen ($0.003)
- `ideogram-v3-turbo` — texto en imagen ($0.0175)
- `nano-banana-2` — sketch premium ($0.04)

**NOTA:** Verificar nombres exactos de modelos en docs de Kie.ai al configurar.

---

## Reglas

- SIEMPRE mantener consistencia visual entre todas las piezas
- Texto LEGIBLE en movil (tamano grande)
- NO saturar — el sketch debe respirar
- Debe parecer hecho a mano, no generado por IA generica
- Cada imagen funciona SOLA (sin necesidad de leer caption)
- Carruseles: estilo identico entre todas las slides
- Usar el modelo MAS BARATO que cumpla con la calidad necesaria
- Para borradores/pruebas: siempre Grok Imagine ($0.003)
- Para piezas finales con texto: Ideogram Turbo ($0.0175)
- Solo usar Nano Banana 2 para piezas clave de marca
