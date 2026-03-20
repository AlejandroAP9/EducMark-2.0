'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight, RefreshCw, Trophy, AlertTriangle, Calendar, Users, Loader2, ChevronDown, ChevronUp, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { assessmentFetch } from '@/shared/lib/apiConfig';

// ── Types ──

interface EvolutionItem {
    oa: string;
    topic: string;
    previous_percentage: number | null;
    current_percentage: number | null;
    delta: number | null;
    abs_delta: number;
    trend: 'strong_improvement' | 'improvement' | 'stable' | 'slight_decline' | 'decline' | 'new';
    icon: string;
    message: string;
}

interface EvalInfo {
    id: string;
    title: string;
    date: string;
    students?: number;
    average?: number;
}

interface EvolutionData {
    success: boolean;
    has_previous: boolean;
    message?: string;
    current_evaluation: EvalInfo;
    previous_evaluation?: EvalInfo;
    overall_delta?: number;
    evolution: EvolutionItem[];
    summary?: {
        improvements: number;
        regressions: number;
        stable: number;
        best_improvement: EvolutionItem | null;
        worst_regression: EvolutionItem | null;
    };
    narrative: string;
}

// ── Component ──

interface OAEvolutionProps {
    evaluationId: string | null;
}

import { getAssessmentApiUrl } from '@/shared/lib/apiConfig';

const API_BASE_URL = getAssessmentApiUrl();

