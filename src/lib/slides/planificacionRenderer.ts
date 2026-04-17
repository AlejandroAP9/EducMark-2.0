/**
 * Genera un HTML de planificación pedagógica completa.
 * Diseño basado en el template de n8n "Planificación Cerebro-Compatible".
 * Incluye: OA, habilidades, secuencia didáctica, evaluación con rúbrica, NEE/DUA, co-docencia.
 */

export interface OAItem {
  numero: string;
  texto: string;
}

export interface RubricaRow {
  criterio: string;
  destacado: string;
  logrado: string;
  en_desarrollo: string;
  inicial: string;
}

export interface NEEData {
  diagnostico?: string;
  perfil_neurocognitivo?: string;
  principio_dua_prioritario?: string;
  barrera_identificada?: string;
  adaptaciones?: {
    acceso?: { descripcion?: string };
    metodologia?: { descripcion?: string };
    evaluacion?: { descripcion?: string };
  };
  adaptacion_por_fase?: {
    inicio?: string;
    desarrollo?: string;
    cierre?: string;
  };
  co_docencia?: {
    profesor_aula?: string;
    educador_diferencial?: string;
  };
  estrategia_dua_universal?: string;
}

export interface PlanificacionInput {
  asignatura: string;
  profesor: string;
  curso: string;
  duracion: string;
  fecha: string;
  oas: OAItem[];
  habilidades?: string;
  nivel_taxonomico?: string;
  actitud?: string;
  objetivo_clase: string;
  fase_inicio?: string;
  fase_desarrollo?: string;
  fase_cierre?: string;
  indicadores?: string[];
  rubrica?: RubricaRow[];
  nee_data?: NEEData;
}

