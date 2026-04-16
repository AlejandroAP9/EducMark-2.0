/**
 * Shell del consolidador-maestro-v12.js — copiada VERBATIM.
 * Solo se parametrizan: título, slides HTML, y totalSlides.
 * NO modificar el CSS ni el JS — viene del consolidador probado en producción.
 */
export interface SlideBlock {
  innerHTML: string;
  bgStyle?: string;
  id?: string;
}

export function wrapSlidesHtml(titulo: string, slides: SlideBlock[]): string {
  const totalSlides = slides.length;

  const slideBlocks = slides.map((slide, i) =>
    `<div class="slide-wrapper" data-slide="${i + 1}"${slide.id ? ` id="${slide.id}"` : ''} style="${slide.bgStyle || ''}">
      <div class="slide-overlay"></div>
      <div class="slide-content">${slide.innerHTML}</div>
      <canvas class="draw-canvas" width="1920" height="1080"></canvas>
    </div>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="referrer" content="no-referrer">
    <title>${titulo} - EducMark</title>

    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { margin: 0; background: #0a0a0f; color: white; font-family: 'Outfit', sans-serif; overflow: hidden; height: 100vh; width: 100vw; }
      #presentation-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #0a0a0f; }
      .slide-wrapper { position: absolute; width: 1920px; height: 1080px; background-color: #0f111a; opacity: 0; pointer-events: none; transform: scale(0.95); transition: opacity 0.4s ease, transform 0.4s ease; z-index: 1; overflow: hidden; transform-origin: center center; background-size: cover; background-position: center; }
      .slide-wrapper.active { opacity: 1; pointer-events: auto; transform: scale(1); z-index: 10; }
      .slide-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,17,26,0.92); backdrop-filter: blur(30px); z-index: 1; }
      .slide-content { position: relative; z-index: 2; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; padding: 80px; }
      .col-text { flex: 1.1; padding-right: 80px; display: flex; flex-direction: column; justify-content: center; height: 100%; }
      .col-visual { flex: 0.8; display: grid; grid-template-rows: 1fr auto; gap: 40px; height: 100%; }
      h1 { font-weight: 900; line-height: 1.05; margin-bottom: 30px; background: linear-gradient(90deg, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 4.2rem; }
      .main-text { font-size: 2.3rem; line-height: 1.4; color: #e2e8f0; font-weight: 400; text-align: left; }
      .chilean-box { margin-top: 40px; padding: 30px; background: rgba(255,255,255,0.08); border-left: 8px solid #f472b6; border-radius: 20px; }
      .chile-title { color: #f472b6; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; font-size: 1.4rem; margin-bottom: 15px; }
      .chilean-box p { margin: 0; font-size: 1.8rem; line-height: 1.4; color: white; }
      .img-card-container { border-radius: 35px; border: 2px solid rgba(255,255,255,0.15); overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.6); min-height: 350px; position: relative; }
      .img-card-container img { width: 100%; height: 100%; object-fit: cover; }
      .glass-card { background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.1); border-radius: 35px; padding: 40px; height: fit-content; }
      h3 { color: #f472b6; margin: 0 0 20px 0; font-size: 1.4rem; letter-spacing: 3px; text-transform: uppercase; font-weight: 800; }
      .tag { display: inline-block; background: rgba(255,255,255,0.15); padding: 10px 25px; border-radius: 30px; margin: 8px; font-size: 1.4rem; font-weight: 600; }
      .q-item { padding: 15px; border-bottom: 2px solid rgba(255,255,255,0.1); font-size: 1.6rem; color: #fff; font-weight: 500; }
      .quiz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
      .option-btn { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 30px; font-size: 2rem; cursor: pointer; border: 3px solid transparent; transition: 0.3s; text-align: left; font-weight: 600; }
      .option-btn:hover { background: rgba(255,255,255,0.25); transform: translateY(-8px); }
      .option-btn.correct { background: rgba(34,197,94,0.25); border-color: #22c55e; }
      .option-btn.wrong { background: rgba(239,68,68,0.25); border-color: #ef4444; opacity: 0.6; }
      .feedback-box { margin-top: 50px; background: rgba(34,197,94,0.15); border: 3px solid #22c55e; padding: 40px; border-radius: 30px; display: none; font-size: 2rem; }
      .cover-content { text-align: center; z-index: 10; }
      .cover-content h1 { font-size: 7rem; margin: 0; line-height: 1; text-shadow: 0 0 60px rgba(110,86,207,0.4); max-width: 1700px; }
      .final-slide-content { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .final-icon { margin-bottom: 40px; display: inline-block; padding: 35px; background: rgba(34,197,94,0.1); border-radius: 50%; border: 3px solid #22c55e; }
      .final-icon svg { width: 90px; height: 90px; fill: #22c55e; }
      /* NAV CONTROLS */
      .nav-controls { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; z-index: 9999; background: rgba(15, 17, 26, 0.85); backdrop-filter: blur(15px); padding: 10px 20px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.1); }
      .nav-btn { width: 44px; height: 44px; border-radius: 50%; border: none; background: rgba(255,255,255,0.08); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
      .nav-btn:hover { background: rgba(110, 86, 207, 0.7); transform: scale(1.1); }
      .nav-btn svg { width: 22px; height: 22px; fill: white; }
      .slide-counter { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.7); min-width: 70px; text-align: center; }
      .progress-bar { width: 120px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden; }
      .progress-fill { height: 100%; background: linear-gradient(90deg, #6e56cf, #f472b6); transition: width 0.3s ease; }
      /* === HAMBURGER MENU === */
      .menu-toggle { position: fixed; top: 20px; right: 20px; z-index: 10001; }
      .menu-toggle-btn { width: 48px; height: 48px; border-radius: 50%; border: none; background: rgba(255,255,255,0.15); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; backdrop-filter: blur(10px); }
      .menu-toggle-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
      .menu-toggle-btn svg { width: 24px; height: 24px; }
      .tool-menu { position: fixed; top: 76px; right: 20px; background: rgba(15,17,26,0.95); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 8px; z-index: 10000; display: none; min-width: 220px; max-height: 80vh; overflow-y: auto; }
      .tool-menu.visible { display: block; }
      .tool-menu-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 16px; background: none; border: none; color: rgba(255,255,255,0.8); font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; border-radius: 8px; text-align: left; transition: background 0.2s; }
      .tool-menu-item:hover { background: rgba(255,255,255,0.1); color: white; }
      .tool-menu-item.active { background: rgba(244,114,182,0.15); color: #f472b6; }
      .tool-menu-item.danger { color: #ef4444; }
      .tool-menu-item.danger:hover { background: rgba(239,68,68,0.15); }
      .tool-menu-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 4px 8px; }
      .tool-menu-label { padding: 6px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.3); font-weight: 700; }
      .tool-btn { width: 48px; height: 48px; border-radius: 50%; border: none; background: rgba(255,255,255,0.15); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; backdrop-filter: blur(10px); }
      .tool-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
      .tool-btn.active { background: #f472b6; box-shadow: 0 0 20px rgba(244, 114, 182, 0.5); }
      .tool-btn svg { width: 22px; height: 22px; }
      /* EDIT MODE */
      body.edit-mode .editable:focus { outline: 2px dashed #f472b6; outline-offset: 8px; border-radius: 8px; }
      body.edit-mode .editable { cursor: text; }
      body.edit-mode h1, body.edit-mode h1.editable { background: none !important; -webkit-text-fill-color: white !important; text-shadow: none !important; }
      /* TIMER */
      .timer-display { position: fixed; bottom: 24px; left: 24px; background: rgba(15,17,26,0.85); backdrop-filter: blur(15px); padding: 10px 20px; border-radius: 50px; font-size: 1.3rem; font-weight: 700; z-index: 9999; display: none; align-items: center; gap: 12px; border: 1px solid rgba(255,255,255,0.1); }
      .timer-display.visible { display: flex; }
      .timer-display .time { color: #a5b4fc; }
      .timer-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(255,255,255,0.2); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .timer-btn svg { width: 14px; height: 14px; fill: white; }
      /* LASER & SPOTLIGHT */
      #laser { position: fixed; width: 18px; height: 18px; border-radius: 50%; background: radial-gradient(circle, #a78bfa 0%, #8b5cf6 40%, transparent 80%); box-shadow: 0 0 25px 8px rgba(139,92,246,0.7), 0 0 50px 15px rgba(139,92,246,0.3); pointer-events: none; z-index: 99999; display: none; transform: translate(-50%,-50%); }
      body.laser-mode { cursor: none; } body.laser-mode #laser { display: block; }
      .laser-trail { position: fixed; width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle, rgba(167,139,250,0.9) 0%, rgba(139,92,246,0.6) 40%, transparent 80%); box-shadow: 0 0 18px 6px rgba(139,92,246,0.4); pointer-events: none; z-index: 99998; transform: translate(-50%,-50%); animation: laserFade 2.5s forwards; }
      @keyframes laserFade { 0% { opacity: 0.95; transform: translate(-50%,-50%) scale(1); } 60% { opacity: 0.6; transform: translate(-50%,-50%) scale(0.8); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(0.4); } }
      #spotlight { position: fixed; inset: 0; background: radial-gradient(circle 200px at var(--x,50%) var(--y,50%), transparent 0%, rgba(0,0,0,0.85) 100%); pointer-events: none; z-index: 9000; display: none; }
      body.spotlight-mode #spotlight { display: block; } body.spotlight-mode { cursor: none; }
      /* KEYBOARD HINTS */
      .keyboard-hints { position: fixed; bottom: 90px; right: 24px; background: rgba(15,17,26,0.95); backdrop-filter: blur(15px); padding: 20px 24px; border-radius: 16px; font-size: 12px; z-index: 9999; display: none; border: 1px solid rgba(255,255,255,0.1); }
      .keyboard-hints.visible { display: block; }
      .hints-title { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #f472b6; margin-bottom: 12px; font-weight: 800; }
      .hint-row { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 8px; }
      .hint-key { background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 6px; font-weight: 700; }
      .hint-desc { color: rgba(255,255,255,0.7); }
      /* IMAGE */
      .img-zoomed { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 50000 !important; object-fit: contain !important; background: rgba(0,0,0,0.95) !important; cursor: zoom-out !important; }
      .img-upload-overlay { position: absolute; inset: 0; display: none; background: rgba(0,0,0,0.6); align-items: center; justify-content: center; z-index: 50; cursor: pointer; border-radius: 35px; transition: opacity 0.3s; }
      body.edit-mode .img-upload-overlay { display: flex; }
      .img-upload-overlay:hover { background: rgba(110,86,207,0.5); }
      .img-upload-label { color: white; font-size: 1.4rem; font-weight: 700; text-align: center; padding: 20px; }
      .img-upload-label svg { display: block; margin: 0 auto 10px; width: 48px; height: 48px; stroke: white; }
      /* FONT SIZE */
      .font-controls { position: fixed; top: 80px; right: 20px; display: none; gap: 6px; z-index: 9999; flex-direction: column; }
      body.edit-mode .font-controls { display: flex; }
      .font-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: rgba(255,255,255,0.15); color: white; cursor: pointer; font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
      .font-btn:hover { background: rgba(255,255,255,0.3); }
      /* === DRAW CANVAS === */
      .draw-canvas { position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; z-index: 100; pointer-events: none; }
      body.draw-mode .draw-canvas { pointer-events: auto; cursor: crosshair; }
      body.draw-mode .slide-content { pointer-events: none; }
      .draw-toolbar { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); display: none; align-items: center; gap: 10px; z-index: 10000; background: rgba(15,17,26,0.95); backdrop-filter: blur(15px); padding: 10px 20px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.15); }
      body.draw-mode .draw-toolbar { display: flex; }
      .draw-color { width: 32px; height: 32px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: 0.2s; }
      .draw-color.active { border-color: white; transform: scale(1.2); }
      .draw-thickness { width: 100px; -webkit-appearance: none; background: rgba(255,255,255,0.2); height: 4px; border-radius: 2px; outline: none; }
      .draw-thickness::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: white; cursor: pointer; }
      .draw-tool-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: white; cursor: pointer; font-size: 12px; font-weight: 700; transition: 0.2s; }
      .draw-tool-btn:hover { background: rgba(255,255,255,0.25); }
      .draw-tool-btn.active { background: #ef4444; border-color: #ef4444; }
      /* === WHITEBOARD === */
      #whiteboard { position: fixed; inset: 0; background: white; z-index: 20000; display: none; flex-direction: column; align-items: center; justify-content: center; }
      #whiteboard.visible { display: flex; }
      #whiteboard canvas { border: 1px solid #ddd; cursor: crosshair; border-radius: 8px; }
      .wb-toolbar { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; z-index: 20001; background: rgba(0,0,0,0.85); padding: 10px 20px; border-radius: 50px; }
      .wb-color { width: 28px; height: 28px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; }
      .wb-color.active { border-color: #6e56cf; transform: scale(1.2); }
      .wb-close { padding: 6px 16px; border-radius: 20px; border: none; background: #ef4444; color: white; cursor: pointer; font-weight: 700; font-size: 13px; }
      /* === NOTES PANEL === */
      .notes-panel { position: fixed; bottom: 0; left: 0; right: 0; height: 0; background: rgba(15,17,26,0.97); backdrop-filter: blur(15px); z-index: 9998; transition: height 0.3s ease; overflow: hidden; border-top: 2px solid rgba(255,255,255,0.1); }
      .notes-panel.visible { height: 220px; }
      .notes-inner { padding: 20px 40px; height: 100%; display: flex; flex-direction: column; }
      .notes-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .notes-title { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #f472b6; font-weight: 800; }
      .notes-close { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 18px; }
      .notes-textarea { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; font-family: 'Outfit', sans-serif; font-size: 16px; padding: 15px; resize: none; outline: none; }
      .notes-textarea::placeholder { color: rgba(255,255,255,0.3); }
      /* === OVERVIEW GRID === */
      #overview { position: fixed; inset: 0; background: rgba(10,10,15,0.97); backdrop-filter: blur(15px); z-index: 15000; display: none; overflow-y: auto; padding: 40px; }
      #overview.visible { display: block; }
      .overview-header { text-align: center; margin-bottom: 30px; }
      .overview-header h2 { font-size: 1.5rem; color: #a5b4fc; font-weight: 700; }
      .overview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
      .overview-thumb { position: relative; background: #1a1a2e; border-radius: 12px; overflow: hidden; cursor: pointer; border: 3px solid transparent; transition: 0.2s; aspect-ratio: 16/9; }
      .overview-thumb:hover { border-color: #6e56cf; transform: scale(1.03); }
      .overview-thumb.current { border-color: #f472b6; }
      .overview-num { position: absolute; bottom: 8px; right: 12px; background: rgba(0,0,0,0.7); padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; }
      /* === ZOOM AREA === */
      .zoom-selection { position: fixed; border: 2px dashed #6e56cf; background: rgba(110,86,207,0.15); pointer-events: none; z-index: 11000; display: none; }
      body.zoom-select-mode { cursor: crosshair; }
      @media print { .menu-toggle, .tool-menu, .nav-controls, .timer-display, .keyboard-hints, #laser, #spotlight, .font-controls, .img-upload-overlay, .draw-toolbar, .draw-canvas, #whiteboard, .notes-panel, #overview, .zoom-selection { display: none !important; } .slide-wrapper { position: relative !important; opacity: 1 !important; transform: none !important; page-break-after: always !important; } }
    </style>

</head>
<body>
    <div id="laser"></div>
    <div id="spotlight"></div>
    <div id="zoomSelection" class="zoom-selection"></div>
    <!-- HAMBURGER MENU -->
    <div class="menu-toggle" id="menuToggle">
        <button class="menu-toggle-btn" onclick="toggleMenu()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
    </div>
    <div class="tool-menu" id="toolMenu">
        <div class="tool-menu-label">Edici&#243;n</div>
        <button class="tool-menu-item" onclick="toggleEdit()">&#9998;&#65039; Editar contenido (E)</button>
        <button class="tool-menu-item" onclick="savePresentation()">&#128190; Guardar cambios (S)</button>
        <button class="tool-menu-item danger" onclick="deleteCurrentSlide()">&#128465;&#65039; Eliminar slide (Del)</button>
        <div class="tool-menu-divider"></div>
        <div class="tool-menu-label">Herramientas</div>
        <button class="tool-menu-item" onclick="toggleDraw()">&#9999;&#65039; Dibujar (D)</button>
        <button class="tool-menu-item" onclick="toggleWhiteboard()">&#9634;&#65039; Pizarra (W)</button>
        <button class="tool-menu-item" onclick="toggleNotes()">&#128221; Notas docente (N)</button>
        <button class="tool-menu-item" onclick="toggleOverview()">&#128200; Vista general (G)</button>
        <button class="tool-menu-item" onclick="toggleZoomSelect()">&#128269; Zoom zona (Z)</button>
        <div class="tool-menu-divider"></div>
        <div class="tool-menu-label">Presentaci&#243;n</div>
        <button class="tool-menu-item" onclick="toggleLaser()">&#128308; Puntero l&#225;ser (L)</button>
        <button class="tool-menu-item" onclick="toggleSpotlight()">&#128161; Spotlight (O)</button>
        <button class="tool-menu-item" onclick="toggleTimerDisplay()">&#9201;&#65039; Cron&#243;metro (T)</button>
        <button class="tool-menu-item" onclick="toggleFullScreen()">&#9974;&#65039; Pantalla completa (F)</button>
        <div class="tool-menu-divider"></div>
        <button class="tool-menu-item" onclick="toggleHints()">&#10067; Atajos de teclado (?)</button>
    </div>
    <!-- DRAW TOOLBAR -->
    <div class="draw-toolbar">
        <div class="draw-color active" style="background:#ff0000;" onclick="setDrawColor('#ff0000',this)"></div>
        <div class="draw-color" style="background:#ffff00;" onclick="setDrawColor('#ffff00',this)"></div>
        <div class="draw-color" style="background:#00ff00;" onclick="setDrawColor('#00ff00',this)"></div>
        <div class="draw-color" style="background:#00bfff;" onclick="setDrawColor('#00bfff',this)"></div>
        <div class="draw-color" style="background:#ffffff;" onclick="setDrawColor('#ffffff',this)"></div>
        <input type="range" class="draw-thickness" min="1" max="20" value="4" oninput="setDrawThickness(this.value)">
        <button class="draw-tool-btn" id="eraserBtn" onclick="toggleEraser()">Borrador</button>
        <button class="draw-tool-btn" onclick="clearDrawing()">Limpiar</button>
    </div>
    <!-- FONT SIZE -->
    <div class="font-controls">
        <button class="font-btn" onclick="changeFontSize(1)" title="Aumentar">A+</button>
        <button class="font-btn" onclick="changeFontSize(-1)" title="Reducir">A-</button>
    </div>
    <!-- TIMER -->
    <div class="timer-display">
        <button class="timer-btn" onclick="toggleTimer()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
        <span class="time" id="timerValue">00:00</span>
        <button class="timer-btn" onclick="resetTimer()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg></button>
    </div>
    <!-- KEYBOARD HINTS -->
    <div class="keyboard-hints" id="hints">
        <div class="hints-title">Atajos</div>
        <div class="hint-row"><span class="hint-key">&#8592;&#8594;</span><span class="hint-desc">Navegar</span></div>
        <div class="hint-row"><span class="hint-key">E</span><span class="hint-desc">Editar</span></div>
        <div class="hint-row"><span class="hint-key">S</span><span class="hint-desc">Guardar</span></div>
        <div class="hint-row"><span class="hint-key">Del</span><span class="hint-desc">Eliminar slide</span></div>
        <div class="hint-row"><span class="hint-key">D</span><span class="hint-desc">Dibujar</span></div>
        <div class="hint-row"><span class="hint-key">W</span><span class="hint-desc">Pizarra</span></div>
        <div class="hint-row"><span class="hint-key">N</span><span class="hint-desc">Notas</span></div>
        <div class="hint-row"><span class="hint-key">G</span><span class="hint-desc">Vista general</span></div>
        <div class="hint-row"><span class="hint-key">Z</span><span class="hint-desc">Zoom zona</span></div>
        <div class="hint-row"><span class="hint-key">L</span><span class="hint-desc">L&#225;ser</span></div>
        <div class="hint-row"><span class="hint-key">O</span><span class="hint-desc">Spotlight</span></div>
        <div class="hint-row"><span class="hint-key">T</span><span class="hint-desc">Cron&#243;metro</span></div>
        <div class="hint-row"><span class="hint-key">+/-</span><span class="hint-desc">Tama&#241;o fuente</span></div>
        <div class="hint-row"><span class="hint-key">F</span><span class="hint-desc">Fullscreen</span></div>
    </div>
    <!-- NOTES PANEL -->
    <div class="notes-panel">
        <div class="notes-inner">
            <div class="notes-header">
                <span class="notes-title">Notas del docente - Slide <span id="notesSlideNum">1</span></span>
                <button class="notes-close" onclick="toggleNotes()">&#10005;</button>
            </div>
            <textarea class="notes-textarea" id="notesTextarea" placeholder="Escribe tus notas para esta slide..." onblur="saveNoteForSlide()"></textarea>
        </div>
    </div>
    <!-- OVERVIEW -->
    <div id="overview">
        <div class="overview-header"><h2>Vista general de slides</h2></div>
        <div class="overview-grid" id="overviewGrid"></div>
    </div>
    <!-- WHITEBOARD -->
    <div id="whiteboard">
        <div class="wb-toolbar">
            <div class="wb-color active" style="background:#000;" onclick="setWbColor('#000',this)"></div>
            <div class="wb-color" style="background:#ff0000;" onclick="setWbColor('#ff0000',this)"></div>
            <div class="wb-color" style="background:#0066ff;" onclick="setWbColor('#0066ff',this)"></div>
            <div class="wb-color" style="background:#00aa00;" onclick="setWbColor('#00aa00',this)"></div>
            <button class="wb-close" onclick="clearWhiteboard()">Limpiar</button>
            <button class="wb-close" onclick="toggleWhiteboard()">Cerrar (W)</button>
        </div>
        <canvas id="wbCanvas"></canvas>
    </div>
    <!-- NAV CONTROLS -->
    <div class="nav-controls">
        <button class="nav-btn" onclick="prevSlide()"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
        <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
        <span class="slide-counter" id="slideCounter">1 / ${totalSlides}</span>
        <button class="nav-btn" onclick="nextSlide()"><svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg></button>
    </div>
    <div id="presentation-container">
        ${slideBlocks}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"><\/script>
    <script>
        let currentSlide = 0, slides = [], editMode = false, laserMode = false, spotlightMode = false;
        let timerRunning = false, timerSeconds = 0, timerInterval = null;
        let drawMode = false, eraserMode = false, drawColor = '#ff0000', drawThickness = 4;
        let whiteboardOpen = false, notesOpen = false, overviewOpen = false;
        let zoomSelectMode = false, isZoomed = false;
        let slideNotes = {};
        let totalSlides = ${totalSlides};

        function init() {
            slides = document.querySelectorAll('.slide-wrapper');
            totalSlides = slides.length;
            updateSlide();
            fitToScreen();
            window.addEventListener('resize', fitToScreen);
            window.addEventListener('mousemove', updatePointers);
            window.addEventListener('keydown', handleKeyboard);
            initDrawCanvases();
            initZoom();
            document.addEventListener('click', function(e) {
                const menu = document.getElementById('toolMenu');
                const toggle = document.getElementById('menuToggle');
                if (menu && menu.classList.contains('visible') && !menu.contains(e.target) && !toggle.contains(e.target)) {
                    menu.classList.remove('visible');
                }
            });
        }

        function toggleMenu() {
            document.getElementById('toolMenu').classList.toggle('visible');
        }

        function handleKeyboard(e) {
            if (e.target.tagName === 'TEXTAREA') return;
            if (e.target.getAttribute('contenteditable') === 'true') return;
            switch(e.key) {
                case 'ArrowRight': case ' ': e.preventDefault(); nextSlide(); break;
                case 'ArrowLeft': prevSlide(); break;
                case 'f': toggleFullScreen(); break;
                case 'e': toggleEdit(); break;
                case 's': if (editMode) savePresentation(); break;
                case 'l': toggleLaser(); break;
                case 'o': toggleSpotlight(); break;
                case 'd': toggleDraw(); break;
                case 'w': toggleWhiteboard(); break;
                case 'n': toggleNotes(); break;
                case 'g': toggleOverview(); break;
                case 'z': toggleZoomSelect(); break;
                case 't': toggleTimerDisplay(); break;
                case 'Delete': case 'Backspace': if (editMode) deleteCurrentSlide(); break;
                case '?': toggleHints(); break;
                case 'Escape': exitModes(); break;
                case '+': case '=': if (editMode) changeFontSize(1); break;
                case '-': if (editMode) changeFontSize(-1); break;
                default: if (e.key >= '1' && e.key <= '9') { const n = parseInt(e.key)-1; if (n < slides.length) { currentSlide = n; updateSlide(); } }
            }
        }

        function updateSlide() {
            slides.forEach((s,i) => {
                s.classList.remove('active');
                if (i === currentSlide) {
                    s.classList.add('active');
                    if (s.id === 'final-slide') setTimeout(fireConfetti, 500);
                }
            });
            updateProgress();
            fitToScreen();
            if (notesOpen) loadNoteForSlide();
            if (isZoomed) resetZoom();
        }

        function nextSlide() { if (currentSlide < slides.length-1) { currentSlide++; updateSlide(); } }
        function prevSlide() { if (currentSlide > 0) { currentSlide--; updateSlide(); } }
        function updateProgress() {
            const c = document.getElementById('slideCounter');
            const p = document.getElementById('progressFill');
            if (c) c.textContent = (currentSlide+1)+' / '+slides.length;
            if (p) p.style.width = ((currentSlide+1)/slides.length*100)+'%';
        }
        function fireConfetti() { const end = Date.now()+3000; const colors = ['#6e56cf','#f472b6','#ffffff','#22c55e']; (function frame() { confetti({particleCount:4,angle:60,spread:55,origin:{x:0},colors}); confetti({particleCount:4,angle:120,spread:55,origin:{x:1},colors}); if(Date.now()<end) requestAnimationFrame(frame); }()); }
        function fitToScreen() { const scale = Math.min(window.innerWidth/1920, window.innerHeight/1080); slides.forEach(s => { s.style.transform = s.classList.contains('active') ? 'scale('+scale+')' : 'scale('+(scale*0.95)+')'; }); }
        function toggleFullScreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
        function toggleLaser() { laserMode = !laserMode; document.body.classList.toggle('laser-mode', laserMode); if (laserMode) { if (spotlightMode) toggleSpotlight(); if (drawMode) toggleDraw(); } document.getElementById('toolMenu').classList.remove('visible'); }
        function toggleSpotlight() { spotlightMode = !spotlightMode; document.body.classList.toggle('spotlight-mode', spotlightMode); if (spotlightMode) { if (laserMode) toggleLaser(); if (drawMode) toggleDraw(); } document.getElementById('toolMenu').classList.remove('visible'); }
        let lastTrailTime = 0;
        let laserMouseDown = false;
        function spawnTrail(x, y, persist) {
            const t = document.createElement('div');
            t.className = 'laser-trail';
            t.style.left = x + 'px';
            t.style.top = y + 'px';
            if (persist) { t.style.animationDuration = '6s'; t.style.width = '10px'; t.style.height = '10px'; }
            document.body.appendChild(t);
            setTimeout(() => t.remove(), persist ? 6000 : 2500);
        }
        function updatePointers(e) {
            if (laserMode) {
                const l = document.getElementById('laser');
                l.style.left = e.clientX+'px';
                l.style.top = e.clientY+'px';
                const now = Date.now();
                const throttle = laserMouseDown ? 12 : 35;
                if (now - lastTrailTime > throttle) {
                    spawnTrail(e.clientX, e.clientY, laserMouseDown);
                    lastTrailTime = now;
                }
            }
            if (spotlightMode) {
                const s = document.getElementById('spotlight');
                s.style.setProperty('--x', e.clientX+'px');
                s.style.setProperty('--y', e.clientY+'px');
            }
        }
        document.addEventListener('mousedown', function(e) { if (laserMode) laserMouseDown = true; });
        document.addEventListener('mouseup', function() { laserMouseDown = false; });
        function toggleTimerDisplay() { document.querySelector('.timer-display').classList.toggle('visible'); document.getElementById('toolMenu').classList.remove('visible'); }
        function toggleTimer() { timerRunning = !timerRunning; if (timerRunning) { timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000); } else clearInterval(timerInterval); }
        function resetTimer() { timerSeconds = 0; updateTimerDisplay(); }
        function updateTimerDisplay() { const d = document.getElementById('timerValue'); if (d) d.textContent = Math.floor(timerSeconds/60).toString().padStart(2,'0')+':'+(timerSeconds%60).toString().padStart(2,'0'); }
        function toggleHints() { document.getElementById('hints').classList.toggle('visible'); document.getElementById('toolMenu').classList.remove('visible'); }

        function exitModes() {
            if (laserMode) toggleLaser();
            if (spotlightMode) toggleSpotlight();
            if (drawMode) toggleDraw();
            if (whiteboardOpen) toggleWhiteboard();
            if (notesOpen) toggleNotes();
            if (overviewOpen) toggleOverview();
            if (zoomSelectMode) toggleZoomSelect();
            if (isZoomed) resetZoom();
            if (document.fullscreenElement) document.exitFullscreen();
            document.getElementById('toolMenu').classList.remove('visible');
        }

        function toggleEdit() {
            editMode = !editMode;
            document.body.classList.toggle('edit-mode', editMode);
            document.getElementById('toolMenu').classList.remove('visible');
            document.querySelectorAll('.editable').forEach(el => editMode ? el.setAttribute('contenteditable','true') : el.removeAttribute('contenteditable'));
        }

        function deleteCurrentSlide() {
            if (slides.length <= 2) { alert('Debe haber al menos 2 slides'); return; }
            const active = document.querySelector('.slide-wrapper.active');
            if (!active || active.id === 'final-slide') { alert('No se puede eliminar esta slide'); return; }
            if (!confirm('Eliminar slide ' + (currentSlide+1) + '?')) return;
            active.remove();
            slides = document.querySelectorAll('.slide-wrapper');
            totalSlides = slides.length;
            if (currentSlide >= slides.length) currentSlide = slides.length - 1;
            updateSlide();
            document.getElementById('toolMenu').classList.remove('visible');
        }

        function savePresentation() {
            saveNoteForSlide();
            document.querySelectorAll('.editable').forEach(el => el.removeAttribute('contenteditable'));
            const hideEls = ['.menu-toggle','.tool-menu','.nav-controls','.timer-display','#hints','#laser','#spotlight','.font-controls','.img-upload-overlay','.draw-toolbar','.notes-panel','#overview'];
            hideEls.forEach(s => { document.querySelectorAll(s).forEach(e => e.style.display='none'); });
            const htmlContent = '<!DOCTYPE html>' + document.documentElement.outerHTML;
            document.querySelector('.menu-toggle').style.display = 'block';
            document.querySelector('.nav-controls').style.display = 'flex';
            if (editMode) { document.querySelectorAll('.editable').forEach(el => el.setAttribute('contenteditable','true')); const fc = document.querySelector('.font-controls'); if(fc) fc.style.display='flex'; }
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'Presentacion_editada.html';
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            document.getElementById('toolMenu').classList.remove('visible');
        }
        function changeFontSize(delta) { document.querySelectorAll('.slide-wrapper.active .editable').forEach(el => { const c = parseFloat(window.getComputedStyle(el).fontSize); el.style.fontSize = (c + delta*4)+'px'; }); }

        function handleImageUpload(el) {
            const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
            input.onchange = function(e) {
                const file = e.target.files[0]; if(!file) return;
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const container = el.closest('.img-card-container');
                    if (container) {
                        const overlay = container.querySelector('.img-upload-overlay');
                        const overlayHtml = overlay ? overlay.outerHTML : '';
                        container.innerHTML = '<img src="'+ev.target.result+'" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" onclick="toggleZoom(this)">' + overlayHtml;
                    }
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }
        function toggleZoom(img) { img.classList.toggle('img-zoomed'); }

        function initDrawCanvases() {
            slides.forEach(slide => {
                const canvas = slide.querySelector('.draw-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                let drawing = false;
                canvas.addEventListener('mousedown', function(e) { if (!drawMode) return; drawing = true; ctx.beginPath(); const rect = canvas.getBoundingClientRect(); const sx = 1920/rect.width; const sy = 1080/rect.height; ctx.moveTo((e.clientX-rect.left)*sx,(e.clientY-rect.top)*sy); });
                canvas.addEventListener('mousemove', function(e) { if (!drawing||!drawMode) return; const rect = canvas.getBoundingClientRect(); const sx = 1920/rect.width; const sy = 1080/rect.height; const x = (e.clientX-rect.left)*sx; const y = (e.clientY-rect.top)*sy; if (eraserMode) { ctx.clearRect(x-20,y-20,40,40); } else { ctx.strokeStyle = drawColor; ctx.lineWidth = drawThickness; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineTo(x,y); ctx.stroke(); } });
                canvas.addEventListener('mouseup', function() { drawing = false; });
                canvas.addEventListener('mouseleave', function() { drawing = false; });
                canvas.addEventListener('touchstart', function(e) { if (!drawMode) return; e.preventDefault(); drawing = true; ctx.beginPath(); const rect = canvas.getBoundingClientRect(); const t = e.touches[0]; ctx.moveTo((t.clientX-rect.left)*(1920/rect.width),(t.clientY-rect.top)*(1080/rect.height)); }, {passive:false});
                canvas.addEventListener('touchmove', function(e) { if (!drawing||!drawMode) return; e.preventDefault(); const rect = canvas.getBoundingClientRect(); const t = e.touches[0]; const x = (t.clientX-rect.left)*(1920/rect.width); const y = (t.clientY-rect.top)*(1080/rect.height); if (eraserMode) { ctx.clearRect(x-20,y-20,40,40); } else { ctx.strokeStyle = drawColor; ctx.lineWidth = drawThickness; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineTo(x,y); ctx.stroke(); } }, {passive:false});
                canvas.addEventListener('touchend', function() { drawing = false; });
            });
        }
        function toggleDraw() { drawMode = !drawMode; document.body.classList.toggle('draw-mode', drawMode); if (drawMode) { if (laserMode) toggleLaser(); if (spotlightMode) toggleSpotlight(); eraserMode = false; } document.getElementById('toolMenu').classList.remove('visible'); }
        function setDrawColor(c, btn) { drawColor = c; eraserMode = false; document.querySelectorAll('.draw-color').forEach(b => b.classList.remove('active')); btn.classList.add('active'); document.getElementById('eraserBtn').classList.remove('active'); }
        function setDrawThickness(v) { drawThickness = parseInt(v); }
        function toggleEraser() { eraserMode = !eraserMode; document.getElementById('eraserBtn').classList.toggle('active', eraserMode); document.querySelectorAll('.draw-color').forEach(b => { if(eraserMode) b.classList.remove('active'); }); }
        function clearDrawing() { const active = document.querySelector('.slide-wrapper.active .draw-canvas'); if (active) { const ctx = active.getContext('2d'); ctx.clearRect(0,0,1920,1080); } }

        function toggleWhiteboard() { whiteboardOpen = !whiteboardOpen; document.getElementById('whiteboard').classList.toggle('visible', whiteboardOpen); if (whiteboardOpen) { const c = document.getElementById('wbCanvas'); c.width = Math.min(window.innerWidth-80,1600); c.height = Math.min(window.innerHeight-120,900); initWbCanvas(c); } document.getElementById('toolMenu').classList.remove('visible'); }
        function initWbCanvas(canvas) { const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0,0,canvas.width,canvas.height); let drawing = false; canvas._wbState = { color: '#000000', thick: 3 }; canvas.onmousedown = function(e) { drawing = true; ctx.beginPath(); const r = canvas.getBoundingClientRect(); ctx.moveTo(e.clientX-r.left,e.clientY-r.top); }; canvas.onmousemove = function(e) { if (!drawing) return; const r = canvas.getBoundingClientRect(); ctx.strokeStyle = canvas._wbState.color; ctx.lineWidth = canvas._wbState.thick; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineTo(e.clientX-r.left,e.clientY-r.top); ctx.stroke(); }; canvas.onmouseup = function() { drawing = false; }; canvas.onmouseleave = function() { drawing = false; }; }
        function setWbColor(c, btn) { const canvas = document.getElementById('wbCanvas'); if (canvas._wbState) canvas._wbState.color = c; document.querySelectorAll('.wb-color').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
        function clearWhiteboard() { const c = document.getElementById('wbCanvas'); const ctx = c.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0,0,c.width,c.height); }

        function toggleNotes() { notesOpen = !notesOpen; document.querySelector('.notes-panel').classList.toggle('visible', notesOpen); if (notesOpen) loadNoteForSlide(); else saveNoteForSlide(); document.getElementById('toolMenu').classList.remove('visible'); }
        function loadNoteForSlide() { const ta = document.getElementById('notesTextarea'); if (ta) ta.value = slideNotes[currentSlide] || ''; }
        function saveNoteForSlide() { const ta = document.getElementById('notesTextarea'); if (ta && ta.value.trim()) slideNotes[currentSlide] = ta.value; else delete slideNotes[currentSlide]; }

        function toggleOverview() { overviewOpen = !overviewOpen; document.getElementById('overview').classList.toggle('visible', overviewOpen); if (overviewOpen) buildOverview(); document.getElementById('toolMenu').classList.remove('visible'); }
        function buildOverview() { const grid = document.getElementById('overviewGrid'); grid.innerHTML = ''; slides.forEach((slide, i) => { const thumb = document.createElement('div'); thumb.className = 'overview-thumb' + (i === currentSlide ? ' current' : ''); thumb.onclick = function() { currentSlide = i; updateSlide(); toggleOverview(); }; const inner = document.createElement('div'); inner.style.cssText = 'width:1920px;height:1080px;transform:scale(0.167);transform-origin:top left;pointer-events:none;overflow:hidden;'; inner.innerHTML = slide.innerHTML; thumb.appendChild(inner); const num = document.createElement('div'); num.className = 'overview-num'; num.textContent = (i+1); thumb.appendChild(num); grid.appendChild(thumb); }); }

        let zoomStartX, zoomStartY;
        function initZoom() { const sel = document.getElementById('zoomSelection'); document.addEventListener('mousedown', function(e) { if (!zoomSelectMode) return; zoomStartX = e.clientX; zoomStartY = e.clientY; sel.style.left = e.clientX+'px'; sel.style.top = e.clientY+'px'; sel.style.width = '0'; sel.style.height = '0'; sel.style.display = 'block'; }); document.addEventListener('mousemove', function(e) { if (!zoomSelectMode || !sel.style.display || sel.style.display === 'none') return; sel.style.left = Math.min(e.clientX, zoomStartX)+'px'; sel.style.top = Math.min(e.clientY, zoomStartY)+'px'; sel.style.width = Math.abs(e.clientX - zoomStartX)+'px'; sel.style.height = Math.abs(e.clientY - zoomStartY)+'px'; }); document.addEventListener('mouseup', function(e) { if (!zoomSelectMode) return; sel.style.display = 'none'; const w = Math.abs(e.clientX - zoomStartX); const h = Math.abs(e.clientY - zoomStartY); if (w < 30 || h < 30) return; applyZoom(Math.min(e.clientX, zoomStartX) + w/2, Math.min(e.clientY, zoomStartY) + h/2, w, h); zoomSelectMode = false; document.body.classList.remove('zoom-select-mode'); }); }
        function toggleZoomSelect() { if (isZoomed) { resetZoom(); return; } zoomSelectMode = !zoomSelectMode; document.body.classList.toggle('zoom-select-mode', zoomSelectMode); document.getElementById('toolMenu').classList.remove('visible'); }
        function applyZoom(cx, cy, w, h) { const active = document.querySelector('.slide-wrapper.active'); if (!active) return; const zf = Math.min(window.innerWidth/w, window.innerHeight/h)*0.9; const cs = Math.min(window.innerWidth/1920, window.innerHeight/1080); const ns = cs*zf; active.style.transition = 'transform 0.5s ease'; active.style.transform = 'scale('+ns+') translate('+((window.innerWidth/2-cx)/ns)+'px,'+((window.innerHeight/2-cy)/ns)+'px)'; isZoomed = true; }
        function resetZoom() { isZoomed = false; fitToScreen(); }

        function check(el, k) {
            const slide = el.closest('.slide-content');
            if (slide.dataset.quizDone) return;
            slide.dataset.quizDone = '1';
            const btns = slide.querySelectorAll('.option-btn');
            btns.forEach(b => { b.style.pointerEvents = 'none'; });
            const fb = slide.querySelector('.feedback-box') || slide.querySelector('#feedback');
            let correctKey = '';
            btns.forEach(b => { if (b.dataset.correct === 'true') correctKey = b.dataset.key; });
            if (k === correctKey || !correctKey) {
                el.classList.add('correct');
                if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
            } else {
                el.classList.add('wrong');
                btns.forEach(b => { if (b.dataset.key === correctKey) b.classList.add('correct'); });
            }
            if (fb) fb.style.display = 'block';
        }

        window.onload = init;
    <\/script>
</body>
</html>`;
}
