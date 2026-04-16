/**
 * Genera un HTML de planificación pedagógica standalone.
 * Diseño tipo documento institucional, imprimible (A4/Letter).
 */

export interface PlanificacionInput {
  titulo: string;
  profesor: string;
  asignatura: string;
  curso: string;
  duracion: string;
  fecha: string;
  oa_number?: string;
  oa_text?: string;
  objetivo_clase: string;
  conceptos_clave?: string;
  habilidades?: string;
  indicadores?: string[];
  fase_inicio?: string;
  fase_desarrollo?: string;
  fase_cierre?: string;
  nee?: string;
}

export function renderPlanificacionHtml(data: PlanificacionInput): string {
  const indicadoresHtml = (data.indicadores || []).map(i => `<li>${escapeHtml(i)}</li>`).join('');
  const neeHtml = data.nee && data.nee !== 'Ninguna'
    ? `<div class="nee-box">
        <div class="nee-title">🌈 Adaptaciones NEE / DUA</div>
        <p>${escapeHtml(data.nee)}</p>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Planificación — ${escapeHtml(data.titulo)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f5f5f7;
  color: #1a1a2e;
  line-height: 1.6;
  padding: 40px 20px;
  min-height: 100vh;
}
.page {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 40px rgba(0,0,0,0.08);
  overflow: hidden;
}
.header {
  background: linear-gradient(135deg, #6e56cf 0%, #f472b6 100%);
  color: white;
  padding: 50px 60px;
  position: relative;
}
.header::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
}
.logo-tag {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 20px;
}
h1 { font-size: 2.4rem; font-weight: 900; line-height: 1.1; margin-bottom: 12px; position: relative; }
.subtitle { font-size: 1.1rem; opacity: 0.9; font-weight: 400; position: relative; }
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  padding: 30px 60px;
  background: #fafafa;
  border-bottom: 1px solid #ececef;
}
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #8b5cf6; font-weight: 800; }
.meta-value { font-size: 15px; font-weight: 600; color: #1a1a2e; }
.content { padding: 50px 60px; }
.section { margin-bottom: 40px; }
.section-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 11px; text-transform: uppercase; letter-spacing: 3px;
  color: #8b5cf6; font-weight: 800; margin-bottom: 16px;
  padding-bottom: 10px; border-bottom: 2px solid #e9e7ff;
}
.section-title::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #f472b6; display: inline-block; }
.objetivo-box {
  background: linear-gradient(135deg, rgba(110,86,207,0.06) 0%, rgba(244,114,182,0.06) 100%);
  border-left: 6px solid #6e56cf;
  padding: 24px 28px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 500;
  color: #1a1a2e;
  line-height: 1.5;
}
.oa-tag {
  display: inline-block;
  background: #1a1a2e;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.oa-text { font-size: 14px; color: #555; font-style: italic; margin-bottom: 16px; line-height: 1.5; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.chip {
  background: #f0eefc;
  color: #6e56cf;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.indicadores-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.indicadores-list li {
  padding: 10px 14px 10px 34px;
  background: #f8f8fa;
  border-radius: 8px;
  font-size: 14px;
  position: relative;
  color: #333;
}
.indicadores-list li::before {
  content: '✓';
  position: absolute;
  left: 12px; top: 10px;
  color: #22c55e;
  font-weight: 900;
}
.fases {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.fase {
  border: 1px solid #ececef;
  border-radius: 12px;
  padding: 22px 26px;
  transition: all 0.2s;
}
.fase:hover { border-color: #6e56cf; box-shadow: 0 4px 20px rgba(110,86,207,0.08); }
.fase-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.fase-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.fase-inicio .fase-icon { background: #fef3c7; color: #d97706; }
.fase-desarrollo .fase-icon { background: #dbeafe; color: #2563eb; }
.fase-cierre .fase-icon { background: #d1fae5; color: #059669; }
.fase-name { font-size: 18px; font-weight: 800; color: #1a1a2e; }
.fase-duration { font-size: 11px; background: #f0eefc; color: #6e56cf; padding: 3px 10px; border-radius: 12px; font-weight: 700; margin-left: auto; }
.fase-body { font-size: 14px; color: #444; line-height: 1.7; padding-left: 48px; }
.nee-box {
  background: linear-gradient(135deg, rgba(244,114,182,0.08) 0%, rgba(245,158,11,0.08) 100%);
  border: 2px solid rgba(244,114,182,0.3);
  border-radius: 12px;
  padding: 22px 26px;
  margin-top: 20px;
}
.nee-title {
  font-size: 13px; text-transform: uppercase; letter-spacing: 2px;
  color: #f472b6; font-weight: 800; margin-bottom: 8px;
}
.footer {
  background: #fafafa;
  padding: 24px 60px;
  text-align: center;
  font-size: 12px;
  color: #888;
  border-top: 1px solid #ececef;
}
.footer a { color: #6e56cf; text-decoration: none; font-weight: 600; }
.print-btn {
  position: fixed;
  top: 24px;
  right: 24px;
  background: linear-gradient(135deg, #6e56cf, #f472b6);
  color: white;
  padding: 10px 20px;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  box-shadow: 0 4px 20px rgba(110,86,207,0.3);
  transition: all 0.2s;
  z-index: 100;
}
.print-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(110,86,207,0.4); }
@media print {
  body { background: white; padding: 0; }
  .page { box-shadow: none; border-radius: 0; max-width: none; }
  .print-btn { display: none; }
  .header { color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .header, .objetivo-box, .chip, .fase-icon, .nee-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
<div class="page">
  <div class="header">
    <div class="logo-tag">📋 Planificación de Clase — EducMark</div>
    <h1>${escapeHtml(data.titulo)}</h1>
    <div class="subtitle">${escapeHtml(data.asignatura)} · ${escapeHtml(data.curso)} · ${escapeHtml(data.fecha)}</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-label">Profesor/a</div>
      <div class="meta-value">${escapeHtml(data.profesor)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Asignatura</div>
      <div class="meta-value">${escapeHtml(data.asignatura)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Curso</div>
      <div class="meta-value">${escapeHtml(data.curso)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Duración</div>
      <div class="meta-value">${escapeHtml(data.duracion)}</div>
    </div>
  </div>

  <div class="content">
    ${data.oa_number || data.oa_text ? `
    <div class="section">
      <div class="section-title">Objetivo de Aprendizaje (OA)</div>
      ${data.oa_number ? `<div class="oa-tag">${escapeHtml(data.oa_number)}</div>` : ''}
      ${data.oa_text ? `<div class="oa-text">"${escapeHtml(data.oa_text)}"</div>` : ''}
    </div>` : ''}

    <div class="section">
      <div class="section-title">Objetivo Tridimensional de la Clase</div>
      <div class="objetivo-box">${escapeHtml(data.objetivo_clase)}</div>
    </div>

    ${data.conceptos_clave || data.habilidades ? `
    <div class="section">
      <div class="section-title">Conceptos y Habilidades</div>
      ${data.conceptos_clave ? `<div style="margin-bottom:12px;"><strong style="font-size:13px;color:#666;">Conceptos clave:</strong><div class="chips">${data.conceptos_clave.split(',').map(c => `<span class="chip">${escapeHtml(c.trim())}</span>`).join('')}</div></div>` : ''}
      ${data.habilidades ? `<div><strong style="font-size:13px;color:#666;">Habilidades:</strong><div class="chips"><span class="chip" style="background:#fef3c7;color:#d97706;">${escapeHtml(data.habilidades)}</span></div></div>` : ''}
    </div>` : ''}

    ${indicadoresHtml ? `
    <div class="section">
      <div class="section-title">Indicadores de Evaluación</div>
      <ul class="indicadores-list">${indicadoresHtml}</ul>
    </div>` : ''}

    <div class="section">
      <div class="section-title">Secuencia Didáctica</div>
      <div class="fases">
        ${data.fase_inicio ? `
        <div class="fase fase-inicio">
          <div class="fase-header">
            <div class="fase-icon">🎯</div>
            <div class="fase-name">Inicio</div>
            <div class="fase-duration">15-20 min</div>
          </div>
          <div class="fase-body">${escapeHtml(data.fase_inicio)}</div>
        </div>` : ''}
        ${data.fase_desarrollo ? `
        <div class="fase fase-desarrollo">
          <div class="fase-header">
            <div class="fase-icon">⚡</div>
            <div class="fase-name">Desarrollo</div>
            <div class="fase-duration">50-60 min</div>
          </div>
          <div class="fase-body">${escapeHtml(data.fase_desarrollo)}</div>
        </div>` : ''}
        ${data.fase_cierre ? `
        <div class="fase fase-cierre">
          <div class="fase-header">
            <div class="fase-icon">✨</div>
            <div class="fase-name">Cierre</div>
            <div class="fase-duration">10-15 min</div>
          </div>
          <div class="fase-body">${escapeHtml(data.fase_cierre)}</div>
        </div>` : ''}
      </div>
    </div>

    ${neeHtml}
  </div>

  <div class="footer">
    Generado con <a href="https://educmark.cl">EducMark</a> · Alineado al curriculum chileno MINEDUC
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