export function renderPlanificacionHtml(data: PlanificacionInput): string {
  const oaListHtml = (data.oas || []).map(oa =>
    `<li><strong>${esc(oa.numero)}:</strong> ${esc(oa.texto)}</li>`
  ).join('');

  const indicadoresListHtml = (data.indicadores || []).map(i =>
    `<li>${esc(i)}</li>`
  ).join('');

  const rubricaTableHtml = (data.rubrica && data.rubrica.length > 0)
    ? `<div class="indicators-title" style="margin-top:16px;">Rúbrica Analítica</div>
       <div class="table-wrapper"><table>
         <tr><th>CRITERIO</th><th>DESTACADO (4)</th><th>LOGRADO (3)</th><th>EN DESARROLLO (2)</th><th>INICIAL (1)</th></tr>
         ${data.rubrica.map(r => `<tr>
           <td>${esc(r.criterio)}</td>
           <td>${esc(r.destacado)}</td>
           <td>${esc(r.logrado)}</td>
           <td>${esc(r.en_desarrollo)}</td>
           <td>${esc(r.inicial)}</td>
         </tr>`).join('')}
       </table></div>`
    : '';

  const nee = data.nee_data || {};
  const hasNee = Object.keys(nee).length > 0;

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planificación - ${esc(data.asignatura)}</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    :root {
        --primary: #6e56cf; --primary-light: #ede9fe; --primary-glow: rgba(110,86,207,0.15);
        --secondary: #0891b2; --secondary-light: #ecfeff;
        --success: #059669; --success-light: #ecfdf5;
        --danger: #dc2626; --danger-light: #fef2f2;
        --warning: #f59e0b; --warning-light: #fffbeb;
        --bg: #ffffff; --bg-alt: #f8fafc; --bg-dark: #0f111a;
        --border: #e2e8f0; --border-strong: #cbd5e1;
        --text-main: #1e293b; --text-body: #475569; --text-muted: #94a3b8;
        --pink: #f472b6; --pink-light: #fce7f3;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', -apple-system, sans-serif; background: linear-gradient(180deg, #f1f0fb 0%, #f8fafc 100%); color: var(--text-body); padding: 40px; line-height: 1.6; font-size: 15px; -webkit-font-smoothing: antialiased; }
    .container { max-width: 920px; margin: 0 auto; background: var(--bg); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(110,86,207,0.05); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%); color: white; padding: 48px 56px 40px; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: -100px; right: -80px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(244,114,182,0.2) 0%, transparent 60%); border-radius: 50%; }
    .header::after { content: ''; position: absolute; bottom: -80px; left: -40px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(110,86,207,0.3) 0%, transparent 60%); border-radius: 50%; }
    .header-content { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left { flex: 1; }
    .doc-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 6px 16px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.15); font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
    .doc-badge .dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .subject-name { font-size: 2.8rem; font-weight: 900; letter-spacing: -1.5px; margin: 0 0 4px 0; line-height: 1.1; }
    .subject-subtitle { font-size: 1rem; font-weight: 400; opacity: 0.7; }
    .header-date { text-align: right; background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); padding: 16px 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
    .header-date .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.6; margin-bottom: 4px; }
    .header-date .value { font-size: 1.05rem; font-weight: 700; }
    .meta-bar { display: grid; grid-template-columns: repeat(3, 1fr); background: var(--bg); border-bottom: 1px solid var(--border); }
    .meta-item { padding: 20px 28px; display: flex; align-items: center; gap: 14px; border-right: 1px solid var(--border); transition: background 0.2s; }
    .meta-item:last-child { border-right: none; }
    .meta-item:hover { background: var(--bg-alt); }
    .meta-icon { width: 44px; height: 44px; background: linear-gradient(135deg, var(--primary-light), #f5f3ff); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: 0 2px 8px rgba(110,86,207,0.12); }
    .meta-text .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: 700; }
    .meta-text .value { font-size: 1rem; font-weight: 700; color: var(--text-main); }
    .content { padding: 48px 56px; }
    .section { margin-bottom: 44px; break-inside: avoid; }
    .section-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 2px solid var(--border); position: relative; }
    .section-header::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 60px; height: 2px; border-radius: 2px; }
    .section-header.purple::after { background: var(--primary); }
    .section-header.cyan::after { background: var(--secondary); }
    .section-header.green::after { background: var(--success); }
    .section-header.red::after { background: var(--danger); }
    .section-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .section-icon.purple { background: linear-gradient(135deg, var(--primary-light), #ddd6fe); }
    .section-icon.cyan { background: linear-gradient(135deg, var(--secondary-light), #a5f3fc); }
    .section-icon.green { background: linear-gradient(135deg, var(--success-light), #a7f3d0); }
    .section-icon.red { background: linear-gradient(135deg, var(--danger-light), #fecaca); }
    .section-title { font-size: 1.15rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-main); }
    .oa-card { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 1px solid #ddd6fe; border-radius: 20px; padding: 28px 32px; margin-bottom: 20px; position: relative; overflow: hidden; }
    .oa-card::before { content: 'OA'; position: absolute; top: -15px; right: -10px; font-size: 7rem; font-weight: 900; color: var(--primary); opacity: 0.04; pointer-events: none; line-height: 1; }
    .oa-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--primary); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .oa-text { font-size: 1rem; line-height: 1.7; color: var(--text-main); position: relative; z-index: 1; }
    .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .skill-card { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 22px; transition: all 0.2s; }
    .skill-card:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .skill-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 8px; }
    .skill-value { font-size: 1rem; font-weight: 600; color: var(--text-main); }
    .purpose-box { background: linear-gradient(135deg, #ecfeff, #cffafe); border-left: 5px solid var(--secondary); border-radius: 0 20px 20px 0; padding: 24px 28px; margin-bottom: 28px; position: relative; overflow: hidden; }
    .purpose-box::before { content: '"'; position: absolute; top: -10px; left: 20px; font-size: 5rem; font-weight: 900; color: var(--secondary); opacity: 0.1; line-height: 1; }
    .purpose-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--secondary); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .purpose-text { font-size: 1.05rem; font-style: italic; color: var(--text-main); line-height: 1.7; position: relative; z-index: 1; }
    .phases-container { position: relative; padding-left: 0; }
    .phase { margin-bottom: 24px; border-radius: 20px; padding: 28px 32px; position: relative; overflow: hidden; transition: all 0.2s; }
    .phase:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.06); }
    .phase.inicio { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; }
    .phase.desarrollo { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; }
    .phase.cierre { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; }
    .phase-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .phase-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .phase.inicio .phase-icon { background: rgba(34,197,94,0.15); }
    .phase.desarrollo .phase-icon { background: rgba(59,130,246,0.15); }
    .phase.cierre .phase-icon { background: rgba(245,158,11,0.15); }
    .phase-title { font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
    .phase.inicio .phase-title { color: #16a34a; }
    .phase.desarrollo .phase-title { color: #2563eb; }
    .phase.cierre .phase-title { color: #d97706; }
    .phase-time { margin-left: auto; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 50px; }
    .phase.inicio .phase-time { background: rgba(34,197,94,0.15); color: #16a34a; }
    .phase.desarrollo .phase-time { background: rgba(59,130,246,0.15); color: #2563eb; }
    .phase.cierre .phase-time { background: rgba(245,158,11,0.15); color: #d97706; }
    .phase-content { font-size: 0.95rem; line-height: 1.8; color: var(--text-body); white-space: pre-line; }
    .phase-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; padding: 3px 10px; border-radius: 50px; margin-top: 12px; }
    .phase.inicio .phase-tag { background: rgba(34,197,94,0.1); color: #16a34a; }
    .phase.desarrollo .phase-tag { background: rgba(59,130,246,0.1); color: #2563eb; }
    .phase.cierre .phase-tag { background: rgba(245,158,11,0.1); color: #d97706; }
    .eval-instrument { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, var(--success), #047857); color: white; padding: 10px 20px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }
    .eval-content { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #a7f3d0; border-radius: 20px; padding: 24px 28px; }
    .indicators-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--success); margin-bottom: 12px; }
    .indicators-list { list-style: none; padding: 0; }
    .indicators-list li { padding: 8px 0; border-bottom: 1px solid rgba(5,150,105,0.1); font-size: 0.95rem; display: flex; align-items: flex-start; gap: 8px; }
    .indicators-list li::before { content: '\\2713'; color: var(--success); font-weight: 900; font-size: 14px; flex-shrink: 0; margin-top: 2px; }
    .indicators-list li:last-child { border-bottom: none; }
    .nee-box { background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 1px solid #fecaca; border-radius: 20px; padding: 28px 32px; position: relative; overflow: hidden; }
    .nee-box::before { content: '\\2764'; position: absolute; top: 10px; right: 20px; font-size: 3rem; opacity: 0.06; }
    .nee-grid { display: grid; gap: 20px; }
    .nee-item { display: flex; flex-direction: column; gap: 6px; }
    .nee-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--danger); }
    .nee-value { font-size: 0.95rem; color: var(--text-body); line-height: 1.7; }
    .nee-success { margin-top: 20px; padding: 20px 28px; background: white; border-radius: 16px; border: 1px solid #a7f3d0; }
    .nee-success-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--success); margin-bottom: 6px; }
    .framework-badge { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #1e1b4b, #312e81); color: white; padding: 16px 24px; border-radius: 16px; margin-top: 40px; }
    .framework-badge .fw-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .framework-badge .fw-text { font-size: 12px; line-height: 1.5; }
    .framework-badge .fw-title { font-weight: 800; font-size: 13px; letter-spacing: 0.5px; }
    .framework-badge .fw-desc { opacity: 0.7; margin-top: 2px; }
    .table-wrapper { overflow-x: auto; margin-top: 16px; border-radius: 16px; border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: var(--text-main); padding: 14px 16px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border-strong); }
    td { padding: 14px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--bg-alt); }
    .toolbar { position: fixed; top: 24px; right: 24px; display: flex; gap: 10px; z-index: 100; }
    .toolbar-btn { background: white; color: var(--text-main); border: 2px solid var(--border); padding: 12px 20px; border-radius: 50px; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.1); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
    .toolbar-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .toolbar-btn.primary { background: linear-gradient(135deg, var(--primary), #5b21b6); color: white; border-color: transparent; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4); }
    .toolbar-btn.edit-active { background: var(--warning); color: white; border-color: var(--warning); }
    .toolbar-btn.save { background: var(--success); color: white; border-color: var(--success); }
    .toolbar-btn.hidden { display: none; }
    body.edit-mode .editable:focus { outline: 2px dashed var(--warning); outline-offset: 4px; border-radius: 4px; background: var(--warning-light); }
    body.edit-mode .editable { cursor: text; transition: background 0.2s; }
    body.edit-mode .editable:hover { background: rgba(245, 158, 11, 0.08); }
    .edit-banner { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--warning), #d97706); color: white; padding: 12px 24px; border-radius: 50px; font-size: 13px; font-weight: 600; display: none; align-items: center; gap: 10px; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); z-index: 100; }
    body.edit-mode .edit-banner { display: flex; }
    @media print {
        @page { size: letter; margin: 1.5cm; }
        body { padding: 0; background: white; font-size: 11pt; }
        .container { box-shadow: none; border-radius: 0; max-width: 100%; }
        .header { padding: 30px 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .content { padding: 30px 40px; }
        .toolbar, .edit-banner { display: none !important; }
        .section { break-inside: avoid; margin-bottom: 25px; }
        .phase, .oa-card, .purpose-box, .eval-content, .nee-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
</style>
</head>
<body>
    <div class="toolbar">
        <button class="toolbar-btn" id="editBtn" onclick="toggleEdit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span id="editBtnText">Editar</span>
        </button>
        <button class="toolbar-btn save hidden" id="saveBtn" onclick="saveDocument()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Guardar
        </button>
        <button class="toolbar-btn primary" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir
        </button>
    </div>
    <div class="edit-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Modo edición activo — Haz clic en cualquier texto para modificarlo
    </div>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <div class="header-left">
                    <div class="doc-badge"><span class="dot"></span> Planificación Cerebro-Compatible</div>
                    <h1 class="subject-name editable">${esc(data.asignatura)}</h1>
                    <div class="subject-subtitle">Framework Céspedes & Maturana • Neuroeducación Aplicada</div>
                </div>
                <div class="header-date">
                    <div class="label">Fecha</div>
                    <div class="value editable">${esc(data.fecha)}</div>
                </div>
            </div>
        </div>
        <div class="meta-bar">
            <div class="meta-item">
                <div class="meta-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                <div class="meta-text"><div class="label">Profesor</div><div class="value editable">${esc(data.profesor)}</div></div>
            </div>
            <div class="meta-item">
                <div class="meta-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
                <div class="meta-text"><div class="label">Curso</div><div class="value editable">${esc(data.curso)}</div></div>
            </div>
            <div class="meta-item">
                <div class="meta-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                <div class="meta-text"><div class="label">Duración</div><div class="value editable">${esc(data.duracion)}</div></div>
            </div>
        </div>
        <div class="content">
            <div class="section">
                <div class="section-header purple"><div class="section-icon purple"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div><h2 class="section-title">Marco Curricular</h2></div>
                <div class="oa-card">
                    <span class="oa-label"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> Objetivo de Aprendizaje (OA)</span>
                    <ul class="indicators-list">${oaListHtml}</ul>
                </div>
                <div class="skills-grid">
                    <div class="skill-card"><span class="skill-label">Habilidades</span><div class="skill-value editable">${esc(data.habilidades || 'No disponible')}</div></div>
                    <div class="skill-card"><span class="skill-label">Nivel Taxonómico</span><div class="skill-value editable">${esc(data.nivel_taxonomico || 'No disponible')}</div></div>
                </div>
                ${data.actitud ? `<div class="skill-card" style="margin-top:16px;"><span class="skill-label">Actitud / OAT Transversal</span><div class="skill-value editable">${esc(data.actitud)}</div></div>` : ''}
            </div>

            <div class="section">
                <div class="section-header cyan"><div class="section-icon cyan"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg></div><h2 class="section-title">Secuencia Didáctica</h2></div>
                <div class="purpose-box">
                    <div class="purpose-label"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e56cf" stroke-width="2"><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.12.34 2.17.92 3.04C3.72 11.58 3 13.2 3 15a5 5 0 0 0 5 5h1.5M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.12-.34 2.17-.92 3.04C20.28 11.58 21 13.2 21 15a5 5 0 0 1-5 5h-1.5M12 2v20"/></svg> Propósito de la Clase (Objetivo Tridimensional)</div>
                    <div class="purpose-text editable">${esc(data.objetivo_clase)}</div>
                </div>
                <div class="phases-container">
                    ${data.fase_inicio ? `<div class="phase inicio">
                        <div class="phase-header">
                            <div class="phase-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg></div>
                            <div class="phase-title">Inicio — Rompehielos Límbico</div>
                            <span class="phase-time">15-20 min</span>
                        </div>
                        <div class="phase-content editable">${esc(data.fase_inicio)}</div>
                        ${renderPhaseDua(nee.adaptacion_por_fase?.inicio)}
                        <div class="phase-tag">Pilar: Vínculo y Sorpresa</div>
                    </div>` : ''}
                    ${data.fase_desarrollo ? `<div class="phase desarrollo">
                        <div class="phase-header">
                            <div class="phase-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></div>
                            <div class="phase-title">Desarrollo — Gestión de Energía Cognitiva</div>
                            <span class="phase-time">50-60 min</span>
                        </div>
                        <div class="phase-content editable">${esc(data.fase_desarrollo)}</div>
                        ${renderPhaseDua(nee.adaptacion_por_fase?.desarrollo)}
                        <div class="phase-tag">Pilar: Hacer para Aprender + Movimiento</div>
                    </div>` : ''}
                    ${data.fase_cierre ? `<div class="phase cierre">
                        <div class="phase-header">
                            <div class="phase-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><polyline points="16 5 12 9 8 5"/></svg></div>
                            <div class="phase-title">Cierre — Consolidación y Metacognición</div>
                            <span class="phase-time">10-15 min</span>
                        </div>
                        <div class="phase-content editable">${esc(data.fase_cierre)}</div>
                        ${renderPhaseDua(nee.adaptacion_por_fase?.cierre)}
                        <div class="phase-tag">Pilar: Reflexión Final</div>
                    </div>` : ''}
                </div>
            </div>

            ${indicadoresListHtml || rubricaTableHtml ? `<div class="section">
                <div class="section-header green"><div class="section-icon green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div><h2 class="section-title">Evaluación</h2></div>
                <div class="eval-instrument"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>Instrumento: Rúbrica Analítica</div>
                <div class="eval-content">
                    ${indicadoresListHtml ? `<div class="indicators-title">Indicadores de Evaluación</div><ul class="indicators-list">${indicadoresListHtml}</ul>` : ''}
                    ${rubricaTableHtml}
                </div>
            </div>` : ''}

            ${hasNee ? `<div class="section">
                <div class="section-header red"><div class="section-icon red"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><h2 class="section-title">Inclusión y DUA</h2></div>
                <div class="nee-box">
                    <div class="nee-grid">
                        ${nee.diagnostico ? `<div class="nee-item"><span class="nee-label">Diagnóstico</span><div class="nee-value editable">${esc(nee.diagnostico)}</div></div>` : ''}
                        ${nee.perfil_neurocognitivo ? `<div class="nee-item"><span class="nee-label">Perfil Neurocognitivo</span><div class="nee-value editable">${esc(nee.perfil_neurocognitivo)}</div></div>` : ''}
                        ${nee.barrera_identificada ? `<div class="nee-item"><span class="nee-label">Barrera Identificada</span><div class="nee-value editable">${esc(nee.barrera_identificada)}</div></div>` : ''}
                        ${nee.principio_dua_prioritario ? `<div class="nee-item"><span class="nee-label">Principio DUA Prioritario</span><div class="nee-value editable">${esc(nee.principio_dua_prioritario)}</div></div>` : ''}
                    </div>
                    ${nee.adaptaciones ? `<div style="margin-top:20px; display:grid; gap:12px;">
                        ${nee.adaptaciones.acceso?.descripcion ? `<div class="nee-item"><span class="nee-label">Adaptación de Acceso</span><div class="nee-value editable">${esc(nee.adaptaciones.acceso.descripcion)}</div></div>` : ''}
                        ${nee.adaptaciones.metodologia?.descripcion ? `<div class="nee-item"><span class="nee-label">Adaptación Metodológica</span><div class="nee-value editable">${esc(nee.adaptaciones.metodologia.descripcion)}</div></div>` : ''}
                        ${nee.adaptaciones.evaluacion?.descripcion ? `<div class="nee-item"><span class="nee-label">Adaptación Evaluativa</span><div class="nee-value editable">${esc(nee.adaptaciones.evaluacion.descripcion)}</div></div>` : ''}
                    </div>` : ''}
                    ${nee.co_docencia ? `<div style="margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        ${nee.co_docencia.profesor_aula ? `<div style="background:white; border-radius:12px; padding:16px; border:1px solid #a7f3d0;"><span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#059669;">Prof. Aula</span><div class="nee-value editable">${esc(nee.co_docencia.profesor_aula)}</div></div>` : ''}
                        ${nee.co_docencia.educador_diferencial ? `<div style="background:white; border-radius:12px; padding:16px; border:1px solid #a7f3d0;"><span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#059669;">Educador/a Diferencial</span><div class="nee-value editable">${esc(nee.co_docencia.educador_diferencial)}</div></div>` : ''}
                    </div>` : ''}
                    ${nee.estrategia_dua_universal ? `<div class="nee-success">
                        <div class="nee-success-label">Estrategia DUA Universal (beneficia a todo el grupo)</div>
                        <div class="nee-value editable">${esc(nee.estrategia_dua_universal)}</div>
                    </div>` : ''}
                </div>
            </div>` : ''}

            <div class="framework-badge">
                <div class="fw-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e56cf" stroke-width="2"><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.12.34 2.17.92 3.04C3.72 11.58 3 13.2 3 15a5 5 0 0 0 5 5h1.5M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.12-.34 2.17-.92 3.04C20.28 11.58 21 13.2 21 15a5 5 0 0 1-5 5h-1.5M12 2v20"/></svg></div>
                <div class="fw-text">
                    <div class="fw-title">Framework Céspedes & Maturana · EducMark</div>
                    <div class="fw-desc">Planificación diseñada con principios de Neuroeducación y Biología del Conocimiento</div>
                </div>
            </div>
        </div>
    </div>
    <script>
        let editMode = false;
        function toggleEdit() {
            editMode = !editMode;
            document.body.classList.toggle('edit-mode', editMode);
            document.getElementById('editBtn').classList.toggle('edit-active', editMode);
            document.getElementById('editBtnText').textContent = editMode ? 'Editando...' : 'Editar';
            document.getElementById('saveBtn').classList.toggle('hidden', !editMode);
            document.querySelectorAll('.editable').forEach(el => editMode ? el.setAttribute('contenteditable','true') : el.removeAttribute('contenteditable'));
        }
        function saveDocument() {
            document.querySelectorAll('.editable').forEach(el => el.removeAttribute('contenteditable'));
            const toolbar = document.querySelector('.toolbar');
            const banner = document.querySelector('.edit-banner');
            toolbar.style.display = 'none';
            banner.style.display = 'none';
            const htmlContent = '<!DOCTYPE html>' + document.documentElement.outerHTML;
            toolbar.style.display = 'flex';
            if (editMode) { banner.style.display = 'flex'; document.querySelectorAll('.editable').forEach(el => el.setAttribute('contenteditable','true')); }
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'Planificacion_editada.html';
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;
}

function renderPhaseDua(adaptacion: string | undefined | null): string {
  if (!adaptacion || !String(adaptacion).trim()) return '';
  return `<div class="phase-dua" style="margin-top:12px; padding:12px 14px; background:rgba(220, 38, 38, 0.06); border-left:3px solid #dc2626; border-radius:6px;">
    <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#dc2626; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      Adaptación DUA en esta fase
    </div>
    <div class="editable" style="font-size:13px; color:#4b5563; line-height:1.5;">${esc(adaptacion)}</div>
  </div>`;
}

function esc(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
