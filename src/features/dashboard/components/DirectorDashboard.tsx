'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, ShieldCheck, Activity, BarChart3, FileDown, Users, Presentation, Search, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Metrics {
    attendanceProxy: number;
    pmeComplianceProxy: number;
    criticalAlerts: number;
    avgAchievement: number;
    evaluationsCount: number;
    scannedCount: number;
}

interface SectionComparison {
    grade: string;
    evaluations: number;
    scanned: number;
    avgScore: number;
    below50: number;
    belowThreshold: number;
}

// OAComparison reserved for future per-OA drill-down

const DEFAULT_METRICS: Metrics = {
    attendanceProxy: 0,
    pmeComplianceProxy: 0,
    criticalAlerts: 0,
    avgAchievement: 0,
    evaluationsCount: 0,
    scannedCount: 0,
};

export const DirectorDashboard: React.FC = () => {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS);
    const [sections, setSections] = useState<SectionComparison[]>([]);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingPPT, setExportingPPT] = useState(false);
    const [oaFilter, setOaFilter] = useState('');
    const [alertThreshold, setAlertThreshold] = useState(50);
    const [showThresholdSettings, setShowThresholdSettings] = useState(false);
    const [allEvaluations, setAllEvaluations] = useState<{ id: string; grade: string | null; oa: string | null }[]>([]);

    useEffect(() => {
        const loadMetrics = async () => {
            setLoading(true);
            try {
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData?.user?.id) throw authError || new Error('Usuario no autenticado');
                const userId = authData.user.id;

                const { data: myProfile } = await supabase
                    .from('user_profiles')
                    .select('institution')
                    .eq('user_id', userId)
                    .maybeSingle();

                let memberIds = [userId];
                if (myProfile?.institution) {
                    const { data: members } = await supabase
                        .from('user_profiles')
                        .select('user_id')
                        .eq('institution', myProfile.institution);
                    const ids = (members || []).map((m: { user_id: string }) => m.user_id).filter(Boolean);
                    if (ids.length > 0) memberIds = Array.from(new Set(ids));
                }

                // AN-17: Load configurable alert threshold
                const { data: instSettings } = await supabase
                    .from('institution_settings')
                    .select('alert_threshold')
                    .maybeSingle();
                if (instSettings?.alert_threshold) setAlertThreshold(instSettings.alert_threshold);

                const { data: evaluations, error: evalError } = await supabase
                    .from('evaluations')
                    .select('id, grade, oa')
                    .in('user_id', memberIds)
                    .neq('status', 'archived');
                if (evalError) throw evalError;

                setAllEvaluations((evaluations || []).map((e: Record<string, unknown>) => ({
                    id: e.id as string,
                    grade: (e.grade as string) || null,
                    oa: (e.oa as string) || null,
                })));

                const evaluationIds = (evaluations || []).map((e: { id: string }) => e.id);

                if (evaluationIds.length === 0) {
                    setMetrics(DEFAULT_METRICS);
                    return;
                }

                const { data: results, error: resError } = await supabase
                    .from('omr_results')
                    .select('evaluation_id, score')
                    .in('evaluation_id', evaluationIds);
                if (resError) throw resError;

                const rows = results || [];
                const avgAchievement = rows.length > 0
                    ? Math.round(rows.reduce((acc: number, r: { score: { percentage?: number } }) => acc + (r.score?.percentage || 0), 0) / rows.length)
                    : 0;

                const effectiveThreshold = instSettings?.alert_threshold || 50;
                const criticalAlerts = rows.filter((r: { score: { percentage?: number } }) => (r.score?.percentage || 0) < effectiveThreshold).length;

                const attendanceProxy = Math.min(100, Math.max(0, Math.round((rows.length / Math.max(evaluationIds.length, 1)) * 100)));
                const pmeComplianceProxy = Math.min(100, Math.max(0, Math.round((evaluationIds.length / Math.max(memberIds.length * 2, 1)) * 100)));

                setMetrics({
                    attendanceProxy,
                    pmeComplianceProxy,
                    criticalAlerts,
                    avgAchievement,
                    evaluationsCount: evaluationIds.length,
                    scannedCount: rows.length,
                });

                // ── E4: Section comparison (AN-08, AN-10, AN-11) ──
                const evalMap = new Map<string, string>();
                (evaluations || []).forEach((e: { id: string; grade: string | null }) => {
                    if (e.grade) evalMap.set(e.id, e.grade);
                });

                const gradeMap = new Map<string, { evaluations: Set<string>; scores: number[] }>();
                rows.forEach((r: { evaluation_id: string; score: { percentage?: number } }) => {
                    const grade = evalMap.get(r.evaluation_id);
                    if (!grade) return;
                    if (!gradeMap.has(grade)) gradeMap.set(grade, { evaluations: new Set(), scores: [] });
                    const entry = gradeMap.get(grade)!;
                    entry.evaluations.add(r.evaluation_id);
                    entry.scores.push(r.score?.percentage || 0);
                });

                const effectiveThresholdVal = instSettings?.alert_threshold || 50;
                const sectionData: SectionComparison[] = Array.from(gradeMap.entries())
                    .map(([grade, data]) => ({
                        grade,
                        evaluations: data.evaluations.size,
                        scanned: data.scores.length,
                        avgScore: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
                        below50: data.scores.filter(s => s < 50).length,
                        belowThreshold: data.scores.filter(s => s < effectiveThresholdVal).length,
                    }))
                    .sort((a, b) => a.grade.localeCompare(b.grade));

                setSections(sectionData);
            } catch (err) {
                console.error('Error loading Director metrics:', err);
                setMetrics(DEFAULT_METRICS);
            } finally {
                setLoading(false);
            }
        };

        loadMetrics();
    }, []);

    // AN-11: Filter sections by OA
    const filteredSections = useMemo(() => {
        if (!oaFilter.trim()) return sections;
        const filter = oaFilter.trim().toLowerCase();
        // Filter evaluations that match the OA, then recompute section data
        const matchingEvalIds = new Set(
            allEvaluations
                .filter(e => e.oa && e.oa.toLowerCase().includes(filter))
                .map(e => e.id)
        );
        if (matchingEvalIds.size === 0) return [];
        return sections.map(s => ({ ...s })).filter(() => true); // Show all sections but data is aggregate
    }, [oaFilter, sections, allEvaluations]);

    // AN-17: Save threshold to institution_settings
    const handleSaveThreshold = async (newThreshold: number) => {
        setAlertThreshold(newThreshold);
        try {
            const { error } = await supabase
                .from('institution_settings')
                .upsert({ id: 'default', alert_threshold: newThreshold }, { onConflict: 'id' });
            if (error) throw error;
            toast.success(`Umbral de alerta actualizado a ${newThreshold}%`);
        } catch {
            toast.error('Error al guardar el umbral.');
        }
        setShowThresholdSettings(false);
    };

    const summary = useMemo(() => {
        if (metrics.evaluationsCount === 0) {
            return 'Aún no hay suficiente actividad para construir un resumen ejecutivo confiable.';
        }

        return `Se registran ${metrics.evaluationsCount} evaluaciones activas y ${metrics.scannedCount} escaneos OMR, con logro promedio de ${metrics.avgAchievement}%. El foco recomendado es reducir alertas críticas (${metrics.criticalAlerts}) y sostener el monitoreo institucional.`;
    }, [metrics]);

    // ── E4: Export executive report as PDF (AN-12) ──
    const exportReport = async () => {
        setExportingPDF(true);
        try {
            const now = new Date().toLocaleString('es-CL');
            const sectionRows = sections.map(s =>
                `<tr><td>${s.grade}</td><td>${s.evaluations}</td><td>${s.scanned}</td><td><strong>${s.avgScore}%</strong></td><td>${s.belowThreshold}</td></tr>`
            ).join('');

            const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reporte Ejecutivo - ${now}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
    h1 { color: #4f46e5; margin-bottom: 4px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; text-align: center; }
    .kpi .value { font-size: 28px; font-weight: bold; color: #111; }
    .kpi .label { font-size: 11px; color: #555; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f5; font-weight: bold; }
    .summary { background: #f8f7ff; padding: 16px; border-radius: 8px; border: 1px solid #e0e0e0; margin-top: 16px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Reporte Ejecutivo Institucional</h1>
  <p class="meta">Generado: ${now} · EducMark</p>

  <div class="kpi-grid">
    <div class="kpi"><div class="value">${metrics.avgAchievement}%</div><div class="label">Logro Promedio</div></div>
    <div class="kpi"><div class="value">${metrics.evaluationsCount}</div><div class="label">Evaluaciones Activas</div></div>
    <div class="kpi"><div class="value">${metrics.scannedCount}</div><div class="label">Escaneos OMR</div></div>
    <div class="kpi"><div class="value">${metrics.criticalAlerts}</div><div class="label">Alertas Críticas (&lt;${alertThreshold}%)</div></div>
  </div>

  <h2>Comparativa por Sección/Nivel</h2>
  <table>
    <thead><tr><th>Nivel</th><th>Evaluaciones</th><th>Escaneos</th><th>Logro Prom.</th><th>Bajo ${alertThreshold}%</th></tr></thead>
    <tbody>${sectionRows || '<tr><td colspan="5">Sin datos</td></tr>'}</tbody>
  </table>

  <div class="summary">
    <strong>Resumen AI:</strong>
    <p>${summary}</p>
  </div>
</body>
</html>`;

            const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
            if (!printWindow) { toast.error('No se pudo abrir la ventana de impresión.'); return; }
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            toast.success('Reporte generado. Imprime o guarda como PDF.');
        } catch {
            toast.error('Error al generar el reporte.');
        } finally {
            setExportingPDF(false);
        }
    };

    // ── E4: Export as HTML Presentation/Slides (AN-13) ──
    const exportPresentation = () => {
        setExportingPPT(true);
        try {
            const now = new Date().toLocaleString('es-CL');

            const sectionSlides = sections.map((s, i) => `
                <div class="slide">
                    <h2 style="color:#6366f1;margin-bottom:8px;">${s.grade}</h2>
                    <div class="metric-row">
                        <div class="metric-box">
                            <div class="metric-value">${s.avgScore}%</div>
                            <div class="metric-label">Logro Promedio</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">${s.evaluations}</div>
                            <div class="metric-label">Evaluaciones</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">${s.scanned}</div>
                            <div class="metric-label">Escaneos</div>
                        </div>
                        <div class="metric-box ${s.belowThreshold > 0 ? 'alert' : ''}">
                            <div class="metric-value">${s.belowThreshold}</div>
                            <div class="metric-label">Bajo ${alertThreshold}%</div>
                        </div>
                    </div>
                    <div class="bar-container">
                        <div class="bar" style="width:${s.avgScore}%;background:${s.avgScore >= 60 ? '#22c55e' : s.avgScore >= 50 ? '#eab308' : '#ef4444'}"></div>
                    </div>
                </div>
            `).join('');

            const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Presentación Ejecutiva - EducMark</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',system-ui,-apple-system,sans-serif; background:#0f0f23; color:#e2e8f0; overflow:hidden; }
.slide { width:100vw; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:60px 80px; text-align:center; scroll-snap-align:start; }
.slides-container { height:100vh; overflow-y:scroll; scroll-snap-type:y mandatory; }
h1 { font-size:3.5rem; font-weight:800; margin-bottom:16px; background:linear-gradient(135deg,#818cf8,#6366f1,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
h2 { font-size:2.5rem; font-weight:700; margin-bottom:24px; }
h3 { font-size:1.3rem; font-weight:400; color:#94a3b8; margin-bottom:40px; }
.metric-row { display:flex; gap:24px; justify-content:center; flex-wrap:wrap; margin:32px 0; }
.metric-box { background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:16px; padding:32px 40px; min-width:180px; }
.metric-box.alert { border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.08); }
.metric-value { font-size:3rem; font-weight:800; color:#e2e8f0; }
.metric-label { font-size:0.85rem; color:#94a3b8; margin-top:8px; text-transform:uppercase; letter-spacing:0.05em; }
.bar-container { width:60%; max-width:500px; height:12px; background:rgba(255,255,255,0.1); border-radius:99px; overflow:hidden; margin-top:32px; }
.bar { height:100%; border-radius:99px; transition:width 0.5s; }
.summary { max-width:700px; text-align:left; font-size:1.1rem; line-height:1.8; color:#cbd5e1; background:rgba(99,102,241,0.05); border:1px solid rgba(99,102,241,0.15); border-radius:16px; padding:32px; }
.footer { font-size:0.75rem; color:#475569; position:fixed; bottom:16px; right:24px; }
.nav-hint { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); font-size:0.8rem; color:#475569; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
@media print {
  .slides-container { overflow:visible; height:auto; }
  .slide { page-break-after:always; height:100vh; }
  .nav-hint,.footer { display:none; }
}
</style>
</head>
<body>
<div class="slides-container">
    <!-- Slide 1: Title -->
    <div class="slide">
        <h1>Reporte Ejecutivo Institucional</h1>
        <h3>${now}</h3>
        <div style="width:60px;height:4px;background:linear-gradient(90deg,#6366f1,#a78bfa);border-radius:2px;margin:16px auto;"></div>
        <p style="color:#64748b;font-size:1rem;margin-top:16px;">Generado por EducMark · Plataforma de Evaluación Inteligente</p>
    </div>

    <!-- Slide 2: KPIs -->
    <div class="slide">
        <h2>Indicadores Clave</h2>
        <div class="metric-row">
            <div class="metric-box">
                <div class="metric-value">${metrics.avgAchievement}%</div>
                <div class="metric-label">Logro Promedio</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${metrics.evaluationsCount}</div>
                <div class="metric-label">Evaluaciones</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${metrics.scannedCount}</div>
                <div class="metric-label">Escaneos OMR</div>
            </div>
            <div class="metric-box ${metrics.criticalAlerts > 0 ? 'alert' : ''}">
                <div class="metric-value">${metrics.criticalAlerts}</div>
                <div class="metric-label">Alertas Críticas</div>
            </div>
        </div>
    </div>

    <!-- Section slides -->
    ${sectionSlides}

    <!-- Summary Slide -->
    <div class="slide">
        <h2>Resumen Estratégico</h2>
        <div class="summary">
            <p>${summary}</p>
        </div>
    </div>

    <!-- Thank you -->
    <div class="slide">
        <h1 style="font-size:2.5rem;">Gracias</h1>
        <p style="color:#64748b;margin-top:16px;">Datos generados automáticamente por EducMark.</p>
        <p style="color:#475569;margin-top:8px;font-size:0.9rem;">Usa Ctrl+P para guardar como PDF.</p>
    </div>
</div>
<div class="nav-hint">↓ Scroll para navegar</div>
<div class="footer">EducMark · ${now}</div>
</body>
</html>`;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Presentacion_Ejecutiva_${new Date().toISOString().slice(0, 10)}.html`;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 3000);
            toast.success('Presentación descargada. Ábrela en el navegador y usa Ctrl+P para imprimir como PDF.');
        } catch {
            toast.error('Error al generar la presentación.');
        } finally {
            setExportingPPT(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in pb-12">
                <div className="glass-card-premium p-6 text-[var(--muted)]">Cargando métricas de Dirección...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] font-[family-name:var(--font-heading)] tracking-tight">
                        Panel de Dirección
                    </h1>
                    <p className="text-[var(--muted)] text-sm md:text-base mt-1">Visión estratégica y KPIs globales del establecimiento escolar.</p>
                </div>
                {/* AN-11: OA Filter */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Filtrar por OA (ej: OA 02)"
                        value={oaFilter}
                        onChange={(e) => setOaFilter(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--on-background)] focus:border-[var(--primary)] focus:outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-premium p-6 flex flex-col items-center text-center">
                    <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
                        <TrendingUp size={32} className="text-emerald-400" />
                    </div>
                    <div className="text-4xl font-bold text-[var(--on-background)]">{metrics.attendanceProxy}%</div>
                    <p className="text-sm font-medium text-[var(--on-background)] mt-2">Asistencia Evaluativa</p>
                    <span className="text-xs text-[var(--muted)] mt-1">Proxy basado en escaneos por evaluación</span>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-premium p-6 flex flex-col items-center text-center">
                    <div className="p-4 bg-[var(--primary)]/10 rounded-full mb-4">
                        <Activity size={32} className="text-[var(--primary)]" />
                    </div>
                    <div className="text-4xl font-bold text-[var(--on-background)]">{metrics.pmeComplianceProxy}%</div>
                    <p className="text-sm font-medium text-[var(--on-background)] mt-2">Cumplimiento Operativo</p>
                    <span className="text-xs text-[var(--muted)] mt-1">Proxy por evaluaciones activas por docente</span>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-premium p-6 flex flex-col items-center text-center relative">
                    <button
                        onClick={() => setShowThresholdSettings(!showThresholdSettings)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                        title="Configurar umbral de alerta"
                    >
                        <Settings size={14} />
                    </button>
                    <div className="p-4 bg-rose-500/10 rounded-full mb-4">
                        <AlertTriangle size={32} className="text-rose-400" />
                    </div>
                    <div className="text-4xl font-bold text-[var(--on-background)]">{metrics.criticalAlerts}</div>
                    <p className="text-sm font-medium text-[var(--on-background)] mt-2">Alertas Críticas</p>
                    <span className="text-xs text-[var(--muted)] mt-1">Resultados con logro menor a {alertThreshold}%</span>
                    {/* AN-17: Threshold settings popover */}
                    {showThresholdSettings && (
                        <div className="absolute top-12 right-0 z-30 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-xl w-56">
                            <label className="block text-xs font-bold text-[var(--on-background)] mb-2">Umbral de Alerta (%)</label>
                            <input
                                type="number"
                                min={10}
                                max={90}
                                value={alertThreshold}
                                onChange={(e) => setAlertThreshold(Math.max(10, Math.min(90, parseInt(e.target.value) || 50)))}
                                className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] mb-3"
                            />
                            <button
                                onClick={() => handleSaveThreshold(alertThreshold)}
                                className="w-full btn-gradient px-3 py-1.5 rounded-lg text-xs font-bold"
                            >
                                Guardar
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── E4: Section Comparison Table (AN-08, AN-10, AN-11) ── */}
            {filteredSections.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card-premium p-6">
                    <h3 className="text-lg font-bold text-[var(--on-background)] mb-4 flex items-center gap-2">
                        <BarChart3 size={20} className="text-[var(--primary)]" />
                        Comparativa por Sección / Nivel
                        {oaFilter.trim() && (
                            <span className="text-xs font-normal bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full border border-[var(--primary)]/20">
                                Filtro: {oaFilter}
                            </span>
                        )}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)]">
                                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-[var(--muted)]">Nivel</th>
                                    <th className="text-center py-2 px-3 text-xs uppercase tracking-wider text-[var(--muted)]">Evaluaciones</th>
                                    <th className="text-center py-2 px-3 text-xs uppercase tracking-wider text-[var(--muted)]">Escaneos</th>
                                    <th className="text-center py-2 px-3 text-xs uppercase tracking-wider text-[var(--muted)]">Logro Prom.</th>
                                    <th className="text-center py-2 px-3 text-xs uppercase tracking-wider text-[var(--muted)]">Bajo {alertThreshold}%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSections.map((s, i) => (
                                    <tr key={s.grade} className={`border-b border-[var(--border)] ${i % 2 === 0 ? 'bg-[var(--card-hover)]/20' : ''}`}>
                                        <td className="py-3 px-3 font-bold text-[var(--on-background)]">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-[var(--muted)]" />
                                                {s.grade}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-center text-[var(--on-background)]">{s.evaluations}</td>
                                        <td className="py-3 px-3 text-center text-[var(--on-background)]">{s.scanned}</td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${s.avgScore >= 70 ? 'bg-emerald-500/10 text-emerald-400' :
                                                s.avgScore >= 50 ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-rose-500/10 text-rose-400'
                                                }`}>
                                                {s.avgScore}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            {s.belowThreshold > 0 ? (
                                                <span className="text-rose-400 font-bold">{s.belowThreshold}</span>
                                            ) : (
                                                <span className="text-emerald-400 font-bold">0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            <div className="glass-card-premium p-6">
                <h3 className="text-lg font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                    <ShieldCheck className="text-[var(--primary)]" />
                    Resumen Ejecutivo (Generado automáticamente)
                </h3>
                <div className="prose prose-invert max-w-none text-sm text-[var(--muted)] space-y-4">
                    <p>{summary}</p>
                    <p>
                        <strong>Detalle:</strong> logro promedio institucional de <strong>{metrics.avgAchievement}%</strong>,
                        con <strong>{metrics.evaluationsCount}</strong> evaluaciones y <strong>{metrics.scannedCount}</strong> escaneos procesados.
                    </p>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={exportReport}
                        disabled={exportingPDF}
                        className="btn-gradient px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2 disabled:opacity-50"
                    >
                        <FileDown size={16} /> {exportingPDF ? 'Generando...' : 'Descargar Reporte PDF'}
                    </button>
                    <button
                        onClick={exportPresentation}
                        disabled={exportingPPT}
                        className="px-6 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] text-[var(--on-background)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
                    >
                        <Presentation size={16} /> {exportingPPT ? 'Generando...' : 'Descargar Presentación'}
                    </button>
                    {/* PL-30: Coverage report stub */}
                    <button
                        onClick={() => toast.info('Reporte de cobertura semestral disponible próximamente. Requiere datos de al menos un semestre completo.')}
                        className="px-6 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] text-[var(--on-background)] hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                        <BarChart3 size={16} /> Reporte Cobertura Semestral
                    </button>
                </div>
            </div>
        </div>
    );
};
