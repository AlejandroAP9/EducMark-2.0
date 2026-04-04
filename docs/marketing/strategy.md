# Estrategia de Marketing EducMark

> Definida 2026-03-28/29. Documento de referencia para la estrategia de contenido e Instagram.

---

## Regla 1-1-1

- **1 Avatar:** Profesor de basica/media en Chile (~250,000)
- **1 Producto:** EducMark (planificacion + slides + quiz + evaluacion + OMR)
- **1 Canal:** Instagram (Reels, Carruseles, Posts, Stories — SIN mostrar cara)

## Grand Slam Offer (Hormozi)

No vendemos IA. Vendemos: "Recupera tus tardes. Clase completa en minutos. De profe a profe."

## Embudo de Ventas

```
Instagram Reels/Carruseles/Posts (dolor del profe + demos)
    ↓
CTA: "Comenta PROFE" o "Link en bio"
    ↓
Landing educmark.cl → Registrarse para descargar ebook gratis
    ↓
Al registrarse: ebook PDF + 3 clases gratis del kit (planificacion + slides + quiz)
    ↓
Genera primera clase → momento WOW
    ↓
Ve membresias → conversion a plan pagado
    ↓
Referidos (sala de profes → colegas se registran)
```

## Lead Magnet

- Ebook "Prompts para Profesores" (38 paginas, ya existe)
- Es la EXCUSA para registrarse. Las 3 clases gratis son la rosquilla salada real

## Contenido: 4 Tipos (Sistema Emilio Puigrredon)

1. **Vehiculo** — Mostrar que EducMark es la solucion
2. **Ayuda** — Contenido contrarian que rompe paradigmas del profe
3. **Autoridad** — Subtle flex (metricas reales del producto)
4. **Confianza** — Historia personal, valores, "de profe a profe"

## Formatos Sin Camara

- **Reels (3/sem):** Screen recording, texto cinetico, POV manos, before/after
- **Carruseles (2/sem):** Estilo sketch/pizarra pedagogica
- **Posts (1/sem):** Frases de impacto, datos, screenshots
- **Stories (diarias):** Encuestas, quizzes, CTAs, secuencias

## Generacion de Imagenes

- **Principal:** Gemini Nano Banana (GRATIS via plan Gemini). Estilo sketch/pizarra
- **Secundario:** Kie.ai API (para automatizacion). KIE_API_KEY en .env.local
- Texto se agrega en Canva si la IA comete errores de tipografia
- Prompt base para estilo: "Professional sketchnote illustration on flat light beige cream paper background..."

## Calendario Semanal

| Dia | Formato                 | Tipo       | Pilar           |
| --- | ----------------------- | ---------- | --------------- |
| Lun | Reel (screen recording) | Vehiculo   | IA para profes  |
| Mar | Carrusel (7 slides)     | Contrarian | Dolor del profe |
| Mie | Reel (texto cinetico)   | Dolor      | Dolor del profe |
| Jue | Post estatico           | Confianza  | Tu historia     |
| Vie | Carrusel (8 slides)     | Autoridad  | IA para profes  |
| Sab | Reel (POV/before-after) | Vehiculo   | IA para profes  |
| Dom | Descanso/repost         | —          | —               |

## Archivos de Contenido

- Calendarios: `.claude/content/calendar-YYYY-WXX.md` (+ PDF)
- Imagenes: `generated/content/` (organizadas por dia)
- Banco de ideas: `.claude/content/idea-bank.md`
- Playbook completo: ver memoria persistente `project_instagram_playbook.md`