const trendColors: Record<string, { bg: string; text: string; border: string }> = {
    strong_improvement: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    improvement: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    stable: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
    slight_decline: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    decline: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    new: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

const TrendIcon: React.FC<{ trend: string; size?: number }> = ({ trend, size = 16 }) => {
    switch (trend) {
        case 'strong_improvement': return <TrendingUp size={size} className="text-emerald-400" />;
        case 'improvement': return <ArrowUpRight size={size} className="text-green-400" />;
        case 'stable': return <Minus size={size} className="text-slate-400" />;
        case 'slight_decline': return <ArrowDownRight size={size} className="text-amber-400" />;
        case 'decline': return <TrendingDown size={size} className="text-red-400" />;
        case 'new': return <Sparkles size={size} className="text-blue-400" />;
        default: return <Minus size={size} />;
    }
};

export const OAEvolution: React.FC<OAEvolutionProps> = ({ evaluationId }) => {
    const [data, setData] = useState<EvolutionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    const fetchEvolution = async () => {
        if (!evaluationId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await assessmentFetch(`${API_BASE_URL}/api/v1/feedback/oa-evolution/${evaluationId}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `Error ${res.status}`);
            }
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener evolución');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (evaluationId) {
            setData(null);
            setError(null);
        }
    }, [evaluationId]);

    if (!evaluationId) return null;

    // ── CTA (not loaded) ──
    if (!data && !loading && !error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card-premium p-8 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5 group-hover:from-amber-500/10 group-hover:to-emerald-500/10 transition-all duration-500" />
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp size={140} />
                </div>

                <div className="relative z-10 text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 flex items-center justify-center border border-amber-500/20">
                        <TrendingUp size={28} className="text-amber-400" />
                    </div>

                    <h3 className="text-xl font-bold text-[var(--on-background)] mb-2">
                        Evolución por OA
                    </h3>
                    <p className="text-[var(--muted)] text-sm mb-6 leading-relaxed">
                        Compara los resultados de esta evaluación con la anterior del mismo curso y asignatura.
                        Detecta mejoras, brechas persistentes, y genera mensajes automáticos.
                    </p>

                    <button
                        onClick={fetchEvolution}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <TrendingUp size={16} />
                        Comparar con Evaluación Anterior
                        <ArrowRight size={16} />
                    </button>
                </div>
            </motion.div>
        );
    }

    // ── Loading ──
    if (loading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-premium p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-emerald-500/5 animate-pulse" />
                <div className="relative z-10 text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="inline-block mb-4">
                        <Loader2 size={40} className="text-amber-400" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-[var(--on-background)] mb-2">Comparando evaluaciones…</h3>
                    <p className="text-[var(--muted)] text-sm">Analizando la evolución del dominio por OA entre ambas evaluaciones.</p>
                </div>
            </motion.div>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-premium p-8 border-l-4 border-red-500">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-[var(--on-background)] mb-1">Error</h4>
                        <p className="text-[var(--muted)] text-sm">{error}</p>
                        <button onClick={fetchEvolution} className="mt-3 text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
                            <RefreshCw size={14} /> Reintentar
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (!data) return null;

    // ── No previous evaluation ──
    if (!data.has_previous) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-premium p-8 text-center"
            >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Calendar size={24} className="text-amber-400" />
                </div>
                <h4 className="text-lg font-bold text-[var(--on-background)] mb-2">Primera Evaluación</h4>
                <p className="text-[var(--muted)] text-sm max-w-md mx-auto">{data.message}</p>
            </motion.div>
        );
    }

    const { current_evaluation, previous_evaluation, overall_delta, evolution, summary, narrative } = data;

    // ── Full View ──
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
        >
            {/* ── Header: Comparison Overview ── */}
            <div className="glass-card-premium p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-emerald-500/5" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-[var(--on-background)] flex items-center gap-2">
                            <TrendingUp size={20} className="text-amber-400" />
                            Evolución por OA
                        </h3>
                        <button onClick={fetchEvolution} className="p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors" title="Regenerar">
                            <RefreshCw size={14} className="text-[var(--muted)]" />
                        </button>
                    </div>

                    {/* Two evaluation comparison cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        {/* Previous */}
                        <div className="bg-[var(--card)]/60 p-4 rounded-xl border border-[var(--border)]">
                            <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Anterior</span>
                            <p className="text-sm font-semibold text-[var(--on-background)] mt-1 truncate">{previous_evaluation?.title}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-2xl font-black text-[var(--foreground)]">{previous_evaluation?.average}%</span>
                                <span className="text-[10px] text-[var(--muted)]">
                                    <Users size={10} className="inline mr-1" />
                                    {previous_evaluation?.students} alumnos
                                </span>
                            </div>
                            <span className="text-[10px] text-[var(--muted)]">
                                {previous_evaluation?.date ? new Date(previous_evaluation.date).toLocaleDateString('es-CL') : ''}
                            </span>
                        </div>

                        {/* Delta Arrow */}
                        <div className="flex flex-col items-center justify-center py-2">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${(overall_delta ?? 0) > 0
                                ? 'bg-emerald-500/20 border-2 border-emerald-500/40'
                                : (overall_delta ?? 0) < 0
                                    ? 'bg-red-500/20 border-2 border-red-500/40'
                                    : 'bg-slate-500/20 border-2 border-slate-500/40'
                                }`}>
                                <span className={`text-lg font-black ${(overall_delta ?? 0) > 0 ? 'text-emerald-400' : (overall_delta ?? 0) < 0 ? 'text-red-400' : 'text-slate-400'
                                    }`}>
                                    {(overall_delta ?? 0) > 0 ? '+' : ''}{overall_delta ?? 0}
                                </span>
                            </div>
                            <span className="text-[10px] text-[var(--muted)] mt-1">pp promedio</span>
                        </div>

                        {/* Current */}
                        <div className="bg-[var(--card)]/60 p-4 rounded-xl border border-[var(--primary)]/30">
                            <span className="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold">Actual</span>
                            <p className="text-sm font-semibold text-[var(--on-background)] mt-1 truncate">{current_evaluation?.title}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-2xl font-black text-[var(--primary)]">{current_evaluation?.average}%</span>
                                <span className="text-[10px] text-[var(--muted)]">
                                    <Users size={10} className="inline mr-1" />
                                    {current_evaluation?.students} alumnos
                                </span>
                            </div>
                            <span className="text-[10px] text-[var(--muted)]">
                                {current_evaluation?.date ? new Date(current_evaluation.date).toLocaleDateString('es-CL') : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Trophy: Best Improvement & Worst Regression ── */}
            {summary && (summary.best_improvement || summary.worst_regression) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summary.best_improvement && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card-premium p-5 border-l-4 border-emerald-500 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-5"><Trophy size={80} /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy size={16} className="text-emerald-400" />
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Mayor Mejora</span>
                                </div>
                                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                    {summary.best_improvement.message}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {summary.worst_regression && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card-premium p-5 border-l-4 border-red-500 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-5"><AlertTriangle size={80} /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle size={16} className="text-red-400" />
                                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Requiere Atención</span>
                                </div>
                                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                    {summary.worst_regression.message}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* ── Evolution Timeline ── */}
            <div className="glass-card-premium p-6">
                <div className="flex items-center justify-between mb-5">
                    <h4 className="text-sm font-bold text-[var(--on-background)] flex items-center gap-2">
                        <TrendingUp size={16} className="text-amber-400" />
                        Detalle por OA
                    </h4>
                    {summary && (
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md font-bold">
                                ↑ {summary.improvements}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-500/10 px-2 py-1 rounded-md font-bold">
                                → {summary.stable}
                            </span>
                            <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded-md font-bold">
                                ↓ {summary.regressions}
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {evolution.map((item, idx) => {
                        const colors = trendColors[item.trend] || trendColors.stable;
                        const isExpanded = expandedIdx === idx;

                        return (
                            <motion.div
                                key={`${item.oa}-${idx}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}
                            >
                                <button
                                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:brightness-110 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
                                            <TrendIcon trend={item.trend} size={20} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-[var(--on-background)]">{item.oa}</span>
                                            <span className="text-xs text-[var(--muted)] block">{item.topic}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Before → After */}
                                        {item.previous_percentage !== null && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-[var(--muted)] font-medium">{item.previous_percentage}%</span>
                                                <ArrowRight size={12} className="text-[var(--muted)]" />
                                                <span className={`font-bold ${colors.text}`}>{item.current_percentage}%</span>
                                            </div>
                                        )}

                                        {/* Delta Badge */}
                                        {item.delta !== null && (
                                            <span className={`px-2 py-1 rounded-md text-xs font-black ${colors.text} ${colors.bg} border ${colors.border}`}>
                                                {item.delta > 0 ? '+' : ''}{item.delta}pp
                                            </span>
                                        )}

                                        {/* AN-18: Post-remediation badge */}
                                        {item.delta !== null && item.delta > 0 && item.previous_percentage !== null && item.previous_percentage < 50 && (
                                            <span className="px-2 py-1 rounded-md text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/25">
                                                Mejora post-nivelación
                                            </span>
                                        )}

                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4">
                                                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                                    {item.message}
                                                </p>

                                                {/* Visual bar comparison */}
                                                {item.previous_percentage !== null && item.current_percentage !== null && (
                                                    <div className="mt-3 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-[var(--muted)] w-14">Antes</span>
                                                            <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                                                <div className="h-full bg-slate-500 rounded-full transition-all" style={{ width: `${item.previous_percentage}%` }} />
                                                            </div>
                                                            <span className="text-[10px] text-[var(--muted)] w-8 text-right">{item.previous_percentage}%</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-[var(--muted)] w-14">Ahora</span>
                                                            <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: `${item.previous_percentage}%` }}
                                                                    animate={{ width: `${item.current_percentage}%` }}
                                                                    transition={{ duration: 1, delay: 0.3 }}
                                                                    className={`h-full rounded-full ${item.delta && item.delta > 0 ? 'bg-emerald-500' : item.delta && item.delta < 0 ? 'bg-red-500' : 'bg-slate-500'}`}
                                                                />
                                                            </div>
                                                            <span className={`text-[10px] font-bold w-8 text-right ${colors.text}`}>{item.current_percentage}%</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── AI Narrative ── */}
            {narrative && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card-premium p-6 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-emerald-500/5" />
                    <div className="relative z-10">
                        <h4 className="text-sm font-bold text-[var(--on-background)] mb-3 flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-400" />
                            Resumen Pedagógico
                        </h4>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                            {narrative}
                        </p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
